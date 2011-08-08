var config = require('../config');
    log_levels = {
        "ERROR": 0,
        "WARN": 1,
        "LOG": 2
    };
    
config.log_level = config.log_level || "ERROR";

function error (handler, data){
    console.error(handler.id, data);
    handler.debug_log.push(data);
}

function warn (handler, data){
    if (log_levels[config.log_level] < log_levels.WARN){
        return;
    }
    console.warn(handler.id, data);
    handler.debug_log.push(data);
}

function log(handler, data){
    if (log_levels[config.log_level] < log_levels.LOG){
        return;
    }
    console.log(handler.id, data);
    handler.debug_log.push(data);
}

function save(handler, data){
    if (log_levels[config.log_level] < log_levels.LOG){
        return;
    }
    handler.debug_log.push(data);
}


module.exports = function(handler){
    this.error = function(data){
        error(handler, data);
    };
    this.warn = function(data){
        warn(handler, data);
    };
    this.log = function(data){
        log(handler, data);
    };
    this.save = function(data){
        save(handler, data);
    }; 

};
