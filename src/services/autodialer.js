/**
 * Created by i.navrotskyj on 11.03.2016.
 */
'use strict';

var EventEmitter2 = require('eventemitter2').EventEmitter2,
    plainTableToJSON = require(__appRoot + '/utils/parse').plainTableToJSON,
    log = require(__appRoot + '/lib/log')(module),
    async = require('async'),
    generateUuid = require('node-uuid'),
    ObjectID = require('mongodb').ObjectID,
    moment = require('moment-timezone'),
    Collection = require(__appRoot + '/lib/collection');

const END_CAUSE = {
    NO_ROUTE: "NO_ROUTE",
    MAX_TRY: "MAX_TRY_COUNT",
    ACCEPT: "ACCEPT"
};

const CODE_RESPONSE_ERRORS = ["NORMAL_TEMPORARY_FAILURE", END_CAUSE.NO_ROUTE, 'CHAN_NOT_IMPLEMENTED', "CALL_REJECTED", "INVALID_NUMBER_FORMAT", "NETWORK_OUT_OF_ORDER", "NORMAL_TEMPORARY_FAILURE", "OUTGOING_CALL_BARRED", "SERVICE_UNAVAILABLE", "CHAN_NOT_IMPLEMENTED", "SERVICE_NOT_IMPLEMENTED", "INCOMPATIBLE_DESTINATION", "MANDATORY_IE_MISSING", "PROGRESS_TIMEOUT", "GATEWAY_DOWN"];
const CODE_RESPONSE_RETRY = ["UNALLOCATED_NUMBER", "NO_ROUTE_DESTINATION", "USER_BUSY", "NO_USER_RESPONSE", "NO_ANSWER", "SUBSCRIBER_ABSENT", "NUMBER_CHANGED", "NORMAL_UNSPECIFIED", "NORMAL_CIRCUIT_CONGESTION", "ORIGINATOR_CANCEL", "LOSE_RACE", "USER_NOT_REGISTERED"];
const CODE_RESPONSE_OK = ["NORMAL_CLEARING"];

const MAX_MEMBER_RETRY = 999;


function addTimeToDate(time) {
    return new Date(Date.now() + time)
}


