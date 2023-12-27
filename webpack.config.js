const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  plugins: [
    new HtmlWebPackPlugin({
      filename: 'index.html',
      template: './public/index.html',
    }),
  ],
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
      },
      // raw loader for text file
      {
        test: /\.txt$/i,
        use: 'raw-loader',
      },
    ],
    unknownContextCritical: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    static: [
      path.join(__dirname, 'public'),
      path.join(__dirname, 'dist'),
    ],
    compress: true,
    port: 9000,
  },
  mode: 'production',
};