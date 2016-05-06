/**
 * Created by igor on 26.04.16.
 */

'use strict';


var dialerService = require(__appRoot + '/services/dialer')
    ;

module.exports = {
    addRoutes: addRoutes
};

function addRoutes (api) {
    api.get('/api/v2/dialer', list);
    api.post('/api/v2/dialer', create);
    api.get('/api/v2/dialer/:id', item);
    api.put('/api/v2/dialer/:id', update);
    api.delete('/api/v2/dialer/:id', remove);

    api.get('/api/v2/dialer/:dialer/members', listMembers);
};

function list (req, res, next) {
    let options = {
        limit: req.query.limit,
        pageNumber: req.query.page,
        domain: req.query.domain,
        columns: {}
    };

    if (req.query.columns)
        req.query.columns.split(',')
            .forEach( (i) => options.columns[i] = 1 );

    dialerService.list(req.webitelUser, options, (err, result) => {
        if (err)
            return next(err);

        return res.status(200).json({
            "status": "OK",
            "data": result
        });
    })
};

function item (req, res, next) {
    let options = {
        id: req.params.id,
        domain: req.query.domain
    };

    dialerService.item(req.webitelUser, options, (err, result) => {
        if (err)
            return next(err);

        return res.status(200).json({
            "status": "OK",
            "data": result
        });
    });
};

function remove (req, res, next) {
    let options = {
        id: req.params.id,
        domain: req.query.domain
    };

    dialerService.remove(req.webitelUser, options, (err, result) => {
        if (err)
            return next(err);

        return res.status(200).json({
            "status": "OK",
            "data": result
        });
    });
};

function update (req, res, next) {
    let options = {
        id: req.params.id,
        domain: req.query.domain,
        data: req.body
    };

    dialerService.update(req.webitelUser, options, (err, result) => {
        if (err)
            return next(err);

        return res.status(200).json({
            "status": "OK",
            "data": result
        });
    });
};

function create (req, res, next) {
    let options = req.body;

    if (req.query.domain)
        options.domain = req.query.domain;

    dialerService.create(req.webitelUser, options, (err, result) => {
        if (err)
            return next(err);

        return res.status(200).json({
            "status": "OK",
            "data": result
        });
    });
};

function listMembers (req, res, next) {
    let options = {
        dialer: req.params.dialer,
        limit: req.query.limit,
        pageNumber: req.query.page,
        domain: req.query.domain,
        columns: {},
        sort: {},
        filter: {}
    };

    if (req.query.columns)
        req.query.columns.split(',')
            .forEach( (i) => options.columns[i] = 1 );

    if (req.query.sort) {
        let _s = req.query.sort.split('=');
        if (_s.length == 2)
            options.sort[_s[0]] = parseInt(_s[1]);
    };

    dialerService.members.list(req.webitelUser, options, (err, result) => {
        if (err)
            return next(err);

        return res.status(200).json({
            "status": "OK",
            "data": result
        });
    })
};