/**
 * Created by igor on 01.06.16.
 */

module.export = {
    calcErlang: calcErlang,
    erlangCPODelayTime: erlangCPODelayTime,
    erlangB: erlangB,
    erlangC: erlangC
};

console.log(calcErlang({
    callsPerHour: 10
}));

function calcErlang(option) {
    let [
        avgCallDuration = 180, //sec
        avgWrapUpTime = 60, // sec
        callAnsweredTargetProcent = 80, //%
        callAnsweredTargetSec = 20, //%
        truncBlockingTarget = 0.010, //%
        callsPerHour = 100
    ] = [
        option.avgCallDuration,
        option.avgWrapUpTime,
        option.callAnsweredTargetProcent,
        option.callAnsweredTargetSec,
        option.truncBlockingTarget,
        option.callsPerHour
    ];

    let agentCounter, agentBusyTime, averageDelayAll, ecTraffic, ebTraffic, lines;
    let result = {
        avgDelay : 0,
        agents : 0,
        lines : 0
    };

    agentBusyTime = avgCallDuration + avgWrapUpTime;
    ecTraffic = agentBusyTime * callsPerHour / 3600;
    agentCounter = Math.floor(ecTraffic) + 1;

    while (erlangCPODelayTime(ecTraffic, agentCounter, agentBusyTime, callAnsweredTargetSec)  > (100 - callAnsweredTargetProcent) / 100 ) {
        agentCounter++;
    }
    averageDelayAll = Math.floor(erlangC(ecTraffic, agentCounter) * agentBusyTime / (agentCounter - ecTraffic)) + 1;
    ebTraffic = callsPerHour * (averageDelayAll + avgCallDuration) / 3600;
    lines = Math.floor(avgCallDuration * callsPerHour / 3600) + 1;

    if (ebTraffic > 0) {
        while (erlangB(ebTraffic, lines) > truncBlockingTarget) {
            lines++;
        }
    }

    result.avgDelay = averageDelayAll;
    result.agents = agentCounter;
    result.lines = lines;

    return result;
}

function erlangCPODelayTime(traffic, lines, holdTime, delayTime) {
    let probability = erlangC(traffic, lines) * Math.exp(-(lines - traffic) * delayTime / holdTime);
    if (probability > 1) {
        return 1
    } else {
        return probability
    }
}

function erlangB(traffic, pLines) {
    let PBR, index;
    if (traffic > 0)
    {
        PBR = (1 + traffic) / traffic;
        for (index = 2; index != pLines + 1; index++)
        {
            PBR = index / traffic * PBR + 1;
            if (PBR > 10000) {
                return 0;
            }
        }
        return 1 / PBR;
    }
    else {
        return 0;
    }
}

function erlangC(traffic, pLines) {
    let EBResult, probability;
    EBResult = erlangB(traffic, pLines);
    probability = EBResult / (1 - (traffic / pLines) * (1 - EBResult));
    if (probability > 1) {
        return 1
    } else {
        return probability
    }
}