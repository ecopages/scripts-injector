import { eco } from '@ecopages/core';
import type { Error404TemplateProps } from '@ecopages/core';
import { BaseLayout } from '@/layouts/base-layout';
import type { JsxRenderable } from '@ecopages/jsx';

export default eco.page<Error404TemplateProps, JsxRenderable>({
	layout: BaseLayout,
	render: () => {
		return (
			<div class="prose">
				<h1>404 - Page Not Found</h1>
				<p>The page you are looking for does not exist.</p>
			</div>
		);
	},
});
