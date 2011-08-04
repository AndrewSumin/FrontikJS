var vows = require('vows'),
    assert = require('assert'),
    events = require('events')
    document = require('../lib/document');
    defer = require('../lib/defer');

vows.describe('Test doc').addBatch({
    'put static JSON': {
        topic: function(){
            var promise = new(events.EventEmitter);
            var doc = document();
            doc.put("data1", {"foo":"bar"})
               .put("data2", {"foo":"bar"})
               .then(function(res){promise.emit('success', res)})
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.data1.foo, 'bar');
            assert.equal (res.data2.foo, 'bar');
        }
    },
    'put async JSON': {
        topic: function(){
            var promise = new(events.EventEmitter);
            var doc = document();
            var defer1 = defer();
            var defer2 = defer();
            doc.put("data1", defer1)
               .put("data2", defer2)
               .then(function(res){promise.emit('success', res)})

            setTimeout(function(){defer1.resolve({"foo":"bar"})}, 10);
            setTimeout(function(){defer2.resolve({"foo":"bar"})}, 10);
            return promise;
        },

        'has JSON': function (res) {
            assert.equal (res.data1.foo, 'bar');
            assert.equal (res.data2.foo, 'bar');
        }
    }
}).export(module);
