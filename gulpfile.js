var gulp = require('gulp');
var del = require('del');
var uglify = require('gulp-uglify');
var sha = require('gulp-gitshasuffix');
var gzip = require('gulp-gzip');

var BUILD_DIR = "./target";

exports.cleanBuild = function () {
  return del([BUILD_DIR]);
};

exports.buildJs = function () {
  exports.cleanBuild();
  return gulp.src(['stringer.js'])
    .pipe(uglify().on('error', function(e) { console.log(e); }))
    .pipe(sha({length: 7}))
    .pipe(gzip({append: false}))
    .pipe(gulp.dest(BUILD_DIR));
};


exports.default = exports.buildJs;

exports.watch = function(){
  gulp.watch('stringer.js', ['build-js']);
};
