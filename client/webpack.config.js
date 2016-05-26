var webpack = require('webpack');

module.exports = {
  entry: './apps/driver.js',
  /*externals: {
    'jquery': '$'
  },*/
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'underscore-template-loader'
      },
      {
          test: /\.css$/,
          loader: "style-loader!css-loader"
      },
    ]
  },
  output: {
    path: __dirname + '/static/js',
    filename: 'app.js'
  },
  plugins: [
    new webpack.ProvidePlugin({
      _: 'underscore',
    })
  ],
  resolve: {
    modulesDirectories: [__dirname + '/node_modules'],
    root: __dirname + '/app'
  },
  resolveLoader: {
    root: __dirname + '/node_modules'
  }
};
