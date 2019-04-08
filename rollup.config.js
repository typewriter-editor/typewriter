import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
// import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
import sourcemaps from 'rollup-plugin-sourcemaps';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/index.ts',
  output: [
    { file: 'lib/index.js', format: 'cjs', sourcemap: true },
    { file: 'lib/index.esm.js', format: 'es', sourcemap: true }
  ],
	plugins: [
		sourcemaps(),
		typescript({
			declaration: true
		}),
		svelte({
      dev: !production,
      immutable: true,
			css: css => {
				css.write('lib/bundle.css');
			}
		}),
		resolve(),
		commonjs(),
		// production && terser()
	]
};
