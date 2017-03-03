var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var runSequence = require('run-sequence');

gulp.task('sass', function() {
    return gulp.src('app/scss/**/*.scss') //source: get all file ending with scss in app/scss
        .pipe(sass())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        })); //destination
});

// Gulp watch syntax
// gulp.watch('files-to-watch', ['tasks', 'to', 'run']); 
gulp.task('watch', ['browserSync', 'sass'], function() {
    gulp.watch('app/scss/**/*.scss', ['sass']);
    gulp.watch('app/*.html', browserSync.reload); 
    gulp.watch('app/js/**/*.js', browserSync.reload);
})

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: 'app'
        }
    })
})

gulp.task('useref', function() {
    return gulp.src('app/*.html')
        .pipe(useref())
        //minify js file
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulp.dest('dist'));
})

gulp.task('build', function() {
    runSequence(['sass', 'browserSync'])
})