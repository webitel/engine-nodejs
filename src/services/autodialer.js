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
    NO_ROUTE: "NO_ROUTE",
    MAX_TRY: "MAX_TRY_COUNT",
    ACCEPT: "ACCEPT"
};

const CODE_RESPONSE_ERRORS = ["NORMAL_TEMPORARY_FAILURE", END_CAUSE.NO_ROUTE, 'CHAN_NOT_IMPLEMENTED'];
const CODE_RESPONSE_RETRY = [];
const CODE_RESPONSE_OK = [];

const MAX_MEMBER_RETRY = 999;



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
        this.id = 'lock id';

        app.Esl.subscribe('CHANNEL_HANGUP_COMPLETE');
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
            member.setVariable('origination_caller_id_number', member.number);
            member.setVariable('origination_caller_id_name', member.name);
        }

        for (let key of member.getVariableKeys()) {
            vars.push(`${key}=${member.getVariable(key)}`);
        }

        if (operator && predictive)
            return `originate {${vars}}${gwString} $park()`;

        if (operator && !predictive)
            return `originate {${vars}}user/${operator} $bridge(${gwString})`;


        return `originate {${vars}}${gwString} ` + '&socket($${acr_srv})';
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

    //dialMember (member) {
    //    log.trace(`try call ${member.sessionId}`);
    //    let gw = this.getDialStringFromMember(null, member);
    //
    //    member.log(`dialString: ${gw.dialString}`);
    //    if (gw.found) {
    //        if (gw.dialString) {
    //
    //            log.trace(`Call ${gw.dialString}`);
    //            application.Esl.bgapi(gw.dialString, (res) => {
    //
    //                this.freeGateway(gw);
    //                this._responseCallMiddleware(res, member);
    //
    //            });
    //        } else {
    //            // MEGA TODO
    //            member.minusProbe();
    //            this.nextTrySec = 0.5;
    //            member.end();
    //        }
    //
    //    } else {
    //        member.end(gw.cause);
    //    }
    //}
}

