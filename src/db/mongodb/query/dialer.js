/**
 * Created by igor on 26.04.16.
 */

'use strict';


var conf = require(__appRoot + '/conf'),
    dialerCollectionName = conf.get('mongodb:collectionDialer'),
    utils = require('./utils')
    ;

module.exports = {
    addQuery: addQuery
};

function addQuery (db) {
    return {
        search: function (options, cb) {
            return utils.searchInCollection(db, dialerCollectionName, options, cb);
        }
    }
}