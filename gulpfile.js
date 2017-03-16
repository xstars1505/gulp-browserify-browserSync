var gulp         = require('gulp'),
    sass         = require('gulp-sass'),
    concat       = require('gulp-concat'),
    watch        = require('gulp-watch'),
    plumber      = require('gulp-plumber'),
    minify_css   = require('gulp-minify-css'),
    uglify       = require('gulp-uglify'),
    notify       = require('gulp-notify'),
    sourcemaps   = require('gulp-sourcemaps'),
    autoprefixer       = require('gulp-autoprefixer'),
    useref       = require('gulp-useref'),
    gulpIf       = require('gulp-if'),
    cond         = require('gulp-cond');

var browserSync = require('browser-sync').create();
var runSequence = require('run-sequence');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var del = require('del');
var argv = require('yargs').argv;
var watchify = require('watchify');

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

var onError = function (err) {
    console.log(err);
    this.emit('end');
};

//-----------------------------------------------------------------------------

//SASS to CSS
gulp.task('sass', function() {
    return gulp.src(src_sass) //source: get all file ending with scss in app/scss
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({
                    style: 'expanded',
                    sourceComments: 'map'
                }))
        .pipe(sourcemaps.write({includeContent: false}))
        .pipe(gulpIf(!PROD, sourcemaps.init({loadMaps: true})))
        .pipe(autoprefixer())
        .pipe(gulpIf(!PROD, sourcemaps.write('.')))
        .pipe(gulpIf(PROD, minify_css()))
        .pipe(gulpIf(PROD, gulp.dest(dest_css), gulp.dest('app/css')))
        .pipe(browserSync.reload({
            stream: true
        }));
});

//-----------------------------------------------------------------------------------------

//Images - TBD


//-----------------------------------------------------------------------------------------

// Browserify specific configuration
const b = browserify({
    entries: ['./app/js/main.js'],
    debug: true,
    plugin: PROD ? [] : [watchify],
    cache: {},
    packageCache: {}
});

b.on('update', bundle);

gulp.task('browserify', bundle);

// Bundles our JS using browserify. Sourcemaps are used in development, while minification is used in production.
function bundle() {
    return b.bundle()

        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(cond(PROD, uglify()))
        .pipe(cond(!PROD, sourcemaps.init({loadMaps: true})))
        .pipe(cond(!PROD, sourcemaps.write()))
        .pipe(gulp.dest('./app/js'));
}

//---------------------------------------------------------------------------------------------------------------
// Gulp watch syntax
// gulp.watch('files-to-watch', ['tasks', 'to', 'run']); 
gulp.task('watch', ['browserSync', 'sass'], function() {
    gulp.watch(src_sass, ['sass']);
    gulp.watch('app/*.html', browserSync.reload); 
    gulp.watch(src_js, browserSync.reload);
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
});

gulp.task('clean', function() {
    return del(['dist/**/*']);
});

gulp.task('build', function() {
    runSequence('browserify',['sass','useref', 'browserSync', 'watch'])
});