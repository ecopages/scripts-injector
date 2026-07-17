import { eco } from '@ecopages/core';
import type { JsxRenderable } from '@ecopages/jsx/client';
import { ThemeToggle } from '@/components/theme-toggle';

export const Footer = eco.component<
	{
		class?: string;
	},
	JsxRenderable
>({
	dependencies: {
		components: [ThemeToggle],
		stylesheets: ['./footer.css'],
	},
	render: ({ class: className }) => {
		const footerClasses = ['footer', className].filter(Boolean).join(' ');

		return (
			<footer class={footerClasses}>
				<div class="footer__container">
					<p class="footer__copyright">
						Built with{' '}
						<a href="https://github.com/ecopages/ecopages" class="footer__link font-bold">
							ecopages
						</a>
					</p>
					<div class="footer__right">
						<div class="footer__links">
							<ThemeToggle />
						</div>
					</div>
				</div>
			</footer>
		);
	},
});
