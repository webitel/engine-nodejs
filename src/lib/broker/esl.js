/**
 * Created by i.navrotskyj on 20.03.2016.
 */
'use strict';

var log = require(__appRoot + '/lib/log')(module),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    Amqp = require('amqplib');

class WebitelEsl extends EventEmitter2 {
    constructor (application) {
        super();
        application.on('sys::connectEsl', () => {
            let esl = application.Esl,
                scope = this;
            esl.subscribe([
                "CHANNEL_CREATE",
                "CHANNEL_DESTROY",
                "CHANNEL_CALLSTATE",
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

            let activeUsers = application.Users.getKeys();
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
    };

    bindChannelEvents (caller, cb) {
        let esl = application.Esl;
        if (!esl) return cb && cb(new Error("No connect"));

        esl.filter('Channel-Presence-ID', caller.id, function (res) {
            log.debug(res.getHeader('Modesl-Reply-OK'));
        });
    };

    unBindChannelEvents (caller) {
        let esl = application.Esl;
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