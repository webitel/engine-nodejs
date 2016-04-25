/**
 * Created by i.navrotskyj on 20.03.2016.
 */
'use strict';

var log = require(__appRoot + '/lib/log')(module),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    Esl = require(__appRoot + '/lib/modesl'),
    Amqp = require('amqplib');

const _connect = Symbol('connect'),
      _esl = Symbol('esl')
    ;

const waitTimeReconnectFreeSWITCH = 5000;

class WebitelEsl extends EventEmitter2 {

    [_connect] (app) {
        let scope = this,
            configBroker = this.configBroker;

        if (this[_esl] && this[_esl].connected) {
            return;
        };

        let esl = scope[_esl] = new Esl.Connection(
            configBroker.host,
            configBroker.port,
            configBroker.pwd,
            (err) => {
                if (err)
                    return log.error(err) && application.stop(err);
                log.debug('Open ESL socket.');
            }
        );

        esl.on('error', function(e) {
            log.error('ESL socket connect error:', e);
            esl.connected = false;

            setTimeout(function () {
                scope[_connect](app);
            }, waitTimeReconnectFreeSWITCH);
        });

        esl.on('esl::event::auth::success', function () {
            esl.connected = true;
            log.info('ESL socket connected.');

            esl.subscribe([
                "CHANNEL_CREATE",
                "CHANNEL_DESTROY",
                "CHANNEL_STATE",
                "CHANNEL_ANSWER",
                "CHANNEL_HANGUP_COMPLETE",
                "CHANNEL_HANGUP",
                "CHANNEL_HOLD",
                "CHANNEL_UNHOLD",
                "CHANNEL_BRIDGE",
                "CHANNEL_UNBRIDGE",
                "CHANNEL_UUID",
                "DTMF",
                "CHANNEL_DATA",
                "CUSTOM callcenter::info"
            ]);
            esl.filter('Event-Subclass', 'callcenter::info');

            let activeUsers = app.Users.getKeys();
            activeUsers.forEach((userName) => {
                scope.bindChannelEvents({id: userName});
            });

            esl.on('esl::event::**', (e) => {
                if (e.subclass == 'callcenter::info')
                    return scope.emit('ccEvent', e.serialize('json', 1));

                if (e.type)
                    return scope.emit('callEvent', e.serialize('json', 1))
            });

        });

        esl.on('esl::event::auth::fail', function () {
            esl.authed = false;
            log.error('esl::event::auth::fail');
            app.stop(new Error('Auth freeSWITH fail, please enter the correct password.'));
        });

        esl.on('esl::end', function () {
            esl.connected = false;

            log.error('ESL socket close.');
            setTimeout(function () {
                scope[_connect](app);
            }, waitTimeReconnectFreeSWITCH);
        });

        esl.on('esl::event::disconnect::notice', function() {
            log.error('esl::event::disconnect::notice');
            this.apiCallbackQueue.length = 0;
            this.cmdCallbackQueue.length = 0;
            esl.connected = false;

            setTimeout(function () {
                scope[_connect](app);
            }, waitTimeReconnectFreeSWITCH);
        });

    };

    constructor (configBroker, application) {
        super();
        this.configBroker = configBroker;
        this[_connect](application);

        application.on('sys::wConsoleConnect', () => {
            let wConsole = application.WConsole,
                scope = this
                ;
            wConsole.subscribe(["USER_CREATE", "USER_DESTROY", "DOMAIN_CREATE", "DOMAIN_DESTROY", "ACCOUNT_STATUS"]);
            wConsole.on('webitel::event::event::**', (e) => scope.emit('webitelEvent', e.serialize('json', 1)));
        });
    };

    bindChannelEvents (caller, cb) {
        let esl = this[_esl];
        if (!esl) return cb && cb(new Error("No connect"));

        esl.filter('Channel-Presence-ID', caller.id, function (res) {
            log.debug(res.getHeader('Modesl-Reply-OK'));
        });
    };

    bgapi () {
        this[_esl].bgapi.apply(this[_esl], [].slice.call(arguments));
    };

    api () {
        this[_esl].api.apply(this[_esl], [].slice.call(arguments));
    };

    disconnect () {
        this[_esl].disconnect ();
    };

    show () {
        this[_esl].show.apply(this[_esl], [].slice.call(arguments));
    };

    unBindChannelEvents (caller) {
        let esl = this[_esl];
        if (!esl) return;

        esl.filterDelete('Channel-Presence-ID', caller.id, function (res) {
            log.debug(res.getHeader('Modesl-Reply-OK'));
        });
    };

    // TODO
    bindHook () {};
    unBindHook () {};

};

module.exports = WebitelEsl;