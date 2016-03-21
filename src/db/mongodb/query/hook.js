/**
 * Created by i.navrotskyj on 15.03.2016.
 */
'use strict';

var conf = require(__appRoot + '/conf'),
    collectionHookName = conf.get('mongodb:collectionHook');

module.exports = {
    addQuery: addQuery
};

function addQuery(db) {
    return {
        list: function (filter, cb) {
            let _f = (filter instanceof Object) ? filter : {};
            return db
                .collection(collectionHookName)
                .find(_f)
                .toArray(cb);
        }
    };
};