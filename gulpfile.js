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

function styles() {
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

function webpackTask() {
    log('webpack started');
    return webpack({
        watch: true,
        mode: 'development',
        entry: glob.sync(source_dir + '/js/*.js').reduce((acc, cur) => {
            acc[path.basename(cur, '.js')] = path.resolve(cur);
            return acc
        }, {}),
        output: {
            path: path.resolve(destination_dir + 'js'),
            publicPath: '/js/',
            filename: '[name].js'
        },
        devtool: 'source-map',
        module: {
            rules: [
                {test: /\.css$/, use: ['vue-style-loader', 'css-loader'],},
                {test: /\.scss$/, use: ['vue-style-loader', 'css-loader', 'sass-loader'],},
                {test: /\.sass$/, use: ['vue-style-loader', 'css-loader', 'sass-loader?indentedSyntax'],},
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                    options: {
                        loaders: {
                            'scss': ['vue-style-loader', 'css-loader', 'sass-loader'],
                            'sass': ['vue-style-loader', 'css-loader', 'sass-loader?indentedSyntax']
                        }
                    }
                },
                {test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/}
            ]
        },
        optimization: {
            minimizer: [new uglifyJsPlugin()],
        },
        resolve: {alias: {vue$: 'vue/dist/vue.esm.js'}, extensions: ['*', '.js', '.vue', '.json']},
        plugins: [
            new VueLoaderPlugin(),
            new webpack.ProvidePlugin({$: 'jquery', jquery: 'jquery', 'window.jQuery': 'jquery', jQuery: 'jquery'})
        ]
    }, (err, stats) => {
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
    styles();
    gulp.watch(source_dir + css_syntax + '/**/*.' + css_syntax, styles);
    webpackTask();
};
