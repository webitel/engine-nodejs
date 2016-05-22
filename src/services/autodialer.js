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
    configFile = require(__appRoot + '/conf'),
    moment = require('moment-timezone'),
    accountServices = require(__appRoot + '/services/account'),
    Collection = require(__appRoot + '/lib/collection');

const END_CAUSE = {
    NO_ROUTE: "NO_ROUTE",
    MAX_TRY: "MAX_TRY_COUNT",
    PROCESS_CRASH: "PROCESS_CRASH",
    ACCEPT: "ACCEPT"
};

const CODE_RESPONSE_ERRORS = ["NORMAL_TEMPORARY_FAILURE", END_CAUSE.NO_ROUTE, 'CHAN_NOT_IMPLEMENTED', "CALL_REJECTED", "INVALID_NUMBER_FORMAT", "NETWORK_OUT_OF_ORDER", "NORMAL_TEMPORARY_FAILURE", "OUTGOING_CALL_BARRED", "SERVICE_UNAVAILABLE", "CHAN_NOT_IMPLEMENTED", "SERVICE_NOT_IMPLEMENTED", "INCOMPATIBLE_DESTINATION", "MANDATORY_IE_MISSING", "PROGRESS_TIMEOUT", "GATEWAY_DOWN"];
const CODE_RESPONSE_RETRY = ["UNALLOCATED_NUMBER", "NO_ROUTE_DESTINATION", "USER_BUSY", "NO_USER_RESPONSE", "NO_ANSWER", "SUBSCRIBER_ABSENT", "NUMBER_CHANGED", "NORMAL_UNSPECIFIED", "NORMAL_CIRCUIT_CONGESTION", "ORIGINATOR_CANCEL", "LOSE_RACE", "USER_NOT_REGISTERED"];
const CODE_RESPONSE_OK = ["NORMAL_CLEARING"];

const MAX_MEMBER_RETRY = 999;

const DIALER_TYPES = {
    VoiceBroadcasting: "Voice Broadcasting",
    ProgressiveDialer: "Progressive Dialer"
};

//TODO
const ROOT = {
    roleName: "root",
    domain: null
};

function addTimeToDate(time) {
    return new Date(Date.now() + time)
}

function getDeadlineMinuteFromSortMap (currentMinuteOfDay, currentWeek, map) {
    // TODO

    let i = parseInt(currentWeek),
        count = 0,
        result = {active: false, minute: null},
        offsetDay = 0;
    while (1) {
        i = (i > 7) ? 1 : i;
        if (map[i] instanceof Array) {
            for (let item of map[i]) {
                if (count === 0 && item.endTime > currentMinuteOfDay) {
                    if (item.startTime > currentMinuteOfDay) {
                        result.minute = item.startTime - currentMinuteOfDay;
                        return result;
                    } else {
                        result.minute = item.endTime - currentMinuteOfDay;
                        result.active = true;
                        return result;
                    }
                }

                if (count === 0 && item.endTime <= currentMinuteOfDay && item.startTime >= currentMinuteOfDay) {
                    break;
                }

                if (count !== 0) {
                    result.minute = offsetDay += item.startTime;
                    return result;
                }
            }
        }
        offsetDay += (count == 0 ? 1440 - currentMinuteOfDay : 1440);
        i++;
        count++;
    }
}

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

class Agent {
    constructor (key, state, status) {
        this.id = key;
        this.state = state;
        this.status = status;
        this.dialers = [];
        this.lockTime = 0;
        this.lock = false;
        this.timerId = null;
    }

    setState (state, status) {
        this.state = state;
        this.status = status;
        log.trace(`Change agent ${this.id} ${this.state} ${this.status} ${this.lock}`);
    }

    addDialer (dialerId) {
        let id = this.dialers.indexOf(dialerId);
        if (!~id)
            this.dialers.push(dialerId);
    }

    removeDialer (dialerId) {
        let id = this.dialers.indexOf(dialerId);
        if (~id)
            this.dialers.splice(id, 1);
    }
}

class AgentManager extends EventEmitter2 {

