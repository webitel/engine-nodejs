/**
 * Created by igor on 26.04.16.
 */

'use strict';

var CodeError = require(__appRoot + '/lib/error'),
    validateCallerParameters = require(__appRoot + '/utils/validateCallerParameters'),
    checkPermissions = require(__appRoot + '/middleware/checkPermissions')
    ;

let Service = {

    /**
     *
     * @param caller
     * @param option
     * @param cb
     */
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


    setState: function (caller, option, cb) {
        checkPermissions(caller, 'dialer', 'u', function (err) {
            if (err)
                return cb(err);

            if (!option)
                return cb(new CodeError(400, "Bad request options"));

            if (!option.id)
                return cb(new CodeError(400, "Bad request: id is required"));

            let domain = validateCallerParameters(caller, option['domain']);
            if (!domain) {
                return cb(new CodeError(400, 'Bad request: domain is required.'));
            }

            if (typeof option.state !== 'number') {
                return cb(new CodeError(400, 'Bad request: state is required.'));
            }

            option.domain = domain;
            if (option.state == 1) {
                return application.AutoDialer.runDialerById(option.id, domain, cb);
            } else if (option.state == 3) {
                return application.AutoDialer.stopDialerById(option.id, domain, cb);
            }

            //cb(null, {
            //    activeCall: 20,
            //    activeState: 2
            //});
        });
    },

    /**
     *
     * @param caller
     * @param option
     * @param cb
     */
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

    /**
     *
     * @param caller
     * @param option
     * @param cb
     */
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

    /**
     *
     * @param caller
     * @param option
     * @param cb
     */
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

    /**
     *
     * @param caller
     * @param option
     * @param cb
     */
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
    },

    members: {
        list: function (caller, option, cb) {
            checkPermissions(caller, 'dialer/members', 'r', function (err) {
                if (err)
                    return cb(err);

                if (!option)
                    return cb(new CodeError(400, "Bad request options."));

                if (!option.dialer)
                    return cb(new CodeError(400, "Bad request dialer is required."));

                let domain = validateCallerParameters(caller, option['domain']);

                if (!domain) {
                    return cb(new CodeError(400, 'Bad request: domain is required.'));
                };

                // TODO  before select dialer
                option.domain = null;

                if (!option.filter)
                    option.filter = {};

                option.filter["dialer"] = option.dialer;

                let db = application.DB._query.dialer;
                return db.memberList(option, cb);
            });
        },

        count: function (caller, option, cb) {
            checkPermissions(caller, 'dialer/members', 'r', function (err) {
                if (err)
                    return cb(err);

                if (!option)
                    return cb(new CodeError(400, "Bad request options."));

                if (!option.dialer)
                    return cb(new CodeError(400, "Bad request dialer is required."));

                let domain = validateCallerParameters(caller, option['domain']);

                if (!domain) {
                    return cb(new CodeError(400, 'Bad request: domain is required.'));
                };

                // TODO  before select dialer
                option.domain = null;

                if (!option.filter)
                    option.filter = {};

                option.filter["dialer"] = option.dialer;

                let db = application.DB._query.dialer;
                return db.memberCount(option, cb);
            });
        },
        
        item: function (caller, option, cb) {
            checkPermissions(caller, 'dialer/members', 'r', function (err) {
                if (err)
                    return cb(err);

                if (!option)
                    return cb(new CodeError(400, "Bad request options."));

                if (!option.id)
                    return cb(new CodeError(400, "Bad request id is required."));

                if (!option.dialer)
                    return cb(new CodeError(400, "Bad request dialer is required."));

                let domain = validateCallerParameters(caller, option['domain']);

                if (!domain) {
                    return cb(new CodeError(400, 'Bad request: domain is required.'));
                };

                // TODO  before select dialer
                option.domain = null;

                let db = application.DB._query.dialer;
                return db.memberById(option.id, option.dialer, cb);
            });
        },
        
        create: function (caller, option, cb) {
            checkPermissions(caller, 'dialer/members', 'c', function (err) {
                if (err)
                    return cb(err);

                if (!option)
                    return cb(new CodeError(400, "Bad request options"));

                if (!option.dialer)
                    return cb(new CodeError(400, 'Bad request: dialer id is required.'));

                if (!option.data)
                    return cb(new CodeError(400, 'Bad request: data is required.'));

                // TODO check dialer in domain
                let domain = validateCallerParameters(caller, option['domain']);
                if (!domain) {
                    return cb(new CodeError(400, 'Bad request: domain is required.'));
                };

                let member = option.data;
                member.dialer = option.dialer;

                let db = application.DB._query.dialer;
                return db.createMember(member, cb);

            });
        },

        update: function (caller, option, cb) {
            checkPermissions(caller, 'dialer/members', 'u', function (err) {
                if (err)
                    return cb(err);

                if (!option)
                    return cb(new CodeError(400, "Bad request options"));


                if (!option.id)
                    return cb(new CodeError(400, 'Bad request: id is required.'));

                if (!option.dialer)
                    return cb(new CodeError(400, 'Bad request: dialer id is required.'));

                if (!option.data)
                    return cb(new CodeError(400, 'Bad request: data is required.'));

                // TODO check dialer in domain
                let domain = validateCallerParameters(caller, option['domain']);
                if (!domain) {
                    return cb(new CodeError(400, 'Bad request: domain is required.'));
                };

                let db = application.DB._query.dialer;
                return db.updateMember(option.id, option.dialer, option.data, cb);

            });
        },

        remove: function (caller, option, cb) {
            checkPermissions(caller, 'dialer/members', 'd', function (err) {
                if (err)
                    return cb(err);

                if (!option)
                    return cb(new CodeError(400, "Bad request options"));


                if (!option.id)
                    return cb(new CodeError(400, 'Bad request: id is required.'));

                if (!option.dialer)
                    return cb(new CodeError(400, 'Bad request: dialer id is required.'));


                // TODO check dialer in domain
                let domain = validateCallerParameters(caller, option['domain']);
                if (!domain) {
                    return cb(new CodeError(400, 'Bad request: domain is required.'));
                };

                let db = application.DB._query.dialer;
                return db.removeMemberById(option.id, option.dialer, cb);

            });
        }
    }
};

module.exports = Service;