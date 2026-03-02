import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { initGlobalInjector } from './global-injector.ts';

describe('Global Injector', () => {
	let container: HTMLDivElement;
	let cleanup: () => void;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);

		const mapScript = document.createElement('script');
		mapScript.type = 'ecopages/global-injector-map';
		mapScript.textContent = JSON.stringify({
			'test-trigger-idle': {
				'on:idle': { scripts: ['/global-idle.js'] },
			},
			'test-trigger-click': {
				'on:interaction': { value: 'click', scripts: ['/global-click.js'] },
			},
			'test-trigger-visible': {
				'on:visible': { value: '10px', scripts: ['/global-visible.js'] },
			},
		});
		container.appendChild(mapScript);
	});

	afterEach(() => {
		if (cleanup) cleanup();
		container.remove();
		document.querySelectorAll('script[src^="/global-"]').forEach((el) => el.remove());
		vi.restoreAllMocks();
	});

	it('should parse global map and load idle scripts for bound elements', async () => {
		const target = document.createElement('div');
		target.setAttribute('data-eco-trigger', 'test-trigger-idle');
		container.appendChild(target);

		cleanup = initGlobalInjector();

		await waitFor(() => {
			expect(document.querySelector('script[src="/global-idle.js"]')).not.toBeNull();
			expect(target.getAttribute('data-load-reason')).toBe('idle');
			expect(target.hasAttribute('data-loaded')).toBe(true);
		});
	});

	it('should handle interaction triggers', async () => {
		const target = document.createElement('button');
		target.setAttribute('data-eco-trigger', 'test-trigger-click');
		container.appendChild(target);

		cleanup = initGlobalInjector();

		expect(document.querySelector('script[src="/global-click.js"]')).toBeNull();

		target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		await waitFor(() => {
			expect(document.querySelector('script[src="/global-click.js"]')).not.toBeNull();
			expect(target.getAttribute('data-load-reason')).toBe('interaction:click');
		});
	});

	it('should bind elements added via mutations', async () => {
		cleanup = initGlobalInjector();

		const target = document.createElement('button');
		target.setAttribute('data-eco-trigger', 'test-trigger-click');
		container.appendChild(target); // Added after init!

		// Wait for mutation observer to pick up the element
		await waitFor(() => {
			// MutationObserver has processed; now trigger the interaction
		});

		target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		await waitFor(() => {
			expect(document.querySelector('script[src="/global-click.js"]')).not.toBeNull();
		});
	});
});
