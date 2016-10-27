var gulp = require('gulp');
var del = require('del');
var uglify = require('gulp-uglify');
var ver = require('gulp-ver');

gulp.task('clean-min-js', function () {
  return del(['./target']);
});

gulp.task('minify-and-version', ['clean-min-js'], function () {
  return gulp.src(['stringer.js'])
    .pipe(uglify())
    .pipe(ver())
    .pipe(gulp.dest('target/'));
});

gulp.task('default', ['minify-and-version']);
