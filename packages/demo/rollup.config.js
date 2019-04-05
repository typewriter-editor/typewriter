import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import livereload from 'rollup-plugin-livereload';
import typescript from 'rollup-plugin-typescript';
import sourcemaps from 'rollup-plugin-sourcemaps';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/index.ts',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'public/bundle.js'
	},
	plugins: [
		sourcemaps(),
		typescript(),
		svelte({
			dev: !production,
			css: css => {
				css.write('public/bundle.css');
			}
		}),
		resolve(),
		commonjs(),
		!production && livereload(),
	]
};
