/**
 * Created by i.navrotskyj on 29.10.2015.
 */
'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    fs = require('fs'),
    log = require('./lib/log')(module),
    WConsole = require('./lib/Console'),
    conf = require('./conf'),
    Esl = require('./lib/modesl'),
    Collection = require('./lib/collection'),
    httpSrv = (conf.get('ssl:enabled').toString() == 'true') ? require('https') : require('http'),
    initDb = require('./db'),
    plainTableToJSONArray = require('./utils/parse').plainTableToJSONArray,
    Broker = require('./lib/broker/index'),
    Hooks = require('./services/hook/hookClass'),
    checkEslError = require('./middleware/checkEslError')
    //outQueryService = require('./services/outboundQueue')
    ;

class Application extends EventEmitter2 {
    constructor () {
        super();
        this.DB = null;
        this.WConsole = null;
        this.Esl = null;
        this.Users = new Collection('id');
        this.Domains = new Collection('id');
        this.Agents = new Collection('id');
        this.OutboundQuery = new Collection('id');
        this.loggedOutAgent = new Collection('id');
        this.Broker = new Broker(conf.get('broker'), this);
        this.Hooks = new Hooks(this);
        process.nextTick(this.connectDb.bind(this));
    }

    Schedule (time, fn, arg) {
        var timerId = setTimeout(function tick() {
            fn(arg);
            timerId = setTimeout(tick, time);
        }, time);
    }

    initAcl (cb) {
        require('./services/acl')._init(this, cb);
        return 1;
    }

    connectDb() {
        var conferenceService = require('./services/conference');
        var scope = this,
            ret = 0;
        scope.once('sys::connectDb', function (db) {
            //TODO bug!! account event prior connectToEsl
            scope.DB = db;
            scope.initAcl();
            scope.connectToEsl();
            scope.attachProcess();
            scope.connectToWConsole();
        });

        this.once('sys::connectFsApi', function () {
            scope.configureExpress();
            conferenceService._runAutoDeleteUser(scope);
        });

        scope.on('sys::connectDbError', (err) => {
            if (++ret > 10) return this.stop(err);
            log.warn('Retry connect to DB');
            initDb(scope);
        });

        initDb(scope);

        if (typeof gc == 'function') {
            setInterval(function () {
                gc();
                console.log('----------------- GC -----------------');
            }, 5000);
        };
    }

    connectToEsl() {
        this.Esl = this.Broker;

        let scope = this;

        function loadTiers() {
            scope.Broker.bgapi('callcenter_config tier list', function (res) {

                if (checkEslError(res)) {
                    setTimeout(loadTiers, 5000);
                    return log.error('Load tiers response undefined !!!');
                };

                let body = res['body'];

                scope.emit('sys::connectFsApi');

                plainTableToJSONArray(body, function (err, result) {
                    if (err) {
                        return log.error(err);
                    };
                    scope.Agents.removeAll();
                    if (result instanceof Array) {
                        let _tmp;
                        result.forEach(function (item) {
                            let agent = scope.Agents.get(item['agent']);
                            if (!agent) {
                                _tmp = {};
                                _tmp[item['queue']] = item;
                                scope.Agents.add(item['agent'], _tmp);
                            } else {
                                agent[item['queue']] = item;
                            };
                        });
                    };

                }, '|')
            });
        };

        loadTiers();
    };

    connectToWConsole () {
        var scope = this,
            waitTimeReconnectConsole = conf.get('webitelServer:reconnect') * 1000;

        var wconsole = this.WConsole = new WConsole.Connection({
            server: conf.get('webitelServer:host'),
            port: conf.get('webitelServer:port'),
            account: conf.get('webitelServer:account'),
            secret: conf.get('webitelServer:secret')
        });

        wconsole.on('webitel::socket::close', function (e) {
            log.error('Webitel error:', e.toString());
            setTimeout(function () {
                scope.connectToWConsole();
            }, waitTimeReconnectConsole);
        });

        wconsole.on('error', function (err) {
            log.warn('Webitel warn:', err);
        });

        wconsole.on('webitel::event::auth::success', function () {
            log.info('Connect Webitel: %s:%s', this.host, this.port);
            scope.emit('sys::wConsoleConnect');

            wconsole._getServerId((err, res) => {
                if (err)
                    return log.error(err);

                wconsole._serverId = res;
            });
        });

        wconsole.on('webitel::event::auth::fail', function () {
            return scope.stop(new Error('webitel::event::auth::fail -> Bad credential config webitelServer:secret'))
        });

        wconsole.on('webitel::end', function () {
            wconsole.authed = false;
            log.error('Webitel: socket close.');
        });

        wconsole.on('webitel::event::disconnect::notice', function () {
            log.error('webitel::event::disconnect::notice');
        });

        if (conf.get('application:sleepConnectToWebitel')) {
            setTimeout(function () {
                wconsole.connect();
            }, conf.get('application:sleepConnectToWebitel'));
        } else {
            wconsole.connect();
        };
    }

    configureExpress () {
        var api = require('./adapter/rest');
        this.startServer(api);
    }

    startServer (api) {
        try {
            var ws = require('./adapter/ws');
            var scope = this,
                server;

            if (conf.get('ssl:enabled').toString() == 'true') {
                var https_options = {
                    key: fs.readFileSync(conf.get('ssl:ssl_key')),
                    cert: fs.readFileSync(conf.get('ssl:ssl_cert'))
                };
                server = httpSrv.createServer(https_options, api).listen(conf.get('server:port'), conf.get('server:host'), function() {
                    log.info('Server (https) listening on port ' + this.address().port);
                    scope.emit('sys::serverStart', this, true);
                });
            } else {
                server = httpSrv.createServer(api).listen(conf.get('server:port'), conf.get('server:host'), function() {
                    log.info('Server (http) listening on port ' + this.address().port);
                    scope.emit('sys::serverStart', this, false);
                });
            };
            ws(server, this);

        } catch (e) {
            log.error('Server create:' + e.message);
            this.stop(e);
        }
    }

    stop(err) {
        log.warn("Stop server \n" + (err || ''));
        if (this.DB) {
            this.DB.close();
            log.info('Disconnect DB...');
        };

        if (this.Esl) {
            this.Esl.disconnect();
            log.info('Disconnect ESL...');
        };

        if (this.WConsole) {
            this.WConsole.disconnect();
            log.info('Disconnect WConsole...');
        };

        process.exit(1);
    }

    attachProcess () {
        process.on('message', (msg) => {
            log.debug('msg: ', msg);
        });
    }

    broadcastWorkers (msg) {
        process.send({
            msg: msg
        });
    }
};

process.on('uncaughtException', function (err) {
    log.error('UncaughtException:', err.message);
    log.error(err.stack);
    var emailService = require('./services/email');

    var _fnStop = function() {
        if (application) {
            application.stop();
        }
        process.exit(1);
    };

    emailService._report(err, function () {
        _fnStop();
    });
});

var _application = new Application();
module.exports = _application;