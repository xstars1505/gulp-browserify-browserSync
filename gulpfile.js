var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    concat       = require('gulp-concat'),
    watch        = require('gulp-watch'),
    plumber      = require('gulp-plumber'),
    minify_css   = require('gulp-minify-css'),
    uglify       = require('gulp-uglify'),
    notify       = require('gulp-notify'),
    sourcemaps   = require('gulp-sourcemaps'),
    prefix       = require('gulp-autoprefixer');

var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

//-------------------------------------------------------------------------

var dest_js  = 'dist/js';
var dest_css = 'dist/css';
var src_sass = 'app/scss/**/*.scss';
var src_js   = 'app/js/**/*.js';

//-----------------------------------------------------------------------------
var onError = function (err) {
    console.log(err);
    this.emit('end');
};

//SASS to CSS
gulp.task('sass', function() {
    return gulp.src(src_sass) //source: get all file ending with scss in app/scss
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(sass())
        .pipe(prefix('last 2 versions'))
        .pipe(concat('app.min.css'))
        .pipe(gulp.dest(dest_css))
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(minify_css())
        .pipe(gulp.dest(dest_css))
        .pipe(browserSync.reload({
            stream: true
        })); //destination
});

//---------------------------------------------------------------------------------

//Compile JS

gulp.task('js', function () {
    gulp.src(src_js)
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(uglify())
        .pipe(concat('app.min.js'))
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dest_js))
});

//-----------------------------------------------------------------------------------------

//Images - TBD

gulp.task('browserify', function() {
    return browserify('./app/js/convert.js')
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('bundle.js'))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./dist'));
});

// Gulp watch syntax
// gulp.watch('files-to-watch', ['tasks', 'to', 'run']); 
gulp.task('watch', ['browserSync', 'sass'], function() {
    gulp.watch(src_sass, ['sass']);
    gulp.watch('app/*.html', browserSync.reload); 
    gulp.watch(src_js, ['browserify', browserSync.reload]);
});

gulp.task('browserSync', function() {
    browserSync.init({
        server: './dist'

    })
});

// gulp.task('useref', function() {
//     return gulp.src('app/*.html')
//         .pipe(useref())
//         //minify js file
//         .pipe(gulpIf('*.js', uglify()))
//         .pipe(gulp.dest('dist'));
// })

gulp.task('build', function() {
    runSequence(['sass', 'browserify','browserSync', 'watch'])
})