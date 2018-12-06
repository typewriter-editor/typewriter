import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import svelte from 'rollup-plugin-svelte';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

export default {
  input: 'src/dev.js',
  output: {
    file: 'dist/typewriter-iife.js',
    format: 'iife',
    name: 'Typewriter',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs({
      include: 'node_modules/**'
    }),
    svelte({
      css: function (css) {
        css.write('dist/ui.css');
      }
    }),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [
        ['@babel/preset-env', {
          modules: false
        }]
      ],
      plugins: [
        [ '@babel/plugin-transform-react-jsx', { 'pragma': 'h' }],
        '@babel/plugin-proposal-object-rest-spread',
      ]
    }),
    serve(),
    livereload()
  ],
};