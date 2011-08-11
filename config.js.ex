module.exports = {
    port: 8080,
    apps: function(request, callback){
        callback('../tests/app');
    },

    // log_level: "DEBUG",

    request_id_header: "X-Request-ID"
};
