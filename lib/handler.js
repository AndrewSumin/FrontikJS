var urllib = require('url'),
    http = require('http'),
    doc = require('./document'),
    defer = require('./defer');

module.exports = function(context){
    context = context || {};
    context.doc = doc();
    context.http = function(url, params, callback){
        params = params || {};
        var method = params.method || 'GET';
        var body = '';
        var urlobj = urllib.parse(url); 
        var options = {
            host: urlobj.hostname,
            port: urlobj.port || '80',
            path: urlobj.pathname + (params.query ? '?' + querystring.stringify(params.query, sep='&', eq='=') : ''),
            method: method,
            headers: params.headers || {}
        };
        
        var promise = defer();

        var request = http.request(options, function(response) {
            response.body = [];
            response.on('data', function(chunk){
                response.body.push(chunk);
            });
            response.on('end', function(){
                var bodystring = response.body.join('');
                try {
                    response.body = JSON.parse(bodystring);
                } catch (e){
                    console.log('Cant parse to json:' + e + ' url:' + url);
                    response.body = bodystring;
                }
                if (callback){
                    callback(response);
                }
                promise.resolve(response.body);
            });
        });
        request.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
        if (body){
            request.write(body);
        }
        request.end();
        return promise;
    };
    return context;
};
