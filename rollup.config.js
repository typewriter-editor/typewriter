import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import svelte from 'rollup-plugin-svelte';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/typewriter.js',
    format: 'cjs',
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
      "presets": [
        "stage-2",
        ["env", {
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