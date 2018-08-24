import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import svelte from 'rollup-plugin-svelte';
import pkg from './package.json';

export default {
  input: 'src/index.js',
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
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
      "presets": [
        "stage-2",
        ["env", {
          "targets": {
            "browsers": ["> 2%", "not ie <= 11"]
          },
          "modules": false
        }]
      ],
      "plugins": [
        [ "transform-react-jsx", { "pragma": "h" }],
        "external-helpers"
      ]
    }),
  ],
};