var defer = require('./defer');

module.exports = function(){
    var promise = defer();
    var counter = 0;
    var document = {};
    promise.put = function(name, future){

        counter++;

        function put(data){
            counter--;
            document[name] = data;
            if (counter == 0){
                promise.resolve(document);
            }
        }

        future.isDefer 
            ? future.then(put)
            : setTimeout(function(){put(future)}, 1);
    
        return this;
    }
    return promise;
};
