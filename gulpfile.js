//gulpfile.js
var gulp = require("gulp");
var fs = require("fs");
var path = require("path");
var data = require("gulp-data");
var sass = require("gulp-sass");
var pug = require("gulp-pug");
var plumber = require("gulp-plumber");
var sassGlob = require("gulp-sass-glob");
var concat = require("gulp-concat");
var imagemin = require("gulp-imagemin");
var pngquant = require("imagemin-pngquant");
var mozjpeg = require("imagemin-mozjpeg");
var uglify = require('gulp-uglify');
var cleanCSS = require('gulp-clean-css');

//sass
gulp.task("sass", function(callback) {
  return gulp
    .src("src/scss/**/*.scss")
    .pipe(plumber())
    .pipe(sassGlob())
    .pipe(sass({ outputStyle: "compressed" }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("dist/assets/css/"))
    .pipe(connect.reload());
});

//pug
//inputDir
var src = {
  html: ["src/pug/page/*.pug", "!" + "src/pug/**/_*.pug"],
  json: "src/pug/_data/",
  css: "src/scss/**/*.scss",
  js: "src/js/**/*.js"
};

//outputDir
var dest = {
  'root': "dist/",
  'html': "dist/"
};

// pugのファイルをビルドしてhtmlに置き換えてdistに吐き出すタスク
gulp.task("pug", function(callback) {
  var locals = {
    site: JSON.parse(fs.readFileSync(src.json + "site.json"))
  };
  return gulp
    .src(src.html)
    .pipe(plumber())
    .pipe(
      data(function(file) {
        locals.relativePath = path.relative(
          file.base,
          file.path.replace(/.pug$/, ".html").replace('../', '')
        );
        return locals;
      })
    )
    .pipe(
      pug({
        locals: locals,
        basedir: "src/pug",
        pretty: true
      })
    )
    .pipe(gulp.dest(dest.html))
    .pipe(connect.reload());
});

// 画像を圧縮してdistに吐き出すタスク
gulp.task("imagemin", function(callback) {
  return gulp
    .src("src/assets/img/*.{png,jpg}")
    .pipe(
      imagemin([
        pngquant({
          quality: [0.30, 0.40],
          speed: 1,
          floyd: 0
        }),
        mozjpeg({
          quality: 40,
          progressive: true
        }),
        imagemin.svgo(),
        imagemin.optipng(),
        imagemin.gifsicle()
      ])
    )
    .pipe(gulp.dest("dist/assets/img/"));
});

// jsを一つのファイルに纏めてdistに吐き出すタスク
gulp.task("js", function(callback) {
  return gulp
    .src("src/assets/js/*.js")
    .pipe(plumber())
    .pipe(concat("script.js"))
    .pipe(uglify())
    .pipe(gulp.dest("dist/assets/js/"));
});

// 監視タスク
gulp.task("watch", function() {
  gulp.watch("src/scss/**/*.scss", gulp.series("sass"));
  gulp.watch("src/pug/**/*.pug", gulp.series("pug"));
  gulp.watch("src/assets/js/*.js", gulp.series("js"));
  gulp.watch("src/assets/img/*.png", gulp.series("imagemin"));
  gulp.watch("src/assets/img/**/*.jpg", gulp.series("imagemin"));
  console.log("check!");
});

// サーバーを立ち上げるタスク
var connect = require("gulp-connect");
gulp.task("connect", function(callback) {
  connect.server({
    root: "dist",
    livereload: true,
    port: 3000
  });
  return callback();
});

// サーバー起動して監視を続けるタスク
gulp.task("start", gulp.parallel("connect", "watch"));

// ビルド用のタスク
gulp.task("build", gulp.parallel("pug", "sass", "js", "imagemin"));
