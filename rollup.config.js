import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/index.js',
    format: 'cjs'
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
  ],
};