    constructor () {
        super();
        this.agents = new Collection('id');
        this._keys = [];
        this.agents.on('added', (a, key) => {
            if (!~this._keys.indexOf(key))
                this._keys.push(key);

            if (this.agents.length() == 1 && !this.timerId) {
                this.tick();
                log.debug('Start agent manager timer');
            }
        });
        this.agents.on('removed', (a, key) => {
            let i = this._keys.indexOf(key);
            if (~i) {
                this._keys.splice(i, 1);
            }

            if (this.agents.length() === 0 && this.timerId) {
                clearTimeout(this.timerId);
                log.debug('Stop agent manager timer');
            }
        });
        this.timerId = null;
        this.tick = ()=> {
            let time = Date.now();
            for (let key of this._keys) {
                let agent = this.agents.get(key);
                if (agent && agent.state === 'ONHOOK' && agent.status === 'NONE' && !agent.lock && agent.lockTime <= time) {
                    log.debug(`send free agent ${agent.id}`);
                    this.emit('unReserveHookAgent', agent);
                }
            }
            this.timerId = setTimeout(this.tick, 1500);
        };
    }

    getFreeAgent (agents) {
        if (agents)
            for (let key of agents) {
                let a = this.getAgentById(key);
                if (a && a.state == 'ONHOOK' && a.status == 'NONE' && !a.lock &&  a.lockTime <= Date.now())
                    return a;
            }
    }

    taskUnReserveAgent (agent, timeSec) {
        agent.lock = false;
        agent.lockTime = Date.now() + (timeSec * 1000)
    }
    unReserveAgent (agent) {
        agent.lock = false;
        agent.lockTime = 0;
    }

    reserveAgent (agent, cb) {
        agent.lock = true;
        this.setAgentStatus(agent, 'OnBreak', (res) => {
            if (/^-ERR|^-USAGE/.test(res.body)) {
                agent.lock = false;
                return cb(new Error(res.body))
            }
            return cb()
        })
    }

    setAgentStatus (agent, status, cb) {
        application.WConsole.setAccountStatus(agent.id, status, cb);
    }

    initDomain (domainName, agents, cb) {

        accountServices.accountList(ROOT, {domain: domainName}, (err, res) => {
            if (err) {
                log.error(err);
                return cb(err);
            }
            for (let key in res) {
                let id = key + '@' + domainName;
                if (!this.agents.existsKey(id) && ~agents.indexOf(id))
                    this.agents.add(id, new Agent(id, res[key].state, res[key].status));
            }
            cb(err, res);
        });
    }

    addDialerInAgents (agentsArray, dialerId) {
        agentsArray.forEach( (i) => {
            let a = this.getAgentById(i);
            if (a) {
                a.addDialer(dialerId)
            } else {
                log.warn(`Bad agent id ${i}`)
            };
        })
    }

    removeDialerInAgents (agentsArray, dialerId) {
        agentsArray.forEach( (i) => {
            let a = this.getAgentById(i);
            if (a) {
                a.removeDialer(dialerId);
                if (a.dialers.length === 0)
                    this.agents.remove(i);
            } else {
                log.warn(`Bad agent id ${i}`)
            };
        })
    }

    getAgentById (id) {
        return this.agents.get(id);
    }
}

