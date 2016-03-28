/**
 * Created by i.navrotskyj on 20.03.2016.
 */


'use strict';

var log = require(__appRoot + '/lib/log')(module),
    util = require('util'),
    WebitelAmqp = require('./amqp')
    ;


class Broker {
    constructor(conf, app) {
        if (!conf)
            throw "Bad config broker";

        let configBroker;
        if (conf.hasOwnProperty('amqp'))
            configBroker = conf.amqp;
        return new WebitelAmqp(configBroker);
        //return Object.create({
        //    bind:1
        //});
    };

};

module.exports = Broker;