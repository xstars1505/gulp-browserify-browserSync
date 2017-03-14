var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    concat       = require('gulp-concat'),
    watch        = require('gulp-watch'),
    plumber      = require('gulp-plumber'),
    minify_css   = require('gulp-minify-css'),
    uglify       = require('gulp-uglify'),
    notify       = require('gulp-notify'),
    sourcemaps   = require('gulp-sourcemaps'),
    prefix       = require('gulp-autoprefixer'),
    useref       = require('gulp-useref'),
    gulpIf       = require('gulp-if'),
    cond         = require('gulp-cond');

var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var del = require('del');
var argv = require('yargs');

//-------------------------------------------------------------------------

// If gulp was called in the terminal with the --prod flag, set the node environment to production
if (argv.prod) {
    process.env.NODE_ENV = 'production';
    console.log('In production mode');
}
var PROD = process.env.NODE_ENV === 'production';

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
        .pipe(gulpIf(PROD, concat('style.css')))
        .pipe(gulpIf(PROD, gulp.dest(dest_css)))
        .pipe(gulpIf(PROD, sourcemaps.init()))
        .pipe(gulpIf(PROD, sourcemaps.write()))
        .pipe(gulpIf(PROD, minify_css()))
        .pipe(gulpIf(PROD, gulp.dest(dest_css), gulp.dest('app/css')))
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
        .pipe(buffer())
        .pipe(cond(!PROD, sourcemaps.init({loadMaps: true})))
        .pipe(cond(!PROD, sourcemaps.write()))
        // Start piping stream to tasks!
        .pipe(gulp.dest('./app/js'))
        ;
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
        server: PROD ? './dist' : './app'

    })
});

gulp.task('useref', function() {
    return gulp.src('app/*.html')
        .pipe(useref())
        //minify js file
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulp.dest('dist'));
})

gulp.task('clean', function() {
    return del(['dist/**/*']);
});

gulp.task('build', function() {
    runSequence([ 'sass', 'browserify','browserSync', 'watch'])
})