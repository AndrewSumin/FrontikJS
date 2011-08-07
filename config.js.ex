module.exports = {
    port: 8080
    apps: function(request){
        return '../tests/app';
    },

    data_dir: __dirname + '/tests',

    request_id_header: "X-Request-ID"
};
