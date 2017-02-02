/**
 * Created by igor on 25.05.16.
 */

let Dialer = require('./dialer'),
    log = require(__appRoot + '/lib/log')(module),

    DIALER_TYPES = require('./const').DIALER_TYPES;

module.exports = class VoiceBroadcast extends Dialer {

    constructor (config, calendarConf, dialerManager) {
        super(DIALER_TYPES.VoiceBroadcasting, config, calendarConf, dialerManager);

        this.on('ready', () => {
            this.huntingMember();
        });

        this.members.on('added', (m) => {
            if (this._active < this._limit)
                this.huntingMember();
        });

        this.members.on('removed', (m) => {
            this.rollback({
                callSuccessful: m.callSuccessful
            }, e => {
                if (!e)
                    this.huntingMember();
            });
        });
        
        this.getDialString = (member) => {
            const vars = [`presence_data='${member._domain}'`, `cc_queue='${member.queueName}'`, `originate_timeout=${this._originateTimeout}`];

            for (let key in this._variables) {
                if (this._variables.hasOwnProperty(key)) {
                    vars.push(`${key}='${this._variables[key]}'`);
                }
            }

            for (let key of member.getVariableKeys()) {
                vars.push(`${key}='${member.getVariable(key)}'`);
            }
            vars.push(
                // `origination_uuid=${member.sessionId}`,
                `origination_caller_id_number='${member.queueNumber}'`,
                `origination_caller_id_name='${member.queueName}'`,
                `origination_callee_id_number='${member.number}'`,
                `origination_callee_id_name='${member.name}'`,
                `loopback_bowout_on_execute=true`
            );
            return `originate {${vars}}loopback/${member.number}/default 'set:dlr_member_id=${member._id.toString()},set:dlr_queue=${member._queueId},socket:` + '$${acr_srv}' + `' inline`;
        };

        let handleHangupEvent = (e) => {
            let member = this.members.get(e.getHeader('variable_dlr_member_id'));
            if (member) {
                member.channelsCount--;
                member.end(e.getHeader('variable_hangup_cause'), e);
            }
        };

        application.Esl.on(`esl::event::CHANNEL_HANGUP_COMPLETE::*`, handleHangupEvent);

        this.once('end', () => {
            application.Esl.off(`esl::event::CHANNEL_HANGUP_COMPLETE::*`, handleHangupEvent);
        });
    }

    dialMember (member) {
        log.trace(`try call ${member.sessionId}`);
        let ds = this.getDialString(member);
        member.log(`dialString: ${ds}`);

        log.trace(`Call ${ds}`);

        application.Esl.bgapi(ds, (res) => {
            if (/^-ERR/.test(res.body)) {
                if (typeof member.offEslEvent === 'function')
                    member.offEslEvent();
                let error =  res.body.replace(/-ERR\s(.*)\n/, '$1');
                member.end(error);
            }
            member.channelsCount++;
        });
    }
};