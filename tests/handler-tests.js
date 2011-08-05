var vows = require('vows'),
    assert = require('assert'),
    events = require('events'),
    http = require('http'),
    handler = require('../lib/handler'),
    defer = require('../lib/defer'),
    port = process.env.C9_PORT || '8081';
    host = process.env.C9_PORT ? 'frontikjs.andrewsumin.cloud9ide.com' : 'localhost:' + port;

vows.describe('Test doc').addBatch({
    'get JSON': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var server = http.createServer(function(request, response) {
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
}).export(module);
