var defer = require('../lib/defer');

module.exports = {
    apply: function(handler){
        var promise = defer();
        
        handler.put('foo', handler.file(handler.config.data_dir + '/json.js'));
        
        handler.then(function(doc){
            handler.response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            handler.response.write('<!DOCTYPE html><head><html><title>' + doc.foo.message + '</title></head><body>' + doc.foo.message + '</body></html>');
            handler.response.end('\n');
        });
        
        return handler;
    }
};
