import { eco } from '@ecopages/core';
import type { PageHeadProps } from '@ecopages/core';
import type { JsxRenderable } from '@ecopages/jsx';
import { Seo } from '@/includes/seo';

export const Head = eco.component<PageHeadProps<JsxRenderable>, JsxRenderable>({
	dependencies: {
		stylesheets: ['../styles/tailwind.css'],
	},

	render: ({ metadata, children }) => {
		return (
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link
					rel="preload"
					href="/assets/fonts/geist.woff2"
					as="font"
					type="font/woff2"
					crossorigin="anonymous"
				/>
				<link
					rel="preload"
					href="/assets/fonts/karla.woff2"
					as="font"
					type="font/woff2"
					crossorigin="anonymous"
				/>
				<link
					rel="preload"
					href="/assets/fonts/inconsolata.woff2"
					as="font"
					type="font/woff2"
					crossorigin="anonymous"
				/>
				<Seo {...metadata} />
				{children as 'safe'}
			</head>
		);
	},
});
