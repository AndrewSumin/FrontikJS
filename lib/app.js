var http = require('http'),
    urllib = require('url'),
    defer = require('./defer');
    querystring = require('querystring'),
    doc = require('./document'),
    config = require('../config'),
    controllers = require(config.apps['lmail'] + 'app.js');

http.createServer(function(request, response) {

    var get = function(url, params, callback){
        params = params || {};
        var urlobj = urllib.parse(url);        
        var options = {
            host: urlobj.host,
            port: urlobj.port || '80',
            path: urlobj.pathname + (params.query ? '?' + querystring.stringify(params.query, sep='&', eq='=') : ''),
            method: params.method || 'GET',
            headers: params.headers
        };
        
        var promise = defer();

        http.get(options, function(response) {
            response.body = [];
            response.on('data', function(chunk){
                response.body.push(chunk);
            });
            response.on('end', function(){
                var bodystring = response.body.join('');
                try {
                    response.body = JSON.parse(bodystring)
                } catch (e){
                    console.log('Cant parse to json:' + e + ' url:' + url)
                    response.body = bodystring
                }
                if (callback){
                    callback(response);
                }
                promise.resolve(response.body);
            })
        });
        return promise;
    }
    
    var context = {
        http: http,
        request: request,
        response: response,
        url: urllib.parse(request.url, true),
        apply: controllers.apply,
        doc: doc(),
        get: get
    }
    try {
        controllers.apply.apply(context);
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
