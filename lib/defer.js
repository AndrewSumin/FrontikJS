module.exports = function(){
    var a=[], b;
    return{
        isDefer: true,
        resolve: function(c){
            b=c;
            while(a.length) a.shift()(b);
            a=0;
        },
        reject: function(){
            this.then = function(){};
            a = [];
        },
        then: function(c){
            a ? a.push(c) : c(b);
        }
    };
};
