/**
 * Created by igor on 20.05.16.
 */

'use strict';

var async = require('async');

var q = async.queue(function (task, callback) {
    console.log('hello ' + task.name);
    callback();
}, 2);


setInterval( () => {
    q.drain = function() {
        console.log('all items have been processed');
    }
}, 1000)