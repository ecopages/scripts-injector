import { eco } from '@ecopages/core';
import type { JsxRenderable } from '@ecopages/jsx';
import { RuiButton } from '@ecopages/radiant-ui/button';
import { RuiChip } from '@ecopages/radiant-ui/chip';
import { RuiHeading, RuiHeadingDescription, RuiHeadingTitle } from '@ecopages/radiant-ui/heading';
import { RuiInput } from '@ecopages/radiant-ui/input';
import { RuiSelect } from '@ecopages/radiant-ui/select';
import { BaseLayout } from '@/layouts/base-layout/base-layout';

type InjectorTrigger = {
	'on:idle'?: boolean;
	'on:interaction'?: string;
	'on:visible'?: string | boolean;
};

const injectorAttrs = (scripts: string, trigger: InjectorTrigger, className?: string) => ({
	'attr:scripts': scripts,
	...(trigger['on:idle'] ? { 'attr:on:idle': true } : {}),
	...(trigger['on:interaction'] ? { 'attr:on:interaction': trigger['on:interaction'] } : {}),
	...(trigger['on:visible'] !== undefined ? { 'attr:on:visible': trigger['on:visible'] } : {}),
	...(className ? { class: className } : {}),
});

type ShowcaseSectionProps = {
	title: string;
	description: JsxRenderable;
	trigger: string;
	children: JsxRenderable;
};

const ShowcaseSection = ({ title, description, trigger, children }: ShowcaseSectionProps) => (
	<section class="showcase-section">
		<div class="showcase-info">
			<RuiHeading size="md">
				<RuiHeadingTitle>{title}</RuiHeadingTitle>
				<RuiHeadingDescription>{description}</RuiHeadingDescription>
			</RuiHeading>
			<RuiChip variant="muted" class="showcase-tag">
				{trigger}
			</RuiChip>
		</div>
		<div class="showcase-demo">
			<div class="showcase-demo-surface">{children}</div>
		</div>
	</section>
);

type HomeFooterLink = { label: string; href?: string; external?: boolean };
type HomeFooterColumnData = { title: string; links: HomeFooterLink[] };

