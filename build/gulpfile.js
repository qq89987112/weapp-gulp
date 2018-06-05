const gulp = require("gulp");
var express = require('express'); //express框架
const path = require("path");
const fse = require("fs-extra");
const proxy = require("http-proxy-middleware");
const weapp = require("./plugins/weapp");
const scssCompiler = require("./plugins/scss-compiler");
var c = require('child_process');//子进程 用于打开默认浏览器
const shelljs = require('shelljs');
const buildPath = path.resolve("./dist");
const srcPath = path.resolve("./src");
const htmlPath = path.resolve(srcPath, "./pages/*.vue");
const concat = require('gulp-concat');
const glob = require('glob');

const proxyUrl = "http://192.168.1.205:8081";
gulp.task("server", (cb) => {
    gulp.run("reBuild");
    var app = express();
    app.use(express.static(buildPath));
    app.use('/api', proxy({
        target: proxyUrl || "http://www.example.org",
        changeOrigin: true,
        pathRewrite: {
            "^/api": ""
        }
    }));
    app.listen(8088, function () {
      gulp.watch(htmlPath, function () {
        gulp.run("extract");
      });
      gulp.watch(path.resolve("./src/!(pages)/**"), function () {
        gulp.run("copy");
      });

    });
});

gulp.task("clean", (cb) => {
    fse.removeSync(buildPath);
    cb();
});

gulp.task("copy-css", () => {
    // 总是先生成common.css再被static中的common.css(空的)覆盖,所以老是为空,需要跳过。
    // return gulp.src(path.resolve(srcPath, "./**/!(common.css)")).pipe(gulp.dest(`${buildPath}`));
    return gulp.src(path.resolve(srcPath, "./css/!(bundle.css)")).pipe(scssCompiler()).pipe(concat(`bundle.css`)).pipe(gulp.dest(`${buildPath}/css`))
});


gulp.task("copy-js", () => {
    return gulp.src(path.resolve(srcPath, "./js/!(bundle.js)")).pipe(concat(`bundle.js`)).pipe(gulp.dest(`${buildPath}/js`));
});

gulp.task("copy-other", ["copy-other1","copy-other2"]);

gulp.task("copy-other1", () => {
    return gulp.src(path.resolve(srcPath, "./!(css|js|pages)/**")).pipe(gulp.dest(`${buildPath}`));
});
gulp.task("copy-other2", () => {
    return gulp.src(path.resolve(srcPath, "./!(css|js|pages)")).pipe(gulp.dest(`${buildPath}`)).on("end",()=>{
        let paths = glob.sync(path.resolve(buildPath, "./pages/*.wxml"));
        let appJsonAddr = path.resolve(buildPath, "./app.json");
        let appJson = JSON.parse(fse.readFileSync(appJsonAddr,"utf-8"));
        appJson.pages = paths.map(i=>{
            let name = path.basename(i,path.extname(i));
            return `pages/${name}`;
        })
        fse.outputFileSync(appJsonAddr,JSON.stringify(appJson,undefined,"\t"));
    });
});

gulp.task("copy", ["copy-css", "copy-js","copy-other"]);

gulp.task("extract",() => {
    return gulp.src(htmlPath).pipe(weapp({dist: buildPath, development: true})).pipe(gulp.dest(`${buildPath}/pages`));
});

gulp.task("build", ["extract","copy"]);

gulp.task("reBuild", ["clean","build"]);

gulp.task("default", ["server"]);



gulp.run();
