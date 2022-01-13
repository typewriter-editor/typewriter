import path from 'path';

export default {
  entry: path.resolve('examples/index.ts'),
  mode: 'development',
  output: {
    path: path.resolve('examples/public'),
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
      'typewriter-editor$': path.resolve('src/index.ts'),
      'typewriter-editor/lib': path.resolve('src'),
    },
  },
  devServer: {
    contentBase: path.resolve('examples/public'),
    port: 9000,
    host: '0.0.0.0',
    historyApiFallback: true,
  },
};
