/**
 * Created by igor on 25.05.16.
 */

class Gw {
    constructor (conf, regex, variables) {
        this.activeLine = 0;
        // TODO link regex...
        this.regex = regex;
        this.maxLines = conf.limit || 0;
        this.gwName = conf.gwName;
        this._vars = [];

        if (variables) {
            let arr = [];
            for (let key in variables)
                arr.push(`${key}=${variables[key]}`);

            this._vars = arr;
        }

        this.dialString = conf.gwProto == 'sip' && conf.gwName ? `sofia/gateway/${conf.gwName}/${conf.dialString}` : conf.dialString;
    }

    fnDialString (member) {
        return (agent, sysVars) => {
            let vars = [`dlr_member_id=${member._id.toString()}`, `cc_queue='${member.queueName}'`].concat(this._vars);

            if (sysVars instanceof Array) {
                vars = vars.concat(sysVars);
            }

            for (let key of member.getVariableKeys()) {
                vars.push(`${key}='${member.getVariable(key)}'`);
            }

            if (agent) {
                vars.push(
                    `origination_callee_id_number=${agent.id}`,
                    `origination_callee_id_name='${agent.id}'`,
                    `origination_caller_id_number=${member.number}`,
                    `origination_caller_id_name='${member.name}'`,
                    `destination_number=${member.number}`,
                    `originate_timeout=${agent.callTimeout}`
                );
                return `originate {${vars}}user/${agent.id} 'set_user:${agent.id},transfer:${member.number}' inline`;
            }

            vars.push(
                `dlr_queue=${member._queueId}`,
                `origination_uuid=${member.sessionId}`,
                `origination_caller_id_number='${member.queueNumber}'`,
                `origination_caller_id_name='${member.queueName}'`,
                `origination_callee_id_number='${member.number}'`,
                `origination_callee_id_name='${member.name}'`
            );

            let gwString = member.number.replace(this.regex, this.dialString);

            return `originate {${vars}}${gwString} ` +  '&socket($${acr_srv})';
        };
    }

    tryLock (member) {
        if (this.activeLine >= this.maxLines || !member.number)
            return false;

        this.activeLine++;

        return this.fnDialString(member)
    }

    unLock () {
        let unLocked = false;
        if (this.activeLine === this.maxLines && this.maxLines !== 0)
            unLocked = true;
        this.activeLine--;
        return unLocked;
    }
}

module.exports = Gw;
