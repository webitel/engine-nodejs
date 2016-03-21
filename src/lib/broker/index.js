/**
 * Created by i.navrotskyj on 20.03.2016.
 */


'use strict';


class Broker {
    constructor(type, app) {

    };

    function initAmqp () {

    };

    function initEsl (eslConnection) {

    };



    get Types () {
        return {
            "amqp": initAmqp,
            "esl": initEsl
        }
    }

};

module.exports = Broker;