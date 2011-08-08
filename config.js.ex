module.exports = {
    port: 8080
    apps: function(request){
        return '../tests/app';
    },

    request_id_header: "X-Request-ID"
};
