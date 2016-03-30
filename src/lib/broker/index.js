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
        } else {
            return new WebitelEsl(app)
        }
    };

};

module.exports = Broker;