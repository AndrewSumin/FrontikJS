var vows = require('vows'),
    assert = require('assert'),
    events = require('events'),
    http = require('http'),
    handler = require('../lib/handler'),
    defer = require('../lib/defer'),
    port = process.env.C9_PORT || '8081',
    host = process.env.C9_PORT ? 'frontikjs.andrewsumin.cloud9ide.com' : 'localhost:' + port;

vows.describe('Test doc').addBatch({
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
            server.listen(port);
            
            var hand = handler();
            hand.http('http://' + host)
                .then(function(res){promise.emit('success', res);});
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
            server.listen(port);
            
            var hand = handler();
            hand.http('http://' + host, {method:'POST'})
                .then(function(res){promise.emit('success', res);});
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.result, 'success');
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
            server.listen(port);
            
            var hand = handler();
            hand.http('http://' + host, {method:'POST'})
                .then(function(res){promise.emit('success', res);});
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
                response.write('Internal error')
                response.end();
                server.close();
            });
            server.listen(port);
            
            var hand = handler();
            hand.http('http://' + host)
                .then(function(res){promise.emit('success', res);});
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
            server.listen(port);
            
            var hand = handler();
            hand.http('http://' + host)
                .then(function(res){server.close(); promise.emit('success', res);});
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
            server.listen(port);
            
            var hand = handler(), timeout;
            hand.http('http://' + host, {timeout: 500})
                .then(function(res){
                    clearTimeout(timeout);
                    server.close();
                    promise.emit('success', res);
                }
            );
            timeout = setTimeout(function(){promise.emit('error', 'Timeout broken');}, 500);
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
            server.listen(port);
            
            var hand = handler();
            hand.http('http://' + host, function(response) {return response.statusCode;})
                .then(function(res){promise.emit('success', res);}
            );
            return promise;
        },

        'has error': function (res) {
            assert.equal (res, 200);
        }
    }
}).export(module);
