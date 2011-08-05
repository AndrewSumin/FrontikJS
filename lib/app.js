var http = require('http'),
    urllib = require('url'),
    querystring = require('querystring'),
    config = require('../config'),
    handler = require('./handler'),
    app = require(config.apps.test + 'app.js');

http.createServer(function(request, response) {
    try {
        app.apply(
            handler({
                http: http,
                request: request,
                response: response,
                url: urllib.parse(request.url, true)
            })
        );
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
