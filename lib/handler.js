var urllib = require('url'),
    http = require('http'),
    doc = require('./document'),
    config = require('../config'),
    defer = require('./defer');
    
function parse_body (response){
    response.body = response.body.join('');
    if (response.headers['content-type'] && /json/i.test(response.headers['content-type'])){
        try {
            return JSON.parse(response.body);
        } catch (e){
            console.log('Cant parse to json: ' + e);
        }
    }
    
    return response.body;
}

function process_response (response, promise, callback, timeout) { 
    response.body = [];
    response.on('data', function(chunk){
        response.body.push(chunk);
    });
    response.on('end', function(){
        clearTimeout(timeout); // clear abort timeout
        var result = parse_body(response);
        
        if (callback){
            var cbresult = callback(response);
            result = typeof cbresult === 'undefined' ? result : cbresult;
        }
        
        if (response.statusCode != 200){
            promise.resolve({error: {code: response.statusCode, message: result}});
        } else {
            promise.resolve(result);
        }
    });
}
        

module.exports = function(context){
    config.timeout = config.timeout || 2000;
    context = context || {};
    context.doc = doc();
    context.http = function(url, params, callback){
        params = params || {};
        var body = '';
        var urlobj = urllib.parse(url); 
        var options = {
            host: urlobj.hostname,
            port: urlobj.port || '80',
            path: urlobj.pathname + (params.query ? '?' + querystring.stringify(params.query, sep='&', eq='=') : ''),
            method: params.method || 'GET',
            headers: params.headers || {}
        };
        
        var promise = defer();

        var request = http.request(options, function(response){
            process_response (response, promise, callback, timeout);
        });
        
        request.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
        request.write(body);
        request.end();
        
        var timeout = setTimeout(function(){
            promise.resolve({error: {code: null, message: 'Timeout'}});
            request.abort();
        }, params.timeout || config.timeout);
        
        return promise;
    };
    return context;
};
