/**
 * Example of gulp configuration
 * @link https://github.com/13DaGGeR/gulpfile-example
 * @version 0.1.2
 */
const css_syntax = 'scss', // sass|scss
    source_dir = 'src/', // must contain js and (sass or scss) directories
    destination_dir = 'public/'; // will receive result files in js and css subdirectories respectively

const gulp = require('gulp'),
    sass = require('gulp-sass'), // to preprocess scss and sass
    path = require('path'), // to resolve absolute paths
    glob = require('glob'), // to find files by mask
    sourcemaps = require('gulp-sourcemaps'), // to generate .map files
    log = require('fancy-log'), // to show our logs in gulp's format
    webpack = require('webpack'),
    uglifyJsPlugin = require('uglifyjs-webpack-plugin'), // to minify js
    postcss = require('gulp-postcss'), // for most css needs, uses packages below
    autoprefixer = require('autoprefixer'), // for browser compatibility
    atImport = require('postcss-import'), // for @import usage
    cssnano = require('cssnano') // to minify css
;
const {VueLoaderPlugin} = require('vue-loader');

function dev_styles() {
    let processors = [
        atImport,
        autoprefixer({browsers: ['last 15 version']}),
    ];
    return gulp.src(source_dir + css_syntax + '/*.' + css_syntax)
        .pipe(sass({outputStyle: 'expand'}))
        .pipe(postcss(processors))
        .pipe(gulp.dest(destination_dir + 'css'))
}

function prod_styles() {
    let processors = [
        atImport,
        autoprefixer({browsers: ['last 15 version']}),
        cssnano
    ];
    return gulp.src(source_dir + css_syntax + '/*.' + css_syntax)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expand'}))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destination_dir + 'css'))
}

function webpackTask(is_dev) {
    log('webpack started');
    let postCssLoader = {
        loader: 'postcss-loader',
        options: {
            plugins: function () {
                let modules = [
                    autoprefixer({browsers: ['last 15 version']})
                ];
                if (!is_dev) {
                    modules.push(cssnano);
                }
                return modules;
            }
        }
    };
    let config = {
        watch: !!is_dev,
        mode: is_dev ? 'development' : 'production',
        entry: glob.sync(source_dir + '/js/*.js').reduce((acc, cur) => {
            acc[path.basename(cur, '.js')] = path.resolve(cur);
            return acc
        }, {}),
        output: {
            path: path.resolve(destination_dir + 'js'),
            publicPath: '/js/',
            filename: '[name].js'
        },
        module: {
            rules: [
                {test: /\.css$/, use: ['vue-style-loader', 'css-loader', postCssLoader],},
                {test: /\.scss$/, use: ['vue-style-loader', 'css-loader', 'sass-loader', postCssLoader],},
                {test: /\.sass$/, use: ['vue-style-loader', 'css-loader', 'sass-loader?indentedSyntax', postCssLoader],},
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                        loaders: {
                            'scss': ['vue-style-loader', 'css-loader', 'sass-loader', postCssLoader],
                            'sass': ['vue-style-loader', 'css-loader', 'sass-loader?indentedSyntax', postCssLoader]
                        }
                    }
                },
                {test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/}
            ]
        },
        resolve: {alias: {vue$: 'vue/dist/vue.min.js'}, extensions: ['*', '.js', '.vue', '.json']},
        plugins: [
            new VueLoaderPlugin()
        ]
    };
    if (!is_dev) {
        config.devtool = 'source-map';
    }
    return webpack(config, (err, stats) => {
        let hasError = !!err;
        if (!err && stats.compilation.errors.length) {
            err = stats.compilation.errors;
            hasError = true
        }
        if (hasError) {
            log.error('ERROR:', err);
        } else {
            log('webpack finished');
        }
    });
}

exports.default = function () {
    webpackTask();
    return prod_styles();
};
exports.dev = function () {
    dev_styles();
    gulp.watch(source_dir + css_syntax + '/**/*.' + css_syntax, dev_styles);
    webpackTask(1);
};

