import { eco } from '@ecopages/core';
import { Footer } from '@/components/footer';
import { BaseLayout } from '@/layouts/base-layout/base-layout';

export const ProseLayout = eco.component({
	dependencies: {
		components: [BaseLayout, Footer],
	},
	render: ({ children, class: className }) => {
		return (
			<BaseLayout class={className}>
				<div class="prose">{children}</div>
			</BaseLayout>
		);
	},
});
