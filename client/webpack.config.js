var webpack = require('webpack');
var path = require('path');

var defaults = {
    entry: './apps/driver.js',
    externals: {
        'jquery': '$'
    },
    module: {
        preLoaders: [
            /*{
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'jshint-loader'
            }*/
        ],
        loaders: [
            {
                test: /\.mo$/,
                loader: 'buffer'  // binary returns string and not Buffer
            },
            {
                test: /\.po$/,
                loader: 'raw'
            },
            {
                test: /\.json$/,
                loader: 'json-loader',
            },
            {
                test: /\.html$/,
                //loader: 'underscore-template-loader!html-minifier'
                loader: 'underscore-loader!html-minifier'
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            }
        ]
    },
    'html-minifier-loader': {},
    'html-minify-loader': {
        dom: {  // options of !(htmlparser2)[https://github.com/fb55/htmlparser2]
            lowerCaseAttributeNames: false,      // do not call .toLowerCase for each attribute name (issue with gettext parameters else)
        }
    },
    underscoreTemplateLoader: {
        engine: 'underscore',
        engineFull: null,
        minify: true,
        minifierOptions: {
            ignoreCustomFragments: [ /<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/ ],
            removeComments: true,
            collapseWhitespace: true,
            conservativeCollapse: true
        },
        templateOptions: {}
    },
    'uglify-loader': {
        mangle: false,
    },
    macros: {
        /* */
    },
    output: {
        path: __dirname + '/static/js',
        filename: 'app.js',
        publicPath: '/static/js/'
    },
    plugins: [
        new webpack.ProvidePlugin({_: 'underscore'}),
    ],
    resolve: {
        modulesDirectories: [__dirname + '/node_modules'],
        root: __dirname + '/app'
    },
    resolveLoader: {
        root: __dirname + '/node_modules'
    },
};

minimize = process.argv.indexOf('--minimize') !== -1,
plugins = [];

if (minimize) {
    defaults.module.loaders.push({
        test: /\.js$/,
        //exclude: /.app.js/,
        loader: 'uglify',
    });

    defaults.devtool ="source-map";
    defaults.plugins.push(new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: {
            warnings: false
        }
    }));
    defaults.output.filename = 'app.min.js';
} else {
    defaults.devtool ="source-map";
    defaults.debug = true;

    defaults.devServer = {
        contentBase: __dirname + '/apps',
        hot: true,
        inline: true
    };

    defaults.plugins.push(
        new webpack.HotModuleReplacementPlugin()
    );
}

module.exports = defaults;
