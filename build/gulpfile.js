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
const concat = require('gulp-concat');
const glob = require('glob');

const proxyUrl = "http://192.168.1.205:8081";


const generateAppJson = ()=>{
    let paths = glob.sync(path.resolve("./src/pages/*.vue"));
    let appJsonAddr = path.resolve(buildPath, "./app.json");
    let appJson = JSON.parse(fse.readFileSync(appJsonAddr,"utf-8"));
    appJson.pages = paths.map(i=>{
        let name = path.basename(i,path.extname(i));
        return `pages/${name}`;
    })
    fse.outputFileSync(appJsonAddr,JSON.stringify(appJson,undefined,"\t"));
}


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
        const extractPaths = ["./src/pages","./src/pages/*.vue","./src/components","./src/components/*.vue"];
        extractPaths.forEach(i=>gulp.watch(path.resolve(i), ()=>{
            console.time("extract");
            gulp.run("extract");
            console.timeEnd("extract");
        }));

        const copyPaths = ["./src/!(pages)/**","./src/!(pages)"];
        copyPaths.forEach(i=>gulp.watch(path.resolve(i), ()=>{
            console.time("copy");
            gulp.run("copy");
            console.timeEnd("copy");
        }));

        gulp.watch("./src/pages",generateAppJson);
    });
});

gulp.task("clean", (cb) => {
    fse.emptyDirSync(buildPath);
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
    return gulp.src(path.resolve(srcPath, "./!(css|js|pages|components)/**")).pipe(gulp.dest(`${buildPath}`));
});
gulp.task("copy-other2", () => {
    return gulp.src(path.resolve(srcPath, "./!(css|js|pages|components)")).pipe(gulp.dest(`${buildPath}`)).on("end",generateAppJson);
});

gulp.task("copy", ["copy-css", "copy-js","copy-other"]);

gulp.task("extract",['extract-pages','extract-components']);

gulp.task("extract-pages",() => {
    return gulp.src(path.resolve("./src/pages/*.vue")).pipe(weapp({dist: buildPath,dirPath:path.resolve("./dist/pages"), development: true}));
});

gulp.task("extract-components",() => {
    return gulp.src(path.resolve("./src/components/*.vue")).pipe(weapp({dist: buildPath,dirPath:path.resolve("./dist/components"), development: true}));
});

gulp.task("build", ["extract","copy"]);

gulp.task("reBuild", ["clean","build"]);

gulp.task("default", ["server"]);

gulp.run();