/**
 * Created by igor on 24.05.16.
 */

'use strict';

let log = require(__appRoot + '/lib/log')(module);

class Agent {

    constructor (key, params) {
        this.id = key;
        this.state = params.state;
        this.status = params.status;
        this.maxNoAnswer = +(params.max_no_answer || 0);
        this.wrapUpTime = +(params.wrap_up_time || 10);
        this.rejectDelayTime = +(params.reject_delay_time || 0);
        let cTimeout = params.contact && /originate_timeout=([^,|}]*)/.exec(params.contact);
        this.callTimeout = +(cTimeout && cTimeout[1]) || 10;
        this.dialers = [];
        this.lockTime = 0;
        this.unIdleTime = 0;
        this.lock = false;
        this.timerId = null;

        this._noAnswerCallCount = 0;
    }

    setStatus (status) {
        this.status = status;
        log.trace(`Change agent status ${this.id} ${this.state} ${this.status} ${this.lock}`);
    }

    getSkills () {}
    setSkills () {}

    setState (state) {
        this.state = state;
        log.trace(`Change agent state ${this.id} ${this.state} ${this.status} ${this.lock}`);
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

module.exports = Agent;