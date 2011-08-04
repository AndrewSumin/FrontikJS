var doc = require('./document'),
    defer = require('./defer');

module.exports = function(context){
    context.doc = doc();
    context.get = function(url, params, callback){
        params = params || {};
        var urlobj = urllib.parse(url);        
        var options = {
            host: urlobj.host,
            port: urlobj.port || '80',
            path: urlobj.pathname + (params.query ? '?' + querystring.stringify(params.query, sep='&', eq='=') : ''),
            method: params.method || 'GET',
            headers: params.headers
        };
        
        var promise = defer();
    
        http.get(options, function(response) {
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
        return promise;
    };
    return context;
};