module.exports =  class AutoDialer extends EventEmitter2 {
    constructor (app) {
        super();
        this._app = app;
        this.activeDialer = new Collection('id');
        let connectDb, connectFs = false;

        log.debug('Init AutoDialer');

        app.on('sys::connectDb', () => { connectDb = true; });
        app.on('sys::connectDbError', () => { connectDb = false; });

        app.on('sys::connectFsApi', () => { connectFs = true; });
        app.on('sys::errorConnectFsApi', () => { connectFs = false; });


        this.collection = {
            dialer: app.DB.collection('dialer'),
            calendar: app.DB.collection('calendar'),
            members: app.DB.collection('agentStatusEngine')
        };

        this.activeDialer.on('added', (dialer) => {
            dialer.once('ready', (d) => {
                log.debug(`Ready dialer ${d.name} - ${d._id}`);
                this.collection.dialer.findOneAndUpdate(
                    {_id: d._objectId},
                    {$set: {state: d.state, _cause: d.cause, active: true}},
                    (err, res) => {
                        if (err)
                            log.error(err);

                    }
                )
            });

            dialer.once('end', (d) => {
                log.debug(`End dialer ${d.name} - ${d._id}`);
                this.collection.dialer.findOneAndUpdate(
                    {_id: d._objectId},
                    {$set: {state: d.state, _cause: d.cause, active: false}},
                    (err, res) => {
                        if (err)
                            log.error(err);
                        this.activeDialer.remove(dialer._id);
                    }
                )
            });

            dialer.once('sleep', (d) => {
                this.collection.dialer.findOneAndUpdate(
                    {_id: d._objectId},
                    {$set: {state: d.state, _cause: d.cause, active: true}},
                    (err, res) => {
                        if (err)
                            log.error(err);
                    }
                )
                this.addTask(d);
                //console.log(d);
            });

            dialer.setReady();

        });

        this.activeDialer.on('removed', (dialer) => {
            log.info(`Remove active dialer ${dialer.name} : ${dialer._id}`);
        });

        this.loadCampaign();
        this.id = 'lock id';

        app.Esl.subscribe('CHANNEL_HANGUP_COMPLETE');
    }

    addTask (dialer) {
        log.info(`Dialer ${dialer.name}@${dialer._domain} next try ${new Date(Date.now() + dialer._sleepNextTry)}`);
        setTimeout(() => {
            dialer.setReady()
        }, dialer._sleepNextTry);

    }

    loadCampaign () {
        this.collection.dialer.find({
            active: true
        }).toArray((err, res) => {
            if (err)
                return log.error(err);

            if (res instanceof Array) {
                log.info(`Found ${res.length} dialer`);
                res.forEach((dialer) => {
                    this.addDialerFromDb(dialer);
                })
            } else {
                log.debug('Not found dialer');
            }
        })
    }

    stopDialerById (id, domain, cb) {
        let dialer = this.activeDialer.get(id);
        if (!dialer)
            return cb(new Error("Not found"));
        dialer.setState(DialerStates.ProcessStop);
        return cb(null, {ok: 1});
    }

    runDialerById(id, domain, cb) {
        if (!ObjectID.isValid(id))
            return cb(new Error("Bad object id"));

        let ad = this.activeDialer.get(id)
        if (ad)
            return cb && cb(null, {active: true});

        this.collection.dialer.findOne({_id: new ObjectID(id), domain: domain}, (err, res) => {
            if (err)
                return cb(err);

            let error = this.addDialerFromDb(res);
            if (error)
                return cb(error);
            return cb(null, {active: true});
        });
    }

    addDialerFromDb (dialerDb) {

        if (dialerDb.active) {
            log.warn(`Dialer ${dialerDb.name} - ${dialerDb._id} is active.`);
            //return new Error("Dialer is active...");
        }

        let calendarId = dialerDb && dialerDb.calendar && dialerDb.calendar.id;
        if (calendarId && ObjectID.isValid(calendarId))
            calendarId = new ObjectID(calendarId);

        this.collection.calendar.findOne({_id: calendarId}, (err, res) => {
            if (err)
                return log.error(err);

            let dialer = new Dialer(dialerDb, this.collection.members, res);
            this.activeDialer.add(dialer._id, dialer);
        });

        return null;
    }
};


function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

class Gw {
    constructor (conf, regex, variables) {
        this.activeLine = 0;
        // TODO link regex...
        this.regex = regex;
        this.maxLines = conf.limit || 0;
        this.gwName = conf.gwName;

        if (variables) {
            let arr = [];
            for (let key in variables)
                arr.push(`${key}=${variables[key]}`);

            this._vars = arr;
        }

        this.dialString = conf.gwProto == 'sip' && conf.gwName ? `sofia/gateway/${conf.gwName}/${conf.dialString}` : conf.dialString;
    }

    // TODO type predictive
    tryLock (operator, member, predictive) {
        if (this.activeLine >= this.maxLines || !member.number)
            return false;

        this.activeLine++;
        let gwString = member.number.replace(this.regex, this.dialString);

        let vars = [`origination_uuid=${member.sessionId}`].concat(this._vars);

        if (!member.getVariable('origination_caller_id_number')) {
            if (!operator) {
                member.setVariable('origination_caller_id_number', member.queueNumber);
                member.setVariable('origination_caller_id_name', member.queueName);
                member.setVariable('origination_callee_id_number', member.number);
                member.setVariable('origination_callee_id_name', member.name);
            } else {
                member.setVariable('origination_callee_id_number', member.number);
                member.setVariable('origination_caller_id_name', member.name);
            }
        }

        for (let key of member.getVariableKeys()) {
            vars.push(`${key}='${member.getVariable(key)}'`);
        }

        if (operator && predictive)
            return `originate {${vars}}${gwString} $park()`;

        if (operator && !predictive)
            return `originate {${vars}}user/${operator} $bridge(${gwString})`;

        vars.push(`dlr_queue=${member._queueId}`);
        return `originate {${vars}}${gwString} ` +  '&socket($${acr_srv})';
    }

