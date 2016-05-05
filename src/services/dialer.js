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

            let domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            };
            option.domain = domain;

            let db = application.DB._query.dialer;
            return db.search(option, cb);
        });
    },

    item: function (caller, option, cb) {
        checkPermissions(caller, 'dialer', 'r', function (err) {
            if (err)
                return cb(err);

            if (!option)
                return cb(new CodeError(400, "Bad request options"));

            let domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            }

            if (!option.id)
                return cb(new CodeError(400, 'Bad request: id is required.'));

            let db = application.DB._query.dialer;

            return db.findById(option.id, domain, cb);
        });
    },
    
    create: function (caller, option, cb) {
        checkPermissions(caller, 'dialer', 'd', function (err) {
            if (err)
                return cb(err);

            if (!option)
                return cb(new CodeError(400, "Bad request options"));

            let domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            }


            let dialer = option;
            dialer.domain = domain;

            let db = application.DB._query.dialer;

            return db.create(dialer, cb);
        });
    },

    remove: function (caller, option, cb) {
        checkPermissions(caller, 'dialer', 'd', function (err) {
            if (err)
                return cb(err);

            if (!option)
                return cb(new CodeError(400, "Bad request options"));

            let domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            }

            if (!option.id)
                return cb(new CodeError(400, 'Bad request: id is required.'));

            let db = application.DB._query.dialer;

            return db.removeById(option.id, domain, cb);
        });
    },
    
    update: function (caller, option, cb) {
        checkPermissions(caller, 'dialer', 'u', function (err) {
            if (err)
                return cb(err);

            if (!option)
                return cb(new CodeError(400, "Bad request options"));


            if (!option.id)
                return cb(new CodeError(400, 'Bad request: id is required.'));

            if (!option.data)
                return cb(new CodeError(400, 'Bad request: data is required.'));

            let domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            };

            let db = application.DB._query.dialer;
            return db.update(option.id, domain, option.data, cb);

        });
    }
};

module.exports = Service;