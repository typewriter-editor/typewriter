const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');


module.exports = function (config) {
  config.set({
    preprocessors: {
     'test/**/*.js': ['rollup']
    },
    frameworks: ['source-map-support', 'mocha', 'chai'],
    files: [ 'test/**/*.test.js' ],
    browsers: ['Chrome'],
    reporters: ['mocha'],
    colors: true,
    singleRun: true,
    autoWatch: true,
    logLevel: config.LOG_INFO,
    port: 9876,
    client: {
      captureConsole: true,
      mocha: {
        reporter: 'html'
      }
    },
    rollupPreprocessor: {
      input: 'test/editor.test.js',
      output: {
        format: 'iife',
        sourcemap: true,
      },
      plugins: [
        resolve(),
        commonjs({
          include: 'node_modules/**'
        }),
        babel({
          exclude: 'node_modules/**'
        })
      ],
    }
  });
};