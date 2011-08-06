var urllib = require('url'),
    http = require('http'),
    doc = require('./document'),
    config = require('../config'),
    defer = require('./defer');
    
    config.timeout = config.timeout || 2000;
    
function parse_body (response){
    response.body = response.body.join('');
    if (response.headers['content-type'] && /json/i.test(response.headers['content-type'])){
        try {
            return JSON.parse(response.body); // if content-type has 'json' expect object in response
        } catch (e){
            console.log('Cant parse to json: ' + e); // if can't parse leave as a string
        }
    }
    
    return response.body;
}

function process_response (response, callback, timeout) { 
    var promise = defer();
    response.body = [];
    response.on('data', function(chunk){
        response.body.push(chunk);
    });
    response.on('end', function(){
        var result, cbresult;
        
        if (callback){
            cbresult = callback(response); // replace response if callback want to change last one
        }
        
        result = typeof cbresult === 'undefined' ? parse_body(response) : cbresult;
        
        if (result.isDefer){ // maybe callback return promise
            result.then(promise.resolve);
        } else if (response.statusCode != 200){
            promise.resolve({error: {code: response.statusCode, message: result}});
        } else {
            promise.resolve(result);
        }
    });
    return promise;
}

function do_http(){
    // url, params, callback || url, params || url, callback || url
    var url = arguments[0];
    var params = arguments[1] && typeof arguments[1] === 'object' ? arguments[1] : {};
    var callback = arguments[1] && typeof arguments[1] === 'function' ? arguments[1] : arguments[2] || null;
    
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
        process_response(response, callback)
            .then(function(){clearTimeout(timeout);}) // clear timeout
            .then(promise.resolve);                   // push data to callback
    });
    
    request.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        clearTimeout(timeout);
        promise.resolve({error: {code: null, message: 'Request error'}});
    });
    request.write(body);
    request.end();
    
    var timeout = setTimeout(function(){
        promise.resolve({error: {code: null, message: 'Timeout'}});
        request.abort();
    }, params.timeout || config.timeout);
    
    return promise;
}

module.exports = function(request, response){
    return defer({
        _doc: doc(),
        request: request,
        response: response,
        put: function(name, promise){
            this._doc.put(name, promise);
            return this;
        },
        http: do_http,
        finish: function(){
            this._doc.then(this.resolve);
        }
    });
};
