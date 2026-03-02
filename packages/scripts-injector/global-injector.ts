/**
 * @packageDocumentation
 * Implements the Global Configurator and script injector.
 *
 * This module allows a single configuration map (`<script type="ecopages/global-injector-map">`)
 * to govern the lazy loading behavior of multiple HTML elements across the document via
 * the `data-eco-trigger` attribute, avoiding the need for individual `<scripts-injector>`
 * component wrappers.
 */

import type { GlobalInjectorMapConfig } from './types';
import { cloneEvent, isScriptLoaded, loadScript, ScriptInjectorEvents, scriptsInFlight } from './utils';

/**
 * Initializes the Global Scripts Injector system on the current page.
 *
 * @remarks
 * 1. Parses any `<script type="ecopages/global-injector-map">` tags into a unified configuration.
 * 2. Scans the initial DOM for elements with `data-eco-trigger` attributes.
 * 3. Sets up a `MutationObserver` to automatically bind new elements added later.
 * 4. Dispatches and listens to `DATA_LOADED` cross-injector events.
 *
 * @returns A cleanup function that disconnects all active observers and removes event listeners.
 */
export function initGlobalInjector(): () => void {
	const mapScripts = document.querySelectorAll('script[type="ecopages/global-injector-map"]');
	let globalConfigMap: GlobalInjectorMapConfig = {};

	for (const script of Array.from(mapScripts)) {
		if (script.textContent) {
			try {
				const parsed = JSON.parse(script.textContent) as GlobalInjectorMapConfig;
				globalConfigMap = { ...globalConfigMap, ...parsed };
			} catch (e) {
				console.error('[global-injector] Failed to parse global-injector-map JSON', e);
			}
		}
	}

	const intersectionObservers: IntersectionObserver[] = [];
	const registeredEvents: { element: Element; type: string; listener: EventListener }[] = [];
	let failedScripts: string[] = [];

	/**
	 * Dispatches a global event informing other injectors (like local `<scripts-injector>` instances)
	 * that specific scripts have finished loading or failed.
	 */
	const notifyInjectors = (scriptsToLoad: string[]) => {
		document.dispatchEvent(
			new CustomEvent(ScriptInjectorEvents.DATA_LOADED, {
				detail: {
					loadedScripts: scriptsToLoad,
					failedScripts: failedScripts,
				},
			}),
		);
	};

	/**
	 * Safely initiates the loading of a set of scripts for a given trigger condition.
	 * Updates the element's DOM attributes (`data-loaded`, `data-load-reason`, `data-error`)
	 * based on the loading results.
	 */
	const triggerScriptLoad = async (reason: string, scriptsToLoad: string[], element?: Element) => {
		if (element && element.hasAttribute('data-loaded')) return;

		failedScripts = [];
		const loadResults: { script: string; promise: Promise<void> }[] = [];

		for (const script of scriptsToLoad) {
			if (!isScriptLoaded(script) && !scriptsInFlight.has(script)) {
				scriptsInFlight.add(script);
				loadResults.push({ script, promise: loadScript(script) });
			}
		}

		const results = await Promise.allSettled(loadResults.map((r) => r.promise));

		try {
			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (result.status === 'rejected') {
					failedScripts.push(loadResults[i].script);
				}
			}
		} finally {
			for (const { script } of loadResults) {
				scriptsInFlight.delete(script);
			}
		}

		if (element) {
			element.setAttribute('data-load-reason', reason);
			if (failedScripts.length > 0) {
				const currentError = element.getAttribute('data-error');
				const newErrors = currentError ? `${currentError},${failedScripts.join(',')}` : failedScripts.join(',');
				element.setAttribute('data-error', newErrors);
			}

			const allLoaded = scriptsToLoad.every((s) => isScriptLoaded(s));
			if (allLoaded) {
				element.setAttribute('data-loaded', '');
			}
		}

		notifyInjectors(scriptsToLoad);
	};

	/**
	 * Binds interaction, visibility, or idle listeners to a specific HTML element
	 * based on its `data-eco-trigger` attribute and the global configuration map.
	 */
	const bindElement = (element: Element) => {
		if (element.hasAttribute('data-eco-bound')) return;

		const triggerId = element.getAttribute('data-eco-trigger');
		if (!triggerId || !globalConfigMap[triggerId]) return;

		element.setAttribute('data-eco-bound', 'true');
		const config = globalConfigMap[triggerId];

		for (const triggerKey in config) {
			if (triggerKey.startsWith('on:idle')) {
				queueMicrotask(() => triggerScriptLoad('idle', config[triggerKey].scripts, element));
			} else if (triggerKey.startsWith('on:interaction')) {
				const eventsStr = config[triggerKey].value as string;
				if (!eventsStr) continue;

				for (const event of eventsStr.split(',')) {
					const eventType = event.trim();
					if (eventType) {
						const listener = async (e: Event) => {
							e.stopImmediatePropagation();
							e.preventDefault();

							await triggerScriptLoad(`interaction:${e.type}`, config[triggerKey].scripts, element);

							if (e.target === element) return;

							if (e.type === 'click' && e.target instanceof HTMLElement) {
								e.target.click();
								return;
							}

							const clonedEvent = cloneEvent(e);
							if (clonedEvent) {
								e.target?.dispatchEvent(clonedEvent);
							}
						};
						element.addEventListener(eventType, listener);
						registeredEvents.push({ element, type: eventType, listener });
					}
				}
			} else if (triggerKey.startsWith('on:visible')) {
				const marginOverride = config[triggerKey].value as string | undefined;
				const rootMargin =
					marginOverride !== undefined && marginOverride !== '' && marginOverride !== 'true'
						? marginOverride
						: '50px 0px';

				const options: IntersectionObserverInit = {
					rootMargin,
					threshold: 0.1,
				};

				const observer = new IntersectionObserver((entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							triggerScriptLoad('visible', config[triggerKey].scripts, element);
							observer.disconnect();
						}
					}
				}, options);

				observer.observe(element);
				intersectionObservers.push(observer);
			}
		}
	};

	document.querySelectorAll('[data-eco-trigger]').forEach(bindElement);

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				for (const node of Array.from(mutation.addedNodes)) {
					if (node instanceof Element) {
						if (node.hasAttribute('data-eco-trigger')) bindElement(node);
						node.querySelectorAll('[data-eco-trigger]').forEach(bindElement);
					}
				}
			} else if (mutation.type === 'attributes' && mutation.attributeName === 'data-eco-trigger') {
				if (mutation.target instanceof Element) bindElement(mutation.target);
			}
		}
	});

	if (document.body) {
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['data-eco-trigger'],
		});
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			document.querySelectorAll('[data-eco-trigger]').forEach(bindElement);
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['data-eco-trigger'],
			});
		});
	}

	return () => {
		observer.disconnect();
		for (const obs of intersectionObservers) {
			obs.disconnect();
		}
		for (const { element, type, listener } of registeredEvents) {
			element.removeEventListener(type, listener);
		}
	};
}
