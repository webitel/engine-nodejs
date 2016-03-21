/**
 * Created by i.navrotskyj on 13.03.2016.
 */
'use strict';
var Collection = require(__appRoot + '/lib/collection'),
    generateUuid = require('node-uuid'),
    url = require('url'),
    http = require('http'),
    log = require(__appRoot + '/lib/log')(module);

class Hook {
    constructor(event, domain, action, filter) {
        this.event = event;
        this.domain = domain;
        this.action = action;
        this._filters = {};
        this._fields = [];
        for (let key in filter) {
            this._fields.push(key);
            this._filters[key] = {
                "operation": filter[key].operation || null,
                "value": filter[key].value || null
            }
        };
    };

    getId () {
        return this.domain + '/' + this.event;
    };
    check(obj) {
        if (!(obj instanceof Object))
            return false;

        for (let key in this._filters) {
            if (!obj.hasOwnProperty(key)
                || !Operations.hasOwnProperty(this._filters[key].operation)
                || !Operations[this._filters[key].operation](obj[key], this._filters[key].value))
                return false;
        };
        return true;
    };
};

const Operations = {
    "==": function (a, b) {
        return a == b;
    },
    "!=": function (a, b) {
        return a != b;
    },
    "<": function (a, b) {
        return a < b
    },
    ">": function (a, b) {
        return a > b;
    },
    "<=": function (a, b) {
        return a <= b;
    },
    ">=": function (a, b) {
        return a >= b
    }
};

class Message {
    constructor(eventName, message) {
        this.action = eventName;
        this.data = message;
        this.id = generateUuid.v4();
    }

    toString() {
        return JSON.stringify({
            "id": this.id,
            "action": this.action,
            "data": this.data
        });
    }
};

class Trigger {
    constructor (app) {
        this.hooks = new Collection('id');
        this._app = app;
        this._fsEvents = [];

        var scope = this;
        app.on('sys::eslConnect', ()=> {
            scope.Db = app.DB._query.hook;
            scope._init();
            scope.amqpConnect();
        });
    };

    amqpConnect () {
        let scope = this;
        require('amqplib/callback_api')
            .connect('amqp://localhost', (err, connection) => {
                // TODO STOP SERVER ???
                if (err)
                    return log.error(err);

                connection.createChannel((err, channel) => {
                    if (err)
                        return log.error(err);

                    scope.channel = channel;
                    //scope.testAmqp();
                });
            });
    };

    testAmqp () {
        let ch = this.channel;
        var ex = 'TAP.Events';
        ch.assertQueue('', {exclusive: true}, function (err, qok) {
            if (err)
                return log.error(err);
            ch.prefetch(10);
            //ch.bindQueue(qok.queue, ex, '#');
            ch.bindQueue(qok.queue, ex, '*.*.CHANNEL_CREATE.#');
            ch.bindQueue(qok.queue, ex, '*.*.CHANNEL_DESTROY.#');
            ch.consume(qok.queue, function(msg) {
                console.log(`${process.pid} : ${msg.fields.routingKey}`);
                ch.ack(msg);
            }, {noAck: false});

        });

        // TODO create Exchange
        //ch.assertExchange(ex, 'topic', {durable: true}, function (err, res) {
        //    if (err)
        //        return log.error(err);
        //
        //
        //});


    };

    sendAmqp (msgStr) {
       //this.channel.sendToQueue('test', new Buffer(msgStr));
    };


    _init () {
        let scope = this;
        this.Db.list({enable: true}, (err, res) => {
            if (err)
                return scope.stop(err);

            if (res.length > 0) {
                res.forEach((item) => {
                    if (item.event && item.domain && item.action) {
                        scope.subscribeEsl(item.event);
                        let hook = new Hook(item.event, item.domain, item.action, item.filter),
                            hooks = scope.hooks.get(hook.getId());
                        if (hooks)
                            hooks.push(hook);
                        else scope.hooks.add(hook.getId(), [hook]);

                    } else {
                        log.warn('Bad hook: ', item);
                    }
                })
            } else {
                log.info("No hook.");
            };

        })
    };

    subscribeEsl (eventName) {
        if (~this._fsEvents.indexOf(eventName))
            return true;
        let scope = this;
        this._app.Esl.filter('Event-Name', eventName, (e) => {
            if (e.getHeader('Modesl-Reply-OK')) {
                scope._fsEvents.push(eventName);
            };
            log.debug(e.getHeader('Reply-Text'));
        });
    };

    toId (domain, eventName) {
        return domain + '/' + eventName;
    };

    emit (eventName, domain, e) {
        try {
            if (!eventName || !(e instanceof Object))
                return false;
            let hooks = this.hooks.get(this.toId(domain, eventName));

            if (hooks instanceof Array) {
                for (let hook of hooks)
                    if (hook.check(e))
                        this.send(hook, eventName, e);
            }
        } catch (e) {
            log.error(e);
        };
    };

    send (hook, name, e) {

        let message = new Message(name, e),
            strMeg = message.toString();
        return this.sendAmqp(strMeg);

        log.debug(`Send message: ${message.id}`);
        switch (hook.action.type) {
            case TYPES.WEB:
                let option = url.parse(hook.action.url);
                option.method = "POST";
                option.headers = {
                    'Content-Type': 'application/json',
                    'Content-Length': strMeg.length
                };
                let req = http.request(option, (res)=> {
                    //TODO add retry
                    log.debug(`Response ${message.id} : ${res.statusCode}`);
                });

                req.write(strMeg);
                req.end();
                break;
            default:
                log.warn('Bad hook action: ', hook);
        };

    };

};

const TYPES = {
    WEB: 'web'
};

module.exports = Trigger;