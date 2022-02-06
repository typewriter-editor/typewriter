import path from 'path';
import BundleAnalyzerPlugin from 'webpack-bundle-analyzer';

export default {
  entry: './src/index.ts',
  mode: 'production',
  output: {
    path: path.resolve('lib'),
    filename: 'bundle.js',
    library: 'typewriter',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        resolve: { fullySpecified: false }
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{
          loader: 'ts-loader',
          options: { onlyCompileBundledFiles: true }
        }],
      },
      {
        test: /\.svelte$/,
        exclude: /node_modules/,
        use: 'svelte-loader'
      }
    ],
  },
  devtool: 'source-map',
  resolve: {
    extensions: [ '.ts', '.tsx', '.js' ],
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
  ],
};
