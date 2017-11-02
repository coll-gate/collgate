// const UglifyJsPlugin = require('uglifyjs-webpack-plugin3');
const I18NextWebpackPlugin = require('./translation');

let fs = require("fs");
let webpack = require('webpack');
let path = require('path');

module.exports = function (env) {

    let defaults = {
        entry: './apps/driver.js',
        externals: {
            'jquery': '$'
        },
        module: {
            rules: [
                {
                    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: [{
                        loader: "url-loader",
                        options: {
                            limit: 0,
                            mimetype: 'application/font-woff'
                        }
                    }]
                },
                {
                    test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    use: [{loader: "file-loader"}]
                },
                {
                    test: /\.mo$/,
                    use: [{loader: 'buffer-loader'}]  // binary returns string and not Buffer
                },
                {
                    test: /\.po$/,
                    use: [{loader: 'raw-loader'}]
                },
                {
                    test: /\.json$/,
                    use: [{loader: 'json-loader'}]
                },
                {
                    test: /\.html$/,
                    use: [
                        {
                            loader: 'underscore-loader',
                            options: {
                                engine: 'underscore',
                                engineFull: null,
                                minify: true,
                                minifierOptions: {
                                    ignoreCustomFragments: [/<%[\s\S]*?%>/, /<\?[\s\S]*?\?>/],
                                    removeComments: true,
                                    collapseWhitespace: true,
                                    conservativeCollapse: true
                                },
                                templateOptions: {}
                            }
                        },
                        {
                            loader: 'html-minifier-loader'
                        }
                    ]
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                minimize: true
                            }
                        }
                    ]
                }
            ]
        },
        output: {
            path: path.join(__dirname, 'build'),
            filename: 'app.js',
            publicPath: '/build'
        },
        plugins: [
            new I18NextWebpackPlugin({}),
            new webpack.optimize.ModuleConcatenationPlugin(),
            new webpack.ProvidePlugin({_: 'underscore'})
        ],
        resolve: {
            modules: [
                path.join(__dirname, "app"),
                path.join(__dirname, "node_modules")
            ]
        }
    };

    if (env && env.minimized) {
        // defaults.plugins.push(
        //     new webpack.BannerPlugin(fs.readFileSync('../LICENSE', 'utf8')),
        //     new webpack.LoaderOptionsPlugin({debug: false}),
        //     new /*webpack.optimize.*/UglifyJsPlugin({
        //         parallel: true,
        //         sourceMap: false,  // not for release
        //         uglifyOptions: {
        //             ecma: 8,
        //             ie8: false,
        //             mangle: {
        //                 //except: ['$super', '$', 'exports', 'require']
        //             },
        //             comments: /Coll-Gate IS /,
        //             minimize: true,
        //             output: {
        //                 comments: false,
        //                 beautify: false
        //             },
        //             compress: {
        //                 warnings: false
        //             }
        //         }
        //     }));
        defaults.output.filename = 'app.min.js';
    } else {
        defaults.devtool = "source-map";
        defaults.devServer = {
            port: 8080,
            contentBase: path.join(__dirname, 'apps'),
            hot: true,
            inline: true,
            clientLogLevel: "info"
        };

        defaults.plugins.push(
            new webpack.BannerPlugin(fs.readFileSync('../LICENSE', 'utf8')),
            new webpack.LoaderOptionsPlugin({debug: true}),
            new webpack.HotModuleReplacementPlugin()
        );
    }

    return defaults;
};
