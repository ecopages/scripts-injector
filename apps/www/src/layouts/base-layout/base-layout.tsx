import { eco } from '@ecopages/core';
import pkg from '@ecopages/scripts-injector/package.json';
import { RuiChip } from '@ecopages/radiant-ui/chip';
import { RuiCycleToggle, RuiCycleToggleItem, ThemePreferenceItemContent } from '@ecopages/radiant-ui/cycle-toggle';
import { Logo } from '@/components/logo/logo';
import { GithubIcon } from '@/components/github-icon';
import type { JsxRenderable } from '@ecopages/jsx';

export type BaseLayoutProps = {
	children: JsxRenderable;
	class?: string;
};

export const BaseLayout = eco.component<BaseLayoutProps, JsxRenderable>({
	dependencies: {
		stylesheets: ['../../styles/tailwind.css', './base-layout.css'],
		scripts: ['./base-layout.script.ts'],
		components: [Logo],
	},
	render: ({ children, class: className }) => {
		return (
			<body>
				<header class="header">
					<div class="header__inner">
						<div class="header__inner-left">
							<Logo href="/" target="_self" title="Scripts Injector" />
							<RuiChip variant="muted" class="version">
								v {pkg.version}
							</RuiChip>
						</div>
						<nav class="header__nav">
							<a href="/docs" class="header__link">
								Docs
							</a>
							<RuiCycleToggle data-theme-toggle value="system" label="Theme" variant="ghost" size="sm">
								<RuiCycleToggleItem id="system" selected>
									<ThemePreferenceItemContent preference="system" showLabel={false} />
								</RuiCycleToggleItem>
								<RuiCycleToggleItem id="light">
									<ThemePreferenceItemContent preference="light" showLabel={false} />
								</RuiCycleToggleItem>
								<RuiCycleToggleItem id="dark">
									<ThemePreferenceItemContent preference="dark" showLabel={false} />
								</RuiCycleToggleItem>
							</RuiCycleToggle>
							<a
								href="https://github.com/ecopages/scripts-injector"
								class="header__link"
								aria-label="GitHub repository"
							>
								<GithubIcon class="w-5 h-5" />
							</a>
						</nav>
					</div>
				</header>
				<main class={`layout-main ${className || ''}`}>{children}</main>
			</body>
		);
	},
});
