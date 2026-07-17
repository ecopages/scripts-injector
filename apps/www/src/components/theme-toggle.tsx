import type { ThemeToggleProps } from './theme-toggle.script';
import type { EcoComponent } from '@ecopages/core';

export const ThemeToggle: EcoComponent<ThemeToggleProps> = (props) => {
	return <theme-toggle class="theme-toggle" {...props}></theme-toggle>;
};

ThemeToggle.config = {
	dependencies: {
		stylesheets: ['./theme-toggle.css'],
		scripts: ['./theme-toggle.script.tsx'],
	},
};
