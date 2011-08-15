var vows = require('vows'),
    assert = require('assert'),
    events = require('events'),
    http = require('http'),
    handler = require('../lib/handler'),
    defer = require('../lib/defer'),
    port = process.env.C9_PORT || '8081',
    host = process.env.C9_PORT ? 'frontikjs.andrewsumin.cloud9ide.com' : '127.0.0.1:' + port;

vows.describe('Test handler').addBatch({
    'JSON from file': {
        topic: function(){
            var promise = new (events.EventEmitter);
            handler().ready(function(handler){
                handler.file('tests/json.js')
                       .then(function(res){promise.emit('success', res);});
                });
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.foo, 'bar');
        }
    },
    'nofile file': {
        topic: function(){
            var promise = new (events.EventEmitter);
            handler().ready(function(handler){
                handler.file('tests/nofile.js')
                       .then(function(res){promise.emit('success', res);});
            });
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.code, 'ENOENT');
        }
    }
}).addBatch({
    'GET JSON': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
                if (request.method === 'GET'){
                    response.write('{"result": "success"}');
                }
                response.end('\n');
                server.close();
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    console.log('http://' + host)
                    handler.http('http://' + host)
                           .then(function(res){promise.emit('success', res);});
                });
            });
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.result, 'success');
        }
    }
}).addBatch({
    'POST JSON': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
                if (request.method === 'POST'){
                    response.write('{"result": "success"}');
                }
                response.end('\n');
                server.close();
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    handler.http('http://' + host, {method:'POST'})
                           .then(function(res){promise.emit('success', res);});
                });
            });
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.result, 'success');
        }
    }
}).addBatch({
    'POST JSON with body': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
                var body = '';
                request.on('data', function (data) {
                    body += data;
                });
                request.on('end', function () {
                    response.write('' + body);
                    response.end('\n');
                    server.close();
                });
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    handler.http('http://' + host, {method:'POST', body:'{"foo": "bar"}'})
                           .then(function(res){promise.emit('success', res);});
                });
            });
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.foo, 'bar');
        }
    }
}).addBatch({
    'broken JSON': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
                response.write('broken JSON');
                response.end();
                server.close();
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    handler.http('http://' + host, {method:'POST'})
                           .then(function(res){promise.emit('success', res);});
                });
            });
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res, 'broken JSON');
        }
    }
}).addBatch({
    'error': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(500);
                response.write('Internal error');
                response.end();
                server.close();
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    handler.http('http://' + host)
                           .then(function(res){promise.emit('success', res);});
                });
            });
            return promise;
        },

        'has error': function (res) {
            assert.equal (res.error.code, 500);
            assert.equal (res.error.message, 'Internal error');
        }
    }
}).addBatch({
    'timeout': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200);
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    handler.http('http://' + host)
                           .then(function(res){server.close(); promise.emit('success', res);});
                });
            });
            return promise;
        },

        'has error': function (res) {
            assert.equal (res.error.code, null);
            assert.equal (res.error.message, 'Timeout');
        }
    }
}).addBatch({
    'custom timeout': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200);
            });
            server.listen(port, function(){
                var timeout;
                handler().ready(function(handler){
                    handler.http('http://' + host, {timeout: 500})
                           .then(function(res){
                               clearTimeout(timeout);
                               server.close();
                               promise.emit('success', res);
                           });
                });
                timeout = setTimeout(function(){promise.emit('error', 'Timeout broken');}, 500);
            });
            return promise;
        },

        'has error': function (res) {
            assert.equal (res.error.code, null);
            assert.equal (res.error.message, 'Timeout');
        }
    }
}).addBatch({
    'callback': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200);
                response.end();
                server.close();
            });
            server.listen(port, function(){
                handler().ready(function(handler){
                    handler.http('http://' + host, function(response) {return response.statusCode;})
                           .then(function(res){promise.emit('success', res);}
                    );
                });
            });
            return promise;
        },

        'has error': function (res) {
            assert.equal (res, 200);
        }
    }
}).addBatch({
    'async callback': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
                response.writeHead(200);
                response.end();
                server.close();
            });
            server.listen(port, function(){
                var callback = defer();
                handler().ready(function(handler){
                    handler.http('http://' + host, function(response){
                                setTimeout(function(){callback.resolve(response.statusCode);}, 100);
                                return callback;
                            })
                           .then(function(res){promise.emit('success', res);}
                    );
                });
            });
            return promise;
        },

        'has error': function (res) {
            assert.equal (res, 200);
        }
    }
}).addBatch({
    'then': {
        topic: function(){
            var promise = new (events.EventEmitter);            
            handler().ready(function(handler){
                handler.wait(function(callback){
                    handler.put('json1', {"foo": "bar"})
                           .put('json2', {"foo": "bar"});
                    callback();
                }).then(function(res){
                    promise.emit('success', res);
                });
            });
            return promise;
        },

        'has error': function (res) {
            assert.equal (res.json1.foo, "bar");
            assert.equal (res.json2.foo, "bar");
        }
    }
}).export(module);
