import { RadiantElement } from '@ecopages/radiant/core/radiant-element';
import { customElement } from '@ecopages/radiant/decorators/custom-element';
import { prop } from '@ecopages/radiant/decorators/prop';
import type { JsxRenderable } from '@ecopages/jsx';
import { parseStoredPreference, resolveEffectiveTheme, THEME_STORAGE_KEY, type ThemePreference } from '@/lib/theme';

export type { ThemePreference };

export type ThemeToggleProps = {
	class?: string;
};

type Bindings = {
	preference: ThemePreference;
};

const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

const THEME_CONFIG: Record<ThemePreference, { label: string; icon: JsxRenderable }> = {
	system: {
		label: 'System',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M4.5 15.5L9 14.5L13.5 15.5" />
				<path d="M9 11.75V14.5" />
				<path d="M14.25 2.75H3.75C2.64543 2.75 1.75 3.64543 1.75 4.75V9.75C1.75 10.8546 2.64543 11.75 3.75 11.75H14.25C15.3546 11.75 16.25 10.8546 16.25 9.75V4.75C16.25 3.64543 15.3546 2.75 14.25 2.75Z" />
			</svg>
		),
	},
	light: {
		label: 'Light',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M9 1.25V2.25" />
				<path d="M14.48 3.52002L13.773 4.22702" />
				<path d="M16.75 9H15.75" />
				<path d="M14.48 14.4799L13.773 13.7729" />
				<path d="M9 16.75V15.75" />
				<path d="M3.52 14.4799L4.227 13.7729" />
				<path d="M1.25 9H2.25" />
				<path d="M3.52 3.52002L4.227 4.22702" />
				<path d="M9 13.25C11.3472 13.25 13.25 11.3472 13.25 9C13.25 6.65279 11.3472 4.75 9 4.75C6.65279 4.75 4.75 6.65279 4.75 9C4.75 11.3472 6.65279 13.25 9 13.25Z" />
			</svg>
		),
	},
	dark: {
		label: 'Dark',
		icon: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M13 11.75C9.548 11.75 6.75 8.95201 6.75 5.50001C6.75 4.14801 7.183 2.90101 7.912 1.87801C4.548 2.50601 2 5.45301 2 9.00001C2 13.004 5.246 16.25 9.25 16.25C12.622 16.25 15.448 13.944 16.259 10.826C15.309 11.409 14.196 11.75 13 11.75Z" />
			</svg>
		),
	},
};

@customElement('theme-toggle')
export class ThemeToggle extends RadiantElement<Bindings> {
	@prop({ type: String, reflect: true, defaultValue: 'system' }) declare preference: ThemePreference;
	private icon = this.$.preference.map((p) => THEME_CONFIG[p].icon);
	private label = this.$.preference.map((p) => THEME_CONFIG[p].label);

	private mediaQuery?: MediaQueryList;

	private get effectiveTheme(): 'light' | 'dark' {
		return resolveEffectiveTheme(this.preference, this.mediaQuery?.matches ?? false);
	}

	private applyTheme(): void {
		const theme = this.effectiveTheme;
		const root = document.documentElement;
		root.setAttribute('data-theme', theme);
		root.classList.toggle('dark', theme === 'dark');
		localStorage.setItem(THEME_STORAGE_KEY, this.preference);
		window.dispatchEvent(new CustomEvent('theme-changed'));
	}

	private readonly cycle = (): void => {
		const index = ORDER.indexOf(this.preference);
		this.preference = ORDER[(index + 1) % ORDER.length];
		this.applyTheme();
	};

	private readonly handleMediaChange = (): void => {
		if (this.preference === 'system') {
			this.applyTheme();
		}
	};

	override connectedCallback(): void {
		super.connectedCallback();
		this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const stored = parseStoredPreference(localStorage.getItem(THEME_STORAGE_KEY));
		if (stored) this.preference = stored;
		this.applyTheme();
		this.mediaQuery.addEventListener('change', this.handleMediaChange);
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.mediaQuery?.removeEventListener('change', this.handleMediaChange);
	}

	override render() {
		return (
			<button
				type="button"
				class="button button--tonal button--sm"
				data-preference={this.$.preference}
				on:click={this.cycle}
			>
				{this.icon}
				{this.label}
			</button>
		);
	}
}

declare global {
	namespace JSX {
		interface IntrinsicElements {
			'theme-toggle': ThemeToggleProps;
		}
	}
}
