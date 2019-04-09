import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import typescript from 'rollup-plugin-typescript';
import sourcemaps from 'rollup-plugin-sourcemaps';

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
			dev: true,
			css: css => {
				css.write('public/bundle.css');
			}
		}),
		resolve(),
		commonjs(),
		livereload(),
	]
};
