/**
 * Created by igor on 26.04.16.
 */

'use strict';

var CodeError = require(__appRoot + '/lib/error'),
    validateCallerParameters = require(__appRoot + '/utils/validateCallerParameters'),
    checkPermissions = require(__appRoot + '/middleware/checkPermissions')
    ;

let Service = {
    
    list: function (caller, option, cb) {
        checkPermissions(caller, 'dialer', 'r', function (err) {
            if (err)
                return cb(err);

            if (!option)
                return cb(new CodeError(400, "Bad request options"));

            var domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            };
            option.domain = domain;

            var db = application.DB._query.dialer;
            return db.search(option, cb);
        });
    },

    item: function () {
        
    },
    
    create: function () {
        
    },

    remove: function () {
        
    }
};

module.exports = Service;