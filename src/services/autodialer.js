/**
 * Created by i.navrotskyj on 11.03.2016.
 */
'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2,
    plainTableToJSON = require(__appRoot + '/utils/parse').plainTableToJSON,
    log = require(__appRoot + '/lib/log')(module),
    async = require('async'),
    generateUuid = require('node-uuid'),
    Collection = require(__appRoot + '/lib/collection');

const END_CAUSE = {
    MAX_TRY: "MAX_TRY_COUNT",
    ACCEPT: "ACCEPT"
};

module.exports =  class AutoDialer extends EventEmitter2 {
    constructor (app) {
        super();
        this._app = app;
        this.activeDialer = new Collection('id');

        log.debug('Init AutoDialer');

        this.collection = {
            dialer: app.DB.collection('dialer'),
            members: app.DB.collection('agentStatusEngine')
        };
        this.loadCampaign();
        this.id = 'lock id'
    }

    loadCampaign () {
        this.collection.dialer.find({
            active: true
        }).toArray((err, res) => {
            if (err)
                return log.error(err);

            if (res instanceof Array)
                res.forEach((dialer) => {
                    this.activeDialer.add(dialer._id, new Dialer(dialer, this.collection.members))
                })
        })
    }

    run() {

    }
};
/*
// Лочити мембера ынстанс ыд, даӕ можливысть пысля ребуту знати на якый машины впало...
// Прыоритет мембера быльший прыоритету номера в ньому... вибирати по одному мемберу по формулы створений + прыоритет, потым обыд номерыв в залежносты выд стратегы,
//          чи на всы номери одночасно чи по прыоритету...
   З операторами просто слдкувати щоб було >> 1 вльного щоб запускати орджнейт
*/

class Dialer extends EventEmitter2 {
    constructor (config, dbCollection) {
        super();
        // TODO string ????
        this._id = config._id.toString();

        this.name = config.name;
        this._limit = 0;
        this._maxTryCount = 5;
        this._intervalTryCount = 60;

        if (config.parameters instanceof Object) {
            this._limit = config.parameters.limit || 0;
            this._maxTryCount = config.parameters.maxTryCount || 5;
            this._intervalTryCount = config.parameters.intervalTryCount || 60;
        };

        this.type = config.type;

        this._typesReserve = {
            'progressive': function (cb) {
                dbCollection.findOneAndUpdate(
                    {dialer: this._id, _endCause: null, _lock: null, 'communications.state': 0},
                    {$set: {_lock: this._id}},
                    {sort: [["priority", -1]]},
                    cb
                )
            }.bind(this)
        };

        if (typeof this._typesReserve[this.type] !== 'function') {
            return log.error(`Bad dialer ${this._id} type ${this.type}`);
        } else {
            log.trace(`Init dialer ${this.name} - ${this._id} type ${this.type}`);
        }

        this.members = new Collection('id');

        this.members.on('added', (member) => {
            log.trace(`Members length ${this.members.length()}`);

            member.on('end', (m) => {
                dbCollection.updateOne(
                    {_id: m._id},
                    {$push: {_log: m._log}, $set: {_lastSession: m.sessionId, _endCause: m.endCause}, $unset: {_lock: 1}, $inc: {_probeCount: 1}},
                    (err, res) => {
                        if (err)
                            throw err;
                        if (res.modifiedCount != 1 || res.matchedCount != 1)
                            throw res;

                        log.trace(`removed ${m.sessionId}`);
                        if (!this.members.remove(m._id))
                            throw 'asd'
                });
            });
            member.run(this._maxTryCount);
        });

        this.members.on('removed', () => {
            this.getNextMember();
        });

        this.getNextMember();

        ;
        //
    };

    getNextMember () {
        log.trace(`find members in ${this.name}`);
        //if (this.members.length() > this._limit) {
        //    log.trace(`Skip find member from dialer ${this.name}, reason: max limit`);
        //    return;
        //};
        for (let i = 1, len = (this._limit - this.members.length()); i <= len; i++)
            this._typesReserve[this.type]( (err, res) => {
                if (err)
                    return log.error(err);


                if (!res || !res.value) {
                    // End members;
                    return log.debug (`End members in ${this.name}`)
                };

                if (this.members.existsKey(res.value._id))
                    return log.warn(`Member in queue ${this.name} : ${res.value._id}`);

                let m = new Member(res.value);
                this.members.add(m._id, m);
            });


    }

    stop () {}


};

/*
 state {
    0: idle,
    1: process,
    2: end,
 }

 */

const MemberState = {
    Idle: 0,
    Process: 1,
    End: 2
};

class Member extends EventEmitter2 {
    constructor (config) {
        super();
        if (config._lock)
            throw config;

        this._id = config._id;

        this.sessionId = generateUuid.v4();
        this._log = {
            session: this.sessionId,
            steps: []
        };
        this.currentProbe = (config._probeCount || 0) + 1;
        this.endCause = null;
        this.score = 0;

        this._data = config;
        this.name = config.name || "";
        this.dialString = '{';
        for (var key in config.variables) {
            this.dialString += `${key}=${config.variables[key]},`
        };

        this.log(`Create member ${config._id} -> ${this.sessionId}`);

        this.dialString += '}';

        this.number = "";
        if (config.communications instanceof Array) {
            let n = [];
            for (var i = 0, len = config.communications.length; i < len; i++)
                if (config.communications[i].state === MemberState.Idle)
                    n.push(config.communications[i]);

        };
    }

    log (str) {
        log.trace(str);
        this._log.steps.push({
            time: Date.now(),
            data: str
        });
    }

    end () {
        log.trace(`end member ${this._id}`) ;

        if (!this.endCause && this.currentProbe >= this.tryCount) {
            this.endCause = END_CAUSE.MAX_TRY
        }
        this.log(`end session`);
        this.emit('end', this);
    }

    run (maxTryCount) {
        this.tryCount = maxTryCount || 0;
        let scope = this;
        this.log(`run`);
        setTimeout(() => {
            scope.end()
        }, 0)
    }
}