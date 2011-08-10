var defer = require('./defer');

module.exports = function(){
    var promise = defer();
    var counter = 0;
    var document = {};
    var then = promise.then;
    return {
        put: function(name, future){
            counter++;

            function put(data){
                counter--;
                document[name] = data;
                if (counter === 0){
                    promise.resolve(document);
                }
            }

            future.isDefer ? future.then(put) : setTimeout(function(){put(future);}, 1);
        
            return this;
        },
        then: function(callback){
            if (counter === 0){
                callback({});
            } else {
                promise.then(callback);
            }
            return this;
        }
    };
};
