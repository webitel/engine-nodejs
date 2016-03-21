/**
 * Created by i.navrotskyj on 15.03.2016.
 */
'use strict';

var CodeError = require(__appRoot + '/lib/error'),
    validateCallerParameters = require(__appRoot + '/utils/validateCallerParameters'),
    checkPermissions = require(__appRoot + '/middleware/checkPermissions'),
    log = require(__appRoot + '/lib/log')(module)
    ;

var Service = {
    list: function (caller, option, cb) {
        
    }
};

module.exports = Service;