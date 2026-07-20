import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigBuilder } from '@ecopages/core/config-builder';
import { ecopagesJsxPlugin } from '@ecopages/ecopages-jsx';
import { postcssProcessorPlugin } from '@ecopages/postcss-processor';
import { tailwindV4Preset } from '@ecopages/postcss-processor/presets/tailwind-v4';
import remarkGfm from 'remark-gfm';
import rehypePrettyCode from 'rehype-pretty-code';
import { rehypeSimpleTableWrapper } from './src/plugins/rehype-simple-table-wrapper';

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const config = await new ConfigBuilder()
	.setRootDir(appRoot)
	.setIntegrations([
		ecopagesJsxPlugin({
			extensions: ['.tsx'],
			mdx: {
				enabled: true,
				extensions: ['.mdx'],
				compilerOptions: {
					remarkPlugins: [remarkGfm],
					rehypePlugins: [
						[
							rehypePrettyCode,
							{
								theme: { light: 'light-plus', dark: 'dark-plus' },
							},
						],
						rehypeSimpleTableWrapper,
					],
				},
			},
		}),
	])
	.setProcessors([
		postcssProcessorPlugin(
			tailwindV4Preset({
				referencePath: path.resolve(appRoot, 'src/styles/tailwind.css'),
			}),
		),
	])
	.setDefaultMetadata({
		title: 'Scripts Injector - Orchestrate your scripts declaratively',
		description:
			'Scripts Injector is a lightweight library that allows you to orchestrate your scripts declaratively with ease.',
	})
	.build();

export default config;
