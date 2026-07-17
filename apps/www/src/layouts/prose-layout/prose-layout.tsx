import { eco } from '@ecopages/core';
import { BaseLayout } from '@/layouts/base-layout/base-layout';

export const ProseLayout = eco.component({
	dependencies: {
		components: [BaseLayout],
	},
	render: ({ children, class: className }) => {
		return (
			<BaseLayout class={className}>
				<div class="prose">{children}</div>
			</BaseLayout>
		);
	},
});
