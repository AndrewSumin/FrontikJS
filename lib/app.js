var urllib = require('url'),
    http = require('http'),
    querystring = require('querystring'),
    config = require('../config'),
    handler = require('./handler'),
    app = require(config.apps.test + 'app.js');

http.createServer(function(request, response) {
    try {
        app.apply(handler(request, response)).finish();
    } catch (e) {
        console.log(e);
        if (e === true) {
            response.writeHead(404);
            response.end();
        } else {
            response.writeHead(500);
            response.end();
        }
    }
}).listen(config.port);
