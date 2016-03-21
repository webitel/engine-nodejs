/**
 * Created by i.navrotskyj on 17.03.2016.
 */
'use strict';

var config = require(__appRoot + '/conf'),
    amqpConf = config.get('amqp'),
    log = require(__appRoot + '/lib/log')(module),
    Amqp = require('amqplib');

class Broker {

    constructor () {
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
    }

    connect () {
        let scope = this;
        scope.channel = null;
        function start () {
            Amqp.connect(amqpConf.uri)
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
        /*
        ch.assertQueue(queue, {autoDelete: true, durable: false, exclusive: false})
            .then(
            (qok) => {
                if (rk instanceof Array)
                    rk.forEach((_rk) => ch.bindQueue(qok.queue, exchange, _rk));
                else ch.bindQueue(qok.queue, exchange, rk, {
                    //"x-redelivered-count": 2,
                    //"redelivered-count": 2,
                    //"global": 1,
                    //"x-global": 1,
                });


                ch.prefetch(1);
                ch.consume(qok.queue, (msg, e) => {
                    middleware(msg);
                    //msg.fields.redelivered = true;
                    //ch.nack(msg, true, false)
                    //ch.ack(msg)
                }, {
                    noAck: false,
                    arguments: {
                        //"x-redelivered-count": 200
                        'prefetch_count ': 1000,
                        'x-prefetch_count ': 1000,
                    }
                })
                    .then(
                    (res) => {
                        caller.tag = res.consumerTag;
                    },
                    (err) => {

                    }
                );

            },
            (err) => {
                //TODO
            }
        );

        */
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

        //this.channel.cancel(caller.tag)
        //    .then( (e) => {
        //        log.trace(e)
        //    },
        //    (e) => {
        //        log.error(e)
        //    }
        //);
    };

    init () {
        this.channel.assertExchange(amqpConf.exchange.name, amqpConf.exchange.type)
            .then((ex) => {
                console.log()
            })
    }


};

module.exports = Broker;