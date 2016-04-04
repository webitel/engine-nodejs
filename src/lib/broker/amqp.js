/**
 * Created by i.navrotskyj on 20.03.2016.
 */
'use strict';

var log = require(__appRoot + '/lib/log')(module),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    Amqp = require('amqplib/callback_api');

var HOOK_QUEUE = 'hooks';

class WebitelAmqp extends EventEmitter2 {

    constructor (amqpConf, app) {
        super();
        this.config = amqpConf;
        this.app = app;
        this.connect();
        this._middlewares = {};
        this.queue = null;
        this.channel = null;
    };

    get Exchange () {
        return {
            FS_EVENT: this.config.eventsExchange.channel,
            FS_CC_EVENT: this.config.eventsExchange.cc
        };
    };

    connect () {
        let scope = this,
            timerId;

        function start () {
            if (timerId)
                timerId = clearTimeout(timerId);

            let closeChannel = function() {
                scope.queue = null;

                if (scope.channel) {
                    //scope.channel.close();
                    scope.channel = null;
                }
            };
            try {

                Amqp.connect(scope.config.uri, (err, conn) => {
                    if (err) {
                        log.error(err);
                        closeChannel();
                        timerId = setTimeout(start, 5000);
                        return;
                    };

                    log.info('[AMQP] connect: OK');
                    conn.on('error', (err)=> {
                        if (err.message !== "Connection closing") {
                            log.error("conn error", err);
                        };
                        conn.close();
                    });
                    conn.on('close', (err)=> {
                        log.error(err);
                        closeChannel();
                        timerId = setTimeout(start, 5000);
                    });

                    conn.createChannel((err, channel) => {
                        if (err) {
                            log.error(err);
                            closeChannel();
                            timerId = setTimeout(start, 5000);
                            return;
                        };
                        channel.on('error', (e) => {
                            log.error(e);
                        });
                        scope.channel = channel;
                        scope.init();
                    });
                });

            } catch (e) {
                log.error(e);
            }
        };
        start();
    };

    bindChannelEvents (caller, cb) {
        let ch = this.channel;
        if (!ch || !this.queue) return cb(new Error('No connect.'));
        try {
            ch.bindQueue(this.queue, this.Exchange.FS_EVENT, getPresenceRoutingFromCaller(caller), {}, cb);
        } catch (e) {
            log.error(e);
        }
    };

    unBindChannelEvents (caller) {
        try {
            if (this.channel && this.queue)
                this.channel.unbindQueue(this.queue, this.Exchange.FS_EVENT, getPresenceRoutingFromCaller(caller))
        } catch (e) {
            log.error(e);
        }
    };


    _parseHookEventName (eventName) {
        let _e = eventName.split('->').map((value) => encodeRK(value) );

        if (~eventName.indexOf('->webitel::')) {
            return {
                ex: this.Exchange.FS_CC_EVENT,
                rk: `*.${_e[1]}.*.*.*`
            };
        } else if (~eventName.indexOf('callcenter')) {
            //FreeSWITCH-Hostname.callcenter%3A%3Ainfo.member-queue-start.kkk%4010%2E10%2E10%2E144.6e4249b7-5595-40be-a819-42b467a2843b
            return {
                ex: this.Exchange.FS_CC_EVENT,
                rk: `*.callcenter%3A%3Ainfo.${_e[1]}.*.*`
            };
        } else {
            return {
                ex: this.Exchange.FS_EVENT,
                rk: `*.${_e[0]}.${_e[1] || '*' }.*.*`
            }
        }
    };

    bindHook (event, cb) {
        try {
            if (!event)
                return cb && cb(new Error("Bad event name"));

            let opt = this._parseHookEventName(event);

            if (this.channel)
                this.channel.bindQueue(HOOK_QUEUE, opt.ex, opt.rk, {}, cb);
        } catch (e) {
            log.error(e);
        }
    };

    unBindHook (event, cb) {
        try {
            if (!event)
                return cb && cb(new Error("Bad event name"));

            let opt = this._parseHookEventName(event);

            if (this.channel)
                this.channel.unbindQueue(HOOK_QUEUE, opt.ex, opt.rk, {}, cb);
        } catch (e) {
            log.error(e);
        }
    };

    init () {
        let scope = this,
            channel = this.channel;

        channel.assertQueue('', {autoDelete: true, durable: false, exclusive: true}, (err, qok) => {
            scope.queue = qok.queue;

            channel.consume(scope.queue, (msg) => {
                try {
                    let json = JSON.parse(msg.content.toString());
                    // TODO https://freeswitch.org/jira/browse/FS-8817
                    if (json['Event-Name'] == 'CUSTOM') return;
                    scope.emit('callEvent', json);
                } catch (e) {
                    log.error(e);
                }
            }, {noAck: true});

            let activeUsers = scope.app.Users.getKeys();
            activeUsers.forEach((userName) => {
                scope.bindChannelEvents({id: userName});
            });
        });

        // CC
        channel.assertQueue('', {autoDelete: true, durable: false, exclusive: true}, (err, qok) => {

            channel.bindQueue(qok.queue, scope.Exchange.FS_CC_EVENT, "*.callcenter%3A%3Ainfo.*.*.*");

            channel.consume(qok.queue, (msg) => {
                try {
                    scope.emit('ccEvent', JSON.parse(msg.content.toString()));
                } catch (e) {
                    log.error(e);
                }
            }, {noAck: true});
        });

        //hooks
        channel.assertQueue(HOOK_QUEUE, {autoDelete: false, durable: false, exclusive: false}, (err, qok) => {

            channel.consume(qok.queue, (msg) => {
                try {
                    let e = JSON.parse(msg.content.toString()),
                        domain = getDomain(e);

                    if (!domain) return;

                    scope.emit('hookEvent', e['Event-Name'], domain, e);
                } catch (e) {
                    log.error(e);
                }
            }, {noAck: true});
        });

        //TODO webitel events
        //channel.assertQueue('', {autoDelete: true, durable: false, exclusive: true}, (err, qok) => {
        //
        //    channel.bindQueue(qok.queue, scope.Exchange.FS_CC_EVENT, "*.webitel%3A%3Aaccount_status.*.*.*");
        //
        //    channel.consume(qok.queue, (msg) => {
        //        try {
        //            //console.dir(JSON.parse(msg.content.toString())['Channel-Presence-ID']);
        //        } catch (e) {
        //            log.error(e);
        //        }
        //    }, {noAck: true});
        //});

    };
};

function encodeRK (rk) {
    try {
        if (rk)
            return encodeURIComponent(rk)
                .replace(/\./g, '%2E')
                .replace(/\:/g, '%3A')
    } catch(e) {
        log.error(e);
        return null;
    }
}

function getPresenceRoutingFromCaller (caller) {
    try {
        let callerId = encodeRK(caller.id);
        return `*.*..${callerId}.*`;
    } catch (e) {
        log.error(e);
        return null;
    }
};

function getDomain (data) {
    if (!data)
        return null;

    if (data.variable_domain_name)
        return data.variable_domain_name;

    if (data.variable_w_domain)
        return data.variable_w_domain;

    if (data['Channel-Presence-ID'])
        return data['Channel-Presence-ID'].substring(data['Channel-Presence-ID'].indexOf('@') + 1)
}

module.exports = WebitelAmqp;