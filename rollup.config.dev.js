import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export default {
  input: 'src/dev.js',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    name: 'Typewriter',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs({
      include: 'node_modules/**'
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
    serve(),
    livereload()
  ],
};