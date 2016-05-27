/**
 * Created by igor on 24.05.16.
 */

'use strict';

let EventEmitter2 = require('eventemitter2').EventEmitter2,
    ccService = require(__appRoot + '/services/callCentre'),
    Agent = require('./agent'),
    async = require('async'),
    log = require(__appRoot + '/lib/log')(module),
    AGENT_STATE = require('./const').AGENT_STATE,
    AGENT_STATUS = require('./const').AGENT_STATUS,
    DIFF_CHANGE_MSEC = require('./const').DIFF_CHANGE_MSEC,
    Collection = require(__appRoot + '/lib/collection')
    ;

class AgentManager extends EventEmitter2 {

    constructor () {

        super();
        this.agents = new Collection('id');
        this._keys = [];

        this.agents.on('added', (a, key) => {
            if (!~this._keys.indexOf(key))
                this._keys.push(key);

            log.trace('add agent: ', a);
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
                this.timerId = null;
                log.debug('Stop agent manager timer');
            }
        });
        this.timerId = null;

        this.tick = () => {
            let time = Date.now();
            for (let key of this._keys) {
                let agent = this.agents.get(key);
                //console.log(agent)
                if (agent.state === AGENT_STATE.Idle && agent.unIdleTime != 0 && agent.unIdleTime <= time) {
                    agent.unIdleTime = 0;
                    this.setAgentStatus(agent, AGENT_STATE.Waiting, (err) => {
                        if (err)
                            log.error(err);
                    });
                }
                if (agent && agent.state === AGENT_STATE.Waiting && agent.status === AGENT_STATUS.Available && !agent.lock && agent.lockTime <= time) {
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
                if (a && a.state === AGENT_STATE.Waiting && a.status === AGENT_STATUS.Available && !a.lock &&  a.lockTime <= Date.now()) {
                    return a;
                }
            }
    }

    taskUnReserveAgent (agent, timeSec) {
        if (agent.lock === true) {
            agent.lock = false;
            let wrapTime = Date.now() + (timeSec * 1000);
            agent.lockTime = wrapTime + DIFF_CHANGE_MSEC;
            agent.unIdleTime = wrapTime;
        }
    }

    reserveAgent (agent, cb) {
        agent.lock = true;
        this.setAgentStatus(agent, AGENT_STATE.Idle, (err, res) => {
            if (err) {
                log.error(err);
                agent.lock = false;
                return cb(err)
            }
            return cb()
        })
    }

    setAgentStatus (agent, status, cb) {
        // TODO if err remove agent ??
        ccService._setAgentState(agent.id, status, cb);
    }

    initAgents (agentsArray, callback) {
        async.eachSeries(agentsArray,
            (agentId, cb) => {
                if (this.agents.existsKey(agentId))
                    return cb();

                ccService._getAgentParams(agentId, (err, res) => {
                    if (err)
                        return cb(err);
                    let agentParams = res && res[0];
                    if (agentParams) {
                        this.agents.add(agentId, new Agent(agentId, agentParams));
                    }
                    // TODO SKIP???
                    return cb();
                });
            },
            callback
        );
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
                if (a.dialers.length === 0) {
                    this.agents.remove(i);
                    if (a.state === AGENT_STATE.Idle && a.unIdleTime !== 0)
                        this.setAgentStatus(a, AGENT_STATE.Waiting, (err) => {
                            if (err)
                                log.error(err);
                        })
                }
            } else {
                log.warn(`Bad agent id ${i}`)
            };
        })
    }

    getAgentById (id) {
        return this.agents.get(id);
    }
}

module.exports = AgentManager;