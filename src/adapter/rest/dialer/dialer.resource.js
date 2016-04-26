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