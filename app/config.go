package app

import (
	"flag"
	"fmt"
	"github.com/webitel/engine/model"
)

var (
	translationsDirectory = flag.String("translations_directory", "i18n", "Translations directory")
	consulHost            = flag.String("consul", "172.0.0.1:8500", "Host to consul")
	websocketHost         = flag.String("websocket", ":80", "WebSocket server address")
	dataSource            = flag.String("data_source", "postgres://opensips:webitel@postgres:5432/webitel?fallback_application_name=engine&sslmode=disable&connect_timeout=10&search_path=call_center", "Data source")
	amqpSource            = flag.String("amqp", "amqp://webitel:webitel@rabbit:5672?heartbeat=10", "AMQP connection")
	grpcServerPort        = flag.Int("grpc_port", 0, "GRPC port")
	grpcServerAddr        = flag.String("grpc_addr", "", "GRPC host")
	openSipAddr           = flag.String("open_sip_addr", "opensips", "OpenSip address")
	wsSipAddr             = flag.String("ws_sip_addr", "", "Sip websocket address")
	dev                   = flag.Bool("dev", false, "enable dev mode")
)

func (app *App) Config() *model.Config {
	return app.config
}

func loadConfig() (*model.Config, error) {
	flag.Parse()
	config := &model.Config{
		Dev:                   *dev,
		TranslationsDirectory: *translationsDirectory,
		NodeName:              fmt.Sprintf("engine-%s", model.NewId()),
		DiscoverySettings: model.DiscoverySettings{
			Url: *consulHost,
		},
		WebSocketSettings: model.WebSocketSettings{
			Address: *websocketHost,
		},
		ServerSettings: model.ServerSettings{
			Address: *grpcServerAddr,
			Port:    *grpcServerPort,
			Network: "tcp",
		},
		SipSettings: model.SipSettings{
			ServerAddr: *wsSipAddr,
			Proxy:      *openSipAddr,
		},
		SqlSettings: model.SqlSettings{
			DriverName:                  model.NewString("postgres"),
			DataSource:                  dataSource,
			MaxIdleConns:                model.NewInt(5),
			MaxOpenConns:                model.NewInt(5),
			ConnMaxLifetimeMilliseconds: model.NewInt(300000),
			Trace:                       true,
		},
		MessageQueueSettings: model.MessageQueueSettings{
			Url: *amqpSource,
		},
	}
	return config, nil
}
