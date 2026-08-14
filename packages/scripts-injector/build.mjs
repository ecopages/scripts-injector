import { rm } from 'node:fs/promises';
import { build } from 'esbuild';

await rm(new URL('./dist', import.meta.url), { force: true, recursive: true });

await build({
	entryPoints: ['scripts-injector.ts', 'global-injector.ts'],
	bundle: true,
	format: 'esm',
	minify: true,
	outdir: 'dist',
	platform: 'browser',
	target: 'es2021',
});
