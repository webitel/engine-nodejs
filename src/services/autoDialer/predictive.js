/**
 * Created by igor on 31.05.16.
 */

// TODO ...

let Dialer = require('./dialer'),
    log = require(__appRoot + '/lib/log')(module),
    Gw = require('./gw'),
    Router = require('./router'),
    DIALER_TYPES = require('./const').DIALER_TYPES;

module.exports = class Predictive extends Dialer {
    constructor (config, calendarConf) {
        super(DIALER_TYPES.PredictiveDialer, config, calendarConf);

        this._am = config.agentManager;
        console.log(this._am.availableCount);
        this._gw = new Gw({}, null, this._variables);
        this._router = new Router(config.resources, this._variables);
        this._agentReserveCallback = [];
        this._agents = [];

        if (config.agents instanceof Array)
            this._agents = [].concat(config.agents); //.map( (i)=> `${i}@${this._domain}`);


        if (this._limit > this._agents.length && this._skills.length === 0  )
            this._limit = this._agents.length;

        this._limit = 20;

        let getMembersFromEvent = (e) => {
            return this.members.get(e.getHeader('variable_dlr_member_id'))
        };

        let onChannelCreate = (e) => {

        };
        let onChannelDestroy = (e) => {

        };

        let onChannelPark = (e) => {
            console.log('PARK');
        };
        let onChannelAnswer = (e) => {
            console.log('ANSWER');
        };
        let onChannelBridge = (e) => {
            console.log('BRIDGE');
        };

        this.once('end', () => {
            log.debug('Off channel events');
            application.Esl.off('esl::event::CHANNEL_DESTROY::*', onChannelDestroy);
            application.Esl.off('esl::event::CHANNEL_CREATE::*', onChannelCreate);
            application.Esl.off('esl::event::CHANNEL_PARK::*', onChannelPark);
            application.Esl.off('esl::event::CHANNEL_ANSWER::*', onChannelAnswer);
            application.Esl.off('esl::event::CHANNEL_BRIDGE::*', onChannelBridge);
        });
        application.Esl.subscribe(['CHANNEL_CREATE', 'CHANNEL_DESTROY', 'CHANNEL_PARK', 'CHANNEL_ANSWER', 'CHANNEL_BRIDGE']);

        application.Esl.on('esl::event::CHANNEL_DESTROY::*', onChannelDestroy);
        application.Esl.on('esl::event::CHANNEL_CREATE::*', onChannelCreate);
        application.Esl.on('esl::event::CHANNEL_PARK::*', onChannelPark);
        application.Esl.on('esl::event::CHANNEL_ANSWER::*', onChannelAnswer);
        application.Esl.on('esl::event::CHANNEL_BRIDGE::*', onChannelBridge);

    }

    dialMember (member) {
        log.trace(`try call ${member.sessionId}`);
        this._am.availableCount
        let gw = this._router.getDialStringFromMember(member);

        if (gw.found) {
            if (gw.dialString) {
                let ds = gw.dialString(null, null, true);
                member.log(`dialString: ${ds}`);
                log.trace(`Call ${ds}`);

                this._limit = this._am.availableCount;
                console.log(this._limit);
                

                let onChannelAnswer = (e) => {
                    console.log("ANSWERRRRRRRR");

                    let agent = this._am.getFreeAgent(this._agents);
                    if (agent) {
                        this._am.reserveAgent(agent, () => {
                            member._agent = agent;
                            member.log(`set agent: ${agent.id}`);
                            application.Esl.bgapi(`uuid_transfer ${member.sessionId} ${agent.number}`);
                        });

                    } else {
                        console.log('--------------------------- NO AGENTS ---------------------------');
                        application.Esl.bgapi(`uuid_kill ${member.sessionId}`);
                        member.end('BAD', e);
                    }

                };

                member.once('end', () => {
                    this._router.freeGateway(gw);
                    if (member._agent) {
                        this._am.taskUnReserveAgent(member._agent, 0);
                    }
                });

                let onChannelDestroy = (e) => {
                    log.trace(`End channels ${member.sessionId}`);
                    member.end(e.getHeader('variable_hangup_cause'), e);
                };

                application.Esl.once(`esl::event::CHANNEL_ANSWER::${member.sessionId}`, onChannelAnswer);
                application.Esl.once(`esl::event::CHANNEL_DESTROY::${member.sessionId}`, onChannelDestroy);

                application.Esl.bgapi(ds, (res) => {

                    if (/^-ERR/.test(res.body)) {
                        let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
                        member.end(error);
                        return;
                    }
                    member._gw = gw;
                    member.channelsCount++;
                });
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
        this._limit++;
        this.huntingMember();
        return false;

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