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
        this._intervalTryCount = 5;
        this._timerId = null;

        if (config.parameters instanceof Object) {
            this._limit = config.parameters.limit || 0;
            this._maxTryCount = config.parameters.maxTryCount || 5;
            this._intervalTryCount = config.parameters.intervalTryCount || 5;
        };

        this.type = config.type;

        log.debug(`
            Init dialer: ${this.name}
            Config:
                limit: ${this._limit},
                maxTryCount: ${this._maxTryCount},
                intervalTryCount: ${this._intervalTryCount}
        `);
        
        this.findMaxTryTime = function (cb) {
            dbCollection.aggregate([
                {$match: {"dialer": this._id}},
                {
                    $group: {
                        _id: '',
                        nextTry: {
                            $min: "$_nextTryTime"
                        }
                    }
                }
            ], (err, res) => {
                if (err)
                    return cb(err);
                return cb(null, res && res[0] && res[0].nextTry);
            })
        };

        this._typesReserve = {
            'progressive': function (cb) {
                dbCollection.findOneAndUpdate(
                    {
                        dialer: this._id,
                        _endCause: null,
                        _lock: null,
                        'communications.state': 0,
                        $or: [{_nextTryTime: null}, {_nextTryTime: {$lte: Date.now()}}]
                    },
                    {$set: {_lock: this._id}},
                    {sort: [["_nextTryTime", -1],["priority", -1]]},
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
                dbCollection.findOneAndUpdate(
                    {_id: m._id},
                    {
                      //  $push: {_log: m._log},
                        $set: {_nextTryTime: m.nextTime, _lastSession: m.sessionId, _endCause: m.endCause},
                        $unset: {_lock: 1}, $inc: {_probeCount: 1}
                    },
                    (err, res) => {
                        if (err)
                            throw err;

                        log.trace(`removed ${m.sessionId}`);
                        if (!this.members.remove(m._id))
                            throw 'asd'
                });
            });
            member.run(this._maxTryCount, this._intervalTryCount);
        });

        this.members.on('removed', () => {
            this.getNextMember();
        });

        this.getNextMember();

        ;
        //
    };

    getNextMember () {
        log.trace(`find members in ${this.name} - members queue: ${this.members.length()}`);
        //if (this.members.length() > this._limit) {
        //    log.trace(`Skip find member from dialer ${this.name}, reason: max limit`);
        //    return;
        //};

        if (this._limit === this.members.length())
            return;

        this._typesReserve[this.type]( (err, res) => {
            if (err)
                return log.error(err);

            if (!res || !res.value) {
                // End members;
                this.tryStop();
                return log.debug (`End members in ${this.name}`);
            };
            this.getNextMember();

            if (this.members.existsKey(res.value._id))
                return log.warn(`Member in queue ${this.name} : ${res.value._id}`);

            let m = new Member(res.value);
            this.members.add(m._id, m);
        });

    }

    tryStop () {
        if (this._timerId)
            clearTimeout(this._timerId);
        this.findMaxTryTime((err, res) => {
            if (err)
                return log.error(err);


        });
        this._timerId = setTimeout(() => this.getNextMember(), 1000);
    }


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
        } else {
            this.nextTime = Date.now() + (this.nextTrySec * 1000);
        }
        this.log(`end session`);
        this.emit('end', this);
    }

    run (maxTryCount, nextTrySec) {
        this.tryCount = maxTryCount || 0;
        this.nextTrySec = nextTrySec || 60;
        let scope = this;
        this.log(`run`);
        setTimeout(() => {
            scope.end()
        }, 5)
    }
}