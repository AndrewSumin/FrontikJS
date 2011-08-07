module.exports = {
    apps: function(request){
        return '../tests/app';
    },
    data_dir: __dirname + '/tests',
    port: 8080
};
