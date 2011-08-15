var http = require('http'),
    config = require('../config'),
    handler = require('./handler'),
    defer = require('./defer'),
    apps = {};
    
function get_app(request){
    var promise = defer();
    
    config.apps(request, function(file){
        if (apps[file]){
            promise[apps[file].error ? 'reject' : 'resolve'](apps[file]);
        } else {
            try {
                apps[file] = require(file);
                promise.resolve(apps[file]);
            } catch (e) {
                apps[file] = {error: e};
                promise.reject(apps[file]);
            }
        }
    });    
    return promise;
}

http.createServer(function(request, response) {
    try {
        get_app(request).then(function(app){
            handler(request, response).ready(function(handler){
                app(handler, function(app){
                    handler.wait(app.collect.bind(app))
                           .then(app.transform.bind(app));
                });
            });
        }).otherwise(function(error){
            throw error.error;
        });
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
}).listen(config.port, function(){console.log('Start server, port: ' + config.port);});
