var through = require('through2');
var nodesass = require("node-sass");
module.exports = function() {


    function doSomething(file, encoding, callback) {

        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(createError(file, 'Streaming not supported'));
        }
        let content = file.contents.toString();
        content = nodesass.renderSync({
            data:content
        });
        file.contents = new Buffer(content.css.toString());
        callback(null, file);
    }

    return through.obj(doSomething);
};