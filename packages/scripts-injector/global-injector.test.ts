import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { initGlobalInjector } from './global-injector';

/**
 * Injects a `<script type="ecopages/global-injector-map">` tag into `container`
 * with the provided JSON content, mirroring what the server emits at render time.
 */
function addMapScript(content: Record<string, unknown>, container: Element): HTMLScriptElement {
	const script = document.createElement('script');
	script.type = 'ecopages/global-injector-map';
	script.textContent = JSON.stringify(content);
	container.appendChild(script);
	return script;
}

describe('Global Injector', () => {
	let container: HTMLDivElement;
	let handle: ReturnType<typeof initGlobalInjector>;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);

		addMapScript(
			{
				'trigger-idle': {
					'on:idle': { scripts: ['/global-idle.js'] },
				},
				'trigger-click': {
					'on:interaction': { value: 'click', scripts: ['/global-click.js'] },
				},
				'trigger-visible': {
					'on:visible': { value: '10px', scripts: ['/global-visible.js'] },
				},
				'trigger-mixed-idle-and-interaction': {
					'on:idle': { scripts: ['/mixed-idle.js'] },
					'on:interaction': { value: 'click', scripts: ['/mixed-interaction.js'] },
				},
				'trigger-multi-event': {
					'on:interaction': { value: 'click,mouseenter', scripts: ['/multi-event.js'] },
				},
			},
			container,
		);
	});

	afterEach(() => {
		if (handle) handle.cleanup();
		container.remove();
		document
			.querySelectorAll(
				'script[src^="/global-"], script[src^="/mixed-"], script[src^="/multi-"], script[src^="/rebind-"], script[src^="/shared"], script[src^="/vis"], script[src^="/after-swap"]',
			)
			.forEach((el) => el.remove());
		vi.restoreAllMocks();
	});

	describe('on:idle', () => {
		it('injects the script tag, sets data-load-reason="idle", data-loaded-scripts, and data-loaded', async () => {
			const trigger = document.createElement('div');
			trigger.setAttribute('data-eco-trigger', 'trigger-idle');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			await waitFor(() => {
				expect(document.querySelector('script[src="/global-idle.js"]')).not.toBeNull();
				expect(trigger.getAttribute('data-load-reason')).toBe('idle');
				expect(trigger.getAttribute('data-loaded-scripts')).toBe('/global-idle.js');
				expect(trigger.hasAttribute('data-loaded')).toBe(true);
			});
		});
	});

	describe('on:interaction', () => {
		it('does not inject the script tag before any interaction occurs', () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			expect(document.querySelector('script[src="/global-click.js"]')).toBeNull();
		});

		it('injects the script tag and sets data-load-reason, data-loaded-scripts, and data-loaded after a click', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			handle = initGlobalInjector();
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

			await waitFor(() => {
				expect(document.querySelector('script[src="/global-click.js"]')).not.toBeNull();
				expect(trigger.getAttribute('data-load-reason')).toBe('interaction:click');
				expect(trigger.getAttribute('data-loaded-scripts')).toBe('/global-click.js');
				expect(trigger.hasAttribute('data-loaded')).toBe(true);
			});
		});

		it('responds to any of the configured event types, not only click', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-multi-event');
			container.appendChild(trigger);

			handle = initGlobalInjector();
			trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, cancelable: true }));

			await waitFor(() => {
				expect(document.querySelector('script[src="/multi-event.js"]')).not.toBeNull();
				expect(trigger.getAttribute('data-load-reason')).toBe('interaction:mouseenter');
			});
		});

		it('removes capture listeners after first load so subsequent interactions do not re-inject the script', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			handle = initGlobalInjector();
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

			await waitFor(() => expect(trigger.hasAttribute('data-loaded')).toBe(true));

			const scriptCountAfterFirstLoad = document.querySelectorAll('script[src="/global-click.js"]').length;
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(document.querySelectorAll('script[src="/global-click.js"]').length).toBe(scriptCountAfterFirstLoad);
		});
	});

	describe('on:visible', () => {
		it('passes the configured rootMargin value to IntersectionObserver', () => {
			const observeSpy = vi.fn();
			const disconnectSpy = vi.fn();
			let capturedOptions: IntersectionObserverInit | undefined;

			class MockIntersectionObserver {
				constructor(_cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
					capturedOptions = options;
				}
				observe = observeSpy;
				disconnect = disconnectSpy;
			}

			vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

			addMapScript({ 'trigger-visible-default': { 'on:visible': { scripts: ['/vis.js'] } } }, container);

			const trigger = document.createElement('div');
			trigger.setAttribute('data-eco-trigger', 'trigger-visible-default');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			expect(capturedOptions?.rootMargin).toBe('50px 0px');
			expect(capturedOptions?.threshold).toBe(0.1);
		});
	});

	describe('mixed rules (on:idle + on:interaction)', () => {
		it('does not set data-loaded after on:idle alone when on:interaction scripts are still pending', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-mixed-idle-and-interaction');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			await waitFor(() => expect(trigger.getAttribute('data-loaded-scripts')).toContain('/mixed-idle.js'));

			expect(trigger.hasAttribute('data-loaded')).toBe(false);
		});

		it('sets data-loaded only after all rules have loaded their scripts', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-mixed-idle-and-interaction');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			await waitFor(() => expect(trigger.getAttribute('data-loaded-scripts')).toContain('/mixed-idle.js'));

			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

			await waitFor(() => {
				expect(trigger.getAttribute('data-loaded-scripts')).toContain('/mixed-interaction.js');
				expect(trigger.hasAttribute('data-loaded')).toBe(true);
			});
		});

		it('does not re-inject a script that was already loaded by on:idle when on:interaction fires', async () => {
			addMapScript(
				{
					'trigger-shared-script': {
						'on:idle': { scripts: ['/shared.js'] },
						'on:interaction': { value: 'click', scripts: ['/shared.js'] },
					},
				},
				container,
			);

			handle = initGlobalInjector();

			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-shared-script');
			container.appendChild(trigger);

			await waitFor(() => expect(trigger.getAttribute('data-loaded-scripts')).toContain('/shared.js'));

			const scriptCountAfterIdleLoad = document.querySelectorAll('script[src="/shared.js"]').length;
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(document.querySelectorAll('script[src="/shared.js"]').length).toBe(scriptCountAfterIdleLoad);
		});
	});

	describe('binding', () => {
		it('sets data-eco-bound-trigger to the trigger id on the element', () => {
			const trigger = document.createElement('div');
			trigger.setAttribute('data-eco-trigger', 'trigger-idle');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			expect(trigger.getAttribute('data-eco-bound-trigger')).toBe('trigger-idle');
		});

		it('binds elements added to the DOM after initialisation via MutationObserver', async () => {
			handle = initGlobalInjector();

			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			await waitFor(() => expect(trigger.hasAttribute('data-eco-bound')).toBe(true));

			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

			await waitFor(() => expect(document.querySelector('script[src="/global-click.js"]')).not.toBeNull());
		});

		it('rebinds an element when its data-eco-trigger attribute is changed to a different trigger id', async () => {
			addMapScript({ 'trigger-rebind': { 'on:interaction': { value: 'click', scripts: ['/rebind-b.js'] } } }, container);

			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			handle = initGlobalInjector();
			await waitFor(() => expect(trigger.getAttribute('data-eco-bound-trigger')).toBe('trigger-click'));

			trigger.setAttribute('data-eco-trigger', 'trigger-rebind');

			await waitFor(() => expect(trigger.getAttribute('data-eco-bound-trigger')).toBe('trigger-rebind'));
			expect(trigger.getAttribute('data-loaded-scripts')).toBeNull();

			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

			await waitFor(() => expect(document.querySelector('script[src="/rebind-b.js"]')).not.toBeNull());
		});

		it('does not bind elements whose trigger id has no entry in the map', () => {
			const trigger = document.createElement('div');
			trigger.setAttribute('data-eco-trigger', 'trigger-not-in-map');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			expect(trigger.hasAttribute('data-eco-bound')).toBe(false);
		});
	});

	describe('refresh()', () => {
		it('re-parses the trigger map and binds newly added elements when refresh is called', async () => {
			const existingTrigger = document.createElement('button');
			existingTrigger.setAttribute('data-eco-trigger', 'trigger-after-swap');
			container.appendChild(existingTrigger);

			addMapScript(
				{ 'trigger-after-swap': { 'on:interaction': { value: 'click', scripts: ['/after-swap.js'] } } },
				container,
			);

			handle = initGlobalInjector();
			await waitFor(() => expect(existingTrigger.hasAttribute('data-eco-bound')).toBe(true));

			const newTrigger = document.createElement('button');
			newTrigger.setAttribute('data-eco-trigger', 'trigger-after-swap');
			container.appendChild(newTrigger);

			handle.refresh();

			await waitFor(() => expect(newTrigger.hasAttribute('data-eco-bound')).toBe(true));

			newTrigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

			await waitFor(
				() => expect(document.querySelector('script[src="/after-swap.js"]')).not.toBeNull(),
				{ timeout: 5000 },
			);
		});

		it('stops binding new elements after cleanup is called', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			handle = initGlobalInjector();
			handle.cleanup();

			const lateArrivingTrigger = document.createElement('button');
			lateArrivingTrigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(lateArrivingTrigger);

			handle.refresh();
			await new Promise((resolve) => setTimeout(resolve, 50));

			expect(lateArrivingTrigger.hasAttribute('data-eco-bound')).toBe(false);
		});
	});

	describe('DATA_LOADED event', () => {
		it('dispatches a DATA_LOADED event that includes the loaded script urls', async () => {
			const trigger = document.createElement('button');
			trigger.setAttribute('data-eco-trigger', 'trigger-click');
			container.appendChild(trigger);

			handle = initGlobalInjector();

			const detail = await new Promise<{ loadedScripts: string[] }>((resolve) => {
				document.addEventListener('data-loaded', (e) => resolve((e as CustomEvent).detail), { once: true });
				trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
			});

			expect(detail.loadedScripts).toContain('/global-click.js');
		});
	});
});

