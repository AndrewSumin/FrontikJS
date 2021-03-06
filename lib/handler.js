var urllib = require('url'),
    http = require('http'),
    fs = require('fs'),
    querystring = require('querystring'),
    doc = require('./document'),
    debug = require('./debug'),
    stages = require('./stages'),
    config = require('../config'),
    defer = require('./defer');
    vm = require('vm');
    
    config.timeout = config.timeout || 2000;
    
function parse_body (response, debug){
    response.body = response.body.join('');
    if (response.headers['content-type'] && /json/i.test(response.headers['content-type'])){
        try {
            return vm.runInNewContext('(' + response.body + ')'); // if content-type has 'json' expect object in response
        } catch (e){
            debug.error('Cant parse to json: ' + e); // if can't parse leave as a string
        }
    }
    
    return response.body;
}

function process_response (response, callback, debug) { 
    var promise = defer();
    response.body = [];
    response.on('data', function(chunk){
        response.body.push(chunk);
    });
    response.on('end', function(){
        var start = new Date().getTime();
        var result = parse_body(response, debug),
            cbresult;
        console.log(new Date().getTime() - start);
        if (callback){
            cbresult = callback(result, response); // replace response if callback want to change last one
        }

        result = typeof cbresult === 'undefined' ? result : cbresult;
        
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
    
    var body = params.data ? querystring.stringify(params.data, sep='&', eq='=') : params.body || '';
    var urlobj = urllib.parse(url); 
    var options = {
        host: urlobj.hostname,
        port: urlobj.port || '80',
        path: urlobj.pathname + (params.query ? '?' + querystring.stringify(params.query, sep='&', eq='=') : ''),
        method: params.method || 'GET',
        headers: params.headers || {}
    };
    
    var promise = defer();
    
    
    var start_request = new Date().getTime();
    var request = http.request(options, function(response){
        process_response(response, callback, this.debug)
            .then(function(){clearTimeout(timeout);}) // clear timeout
            .then(promise.resolve)                    // push data to callback
            .then(function(result){log_request(request, response, result, start_request, this.debug);}.bind(this));
    }.bind(this));
    
    request.setHeader(config.request_id_header, this.id);
    
    request.on('error', function(e) {
        this.debug.log('problem with request: ' + e.message);
        clearTimeout(timeout);
        promise.resolve({error: {code: null, message: 'Request error'}});
    }.bind(this));
    request.write(body);
    request.end();
    
    var timeout = setTimeout(function(){
        promise.resolve({error: {code: null, message: 'Timeout'}});
        request.abort();
    }, params.timeout || config.timeout);
    
    return promise;
}

function log_request(request, response, result, start_request, debug){
    var time = new Date().getTime() - start_request;
    debug.log(time + 'ms, ' + request.method + ' ' + request.agent.host + ':' + request.agent.port + (request.agent.path || ''));
    debug.save({
        time: time,
        request: request,
        response: response
    });
}

function parse_file(data, debug){
    try {
        return JSON.parse(data); // if content-type has 'json' expect object in response
    } catch (e){
        debug.log('Cant parse to json: ' + e); // if can't parse leave as a string
        return data;
    }
}

function do_file(path, callback){
    var promise = defer();
    fs.readFile(path, function(error, data){
        if (error){
            this.debug.log(error.message);
            promise.resolve(error);
            return;
        }
        var result, cbresult;
        
        data = parse_file(data, this.debug);
        
        if (callback){
            cbresult = callback(data); // replace response if callback want to change last one
        }
        
        result = typeof cbresult === 'undefined' ? data : cbresult;
        
        if (result.isDefer){ // maybe callback return promise
            result.then(promise.resolve);
        } else {
            promise.resolve(result);
        }
                
    }.bind(this));
    return promise;
}

function do_put(name, promise){
    this._doc.put(name, promise);
    return this;
}

function do_finish(){
    this._doc.then(function(doc){
        this.stages.finish('collect');
        if (!this.request || typeof this.request.GET.debug === 'undefined'){
            this.stages.start('transform');
            this.resolve(doc);
            this.stages.finish('transform');
        } else {
            this.response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
            this.debug_log.doc = doc;
            this.response.write(JSON.stringify(this.debug_log));
            this.response.end();
        }
    }.bind(this));
}

function do_wait(collect){
    this.stages.start('collect');
    collect(function(){ this.finish(); }.bind(this));
    return this;
}

var request_id = 0;

module.exports = function(request, response){
    var ready = defer();
    var handler = defer({
        _doc: doc(),
        id: request_id++,
        defer: defer,
        config: config,
        request: request,
        response: response,
        put: do_put,
        http: do_http,
        file: do_file,
        finish: do_finish,
        wait: do_wait
    });
    
    handler.debug = new debug(handler);
    handler.debug_log = [];
    
    handler.debug.save({id: handler.id});
    
    handler.stages = new stages(handler.debug);
    
    handler.ready = function(callback){
        ready.then(function(){callback(this);}.bind(this));
        return this;
    };

    if (request && response){
        handler.stages.start('handler');
        handler.id = request.headers[config.request_id_header] || handler.id;
        response.setHeader(config.request_id_header, handler.id);
        request.GET = urllib.parse(request.url, true).query;        
        var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {
            try{
                request.POST = querystring.parse(body, sep='&', eq='=');
            } catch (e) {
                request.POST = body;
            }
            handler.stages.finish('handler');
            ready.resolve();
        });
    } else {
        ready.resolve();
    }
    
    return handler;
};
