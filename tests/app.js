module.exports = {
    apply: function(handler){
        console.log(handler);
        handler.response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        handler.response.write('<!DOCTYPE html><head><html><title>Hello world</title></head><body>Hello world</body></html>');
        handler.response.end('\n');
    }
};
