import { eco } from '@ecopages/core';

type FooterLink = { label: string; href?: string; external?: boolean; page?: FooterPage };
type FooterColumn = { title: string; links: FooterLink[] };
type FooterPage = 'home' | 'docs' | 'global';

export type FooterProps = {
	currentPage?: FooterPage;
};

const FOOTER_COLUMNS: FooterColumn[] = [
	{
		title: 'Ecosystem',
		links: [
			{ label: 'Ecopages', href: 'https://ecopages.app', external: true },
			{ label: 'Radiant', href: 'https://radiant.ecopages.app', external: true },
			{ label: 'Radiant UI', href: 'https://radiant-ui.ecopages.app', external: true },
			{ label: 'Scripts Injector', page: 'home' },
			{ label: 'Logger', href: 'https://github.com/ecopages/logger', external: true },
		],
	},
	{
		title: 'Docs',
		links: [
			{ label: 'Scripts Injector', href: '/docs', page: 'docs' },
			{ label: 'Global Injector', href: '/global', page: 'global' },
		],
	},
	{
		title: 'Packages',
		links: [
			{
				label: '@ecopages/scripts-injector',
				href: 'https://www.npmjs.com/package/@ecopages/scripts-injector',
				external: true,
			},
			{ label: 'GitHub', href: 'https://github.com/ecopages/scripts-injector', external: true },
		],
	},
];

export const Footer = eco.component<FooterProps>({
	dependencies: {
		stylesheets: ['./footer.css'],
	},
	render: ({ currentPage }) => (
		<footer class="site-footer">
			<nav class="site-footer__nav" aria-label="Ecopages ecosystem">
				{FOOTER_COLUMNS.map((column) => (
					<div class="site-footer__col">
						<p class="site-footer__label">{column.title}</p>
						<ul class="site-footer__list">
							{column.links.map((link) => (
								<li>
									{link.page && link.page === currentPage ? (
										<span aria-current="page">{link.label}</span>
									) : (
										<a
											href={link.href ?? '/'}
											{...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
										>
											{link.label}
										</a>
									)}
								</li>
							))}
						</ul>
					</div>
				))}
			</nav>
			<div class="site-footer__bar">
				<p>
					Created by{' '}
					<a href="https://github.com/andeeplus" target="_blank" rel="noopener noreferrer">
						andeeplus
					</a>
				</p>
				<p>
					Built with{' '}
					<a href="https://github.com/ecopages/ecopages" target="_blank" rel="noopener noreferrer">
						Ecopages
					</a>{' '}
					© {new Date().getFullYear()}
				</p>
			</div>
		</footer>
	),
});
