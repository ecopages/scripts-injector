export const THEME_STORAGE_KEY = 'theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export function resolveEffectiveTheme(preference: ThemePreference | null, prefersDark: boolean): EffectiveTheme {
	if (preference === 'light' || preference === 'dark') return preference;
	return prefersDark ? 'dark' : 'light';
}

export function parseStoredPreference(value: string | null): ThemePreference | null {
	if (value === 'light' || value === 'dark' || value === 'system') return value;
	return null;
}

/** Inline script applied before paint to avoid a theme flash. Keep in sync with the app-shell cycle toggle. */
export const themeBootstrapScript = `(function(){const s=localStorage.getItem('${THEME_STORAGE_KEY}');const p=window.matchMedia('(prefers-color-scheme: dark)').matches;const t=(s==='light'||s==='dark')?s:(p?'dark':'light');document.documentElement.setAttribute('data-theme',t);if(t==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}})();`;