    unLock () {
        let unLocked = false;
        if (this.activeLine === this.maxLines && this.maxLines !== 0)
            unLocked = true;
        this.activeLine--;
        return unLocked;
    }
}

class Router extends EventEmitter2 {

    _setResource (resources) {
        this._resourcePaterns = [];
        this._lockedGateways = [];

        if (resources instanceof Array) {

            var maxLimitGw = 0;
            resources.forEach((resource) => {
                try {
                    if (typeof resource.dialedNumber != 'string' || !(resource.destinations instanceof Array))
                        return;
                    let flags = resource.dialedNumber.match(new RegExp('^/(.*?)/([gimy]*)$'));
                    if (!flags)
                        flags = [null, resource.dialedNumber];

                    let regex = new RegExp(flags[1], flags[2]);
                    let gws = [];

                    resource.destinations.forEach( (i) => {
                        if (i.enabled !== true)
                            return;

                        if (maxLimitGw !== -1)
                            if (i.limit === 0) {
                                maxLimitGw = -1;
                            } else {
                                maxLimitGw += i.limit
                            }

                        gws.push(new Gw(i, regex, this._variables));
                    });

                    this._resourcePaterns.push(
                        {
                            regexp: regex,
                            gws: gws
                        }
                    )
                } catch (e) {
                    this.emit('error', e);
                }
                ;
            });

            if (maxLimitGw !== -1 && this._limit > maxLimitGw)
                this._limit = maxLimitGw


        }
    }

    getDialStringFromMember (operator, member) {
        let res = {
            found: false,
            dialString: false,
            cause: null,
            patternIndex: null,
            gw: null
        };
        for (let i = 0, len = this._resourcePaterns.length; i < len; i++) {
            if (this._resourcePaterns[i].regexp.test(member.number)) {
                res.found = true;
                for (let j = 0, lenGws = this._resourcePaterns[i].gws.length; j < lenGws; j++) {
                    let gatewayPositionMap = i + '>' + j;
                    // TODO...
                    if (member._currentNumber instanceof Object)
                        member._currentNumber.gatewayPositionMap = gatewayPositionMap;

                    member.setVariable('gatewayPositionMap', gatewayPositionMap);
                    if (~this._lockedGateways.indexOf(gatewayPositionMap))
                        continue;

                    res.dialString = this._resourcePaterns[i].gws[j].tryLock(operator, member);
                    if (res.dialString) {
                        res.patternIndex = i;
                        res.gw = j;
                        break
                    } else {
                        this._lockedGateways.push(gatewayPositionMap)
                    }
                }
            }
        }
        if (!res.found)
            res.cause = END_CAUSE.NO_ROUTE;

        return res;
    }

    freeGateway (gw) {
        let gateway = this._resourcePaterns[gw.patternIndex].gws[gw.gw],
            gatewayPositionMap = gw.patternIndex + '>' + gw.gw;

        if (gateway.unLock() && ~this._lockedGateways.indexOf(gatewayPositionMap))
            this._lockedGateways.splice(this._lockedGateways.indexOf(gatewayPositionMap), 1)

    }
}

const DialerStates = {
    Idle: 0,
    Work: 1,
    Sleep: 2,
    ProcessStop: 3,
    End: 4
};

const DialerCauses = {
    Init: "INIT",
    ProcessStop: "PROCESS_STOP",
    ProcessRecovery: "PROCESS_RECOVERY",
    ProcessSleep: "PROCESS_SLEEP",
    ProcessReady: "PROCESS_HUNTING",
    ProcessNotFoundMember: "NOT_FOUND_MEMBER",
    ProcessExpire: "PROCESS_EXPIRE"
};

