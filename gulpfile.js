var gulp = require('gulp');
var del = require('del');
var uglify = require('gulp-uglify');
var sha = require('gulp-gitshasuffix');
var gzip = require('gulp-gzip');

var BUILD_DIR = "./target";

gulp.task('clean-build', function () {
  return del([BUILD_DIR]);
});

gulp.task('build-js', ['clean-build'], function () {
  return gulp.src(['stringer.js'])
    .pipe(uglify().on('error', function(e) { console.log(e); }))
    .pipe(sha({length: 7}))
    .pipe(gzip({ append: false }))
    .pipe(gulp.dest(BUILD_DIR));
});


gulp.task('default', ['build-js']);

gulp.task('watch', function(){
  gulp.watch('stringer.js', ['build-js']);
})
