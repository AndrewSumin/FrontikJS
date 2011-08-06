module.exports = function(object){
    object = object || {};
    if (object.isDefer){
        return object;
    }
    var res=[], rej=[], b;
    object.isDefer = true;
    object.resolve = function(c){
        b=c;
        while(res.length) res.shift()(b);
        res=0;
    };
    object.reject = function(c){
        b=c;
        while(rej.length) rej.shift()(b);
        rej=0;
    };
    object.then = function(c){
        res ? res.push(c) : c(b);
        return this;
    };
    object.otherwise = function(c){
        rej ? rej.push(c) : c(b);
        return this;
    };
    
    return object;
};
