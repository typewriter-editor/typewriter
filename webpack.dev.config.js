const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'examples/index.ts'),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'examples/public'),
    filename: 'bundle.js',
    library: 'typewriter',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.svelte$/,
        use: 'svelte-loader'
      },
      {
        test: /\.txt$/,
        use: 'raw-loader'
      }
    ],
  },
  devtool: 'source-map',
  resolve: {
    extensions: [ '.ts', '.tsx', '.js' ],
    alias: {
      'typewriter-editor$': path.resolve(__dirname, 'src/index.ts'),
      'typewriter-editor/lib': path.resolve(__dirname, 'src'),
    },
  },
  devServer: {
    contentBase: path.join(__dirname, 'examples/public'),
    port: 9000,
    host: '0.0.0.0',
    historyApiFallback: true,
  },
};
