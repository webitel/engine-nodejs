/**
 * Created by i.navrotskyj on 20.03.2016.
 */
'use strict';

var log = require(__appRoot + '/lib/log')(module),
    Amqp = require('amqplib');

class WebitelAmqp {

    constructor (amqpConf) {
        this.config = amqpConf;
        this.connect();
        this._middlewares = {};
        this.queue = null;
        this.channel = null;
    };

    get Exchange () {
        return {
            // TODO move conf
            FS_EVENT: "TAP.Events"
            //FS_EVENT: "test"
        };
    };

    connect () {
        let scope = this;
        scope.channel = null;
        function start () {
            Amqp.connect(scope.config.uri)
                .then(
                (conn) => {
                    log.info('[AMQP] connect: OK');
                    conn.on('error', (err)=> {
                        if (err.message !== "Connection closing") {
                            log.error("conn error", err.message);
                        }
                    });
                    conn.on('close', (err)=> {
                        log.error(err);
                        setTimeout(start, 5000);
                    });
                    conn.createChannel().then((channel) => {
                        scope.channel = channel;
                        channel.assertQueue('', {autoDelete: true, durable: false, exclusive: true})
                            .then(
                            (qok) => {
                                scope.queue = qok.queue;
                                channel.consume(scope.queue, (msg) => {
                                    console.log(`${process.pid} - ${JSON.parse(msg.content.toString())['Event-Name']}`);

                                }, {noAck: true})
                            }
                        )
                        scope.init();
                    });
                },
                (err) => {
                    log.error(err);
                    setTimeout(start, 5000);
                });
        };
        start();
    };

    bind (caller, rk, exchange, middleware) {
        let ch = this.channel;
        let queue = `engine.${caller.id}`;
        if (rk instanceof Array)
            rk.forEach((_rk) => ch.bindQueue(this.queue, exchange, _rk));
        else ch.bindQueue(this.queue, exchange, rk)
            .then(
            () => {
                //console.log("ok")
            },
            (e) => {
                console.error(e.message)
            }
        );

        this._middlewares[caller.id] = {
            middleware: middleware,
            rk: rk,
            exchange: exchange
        };
    };
    unbind (caller) {
        let bind = this._middlewares[caller.id],
            rk = bind && bind.rk;
        if (rk)
            if (rk instanceof Array) {
                rk.forEach((_rk) => this.channel.unbindQueue(this.queue, bind.exchange, _rk));
            } else {
                this.channel.unbindQueue(this.queue, bind.exchange, rk)
            }
        else log.error("Bad routing key")
        ;
        delete this._middlewares[caller.id];
    };

    init () {
        this.channel.assertExchange(this.config.exchange.name, this.config.exchange.type)
            .then((ex) => {
                console.log()
            })
    }


};

module.exports = WebitelAmqp;