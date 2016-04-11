/**
 * Created by i.navrotskyj on 20.03.2016.
 */


'use strict';

var log = require(__appRoot + '/lib/log')(module),
    util = require('util'),
    WebitelAmqp = require('./amqp'),
    WebitelEsl = require('./esl')
    ;


class Broker {
    constructor(conf, app) {
        if (!conf)
            throw "Bad config broker";

        let configBroker;
        if (conf.hasOwnProperty('amqp')) {
            configBroker = conf.amqp;
            return new WebitelAmqp(configBroker, app);
        } else if (conf.hasOwnProperty('esl')) {
            configBroker = conf.esl;
            return new WebitelEsl(configBroker, app)
        } else {
            app.stop(new Error("Broker config require."));
        }
    };

};

module.exports = Broker;