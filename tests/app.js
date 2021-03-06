module.exports = function (handler, callback){
    callback({
        collect: function(callback){
            handler.put('foo', handler.file(__dirname + '/json.js'));
            callback();
        },
        transform: function(doc){
            handler.response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            handler.response.write('<!DOCTYPE html><head><html><title>' + (handler.request.GET.name || doc.foo.message) + '</title></head><body>' + doc.foo.message + '</body></html>');
            handler.response.end('\n');
        }
    });
};
