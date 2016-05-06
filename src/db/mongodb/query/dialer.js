/**
 * Created by igor on 26.04.16.
 */

'use strict';


var conf = require(__appRoot + '/conf'),
    CodeError = require(__appRoot + '/lib/error'),
    dialerCollectionName = conf.get('mongodb:collectionDialer'),
    ObjectID = require('mongodb').ObjectID,
    utils = require('./utils')
    ;

module.exports = {
    addQuery: addQuery
};

function addQuery (db) {
    return {
        search: function (options, cb) {
            return utils.searchInCollection(db, dialerCollectionName, options, cb);
        },
        
        findById: function (_id, domainName, cb) {
            if (!ObjectID.isValid(_id))
                return cb(new CodeError(400, 'Bad objectId.'));

            return db
                .collection(dialerCollectionName)
                .findOne({_id: new ObjectID(_id), domain: domainName}, cb);
        },
        
        removeById: function (_id, domainName, cb) {
            if (!ObjectID.isValid(_id))
                return cb(new CodeError(400, 'Bad objectId.'));

            return db
                .collection(dialerCollectionName)
                .removeOne({_id: new ObjectID(_id), domain: domainName}, cb);
        },

        create: function (doc, cb) {

            return db
                .collection(dialerCollectionName)
                .insert(doc, cb);
        },
        
        update: function (_id, domainName, doc, cb) {
            if (!ObjectID.isValid(_id))
                return cb(new CodeError(400, 'Bad objectId.'));

            let data = {
                $set: {}
            };

            for (let key in doc) {
                if (doc.hasOwnProperty(key) && key != '_id' && key != 'domain') {
                    data.$set[key] = doc[key];
                }
            };
            return db
                .collection(dialerCollectionName)
                .updateOne({_id: new ObjectID(_id), domain: domainName}, data, cb);

        },
        
        memberList: function (options, cb) {
            return utils.searchInCollection(db, 'agentStatusEngine', options, cb);
        }
    }
}