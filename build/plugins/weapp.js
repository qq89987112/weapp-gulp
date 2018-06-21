var through = require('through2');
var nodesass = require("node-sass");
var fse = require("fs-extra");
var path = require("path");
var jsBeautify = require('js-beautify');
var gulp = require('gulp');
module.exports = function({dist,development}) {


    function doSomething(file, encoding, callback) {

        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(createError(file, 'Streaming not supported'));
        }
        let content = file.contents.toString();
        let 
            scssReg = /<style>([\s\S]+)<\/style>/,
            templateReg = /<template>([\s\S]+)<\/template>/,
            jsReg = /<script>([\s\S]+)<\/script>/,
            configReg = /<config>([\s\S]+)<\/config>/;

        let result = scssReg.exec(content);
        let fileName = path.basename(file.path,path.extname(file.path));

            if(result){
                let matchText = result[0];
                result = result[1];
                result = nodesass.renderSync({
                    data:result
                });
                fse.outputFileSync(path.resolve(dist,`./pages/${fileName}.wxss`),jsBeautify.css(result.css.toString()));
                // content = content.replace(matchText,"");
            }

            result = jsReg.exec(content);


            if(result){
                let matchText = result[0];
                result = result[1];
                fse.outputFileSync(path.resolve(dist,`./pages/${fileName}.js`),jsBeautify.js(result));
                // content = content.replace(matchText,"");
            }

            result = templateReg.exec(content);

            if(result){
                let matchText = result[0];
                result = result[1];
                fse.outputFileSync(path.resolve(dist,`./pages/${fileName}.wxml`),jsBeautify.html(result));
                // content = content.replace(matchText,"");
            }

            result = configReg.exec(content);

            if(result){
                let matchText = result[0];
                result = result[1];
                fse.outputFileSync(path.resolve(dist,`./pages/${fileName}.json`),jsBeautify.js(result.trim()||"{}"));
                // content = content.replace(matchText,"");
            }

            callback(null);
    }
  

    return through.obj(doSomething);
};