module.exports =  class AutoDialer extends EventEmitter2 {

    constructor (app) {
        super();
        this._app = app;
        this.id = 'lock id';
        this.connectDb = false;
        this.connectFs = false;
        this.connectWConsole = false;

        this.activeDialer = new Collection('id');
        this.agentManager = new AgentManager();

        this.agentManager.on('unReserveHookAgent', this.sendAgentToDialer.bind(this));

        log.debug('Init AutoDialer');

        this.on(`changeConnection`, (e) => {
            if (this.isReady()) {
                this.loadCampaign();
            } else {
                this.forceStop();
            }
        });

        app.on('sys::connectDb', this.onConnectDb.bind(this));
        app.on('sys::reconnectDb', this.onConnectDb.bind(this));

        app.on('sys::connectDbError', this.onConnectDbError.bind(this));
        app.on('sys::closeDb', this.onConnectDbError.bind(this));

        app.on('sys::connectFsApi', this.onConnectFs.bind(this));
        app.on('sys::errorConnectFsApi', this.onConnectFsError.bind(this));

        app.on('sys::wConsoleConnect', this.onConnectWConsole.bind(this));
        app.on('sys::wConsoleConnectError', this.onConnectWConsoleError.bind(this));

        this.activeDialer.on('added', (dialer) => {

            dialer.on('ready', (d) => {
                log.debug(`Ready dialer ${d.name} - ${d._id}`);
                this.collection.dialer.findOneAndUpdate(
                    {_id: d._objectId},
                    {$set: {state: d.state, _cause: d.cause, active: true, nextTick: null}},
                    (err, res) => {
                        if (err)
                            log.error(err);

                    }
                )
            });

            dialer.once('end', (d) => {
                log.debug(`End dialer ${d.name} - ${d._id} - ${d.cause}`);
                clearTimeout(d._taskSleepId);
                if (dialer.type === DIALER_TYPES.ProgressiveDialer && dialer._agents instanceof Array)
                    this.agentManager.removeDialerInAgents(dialer._agents, dialer._id);

                this.collection.dialer.findOneAndUpdate(
                    {_id: d._objectId},
                    {$set: {state: d.state, _cause: d.cause, active: false, nextTick: null}},
                    (err, res) => {
                        if (err)
                            log.error(err);
                        this.activeDialer.remove(dialer._id);
                    }
                )
            });

            dialer.on('sleep', (d) => {
                this.collection.dialer.findOneAndUpdate(
                    {_id: d._objectId},
                    {$set: {state: d.state, _cause: d.cause, active: true, nextTick: new Date(Date.now() + dialer._sleepNextTry)}},
                    (err, res) => {
                        if (err)
                            log.error(err);
                    }
                );
                this.addTask(d);
            });

            dialer.on('error', (d) => {
                log.warn(`remove dialer ${d.name}`);
                this.activeDialer.remove(d._id);
            });

            if (dialer._agents instanceof Array && dialer.type === DIALER_TYPES.ProgressiveDialer) {

                this.agentManager.initDomain(dialer._domain, dialer._agents, (err, res) => {
                    if (err)
                        return log.error(err);

                    this.agentManager.addDialerInAgents(dialer._agents, dialer._id);

                    dialer.setReady();
                });
            } else {
                dialer.setReady();
            }
        });

        this.activeDialer.on('removed', (dialer) => {
            if (dialer.type === DIALER_TYPES.ProgressiveDialer && dialer._agents instanceof Array)
                this.agentManager.removeDialerInAgents(dialer._agents, dialer._id);

            log.info(`Remove active dialer ${dialer.name} : ${dialer._id} - ${dialer.cause}`);
        });
    }

    onConnectWConsole () {
        this.connectWConsole = true;
        this.emit('changeConnection');
    }
    onConnectWConsoleError () {
        this.connectWConsole = false;
        this.emit('changeConnection');
    }

    onAgentStatusChange (e) {
        if (e.subclass === 'webitel::account_status') {
            let jEvent = e.serialize('json', 1),
                id = `${jEvent['Account-User']}@${jEvent['Account-Domain']}`,
                agent = this.agentManager.getAgentById(id);
            if (agent) {
                agent.setState(jEvent['Account-User-State'], jEvent['Account-Status']);
            }
        }
    }

    sendAgentToDialer (agent) {
        for (let key of agent.dialers) {
            let d = this.activeDialer.get(key);
            if (d && d.setAgent(agent))
                break;
        }
    }

    onConnectFs (esl) {
        log.debug(`On init esl`);
        this.connectFs = true;
        esl.subscribe('CHANNEL_HANGUP_COMPLETE');
        esl.subscribe('CUSTOM webitel::account_status');
        esl.on('esl::event::CUSTOM::*', this.onAgentStatusChange.bind(this));
        this.emit('changeConnection');
    }

    onConnectFsError (e) {
        this.connectFs = false;
        this.emit('changeConnection', false);
    }

    onConnectDb (db) {
        log.debug(`On init db`);
        this.connectDb = true;
        this.collection = {
            dialer: db.collection(configFile.get('mongodb:collectionDialer')),
            calendar: db.collection(configFile.get('mongodb:collectionCalendar')),
            members: db.collection(configFile.get('mongodb:collectionDialerMembers'))
        };
        this.emit('changeConnection');
    }

    onConnectDbError (e) {
        log.warn('Db error');
        this.connectDb = false;
        this.emit('changeConnection', false);
    }

    isReady () {
        return this.connectDb === true && this.connectFs === true && this.connectWConsole === true;
    }

    addTask (dialer) {
        log.info(`Dialer ${dialer.name}@${dialer._domain} next try ${new Date(Date.now() + dialer._sleepNextTry)}`);
        clearTimeout(dialer._taskSleepId);

        dialer._taskSleepId = setTimeout(() => {
            if (!this.isReady()) {
                // sleep recovery min
                dialer._sleepNextTry = 60 * 1000;
                this.addTask(dialer);
            }

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
                    this.recoveryCrashDialer(dialer);
                })
            } else {
                log.debug('Not found dialer');
            }
        })
    }

    forceStop () {
        let keys = this.activeDialer.getKeys();
        for (let key of keys) {
            this.activeDialer.get(key).setState(DialerStates.Error);
        }
    }

    stopDialerById (id, domain, cb) {
        let dialer = this.activeDialer.get(id);
        if (!dialer)
            return cb(new Error("Not found"));
        dialer.setState(DialerStates.ProcessStop);
        return cb(null, dialer.toJson());
    }

    runDialerById(id, domain, cb) {
        if (!ObjectID.isValid(id))
            return cb(new Error("Bad object id"));

        let ad = this.activeDialer.get(id);
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

            let dialer = new Dialer(dialerDb, this.collection.members, res, this.id, this.agentManager);
            this.activeDialer.add(dialer._id, dialer);
        });

        return null;
    }

    recoveryCrashDialer (dialer) {
        this.collection
            .members
            // TODO Object Id
            .update(
                {dialer: dialer._id.toString(), _lock: this.id},
                {$set: {_endCause: END_CAUSE.PROCESS_CRASH}, $unset: {_lock: null}}, {multi: true},
                (err) => {
                    if (err)
                        return log.error(err);
                    this.addDialerFromDb(dialer);
                }
        )
    }
};

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
    tryLock (member) {
        if (this.activeLine >= this.maxLines || !member.number)
            return false;

        this.activeLine++;

        return (agent) => {
            let gwString = member.number.replace(this.regex, this.dialString);

            let vars = [`dlr_member_id=${member._id.toString()}`].concat(this._vars);

            for (let key of member.getVariableKeys()) {
                vars.push(`${key}='${member.getVariable(key)}'`);
            }

            if (agent) {
                vars.push(
                    `origination_callee_id_number='${agent.id}'`,
                    `origination_callee_id_name='${agent.id}'`,
                    `origination_caller_id_number='${member.number}'`,
                    `origination_caller_id_name='${member.name}'`
                    //`direction=inbound`
                    //`w_jsclient_originate_number='${member.number}'`
                );
                return `originate {${vars}}user/${agent.id} $bridge(${gwString})`;
            }

            vars.push(
                `dlr_queue=${member._queueId}`,
                `origination_uuid=${member.sessionId}`,
                `origination_caller_id_number='${member.queueNumber}'`,
                `origination_caller_id_name='${member.queueName}'`,
                `origination_callee_id_number='${member.number}'`,
                `origination_callee_id_name='${member.name}'`
            );
            return `originate {${vars}}${gwString} ` +  '&socket($${acr_srv})';
        };
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

                        // Check limit gw;
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
                    log.error(e);
                }
            });
            // set new limit gw && TODO +- limit operator
            if (maxLimitGw !== -1 && this._limit > maxLimitGw)
                this._limit = maxLimitGw


        }
    }

    getDialStringFromMember (member) {
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
                        continue; // Next gw check

                    res.dialString = this._resourcePaterns[i].gws[j].tryLock(member);
                    if (res.dialString) {
                        res.patternIndex = i; // Ok gw
                        res.gw = j;
                        break
                    } else {
                        this._lockedGateways.push(gatewayPositionMap) // Bad gw
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
        // Free
        if (gateway.unLock() && ~this._lockedGateways.indexOf(gatewayPositionMap))
            this._lockedGateways.splice(this._lockedGateways.indexOf(gatewayPositionMap), 1)

    }
}

