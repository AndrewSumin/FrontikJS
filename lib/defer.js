module.exports = function(object){
    object = object || {};
    if (object.isDefer){
        return object;
    }
    var a=[], b;
    object.isDefer = true;
    object.resolve = function(c){
        b=c;
        while(a.length) a.shift()(b);
        a=0;
    };
    object.reject = function(){
        this.then = function(){};
        a = [];
    };
    object.then = function(c){
        a ? a.push(c) : c(b);
        return this;
    };
    
    return object;
};
