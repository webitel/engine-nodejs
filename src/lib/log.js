let winston = require('winston');
let conf = require('../conf');

function getLogger(module) {
    let pathDirectory = module.filename.split(/\/+/).slice(-3);
    let path = pathDirectory.join('\\') + '(' + process.pid + ')';

    let logLevels = {
        levels: {
            trace: 4,
            debug: 3,
            warn: 2,
            error: 1,
            info: 0
        },
        colors: {
            trace: 'cyan',
            debug: 'white',
            info: 'green',
            warn: 'yellow',
            error: 'red'
        }
    };

    let log = new (winston.Logger)({
        levels: logLevels.levels,
        colors: logLevels.colors,
        filters: [(l, msg, meta) => {
            return maskSecrets(msg, meta);
        }],
        transports: [
            new winston.transports.Console({
                colorize: 'all',
                level: conf.get('application:loglevel'),
                label: path,
                timestamp: false
            })
        ]
    });

    return log;
};

function maskSecrets(msg, meta) {
    if (/secret|password|\bauth\b/) {
        msg = msg.replace(/(\"secret\"\:\"[^\"]*\")|(password=[^,|"]*)|(\sauth\s[^.]*)|("password","value":"[^"]*)/g, '*****');
    }

    return {
        msg: msg,
        meta: meta
    };
}

module.exports = getLogger;
