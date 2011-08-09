module.exports = {
    port: 8080,
    apps: function(promise){
        // you can use promise.request if you need;
        promise.resolve('../tests/app');
    },

    // log_level: "DEBUG",

    request_id_header: "X-Request-ID"
};
