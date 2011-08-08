module.exports = {
    apply: function(handler){
        
        handler.put('foo', handler.file(__dirname + '/json.js'));
        
        handler.then(function(doc){
            handler.response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            handler.response.write('<!DOCTYPE html><head><html><title>' + doc.foo.message + '</title></head><body>' + doc.foo.message + '</body></html>');
            handler.response.end('\n');
        });
        
        return handler;
    }
};
