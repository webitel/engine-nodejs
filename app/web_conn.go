package app

import (
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/nicksnyder/go-i18n/i18n"
	"github.com/webitel/engine/model"
	wlog "github.com/webitel/wlog"
	"sync"
	"sync/atomic"
	"time"
)

const (
	SEND_QUEUE_SIZE           = 256
	SEND_SLOW_WARN            = (SEND_QUEUE_SIZE * 50) / 100
	SEND_DEADLOCK_WARN        = (SEND_QUEUE_SIZE * 95) / 100
	WRITE_WAIT                = 30 * time.Second
	PONG_WAIT                 = 100 * time.Second
	PING_PERIOD               = (PONG_WAIT * 6) / 10
	AUTH_TIMEOUT              = 5 * time.Second
	WEBCONN_MEMBER_CACHE_TIME = 1000 * 60 * 30 // 30 minutes
)

type WebConn struct {
	id                 string
	sessionExpiresAt   int64 // This should stay at the top for 64-bit alignment of 64-bit words accessed atomically
	App                *App
	WebSocket          *websocket.Conn
	sessionToken       atomic.Value
	session            atomic.Value
	LastUserActivityAt int64
	UserId             int64
	DomainId           int64
	T                  i18n.TranslateFunc
	Locale             string
	Send               chan model.WebSocketMessage
	Sequence           int64
	closeOnce          sync.Once
	endWritePump       chan struct{}
	pumpFinished       chan struct{}
	listenEvents       map[string]*model.BindQueueEvent

	//Sip *SipProxy
}

func (a *App) NewWebConn(ws *websocket.Conn, session model.Session, t i18n.TranslateFunc, locale string) *WebConn {
	wc := &WebConn{
		id:                 model.NewId(),
		App:                a,
		WebSocket:          ws,
		Send:               make(chan model.WebSocketMessage, SEND_QUEUE_SIZE),
		LastUserActivityAt: model.GetMillis(),
		UserId:             session.UserId,
		T:                  t,
		Locale:             locale,
		endWritePump:       make(chan struct{}),
		pumpFinished:       make(chan struct{}),
		listenEvents:       make(map[string]*model.BindQueueEvent),
	}

	//wc.Sip = NewSipProxy(wc)

	wc.SetSession(&session)
	wc.SetSessionToken(session.Token)
	wc.SetSessionExpiresAt(session.Expire)

	return wc
}

func (wc *WebConn) Id() string {
	return wc.id
}

func (wc *WebConn) Close() {
	wc.WebSocket.Close()
	wc.closeOnce.Do(func() {
		close(wc.endWritePump)
	})
	<-wc.pumpFinished
}

func (c *WebConn) Pump() {
	ch := make(chan struct{})
	go func() {
		c.writePump()
		close(ch)
	}()
	c.readPump()
	c.closeOnce.Do(func() {
		close(c.endWritePump)
	})

	<-ch
	c.App.HubUnregister(c)
	close(c.pumpFinished)
}

func (c *WebConn) readPump() {
	defer func() {
		c.WebSocket.Close()
	}()

	c.WebSocket.SetReadLimit(model.SOCKET_MAX_MESSAGE_SIZE_KB)
	c.WebSocket.SetReadDeadline(time.Now().Add(PONG_WAIT))
	c.WebSocket.SetPongHandler(func(string) error {
		c.WebSocket.SetReadDeadline(time.Now().Add(PONG_WAIT))

		return nil
	})

	for {

		var req model.WebSocketRequest

		if err := c.WebSocket.ReadJSON(&req); err != nil {
			// browsers will appear as CloseNoStatusReceived
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
				wlog.Debug(fmt.Sprintf("websocket.read: client side closed socket userId=%v", c.UserId))
			} else {
				wlog.Debug(fmt.Sprintf("websocket.read: closing websocket for userId=%v error=%v", c.UserId, err.Error()))
			}
			return
		}

		c.App.Srv.WebSocketRouter.ServeWebSocket(c, &req)
	}
}