class Dialer extends Router {
    constructor (config, dbCollection, calendarConfig) {
        super();
        // TODO string ????
        this._id = config._id.toString();
        this._objectId = config._id;
        //this.bigData = new Array(1e6).join('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n');

        this.name = config.name;
        this.number = config.number || this.name;
        this._limit = MAX_MEMBER_RETRY;
        this._maxTryCount = 5;
        this._intervalTryCount = 5;
        this._timerId = null;
        this._domain = config.domain


        this.state = DialerStates.Idle;
        this.cause = DialerCauses.Init;

        this._countRequestHunting = 0;

        this.initCalendar(calendarConfig);

        if (config.parameters instanceof Object) {
            this._limit = config.parameters.limit || MAX_MEMBER_RETRY;
            this._maxTryCount = config.parameters.maxTryCount || 5;
            this._intervalTryCount = config.parameters.intervalTryCount || 5;
        };

        this._variables = config.variables;

        this._setResource(config.resources);

        this.type = config.type;

        log.debug(`
            Init dialer: ${this.name}
            Config:
                limit: ${this._limit},
                maxTryCount: ${this._maxTryCount},
                intervalTryCount: ${this._intervalTryCount}
        `);
        
        this.findMaxTryTime = function (cb) {
            //$elemMatch: {
            //    $or: [{state:MemberState.Idle}, {state:null}]
            //}
            dbCollection.aggregate([
                //{$match: {"dialer": this._id,  "_endCause": null}},
                {$match: {"dialer": this._id, _lock: null, "_endCause": null, "communications.state": 0}},
                {
                    $group: {
                        _id: '',
                        nextTryTime: {
                            $min: "$_nextTryTime"
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ], (err, res) => {
                if (err)
                    return cb(err);
                return cb(null, res && res[0]);
            })
        };

        let typesUnReserve = {
            'progressive': function (id, cb) {
                dbCollection.findOneAndUpdate(
                    {_id: id},
                    {$set: {_lock: null}},
                    cb
                )
            }
        };
        typesUnReserve['auto dialer'] = typesUnReserve.progressive;

        let typesReserve = {
            'progressive': function (cb) {
                let communications = {
                    $elemMatch: {
                        //state: MemberState.Idle
                        $or: [{state:MemberState.Idle}, {state:null}]
                    }
                };
                if (this._lockedGateways.length > 0)
                    communications.$elemMatch.gatewayPositionMap = {
                        $nin: this._lockedGateways
                    };

                let filter = {
                    dialer: this._id,
                    _endCause: null,
                    _lock: null,
                    communications,
                    $or: [{_nextTryTime: null}, {_nextTryTime: {$lte: Date.now()}}]
                };
                let i = {
                    _nextTryTime: -1,
                    priority: -1,
                    _id: -1,
                    dialer: 1,
                    _endCause: 1,
                    _lock: 1,
                    "communications.state": 1,
                    "communications.gatewayPositionMap": 1
                };
                console.dir(filter, {depth: 5, colors: true});

                dbCollection.findOneAndUpdate(
                    filter,
                    {$set: {_lock: this._id}},
                    //{sort: {_nextTryTime: 1, priority: -1, _id: -1}},
                    {sort: [["_nextTryTime", 1],["priority", -1], ["_id", -1]]},
                    cb
                )
            }.bind(this)
        };
        typesReserve['auto dialer'] = typesReserve.progressive;

        let dialMember = {
            progressive: function (resEls, member) {


            }.bind(this),

            'auto dialer': function (member) {

                log.trace(`try call ${member.sessionId}`);
                let gw = this.getDialStringFromMember(null, member);

                member.log(`dialString: ${gw.dialString}`);

                if (gw.found) {
                    if (gw.dialString) {

                        let onChannelHangup = function (e) {
                            member.end(e.getHeader('variable_hangup_cause'));
                        };
                        
                        let off = function () {
                            application.Esl.off(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, onChannelHangup);
                        };

                        application.Esl.once(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, onChannelHangup);

                        log.trace(`Call ${gw.dialString}`);

                        application.Esl.bgapi(gw.dialString, (res) => {

                            this.freeGateway(gw);

                            if (/^-ERR/.test(res.body)) {
                                off();
                                let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
                                member.end(error);
                            }

                        });
                    } else {
                        // MEGA TODO
                        member.minusProbe();
                        this.nextTrySec = 0;
                        member.end();
                    }

                } else {
                    member.end(gw.cause);
                }

            }.bind(this)
        };

        this.dialMember = dialMember[this.type];
        this.unReserveMember = typesUnReserve[this.type];
        this.reserveMember = typesReserve[this.type];


        this.members = new Collection('id');

        this.members.on('added', (member) => {

            log.trace(`Members length ${this.members.length()}`);

            member.once('end', (m) => {

                let $set = {_nextTryTime: m.nextTime, _lastSession: m.sessionId, _endCause: m.endCause, variables: m.variables, _probeCount: m.currentProbe};
                if (m._currentNumber)
                    $set[`communications.${m._currentNumber._id}`] = m._currentNumber;

                dbCollection.findOneAndUpdate(
                    {_id: m._id},
                    {
                        $push: {_log: m._log},
                        $set,
                        $unset: {_lock: 1}//, $inc: {_probeCount: 1}
                    },
                    (err, res) => {
                        if (err)
                            throw err;

                        log.trace(`removed ${m.sessionId}`);
                        if (!this.members.remove(m._id))
                            throw 'asd'
                    }
                );
            });

            if (!this.checkLimit() && this.isReady())
                this.getNextMember();

            this.dialMember(member);
        });

        this.members.on('removed', () => {
            if (!this.isReady() || this.members.length() === 0)
                return this.tryStop();

            if (!this.checkLimit())
                this.getNextMember();
        });
    }

    initCalendar (conf) {
        this._calendarMap = {};
        this._calendar = conf;
        if (conf.accept instanceof Array) {
            let sort = conf.accept.sort(dynamicSort('weekDay'));

            let getValue = function (v, last) {
                return {
                    startTime: v.startTime,
                    endTime: v.endTime,
                    next: last
                };
            };

            for (let i = 0, len = sort.length, last = i !== len - 1; i < len; i++) {
                if (this._calendarMap[sort[i].weekDay]) {
                    this._calendarMap[sort[i].weekDay].push(getValue(sort[i], last));
                    this._calendarMap[sort[i].weekDay].sort(dynamicSort('startTime'));
                } else {
                    this._calendarMap[sort[i].weekDay] = [getValue(sort[i], last)];
                }
            }
        }
    }

    checkSleep (calendar) {
        if (!calendar) {
            return true;
        }

        let current;
        if (calendar.timeZone && calendar.timeZone.id)
            current = moment().tz(calendar.timeZone.id);
        else current = moment();


        let currentTime = current.valueOf();

        let expireCb = function () {
            this.cause = DialerCauses.ProcessExpire;
            this.state = DialerStates.End;
        }.bind(this);

        let sleepCb = function (sleepTime) {
            this.cause = DialerCauses.ProcessSleep;
            this.state = DialerStates.Sleep;
            this._sleepNextTry = sleepTime;
        }.bind(this);
        
        let between = function (x, min, max) {
            return x >= min && x <= max;
        };

        // Check range date;
        if (this._calendar.startDate && currentTime < this._calendar.startDate) {
            sleepCb(new Date(this._calendar.startDate).getTime() - Date.now() + 1);
            return false;
        } else if (this._calendar.endDate && currentTime > this._calendar.endDate) {
            expireCb();
            return false
        }

        let currentWeek = current.day();
        let currentTimeOfDay = current.get('hours') * 60 + current.get('minutes');
        let nextOfDey = false;

        if (this._calendarMap[currentWeek] instanceof Array) {
            let c = this._calendarMap[currentWeek];

            for (let i = 0, len = c.length; i < len; i++) {
                nextOfDey = c[i].last;
                if (between(currentTimeOfDay, c[i].startTime, c[i].endTime)) {
                    return true;
                }
            }
        }




        for (let i = 0, len = accepts.length; i < len; i++) {
            let nextTry;
            if (between(currentTimeOfDay, accepts[i].startTime, accepts[i].endTime)) {
                setTimeout(() => {
                    sleepCb(nextTry)
                }, (accepts[i].endTime - currentTimeOfDay) * 60 * 1000 );
                nextTry = accepts[i + 1] ? (accepts[i + 1].startTime - currentTimeOfDay) * 60 * 1000 : (1441 - currentTimeOfDay) * 60 * 1000;
                log.debug(`Dialer ${this.name} sleep in ${addTimeToDate((accepts[i].endTime - currentTimeOfDay) * 60 * 1000)}, next sleep: ${nextTry}`);
                return true
            }
        }

        if (currentTimeOfDay < accepts[0].startTime) {
            sleepCb((accepts[0].startTime - currentTimeOfDay) - currentTimeOfDay);
            return false;
        }

        if (currentTimeOfDay > accepts[accepts.length - 1].endTime) {
            sleepCb(1000);
            return false;
        }

        if (accepts[accepts.length - 1].startTime > currentTimeOfDay) {
            sleepCb((accepts[accepts.length - 1].startTime - currentTimeOfDay) * 60 * 1000);
            return false;
        }



        //console.log(accepts);
        //this.emit('ini', this);
        throw accepts
    }

    setReady () {
        if (typeof this.reserveMember !== 'function' || typeof this.dialMember !== 'function' || typeof this.unReserveMember !== 'function') {
            this.cause = `Not implement ${this.type}`;
            this.setState(DialerStates.End);
            this.emit('end', this);
            return log.error(`Bad dialer ${this._id} type ${this.type}`);
        } else {
            log.trace(`Init dialer ${this.name} - ${this._id} type ${this.type}`);
        }

        this.cause = DialerCauses.ProcessReady;
        this.state = DialerStates.Work;
        this.emit('ready', this);
        this.getNextMember();
    }

    checkLimit () {
        return (this._countRequestHunting >= this._limit || this.members.length() + 1 >= this._limit);
    }

    setState (state) {
        this.state = state;
    }

    isReady () {
        return this.state === DialerStates.Work;
    }

    getNextMember () {
        log.trace(`find members in ${this.name} - members queue: ${this.members.length()}`);

        if (!this.isReady())
            this.tryStop();

        if (this.checkLimit())
            return;

        this._countRequestHunting++;

        this.reserveMember( (err, res, q) => {
            this._countRequestHunting--;
            if (err)
                return log.error(err);

            if (!res || !res.value) {
                return log.debug (`Not found members in ${this.name}`);
            }

            if (!this.isReady()) {
                this.unReserveMember(res.value._id, (err) => {
                    if (err)
                        return log.error(err);
                });
                return
            }

            if (this.members.existsKey(res.value._id))
                return log.warn(`Member in queue ${this.name} : ${res.value._id}`);

            let option = {
                maxTryCount: this._maxTryCount,
                intervalTryCount: this._intervalTryCount,
                lockedGateways: this._lockedGateways,
                queueId: this._id,
                queueName: this.name,
                queueNumber: this.number
            };
            let m = new Member(res.value, option);
            this.members.add(m._id, m);
        });

    }

    tryStop () {

        console.log('state', this.state);
        if (this.state === DialerStates.ProcessStop) {
            if (this.members.length() != 0)
                return;

            log.info('Stop dialer');

            this.cause = DialerCauses.ProcessStop;
            this.active = false;
            this.emit('end', this);
            return
        }

        if (this.state === DialerStates.Sleep) {
            if (this.members.length() === 0)
                this.emit('sleep', this);
            return
        }

        if (this._processTryStop || this.checkLimit())
            return;
        this._processTryStop = true;
        console.log('Try END -------------');

        this.findMaxTryTime((err, res) => {
            if (err)
                return log.error(err);

            if (!res && this.members.length() === 0) {
                this.setState(DialerStates.End);
                this.emit('end', this);
                return log.info(`STOP DIALER ${this.name}`);
            }

            if (!res)
                return;

            log.trace(`Status ${this.name} : state - ${this.state}; count - ${res.count || 0}; nextTryTime - ${res.nextTryTime}`);

            if (res.count === 0)
                return log.info(`STOP DIALER ${this.name}`);

            this._processTryStop = false;
            if (!res.nextTryTime) res.nextTryTime = Date.now() + 1000;
            if (res.nextTryTime > 0) {
                let nextTime = res.nextTryTime - Date.now();
                if (nextTime < 1)
                    nextTime = 1000;
                console.log(nextTime);
                this._timerId = setTimeout(() => {
                    clearTimeout(this._timerId);
                    this.getNextMember()
                }, nextTime);
            }

        });
    }
}

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
    constructor (config, option) {
        super();
        if (config._lock)
            throw config;

        this.tryCount = option.maxTryCount;
        this.nextTrySec = option.intervalTryCount;

        this.queueName = option.queueName ;
        this._queueId = option.queueId;
        this.queueNumber = option.queueNumber || option.queueName;

        let lockedGws = option.lockedGateways;

        this._id = config._id;

        this.sessionId = generateUuid.v4();
        this._log = {
            session: this.sessionId,
            steps: []
        };
        this.currentProbe = (config._probeCount || 0) + 1;
        this.endCause = null;

        this.score = 0;

        //this.bigData = new Array(1e5).join('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n');
        this.variables = {};

        this._data = config;
        this.name = config.name || "";


        for (let key in config.variables) {
            this.setVariable(key, config.variables[key]);
        };

        this.log(`create probe ${this.currentProbe}`);

        this.number = "";
        this._currentNumber = null;
        this._countActiveNumbers = 0;
        if (config.communications instanceof Array) {
            let n = config.communications.filter( (communication, position) => {
                // TODO remove lockedGws, add queue projection..

                let isOk = communication && communication.state === MemberState.Idle;
                if (isOk)
                    this._countActiveNumbers++;

                if (isOk && (!lockedGws || !(communication.gatewayPositionMap in lockedGws))) {
                    if (!communication._probe)
                        communication._probe = 0;
                    if (!communication.priority)
                        communication.priority = 0;
                    communication._score = communication.priority - communication._probe;
                    communication._id = position;
                    return true;
                }
                return false;
            });
            this._currentNumber = n.sort(dynamicSort('-_score'))[0];

            if (this._currentNumber) {
                this._currentNumber._probe++;
                this.number = this._currentNumber.number;
                this.log(`set number: ${this.number}`);
            } else {
                console.log('ERROR', this);
            }

        }
    }
    minusProbe () {
        if (this._currentNumber)
            this._currentNumber._probe--;
        this.currentProbe--;
        this.log(`minus probe: ${this.currentProbe}`);
    }

    setVariable (varName, value) {
        this.variables[varName] = value;
        return true
    }

    getVariable (varName) {
        return this.variables[varName] ;
    }

    getVariableKeys () {
        return Object.keys(this.variables);
    }

    log (str) {
        log.trace(this._id + ' -> ' + str);
        this._log.steps.push({
            time: Date.now(),
            data: str
        });
    }

    _setStateCurrentNumber (state) {
        if (!this._currentNumber)
            return;
        this._currentNumber.state = state;
    }
    end (endCause, e) {
        if (this.processEnd) return;
        this.processEnd = true;


        log.trace(`end member ${this._id} cause: ${this.endCause || endCause || ''}`) ;


        if (~CODE_RESPONSE_OK.indexOf(endCause)) {
            this.endCause = endCause;
            this.log(`OK: ${endCause}`);
            this._setStateCurrentNumber(MemberState.End);
            this.emit('end', this);
            return;
        }

        if (~CODE_RESPONSE_RETRY.indexOf(endCause)) {
            if (this.currentProbe >= this.tryCount) {
                this.log(`max try count`);
                this.endCause = END_CAUSE.MAX_TRY;
                this._setStateCurrentNumber(MemberState.End);
            } else {
                this.nextTime = Date.now() + (this.nextTrySec * 1000);
                this.log(`Retry: ${endCause}`);
                this._setStateCurrentNumber(MemberState.Idle);
            }

            this.emit('end', this);
            return;
        }

        if (~CODE_RESPONSE_ERRORS.indexOf(endCause)) {
            this.log(`fatal: ${endCause}`);
            this._setStateCurrentNumber(MemberState.End);
        }


        if (this.currentProbe >= this.tryCount) {
            this.log(`max try count`);
            this.endCause = endCause || END_CAUSE.MAX_TRY;
            this._setStateCurrentNumber(MemberState.End)
        } else {
            if (this._countActiveNumbers == 1 && endCause)
                this.endCause = endCause;
            this.nextTime = Date.now() + (this.nextTrySec * 1000);
        }
        this.log(`end cause: ${endCause || ''}`);
        this.emit('end', this);
    }
}