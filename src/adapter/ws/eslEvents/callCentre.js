/**
 * Created by Igor Navrotskyj on 03.09.2015.
 */

'use strict';

var eventsService = require(__appRoot + '/services/events'),
    log = require(__appRoot + '/lib/log')(module),
    getDomainFromStr = require(__appRoot + '/utils/parse').getDomainFromStr,
    application = require(__appRoot + '/application')
    ;

var _srvEvents = [
    'agent-offering',
    'bridge-agent-start',
    'member-queue-resume',
    'bridge-agent-end',
    'bridge-agent-fail',
    'members-count',
    'member-queue-start',
    'member-queue-end',
    'agent-status-change',
    'agent-state-change'
];

for (var i = 0, len = _srvEvents.length; i < len; i++) {
    eventsService.registered('CC::' + _srvEvents[i].toUpperCase());
};

module.exports = function (event) {
    try {
        var eventQueue = event['CC-Queue'],
            eventAgent = event['CC-Agent'],
            eventFrom = eventQueue || eventAgent,
            domain = getDomainFromStr(eventFrom),
            eventName = "CC::" + event['CC-Action'].toUpperCase()
            ;
        event['Event-Name'] = eventName;
        //log.trace(eventName);
        eventsService.fire(eventName, domain, event, null, (user, _e) => {
            try {
                if (user._subscribeEvent[eventName] || user.id === eventAgent) return true;

                var queues = application.Agents.get(user.id);
                return queues && queues[eventQueue];
            } catch (e) {
                log.error(e);
                return false;
            }
        });
        // TODO
        eventsService.fire(eventName, 'root', event);
    } catch(e) {
        log.error(e);
    };
};