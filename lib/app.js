var http = require('http'),
    config = require('../config'),
    handler = require('./handler'),
    defer = require('./defer'),
    apps = {};
    
function get_app(request){
    var app,
        promise = defer(),
        file = config.apps(request);
    if (apps[file]){
        promise.resolve(apps[file]);
    } else {
        try {
            app = require(file);
        } catch (e) {
            console.log('Error init app: ' + e)
            app = {
                apply:function(){
                    console.log('Error init app: ' + file);
                    return {finish: function(){}}; // to support chinability
                }
            };
        }
        apps[file] = app;
        promise.resolve(app);
    }
    
    return promise;
}

http.createServer(function(request, response) {
    try {
        get_app(request).then(function(app){
            app.apply(handler(request, response)).finish()
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
}).listen(config.port);
