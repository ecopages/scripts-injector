import { eco } from '@ecopages/core';
import { Head } from '@/includes/head';
import type { HtmlTemplateProps } from '@ecopages/core';
import type { JsxRenderable } from '@ecopages/jsx';
import { themeBootstrapScript } from '@/lib/theme';

const HtmlTemplate = eco.component<HtmlTemplateProps<JsxRenderable>, JsxRenderable>({
	dependencies: {
		components: [Head],
		scripts: [
			{
				content: themeBootstrapScript,
				attributes: {
					defer: '',
				},
			},
		],
	},

	render: ({ children, metadata, headContent = '', language = 'en' }) => {
		return (
			<html lang={language}>
				<Head metadata={metadata}>{headContent}</Head>
				{children}
			</html>
		);
	},
});

export default HtmlTemplate;
