var vows = require('vows'),
    assert = require('assert'),
    events = require('events'),
    defer = require('../lib/defer');
    
vows.describe('Test defer').addBatch({
    'resolve timeout': {
        topic: function(){
            var promise = new (events.EventEmitter);
            var current = defer();
            current.timeout(function(){
                promise.emit('success', 'timeout');
                clearTimeout(timer);
            });
            var timer = setTimeout(function(){promise.emit('error', 'notimeout');}, 2100);
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res, 'timeout');
        }
    }
}).export(module);