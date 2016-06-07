/**
 * Created by igor on 31.05.16.
 */

// TODO ...

let Dialer = require('./dialer'),
    log = require(__appRoot + '/lib/log')(module),
    Gw = require('./gw'),
    Member = require('./member'),
    Router = require('./router'),
    async = require('async'),
    DIALER_TYPES = require('./const').DIALER_TYPES;

module.exports = class Predictive extends Dialer {
    constructor (config, calendarConf) {
        super(DIALER_TYPES.PredictiveDialer, config, calendarConf);

        this._am = config.agentManager;

        this._gw = new Gw({}, null, this._variables);
        this._router = new Router(config.resources, this._variables);
        this._agentReserveCallback = [];
        this._agents = [];


        this._gotCallCount = 0;
        this._badCallCount = 0;
        this._allCallCount = 0;
        this._activeCallCount = 0;
        this._skipAgents = [];
        this._minPredictWaitingAgents = 0;

        this._queueCall = [];

        this._predictAdjust = 150; // Determines how aggressively to dial. The minimum value is 0, which disables over-dialing; the maximum is 1000; the default is 150


        if (config.agents instanceof Array)
            this._agents = [].concat(config.agents); //.map( (i)=> `${i}@${this._domain}`);



        if (this._limit > this._agents.length && this._skills.length === 0  )
            this._limit = this._agents.length;

        // start with available count
        if (this._limit > this._router._limit) {
            log.warn(`skip dialer limit, max resources ${this._router._limit}`);
            this._limit = this._router._limit;
        }

        let getMembersFromEvent = (e) => {
            return this.members.get(e.getHeader('variable_dlr_member_id'))
        };

        // let onChannelCreate = (e) => {
        //
        // };
        // let onChannelDestroy = (e) => {
        //
        // };
        //
        // let onChannelPark = (e) => {
        //     console.log('PARK');
        // };
        // let onChannelAnswer = (e) => {
        //     console.log('ANSWER');
        // };
        // let onChannelBridge = (e) => {
        //     console.log('BRIDGE');
        // };
        //
        // this.once('end', () => {
        //     log.debug('Off channel events');
        //     application.Esl.off('esl::event::CHANNEL_DESTROY::*', onChannelDestroy);
        //     application.Esl.off('esl::event::CHANNEL_CREATE::*', onChannelCreate);
        //     application.Esl.off('esl::event::CHANNEL_PARK::*', onChannelPark);
        //     application.Esl.off('esl::event::CHANNEL_ANSWER::*', onChannelAnswer);
        //     application.Esl.off('esl::event::CHANNEL_BRIDGE::*', onChannelBridge);
        // });
        application.Esl.subscribe([ 'CHANNEL_HANGUP_COMPLETE', 'CHANNEL_ANSWER']);

        // application.Esl.on('esl::event::CHANNEL_DESTROY::*', onChannelDestroy);
        // application.Esl.on('esl::event::CHANNEL_CREATE::*', onChannelCreate);
        // application.Esl.on('esl::event::CHANNEL_PARK::*', onChannelPark);
        // application.Esl.on('esl::event::CHANNEL_ANSWER::*', onChannelAnswer);
        // application.Esl.on('esl::event::CHANNEL_BRIDGE::*', onChannelBridge);



        for (let i = 99950; i <= 99999; i++) {
            application.Esl.bgapi(`callcenter_config agent set status ${i}@10.10.10.144 Available`);
            application.Esl.bgapi(`callcenter_config agent set state ${i}@10.10.10.144 Waiting`);
        }

        let dial = (member, cb) => {
            let ds = member._ds;

            let onChannelAnswer = (e) => {
                member.log(`answer`);
                let agent = this._am.getFreeAgent(this._agents);
                if (agent) {
                    this._am.reserveAgent(agent, () => {
                        member._agent = agent;
                        member.log(`set agent: ${agent.id}`);
                        application.Esl.bgapi(`uuid_transfer ${member.sessionId} ${agent.number}`, (res) => {
                            member.log(res.body);
                            if (/^-ERR/.test(res.body)) {
                                this._badCallCount++;
                                application.Esl.bgapi(`uuid_kill ${member.sessionId}`);
                                member.end('BAD', e);
                                return;
                            }
                            this._gotCallCount++;
                        });
                    });

                } else {
                    member.log(`no found agent`);
                    this._badCallCount++;
                    console.log('--------------------------- NO AGENTS ---------------------------');
                    application.Esl.bgapi(`uuid_kill ${member.sessionId}`);
                    member.end('BAD', e);
                }

            };

            let destoySession = false;

            let onChannelDestroy = (e) => {
                if (!destoySession) {
                    this._activeCallCount--;
                    member.log(`minus line`);
                    destoySession = true;
                    member.channelsCount--;
                }
                if (e.getHeader('variable_hangup_cause') != 'NORMAL_CLEARING') {
                    this._gotCallCount--;
                }
                log.trace(`End channels ${member.sessionId}`);
                member.end(e.getHeader('variable_hangup_cause'), e);
                cb();
            };

            application.Esl.once(`esl::event::CHANNEL_ANSWER::${member.sessionId}`, onChannelAnswer);
            application.Esl.once(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, onChannelDestroy);

            this._activeCallCount++;
            member.log(`plus line`);
            console.log(`dial count: ${this._activeCallCount}`);
            this._callRequestCount++;
            this._allCallCount++;
            member.channelsCount++;
            application.Esl.bgapi(ds, (res) => {
                this._callRequestCount--;
                member.log(res.body);
                if (/^-ERR/.test(res.body)) {
                    application.Esl.off(`esl::event::CHANNEL_ANSWER::${member.sessionId}`, onChannelAnswer);
                    application.Esl.off(`esl::event::CHANNEL_HANGUP_COMPLETE::${member.sessionId}`, onChannelDestroy);
                    let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
                    if (!destoySession) {
                        member.log(`minus line`);
                        this._activeCallCount--;
                        member.channelsCount--;
                        destoySession = true;
                    }
                    member.end(error);
                    return;
                } else if (/^-USAGE/.test(res.body)) {
                    this._activeCallCount--;
                    // TODO
                    member.log(`minus line`);
                    destoySession = true;
                    member.channelsCount--;
                    member.end('DESTINATION_OUT_OF_ORDER');
                    return
                }
            });
        };

        this.__dial = dial;

        let q = async.queue(dial, this._agents.length);


        this._q = q;
        this._callRequestCount = 0;
        this.__dumpLastRecalc = 10;
    }

    calcLimit (agent) {
        console.log(`call request ${this._callRequestCount}`);
        if (!this.isReady()) {
            this._queueCall.length = 0;
            return;
        }

        if (this._callRequestCount != 0) return;
        let cc = 0;
        this._skipAgents = this._am.getFreeAgents(this._agents);
        let aC = this._skipAgents.length; //this._skipAgents.length;
        if (aC == 0)
                return;

        if (this._predictAdjust != 0 && this._gotCallCount > 10 && aC > 0) {

            if (this.__dumpLastRecalc < this._gotCallCount) {
                let avgBad = (this._badCallCount * 100) / this._allCallCount;
                if (avgBad > 3) {
                    this._predictAdjust -= this._predictAdjust * (avgBad / 100);
                    if (this._predictAdjust <= 0)
                        this._predictAdjust = 1;

                } else if (avgBad > 0 && avgBad < 3 && this._predictAdjust < 1000) {
                    this._predictAdjust += this._predictAdjust * ((100 - avgBad) / 100);
                    if (this._predictAdjust > 1000)
                        this._predictAdjust = 1000;
                } else  if (avgBad === 0) {
                    this._predictAdjust += this._predictAdjust * 0.055;
                }
                this.__dumpLastRecalc = this._gotCallCount + 10;
            }

            let connectRate = this._allCallCount / this._gotCallCount;
            let overDial = Math.abs((aC / connectRate) - aC);
            console.log(`connectRate: ${connectRate} overDial: ${overDial}`);
            cc =  Math.ceil(aC + (overDial * this._predictAdjust) / 100 );
            this._q.concurrency = this._activeCallCount + cc;
        } else {
            cc = aC;
        }



        // move config; recalc _predictAdjust
        // if (!(this._allCallCount % 10)) {
        //     let avgBad = this._badCallCount * 100 / this._allCallCount;
        //     if (avgBad > 3.99) {
        //         this._predictAdjust -= this._predictAdjust * ((avgBad - 3.99) / 100);
        //     } else if (avgBad >= 0 && avgBad < 3) {
        //         this._predictAdjust += this._predictAdjust * 0.1;
        //     }
        // }

        console.log(`concurrency: ${this._q.concurrency}; cc: ${cc}; aC: ${aC}; calls: ${this._activeCallCount}; adjust: ${this._predictAdjust}; all: ${this._allCallCount}; got: ${this._gotCallCount}; bad: ${this._badCallCount}`);

        if (this._queueCall.length > 0) {
            for (let i = 0; i < cc; i++) {
                let m = this._queueCall.shift();
                if (!m) {
                    break;
                }
                this.__dial(m, this.calcLimit.bind(this));
                // this._q.push(m, this.calcLimit.bind(this));
            }
        }
    }

    dialMember (member) {
        log.trace(`try call ${member.sessionId}`);

        let gw = this._router.getDialStringFromMember(member);

        if (gw.found) {
            if (gw.dialString) {
                let ds = gw.dialString(null, null, true);
                member._ds = ds;
                member.log(`dialString: ${ds}`);
                log.trace(`Call ${ds}`);

                member.once('end', () => {
                    this._router.freeGateway(gw);
                    if (member._agent) {
                        this._am.taskUnReserveAgent(member._agent, 10);
                    }
                });

                this._queueCall.push(member);

            } else {
                member.minusProbe();
                this.nextTrySec = 0;
                member.end();
            }
        } else {
            member.end(gw.cause);
        }

    }

    setAgent (agent) {
        if (~this._skipAgents.indexOf(agent) || !this.isReady())
                return false;
        // console.log(`free agent ${agent.id}`);
        this.calcLimit(agent);
        // this._limit++;
        // this.huntingMember();
        return true;

        // let ds = this._gw.dialAgent(agent);
        // this._am.reserveAgent(agent, (err) => {
        //     if (err) {
        //         return log.error(err);
        //     }
        //     application.Esl.bgapi(ds, (res) => {
        //         if (/^-ERR/.test(res.body)) {
        //             let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
        //             log.error(error);
        //             this._am.taskUnReserveAgent(agent, agent.rejectDelayTime);
        //         }
        //     });
        // });
        // return true;
    }

    setLimit () {
        let p = 10; // the hit rate
        let m = 10; // parameter of service distribution
        let qD = 10; // the dial frequency
        let q = this.members.length(); // inbound call flow

        let aMax = 2; // The maximum abandon rate
        let agentsCount = this._am.availableCount; // the number of free agents


    }

    findAvailAgents (cb) {

    }
};