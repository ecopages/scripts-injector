import '@ecopages/scripts-injector';
import '@ecopages/radiant-ui/cycle-toggle';
import '@ecopages/radiant-ui/select';

const THEME_STORAGE_KEY = 'theme';

type ThemePreference = 'system' | 'light' | 'dark';

function isThemePreference(value: string | null): value is ThemePreference {
	return value === 'system' || value === 'light' || value === 'dark';
}

function applyTheme(preference: ThemePreference): void {
	const isDark =
		preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
	document.documentElement.classList.toggle('dark', isDark);
	localStorage.setItem(THEME_STORAGE_KEY, preference);
	window.dispatchEvent(new CustomEvent('theme-changed'));
}

function syncThemeToggle(): void {
	const toggle = document.querySelector<HTMLElement>('[data-theme-toggle]');
	const preference = localStorage.getItem(THEME_STORAGE_KEY);
	toggle?.setAttribute('value', isThemePreference(preference) ? preference : 'system');
}

syncThemeToggle();

document.addEventListener('rui-change', (event) => {
	const target = event.target;
	if (!(target instanceof HTMLElement) || !target.matches('[data-theme-toggle]')) return;

	const value = (event as CustomEvent<{ value?: string }>).detail?.value;
	if (isThemePreference(value ?? null)) applyTheme(value);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
	if (localStorage.getItem(THEME_STORAGE_KEY) === 'system') applyTheme('system');
});
