const path = require('path');

module.exports = {
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
        use: {
          loader: 'svelte-loader',
          options: {
            onwarn: (warning, handleWarning) => {
              if (warning.code.startsWith('a11y-') || warning.code.includes('noreferrer')) return;
              if (warning.code === 'a11y-no-onchange' || warning.code === 'a11y-label-has-associated-control') return;
              // handleWarning(warning);
            },
            immutable: true,
            preprocess: require('svelte-preprocess')({}),
          },
        },
      },
      {
        test: /\.txt$/,
        use: 'raw-loader'
      }
    ],
  },
  devtool: 'source-map',
  resolve: {
    conditionNames: ['svelte'],
    extensions: [ '.ts', '.tsx', '.js' ],
    alias: {
      'typewriter-editor$': path.resolve('src/index.ts'),
      'typewriter-editor/lib': path.resolve('src'),
    },
  },
  devServer: {
    static: { directory: path.resolve('examples/public') },
    port: 9000,
    host: '0.0.0.0',
    historyApiFallback: true,
  },
};
