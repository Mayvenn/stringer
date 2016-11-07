var gulp = require('gulp');
var del = require('del');
var uglify = require('gulp-uglify');
var rev = require('gulp-rev');

gulp.task('clean-min-js', function () {
  return del(['./target']);
});


gulp.task('minify-and-version', ['clean-min-js'], function () {
    return gulp.src(['stringer.js'])
        .pipe(uglify().on('error', function(e){
            console.log(e);
        }))
        .pipe(rev())
        .pipe(gulp.dest('target/'));
});


gulp.task('default', ['minify-and-version']);

gulp.task('watch', function(){
  gulp.watch('stringer.js', ['minify-and-version']);
})