const DialerStates = {
    Idle: 0,
    Work: 1,
    Sleep: 2,
    ProcessStop: 3,
    End: 4,
    Error: 5
};

const DialerCauses = {
    Init: "INIT",
    ProcessStop: "QUEUE_STOP",
    ProcessRecovery: "QUEUE_RECOVERY",
    ProcessSleep: "QUEUE_SLEEP",
    ProcessReady: "QUEUE_HUNTING",
    ProcessNotFoundMember: "NOT_FOUND_MEMBER",
    ProcessComplete: "QUEUE_COMPLETE",
    ProcessExpire: "QUEUE_EXPIRE",
    ProcessInternalError: "QUEUE_ERROR"
};

class Dialer extends Router {
    constructor (config, dbCollection, calendarConfig, lockId, agentManager) {
        super();
        // TODO string ????
        this._id = config._id.toString();
        this._objectId = config._id;
        this._am = agentManager;

        // TODO Delete :)
        //this.bigData = new Array(1e6).join('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n');

        this.name = config.name;
        this.number = config.number || this.name;
        this._limit = MAX_MEMBER_RETRY;
        this._maxTryCount = 5;
        this._intervalTryCount = 5;
        this._timerId = null;
        this._domain = config.domain;
        this._calendar = calendarConfig;
        this._agents = [];

        this.state = DialerStates.Idle;
        this.cause = DialerCauses.Init;

        this._countRequestHunting = 0;
        this._agentReserveCallback = [];

        if (config.agents instanceof Array)
            this._agents = [].concat(config.agents).map( (i)=> `${i}@${this._domain}`);

        if (config.parameters instanceof Object) {
            this._limit = config.parameters.limit || MAX_MEMBER_RETRY;
            this._maxTryCount = config.parameters.maxTryCount || 5;
            this._intervalTryCount = config.parameters.intervalTryCount || 5;
        };

        this._variables = config.variables || {};
        this._variables.domain_name = config.domain;

        this._setResource(config.resources);

        this.type = config.type;

        log.debug(`
            Init dialer: ${this.name}@${this._domain}
            Config:
                type: ${this.type}
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

        let typesUnReserve = {};

        typesUnReserve[DIALER_TYPES.ProgressiveDialer] = typesUnReserve[DIALER_TYPES.VoiceBroadcasting] = function (id, cb) {
            dbCollection.findOneAndUpdate(
                {_id: id},
                {$set: {_lock: null}},
                cb
            )
        }.bind(this);

        let typesReserve = {};
        typesReserve[DIALER_TYPES.ProgressiveDialer] = typesReserve[DIALER_TYPES.VoiceBroadcasting] = function (cb) {
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
                $or: [{_nextTryTime: {$lte: Date.now()}}, {_nextTryTime: null}]
            };
            //let i = {
            //    _nextTryTime: -1,
            //    priority: -1,
            //    _id: -1,
            //    dialer: 1,
            //    _endCause: 1,
            //    _lock: 1,
            //    "communications.state": 1,
            //    "communications.gatewayPositionMap": 1
            //};
            console.dir(filter, {depth: 5, colors: true});

            dbCollection.findOneAndUpdate(
                filter,
                {$set: {_lock: lockId}},
                {sort: [["_nextTryTime", -1],["priority", -1], ["_id", -1]]},
                cb
            )
        }.bind(this);

        let dialMember = {};
        dialMember[DIALER_TYPES.VoiceBroadcasting] = function (member) {

            log.trace(`try call ${member.sessionId}`);
            let gw = this.getDialStringFromMember(member);


            if (gw.found) {
                if (gw.dialString) {
                    let ds = gw.dialString();
                    member.log(`dialString: ${ds}`);

                    let onChannelHangup = function (e) {
                        this.freeGateway(gw);
                        let recordSec = +e.getHeader('variable_record_seconds');
                        if (recordSec)
                            member.setRecordSession(recordSec);
                        member.end(e.getHeader('variable_hangup_cause'));
                    }.bind(this);

                    member.offEslEvent = function () {
                        application.Esl.off(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, onChannelHangup);
                    };

                    application.Esl.once(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, onChannelHangup);

                    log.trace(`Call ${ds}`);

                    application.Esl.bgapi(ds, (res) => {

                        if (/^-ERR/.test(res.body)) {
                            member.offEslEvent();
                            this.freeGateway(gw);
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

        }.bind(this);

        if (this.type === DIALER_TYPES.ProgressiveDialer) {
            if (this._limit > this._agents.length) {
                this._limit = this._agents.length;
            }
            let getMembersFromEvent = (e) => {
                return this.members.get(e.getHeader('variable_dlr_member_id'))
            };

            application.Esl.subscribe(['CHANNEL_CREATE', 'CHANNEL_DESTROY']);

            application.Esl.on('esl::event::CHANNEL_DESTROY::*', (e) => {
                let m = getMembersFromEvent(e);
                if (m && --m.channelsCount === 0) {

                    this.freeGateway(m._gw);
                    this._am.taskUnReserveAgent(m._agent, 5);
                    log.trace(`End channels ${m.sessionId}`);
                    let recordSec = +e.getHeader('variable_record_seconds');
                    if (recordSec)
                        m.setRecordSession(recordSec);
                    m.end(e.getHeader('variable_hangup_cause'));
                }
            });
            application.Esl.on('esl::event::CHANNEL_CREATE::*', (e) => {
                let m = getMembersFromEvent(e);
                if (m)
                    m.channelsCount++;
            });
        }

        dialMember[DIALER_TYPES.ProgressiveDialer] = function (member) {
            log.trace(`try call ${member.sessionId}`);

            let gw = this.getDialStringFromMember(member);
            if (gw.found) {
                if (gw.dialString) {
                    this.findAvailAgents( (agent) => {
                        member.log(`set agent: ${agent.id}`);
                        let ds = gw.dialString(agent);
                        member._gw = gw;
                        member._agent = agent;

                        member.log(`dialString: ${ds}`);
                        member.offEslEvent = function () {
                        };

                        log.trace(`Call ${ds}`);
                        member.inCall = true;
                        application.Esl.bgapi(ds, (res) => {
                            log.trace(`fs response: ${res && res.body}`);
                            if (/^-ERR/.test(res.body)) {
                                member.offEslEvent();
                                this.freeGateway(gw);
                                let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
                                member.log(`agent: ${error}`);
                                member.minusProbe();
                                this.nextTrySec = 0;
                                member.end();

                                this._am.taskUnReserveAgent(agent, 0);
                            }
                        });
                    });

                } else {
                    member.minusProbe();
                    this.nextTrySec = 0;
                    member.end();
                }
            } else {
                member.end(gw.cause);
            }
        }.bind(this);

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
                            return log.error(err);

                        log.trace(`removed ${m.sessionId}`);
                        if (!this.members.remove(m._id))
                            log.error(new Error(m));
                    }
                );
            });

            if (!this.checkLimit() && this.isReady())
                this.getNextMember();

            this.dialMember(member);
        });

        this.members.on('removed', () => {
            this.checkSleep();
            if (!this.isReady() || this.members.length() === 0)
                return this.tryStop();

            if (!this.checkLimit())
                this.getNextMember();
        });
    }

    toJson () {
        return {
            "members": this.members.length(),
            "state": this.state
        }
    }

    setSleepStatus (sleepTime) {
        this.cause = DialerCauses.ProcessSleep;
        this.state = DialerStates.Sleep;
        this._sleepNextTry = sleepTime;
        this.emit('sleep', this);
    }

    initCalendar () {
        this._calendarMap = {
            deadLineTime: 0
        };
        let calendar = this._calendar;
        let expireCb = function () {
            this.cause = DialerCauses.ProcessExpire;
            this.state = DialerStates.End;
        }.bind(this);


        if (calendar && calendar.accept instanceof Array) {
            let sort = calendar.accept.sort(dynamicSort('weekDay'));

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
        } else {
            expireCb();
            return false
        };

        let current;
        if (calendar.timeZone && calendar.timeZone.id)
            current = moment().tz(calendar.timeZone.id);
        else current = moment();

        let currentTime = current.valueOf();


        // Check range date;
        if (calendar.startDate && currentTime < calendar.startDate) {
            this.setSleepStatus(new Date(calendar.startDate).getTime() - Date.now() + 1);
            return false;
        } else if (calendar && currentTime > calendar) {
            expireCb();
            return false
        }

        let currentWeek = current.isoWeekday();
        let currentTimeOfDay = current.get('hours') * 60 + current.get('minutes');

        let deadLineRes = getDeadlineMinuteFromSortMap(currentTimeOfDay, currentWeek, this._calendarMap);

        if (deadLineRes.active) {
            this.state = DialerStates.Idle;
            this._calendarMap.deadLineTime = (deadLineRes.minute * 60 * 1000) + Date.now();
        } else {
            this.setSleepStatus(deadLineRes.minute * 60 * 1000);
        }
    }

    checkSleep () {
        if (Date.now() >= this._calendarMap.deadLineTime && this.state !== DialerStates.Sleep) {
            this.initCalendar();
            this.setState(DialerStates.Sleep);
        }
    }

    setReady () {
        if ( typeof this.dialMember !== 'function') {
            this.cause = `Not implement IGOR ${this.type}`;
            this.setState(DialerStates.End);
            this.emit('end', this);
            return log.error(`Bad dialer ${this._id} type ${this.type}`);
        } else {
            log.trace(`Init dialer ${this.name} - ${this._id} type ${this.type}`);
        }
        this.initCalendar();
        if (this.state !== DialerStates.Idle)
            return;
        this.cause = DialerCauses.ProcessReady;
        this.state = DialerStates.Work;
        this.emit('ready', this);
        this.getNextMember();
    }

    checkLimit () {
        return (this._countRequestHunting >= this._limit || this.members.length()  >= this._limit);
    }

    setState (state) {
        this.state = state;

        if (this.isError()) {
            let ms = this.members.getKeys();
            ms.forEach((key) => {
                let m = this.members.get(key);
                m.removeAllListeners();
                if (typeof m.offEslEvent == 'function') {
                    m.offEslEvent();
                }
                this.members.remove(key)
            });

            this.emit('error', this);
            return;
        }

        if (state === DialerStates.ProcessStop && this.members.length() === 0) {
            this.cause = DialerCauses.ProcessStop;
            this.emit('end', this);
        };
    }

    isReady () {
        return this.state === DialerStates.Work;
    }

    getNextMember () {
        log.trace(`find next members in ${this.name} - members queue: ${this.members.length()}`);

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
                if (this.members.length() === 0)
                    this.tryStop();
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

    isError () {
        return this.state === DialerStates.Error;
    }

    tryStop () {

        console.log('state', this.state, this.members.length());
        if (this.isError()) {
            log.warn(`Force stop process.`);
            return;
        }

        if (this.state === DialerStates.ProcessStop) {
            let mKeys = this.members.getKeys();
            for (let key of mKeys) {
                let m = this.members.get(key)
                if (m && m.channelsCount === 0) {
                    //m.minusProbe();
                    m.end();
                }
            }

            if (this.members.length() != 0)
                return;

            log.info('Stop dialer');

            this.cause = DialerCauses.ProcessStop;
            this.active = false;
            this.emit('end', this);
            return
        }

        if (this.state === DialerStates.Sleep) {
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
                this.cause = DialerCauses.ProcessNotFoundMember;
                this.setState(DialerStates.End);
                this.emit('end', this);
                return log.info(`STOP DIALER ${this.name}`);
            }

            if (!res)
                return;

            log.trace(`Status ${this.name} : state - ${this.state}; count - ${res.count || 0}; nextTryTime - ${res.nextTryTime}`);

            if (res.count === 0) {
                this.cause = DialerCauses.ProcessComplete;
                this.setState(DialerStates.End);
                this.emit('end', this);
                return log.info(`STOP DIALER ${this.name}`);
            }

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

    setAgent (agent) {
        if (this._agentReserveCallback.length === 0 || !this.isReady())
            return false;
        this._am.reserveAgent(agent, (err) => {
            if (err) {
                return log.error(err);
            };
            var fn = this._agentReserveCallback.shift();
            if(fn && typeof fn === 'function')
                fn(agent);
        });
        return true;
    }

    findAvailAgents (cb) {
        var a = this._am.getFreeAgent(this._agents);
        if (a) {
            this._am.reserveAgent(a, (err) => {
                if (err) {
                    log.error(err);
                    return this._agentReserveCallback.push(cb);
                };
                cb(a)
            })
        } else {
            this._agentReserveCallback.push(cb);
            console.log(`find agent... queue length ${this._agentReserveCallback.length}`);
        }
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
        this.channelsCount = 0;

        this.sessionId = generateUuid.v4();
        this._log = {
            session: this.sessionId,
            steps: []
        };
        this.currentProbe = (config._probeCount || 0) + 1;
        this.endCause = null;

        this.score = 0;

        this.bigData = new Array(1e4).join('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n');
        this.variables = {};
        this.inCall = false;

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
                    communication._score = communication.priority - (communication._probe + 1);
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
        return this.variables[varName];
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

    setRecordSession (sec) {
        this._log.recordSessionSec = sec;
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
                this.log(`min next time: ${this.nextTime}`);
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
};