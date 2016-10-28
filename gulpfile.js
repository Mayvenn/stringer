var gulp = require('gulp');
var concat = require('gulp-concat');
var del = require('del');
var uglify = require('gulp-uglify');
var ver = require('gulp-ver');

gulp.task('clean-min-js', function () {
  return del(['./target']);
});


gulp.task('concat-minify-and-version', ['clean-min-js'], function () {
    return gulp.src(['uuid.js', 'stringer.js'])
        .pipe(concat('combined.js'))
        .pipe(uglify())
        .pipe(ver())
        .pipe(gulp.dest('target/'));
});


gulp.task('default', ['concat-minify-and-version']);