class Dialer extends Router {
    constructor (config, dbCollection) {
        super();
        // TODO string ????
        this._id = config._id.toString();

        this.name = config.name;
        this._limit = MAX_MEMBER_RETRY;
        this._maxTryCount = 5;
        this._intervalTryCount = 5;
        this._timerId = null;
        this._resources = null;

        if (config.parameters instanceof Object) {
            this._limit = config.parameters.limit || MAX_MEMBER_RETRY;
            this._maxTryCount = config.parameters.maxTryCount || 5;
            this._intervalTryCount = config.parameters.intervalTryCount || 5;
        };

        this._variables =config.variables;

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
                {$match: {"dialer": this._id,  "communications.state": 0}},
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
                let communications = {
                    $elemMatch: {
                        //state: MemberState.Idle
                        $or: [{state:MemberState.Idle}, {state:null}]
                    }
                };
                if (this._lockedGateways.length > 0)
                    communications.$elemMatch.gw = {
                        $nin: this._lockedGateways
                    };

                let filter = {
                    dialer: this._id,
                    //_endCause: null,
                    _lock: null,
                    communications,
                    $or: [{_nextTryTime: null}, {_nextTryTime: {$lte: Date.now()}}]
                };
                
                dbCollection.findOneAndUpdate(
                    filter,
                    {$set: {_lock: this._id}},
                    {sort: [["_nextTryTime", -1],["priority", -1], ["_id", -1]]},
                    cb
                )
            }.bind(this)
        };
        // TODO
        this._typesReserve['auto dialer'] = this._typesReserve.progressive;

        let responseCall = {
            progressive: function (resEls, member) {


            }.bind(this),

            'auto dialer': function (member) {

                log.trace(`try call ${member.sessionId}`);
                let gw = this.getDialStringFromMember(null, member);

                member.log(`dialString: ${gw.dialString}`);

                if (gw.found) {
                    if (gw.dialString) {

                        application.Esl.once(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, (e) => {
                            member.end(e.getHeader('variable_hangup_cause'));
                        });

                        log.trace(`Call ${gw.dialString}`);

                        application.Esl.bgapi(gw.dialString, (res) => {

                            this.freeGateway(gw);
                            console.log(res.body);
                            if (/^-ERR/.test(res.body)) {
                                let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
                                member.end(error);
                            };
                        });
                    } else {
                        // MEGA TODO
                        member.minusProbe();
                        this.nextTrySec = 0.5;
                        member.end();
                    }

                } else {
                    member.end(gw.cause);
                }

            }.bind(this)
        };

        if (typeof this._typesReserve[this.type] !== 'function' || typeof responseCall[this.type] !== 'function') {
            return log.error(`Bad dialer ${this._id} type ${this.type}`);
        } else {
            log.trace(`Init dialer ${this.name} - ${this._id} type ${this.type}`);
        }
        this.dialMember = responseCall[this.type];


        this.members = new Collection('id');

        this.members.on('added', (member) => {
            log.trace(`Members length ${this.members.length()}`);

            member.once('end', (m) => {

                let $set = {_nextTryTime: m.nextTime, _lastSession: m.sessionId, _endCause: m.endCause, variables: m.variables};
                if (m._currentNumber)
                    $set[`communications.${m._currentNumber._id}`] = m._currentNumber;

                dbCollection.findOneAndUpdate(
                    {_id: m._id},
                    {
                        $push: {_log: m._log},
                        $set,
                        $unset: {_lock: 1}, $inc: {_probeCount: 1}
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

            this.dialMember(member);
        });

        this.members.on('removed', () => {
            this.getNextMember();
        });

        this.getNextMember();
    }

    getNextMember () {
        log.trace(`find members in ${this.name} - members queue: ${this.members.length()}`);
        //if (this.members.length() > this._limit) {
        //    log.trace(`Skip find member from dialer ${this.name}, reason: max limit`);
        //    return;
        //};

        if (this._limit <= this.members.length() + 1)
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

            let m = new Member(res.value, this._maxTryCount, this._intervalTryCount, this._lockedGateways);
            this.members.add(m._id, m);
        });

    }

    tryStop () {
        if (this._timerId)
            clearTimeout(this._timerId);

        this.findMaxTryTime((err, res) => {
            if (err)
                return log.error(err);

            if (!res)
                return log.info(`STOP DIALER ${this.name}`);

            let nextTime = res - Date.now();
            if (nextTime < 1)
                nextTime = 1000;
            console.log(nextTime);
            this._timerId = setTimeout(() => this.getNextMember(), nextTime);
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
}

class Member extends EventEmitter2 {
    constructor (config, maxTryCount, nextTrySec, lockedGws) {
        super();
        if (config._lock)
            throw config;

        this.tryCount = maxTryCount;
        this.nextTrySec = nextTrySec;

        this._id = config._id;

        this.sessionId = generateUuid.v4();
        this._log = {
            session: this.sessionId,
            steps: []
        };
        this.currentProbe = (config._probeCount || 0) + 1;
        this.endCause = null;

        this.score = 0;
        this.variables = {};

        this._data = config;
        this.name = config.name || "";


        for (let key in config.variables) {
            this.setVariable(key, config.variables[key]);
        };

        this.log(`create`);

        this.number = "";
        this._currentNumber = null;
        if (config.communications instanceof Array) {
            let n = config.communications.filter( (communication, position) => {
                // TODO remove lockedGws, add queue projection..
                if (communication && communication.state === MemberState.Idle && (!lockedGws || !(communication.gatewayPositionMap in lockedGws))) {
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

    _sortNumbers (a, b) {
        var aPosition = a.position;
        var bPosition = b.position;
        var aProbe = a._probe;
        var bProbe = b._probe;

        if(aPosition == bPosition) {
            return (aProbe < bProbe) ? -1 : (aProbe > bProbe) ? 1 : 0;
        } else {
            return (aPosition < bPosition) ? -1 : 1;
        }
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
        log.trace(str);
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
    end (endCause) {
        if (this.processEnd) return;
        this.processEnd = true;


        log.trace(`end member ${this._id} cause: ${endCause || ''}}`) ;
        if (~CODE_RESPONSE_ERRORS.indexOf(endCause)) {
            this.log(`fatal: ${endCause}`);
            this._setStateCurrentNumber(MemberState.End);
        }


        if (!this.endCause && this.currentProbe >= this.tryCount) {
            this.log(`max try count`);
            this.endCause = endCause || END_CAUSE.MAX_TRY;
            this._setStateCurrentNumber(MemberState.End)
        } else {
            this.nextTime = Date.now() + (this.nextTrySec * 1000);
        }
        this.log(`end cause: ${endCause}`);
        this.emit('end', this, endCause);
    }

    run (maxTryCount, nextTrySec) {

        let scope = this;
        this.log(`run`);
        setTimeout(() => {
            scope.end()
        }, 100)
    }
}