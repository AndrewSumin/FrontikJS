module.exports = function(debug){
    var stages = {};
    this.start = function(name){
        stages[name] = new Date().getTime();
    };
    this.finish = function(name){
        debug.log(name + ': ' + (new Date().getTime() - stages[name]) + 'ms');
    };
};