const HOME_FOOTER_COLUMNS: HomeFooterColumnData[] = [
	{
		title: 'Ecosystem',
		links: [
			{ label: 'Ecopages', href: 'https://ecopages.app', external: true },
			{ label: 'Radiant', href: 'https://radiant.ecopages.app', external: true },
			{ label: 'Radiant UI', href: 'https://radiant-ui.ecopages.app', external: true },
			{ label: 'Scripts Injector' },
			{ label: 'Logger', href: 'https://github.com/ecopages/logger', external: true },
		],
	},
	{
		title: 'Docs',
		links: [
			{ label: 'Scripts Injector', href: '/docs' },
			{ label: 'Global Injector', href: '/global' },
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

const HomeFooterColumn = ({ title, links }: HomeFooterColumnData) => (
	<div class="home-footer__col">
		<p class="home-footer__label">{title}</p>
		<ul class="home-footer__list">
			{links.map((link) => (
				<li>
					{link.href ? (
						<a
							href={link.href}
							{...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
						>
							{link.label}
						</a>
					) : (
						<span aria-current="page">{link.label}</span>
					)}
				</li>
			))}
		</ul>
	</div>
);

export default eco.page({
	dependencies: { stylesheets: ['./index.css'], components: [BaseLayout] },
	layout: BaseLayout,
	render: () => (
		<div class="showcase">
			<section class="showcase-hero">
				<RuiHeading align="center" size="xl" class="showcase-hero__heading">
					<RuiHeadingTitle as="h1">
						Orchestrate scripts.
						<br />
						<scripts-injector {...injectorAttrs('/scripts/accelerate.script.js', { 'on:idle': true })}>
							<span class="accelerate-word text-primary">Accelerate your page.</span>
						</scripts-injector>
					</RuiHeadingTitle>
					<RuiHeadingDescription>
						Take full control of your scripts with a declarative approach. Inject what you need, exactly
						when and where you need it.
					</RuiHeadingDescription>
				</RuiHeading>
				<div class="showcase-hero__actions">
					<RuiButton href="/docs" size="lg">
						<svg
							aria-hidden="true"
							width="20"
							height="20"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						Documentation
					</RuiButton>
				</div>
			</section>

			<div id="examples" class="showcase-examples">
				<ShowcaseSection
					title="Lazy interaction"
					description="Delays loading of heavy logic until the user clicks. The click is captured, the script loads, and then the browser replays it natively."
					trigger={'on:interaction="click"'}
				>
					<scripts-injector {...injectorAttrs('/scripts/demo-click.js', { 'on:interaction': 'click' })}>
						<RuiButton id="demo-click-btn" variant="outline">
							Click to launch
						</RuiButton>
					</scripts-injector>
				</ShowcaseSection>

				<ShowcaseSection
					title="Anticipation"
					description="Preloads resources on hover or keyboard focus, keeping interactions ready without delaying the initial page."
					trigger={'on:interaction="mouseenter,focusin"'}
				>
					<scripts-injector
						{...injectorAttrs(
							'/scripts/demo-hover.js',
							{ 'on:interaction': 'mouseenter,focusin' },
							'showcase-demo__wide',
						)}
					>
						<button id="demo-hover-area" type="button" class="showcase-trigger">
							Hover or focus to load
						</button>
					</scripts-injector>
				</ShowcaseSection>

				<ShowcaseSection
					title="Input focus"
					description="Inject validation or input masks exactly when a user focuses the field."
					trigger={'on:interaction="focusin"'}
				>
					<scripts-injector
						{...injectorAttrs(
							'/scripts/demo-focus.js',
							{ 'on:interaction': 'focusin' },
							'showcase-demo__narrow',
						)}
					>
						<form class="showcase-form" onsubmit="return false">
							<h3>Search</h3>
							<RuiInput
								id="demo-focus-input"
								type="search"
								name="q"
								placeholder="you@example.com"
								autocomplete="off"
								spellcheck={false}
								required
							/>
							<div id="demo-focus-feedback" class="showcase-feedback" aria-live="polite"></div>
						</form>
					</scripts-injector>
				</ShowcaseSection>

				<ShowcaseSection
					title="Background"
					description="Loads non-critical resources such as analytics when the browser is idle, protecting initial-load responsiveness."
					trigger="on:idle"
				>
					<scripts-injector {...injectorAttrs('/scripts/demo-idle.js', { 'on:idle': true })}>
						<RuiChip id="demo-idle-badge" variant="muted" class="showcase-idle-badge">
							Waiting for idle…
						</RuiChip>
					</scripts-injector>
				</ShowcaseSection>

				<ShowcaseSection
					title="Form interception"
					description="Inject validation or submission logic only when a user attempts to submit the form."
					trigger={'on:interaction="submit"'}
				>
					<scripts-injector
						{...injectorAttrs(
							'/scripts/demo-form.js',
							{ 'on:interaction': 'submit' },
							'showcase-demo__narrow',
						)}
					>
						<form id="demo-form" class="showcase-form" onsubmit="return false">
							<h3>Newsletter</h3>
							<RuiInput
								type="email"
								name="email"
								placeholder="you@example.com"
								autocomplete="email"
								required
							/>
							<RuiButton type="submit" class="w-full">
								Subscribe
							</RuiButton>
							<div id="demo-form-feedback" class="showcase-feedback" aria-live="polite"></div>
						</form>
					</scripts-injector>
				</ShowcaseSection>

				<ShowcaseSection
					title="Dynamic selection"
					description="Load dependent logic after a user chooses an option from a Radiant select."
					trigger={'on:interaction="rui-change"'}
				>
					<div class="showcase-select">
						<scripts-injector
							{...injectorAttrs('/scripts/demo-select.js', { 'on:interaction': 'rui-change' }, 'w-full')}
						>
							<RuiSelect
								id="demo-select"
								aria-label="Demo selection"
								placeholder="Select an option…"
								options={[
									{ value: 'A', label: 'Feature A' },
									{ value: 'B', label: 'Feature B' },
									{ value: 'C', label: 'Feature C' },
								]}
							/>
						</scripts-injector>
						<div
							id="demo-select-feedback"
							class="showcase-feedback showcase-feedback--center"
							aria-live="polite"
						></div>
					</div>
				</ShowcaseSection>

				<ShowcaseSection
					title="Nested composition"
					description="Injectors can be nested while keeping the parent and child loading rules independent."
					trigger="Nested components"
				>
					<scripts-injector
						{...injectorAttrs(
							'/scripts/demo-nested-parent.js',
							{ 'on:interaction': 'mouseenter,focusin' },
							'contents',
						)}
					>
						<div id="demo-nested-parent" class="showcase-nested">
							<RuiChip variant="muted" class="showcase-nested__label">
								Parent · hover or focus
							</RuiChip>
							<scripts-injector
								{...injectorAttrs('/scripts/demo-nested-child.js', { 'on:interaction': 'click' })}
							>
								<RuiButton id="demo-nested-child" variant="outline">
									Child button · click
								</RuiButton>
							</scripts-injector>
						</div>
					</scripts-injector>
				</ShowcaseSection>

				<ShowcaseSection
					title="Margin visibility"
					description={
						<>
							Preload scripts <em>before</em> content enters the viewport so the interaction is ready when
							users arrive.
						</>
					}
					trigger={'on:visible="200px"'}
				>
					<div class="showcase-margin-demo">
						<p>Scroll container (simulated)</p>
						<div class="showcase-margin-demo__spacer"></div>
						<scripts-injector
							{...injectorAttrs(
								'/scripts/demo-margin.js',
								{ 'on:visible': '200px' },
								'showcase-demo__wide',
							)}
						>
							<div id="demo-margin-box" class="showcase-margin-box">
								I load at 200px offset
							</div>
						</scripts-injector>
					</div>
				</ShowcaseSection>
			</div>

			<footer class="home-footer">
				<nav class="home-footer__nav" aria-label="Ecopages ecosystem">
					{HOME_FOOTER_COLUMNS.map((column) => (
						<HomeFooterColumn title={column.title} links={column.links} />
					))}
				</nav>
				<div class="home-footer__bar">
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
		</div>
	),
});