func (c *WebConn) writePump() {
	ticker := time.NewTicker(PING_PERIOD)
	authTicker := time.NewTicker(AUTH_TIMEOUT)

	defer func() {
		ticker.Stop()
		authTicker.Stop()
		c.WebSocket.Close()
	}()
	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				c.WebSocket.SetWriteDeadline(time.Now().Add(WRITE_WAIT))
				c.WebSocket.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			evt, evtOk := msg.(*model.WebSocketEvent)

			var msgBytes []byte
			if evtOk {
				cpyEvt := &model.WebSocketEvent{}
				*cpyEvt = *evt
				cpyEvt.Sequence = c.Sequence
				msgBytes = []byte(cpyEvt.ToJson())
				c.Sequence++
			} else {
				msgBytes = []byte(msg.ToJson())
			}

			if len(c.Send) >= SEND_DEADLOCK_WARN {
				if evtOk {
					wlog.Warn(fmt.Sprintf("websocket.full: message userId=%v type=%v size=%v", c.UserId, msg.EventType(), len(msg.ToJson())))
				} else {
					wlog.Warn(fmt.Sprintf("websocket.full: message userId=%v type=%v size=%v", c.UserId, msg.EventType(), len(msg.ToJson())))
				}
			}

			c.WebSocket.SetWriteDeadline(time.Now().Add(WRITE_WAIT))
			if err := c.WebSocket.WriteMessage(websocket.TextMessage, msgBytes); err != nil {
				// browsers will appear as CloseNoStatusReceived
				if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
					wlog.Debug(fmt.Sprintf("websocket.send: client side closed socket userId=%v", c.UserId))
				} else {
					wlog.Debug(fmt.Sprintf("websocket.send: closing websocket for userId=%v, error=%v", c.UserId, err.Error()))
				}
				return
			}

		case <-ticker.C:
			c.WebSocket.SetWriteDeadline(time.Now().Add(WRITE_WAIT))
			if err := c.WebSocket.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				// browsers will appear as CloseNoStatusReceived
				if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseNoStatusReceived) {
					wlog.Debug(fmt.Sprintf("websocket.ticker: client side closed socket userId=%v", c.UserId))
				} else {
					wlog.Debug(fmt.Sprintf("websocket.ticker: closing websocket for userId=%v error=%v", c.UserId, err.Error()))
				}
				return
			}
		case <-c.endWritePump:
			return
		case <-authTicker.C:
			if c.GetSessionToken() == "" {
				wlog.Debug(fmt.Sprintf("websocket.authTicker: did not authenticate ip=%v", c.WebSocket.RemoteAddr()))
				return
			}
			authTicker.Stop()
		}
	}
}

func (webCon *WebConn) SendHello() {
	msg := model.NewWebSocketEvent(model.WEBSOCKET_EVENT_HELLO)
	msg.Add("server_node_id", webCon.App.nodeId)
	msg.Add("server_build_commit", model.BuildNumber)
	msg.Add("server_version", model.CurrentVersion)
	msg.Add("server_time", model.GetMillis())
	msg.Add("sock_id", webCon.id)
	msg.Add("session", webCon.GetSession())
	webCon.Send <- msg
}

func (c *WebConn) GetSessionExpiresAt() int64 {
	return atomic.LoadInt64(&c.sessionExpiresAt)
}

func (c *WebConn) SetSessionExpiresAt(v int64) {
	atomic.StoreInt64(&c.sessionExpiresAt, v)
}

func (c *WebConn) GetSessionToken() string {
	return c.sessionToken.Load().(string)
}

func (c *WebConn) SetSessionToken(v string) {
	c.sessionToken.Store(v)
}

func (c *WebConn) GetSession() *model.Session {
	return c.session.Load().(*model.Session)
}

func (c *WebConn) SetSession(v *model.Session) {
	c.session.Store(v)
}

func (webCon *WebConn) IsAuthenticated() bool {
	// Check the expiry to see if we need to check for a new session
	if webCon.GetSessionExpiresAt() < model.GetMillis() {
		if webCon.GetSessionToken() == "" {
			return false
		}

		session, err := webCon.App.GetSession(webCon.GetSessionToken())
		if err != nil {
			wlog.Error(fmt.Sprintf("invalid session err=%v", err.Error()))
			webCon.SetSessionToken("")
			webCon.SetSession(nil)
			webCon.SetSessionExpiresAt(0)
			return false
		}

		webCon.SetSession(session)
		webCon.SetSessionExpiresAt(session.Expire)
	}

	return true
}

func (webCon *WebConn) SetListenEvent(name string, value *model.BindQueueEvent) {
	webCon.listenEvents[name] = value
}

func (webCon *WebConn) GetListenEvent(name string) (*model.BindQueueEvent, bool) {
	v, ok := webCon.listenEvents[name]
	return v, ok
}

func (webCon *WebConn) ShouldSendEvent(msg *model.WebSocketEvent) bool {
	if !webCon.IsAuthenticated() {
		return false
	}

	if _, ok := webCon.listenEvents[msg.EventType()]; !ok {
		return true
	}

	switch msg.EventType() {
	//case model.WEBSOCKET_EVENT_CALL:
	//
	//	return false
	}

	return true
}

func (webCon *WebConn) GetAllBindings() []*model.BindQueueEvent {
	arr := make([]*model.BindQueueEvent, 0, len(webCon.listenEvents))
	for _, v := range webCon.listenEvents {
		arr = append(arr, v)
	}
	return arr
}