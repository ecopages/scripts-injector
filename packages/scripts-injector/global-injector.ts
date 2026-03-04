/**
 * @packageDocumentation
 * Implements the Global Configurator and script injector.
 *
 * This module allows a single configuration map (`<script type="ecopages/global-injector-map">`)
 * to govern the lazy loading behavior of multiple HTML elements across the document via
 * the `data-eco-trigger` attribute, avoiding the need for individual `<scripts-injector>`
 * component wrappers.
 */

import type { GlobalInjectorMapConfig, TriggerSpecificConfig } from './types';
import { ScriptInjectorEvents } from './utils';

/**
 * In-flight loading promises keyed by script URL.
 *
 * Shared across all `loadScript` calls so that concurrent requests for the same
 * URL return the same promise rather than spawning multiple `<script>` tags.
 */
const loadingScripts = new Map<string, Promise<void>>();

/**
 * Returns `true` when a `<script src="...">` tag for the given URL already exists
 * anywhere in the document — including tags injected by other means.
 */
function scriptExists(url: string): boolean {
	return document.querySelector(`script[src="${url}"]`) !== null;
}

/**
 * Appends a `<script type="module">` tag for `url` and returns a promise that
 * settles when the browser signals load or error.
 *
 * @remarks
 * Returns immediately if the script is already present in the DOM.
 * Deduplicates concurrent calls for the same URL by reusing the pending promise
 * stored in `loadingScripts`; the entry is deleted once the promise settles.
 */
function loadScript(url: string): Promise<void> {
	if (scriptExists(url)) return Promise.resolve();

	const existing = loadingScripts.get(url);
	if (existing) return existing;

	const promise = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = url;
		script.type = 'module';
		script.async = true;
		script.onload = () => {
			loadingScripts.delete(url);
			resolve();
		};
		script.onerror = (event) => {
			loadingScripts.delete(url);
			reject(event);
		};
		document.head.appendChild(script);
	});

	loadingScripts.set(url, promise);
	return promise;
}

/**
 * Merges all `<script type="ecopages/global-injector-map">` tags found in the document
 * into a single config object (later tags override earlier ones for duplicate keys).
 *
 * @remarks
 * Managing or pruning stale map tags is intentionally left to the consumer.
 */
function parseTriggerMap(): GlobalInjectorMapConfig {
	const mapScripts = document.querySelectorAll('script[type="ecopages/global-injector-map"]');
	let merged: GlobalInjectorMapConfig = {};

	for (const script of Array.from(mapScripts)) {
		if (!script.textContent) continue;
		try {
			const parsed = JSON.parse(script.textContent) as GlobalInjectorMapConfig;
			merged = { ...merged, ...parsed };
		} catch (error) {
			console.error('[global-injector] Failed to parse global-injector-map JSON', error);
		}
	}

	return merged;
}

/**
 * Loads the scripts defined in `rule` that have not yet been loaded for `element`.
 *
 * Tracks which scripts have already been loaded on a **per-element** basis via the
 * `data-loaded-scripts` attribute so that mixed rules (e.g. `on:idle` + `on:interaction`)
 * do not short-circuit each other.
 */
async function loadRuleScripts(element: Element, rule: TriggerSpecificConfig, reason: string): Promise<void> {
	const loadedScriptsAttr = element.getAttribute('data-loaded-scripts') ?? '';
	const loadedScripts = new Set(loadedScriptsAttr.split(',').filter(Boolean));
	const scriptsToLoad = rule.scripts.filter((url) => !loadedScripts.has(url));

	if (scriptsToLoad.length === 0) return;

	const results = await Promise.allSettled(scriptsToLoad.map(loadScript));
	const failedScripts: string[] = [];

	element.setAttribute('data-load-reason', reason);

	/**
	 * Mark a URL as loaded when its settle result is `fulfilled`, or when the
	 * `<script>` tag is already present in the DOM. The second condition covers
	 * scripts that were injected externally between the time this call started
	 * and when the promise settled (pre-existing tags, parallel injectors, etc.).
	 */
	for (let i = 0; i < scriptsToLoad.length; i++) {
		if (results[i].status === 'fulfilled' || scriptExists(scriptsToLoad[i])) {
			loadedScripts.add(scriptsToLoad[i]);
		} else {
			failedScripts.push(scriptsToLoad[i]);
		}
	}

	element.setAttribute('data-loaded-scripts', Array.from(loadedScripts).join(','));

	if (failedScripts.length > 0) {
		const currentErrors = element.getAttribute('data-error') ?? '';
		const mergedErrors = new Set(
			[...currentErrors.split(',').filter(Boolean), ...failedScripts].filter(Boolean),
		);
		element.setAttribute('data-error', Array.from(mergedErrors).join(','));
	}

	/**
	 * Broadcast the updated set of loaded scripts so that sibling injectors
	 * (e.g. local `<scripts-injector>` custom elements on the same page) can
	 * react without re-fetching scripts that are already available.
	 */
	document.dispatchEvent(
		new CustomEvent(ScriptInjectorEvents.DATA_LOADED, {
			detail: { loadedScripts: Array.from(loadedScripts), failedScripts },
		}),
	);
}

/**
 * The object returned by {@link initGlobalInjector}.
 */
export interface GlobalInjectorHandle {
	/**
	 * Re-parses all `<script type="ecopages/global-injector-map">` tags currently
	 * in the document and attempts to bind any unbound `[data-eco-trigger]` elements.
	 *
	 * Call this from your framework's navigation / page-swap hook (e.g. after a
	 * view-transition or client-side route change) so that new page content is
	 * picked up without a full re-initialisation.
	 */
	refresh: () => void;
	/**
	 * Disconnects the `MutationObserver` and all `IntersectionObserver` instances
	 * created by this injector instance. Call this when the injector is no longer
	 * needed to prevent memory leaks.
	 */
	cleanup: () => void;
}

/**
 * Initializes the Global Scripts Injector system on the current page.
 *
 * @remarks
 * 1. Merges all `<script type="ecopages/global-injector-map">` tags into a config.
 * 2. Scans the initial DOM for elements with `data-eco-trigger` attributes.
 * 3. Sets up a `MutationObserver` to automatically bind elements added later.
 *
 * The returned {@link GlobalInjectorHandle} exposes:
 * - `refresh()` — re-parses the map and re-binds elements. Wire this to your
 *   framework's navigation / page-swap lifecycle hook.
 * - `cleanup()` — disconnects all observers. Call when tearing down the injector.
 *
 * Compatibility fixes applied compared to v0.1.x:
 * - Prevents interaction replay loops by removing capture listeners after first load.
 * - Replays clicks via `composedPath()[0]` for shadow-DOM / Lit elements.
 * - Tracks loaded scripts per element (`data-loaded-scripts`) for mixed rule support.
 * - Supports trigger-ID changes on existing bound elements via `data-eco-bound-trigger`.
 *
 * @returns A {@link GlobalInjectorHandle} with `refresh` and `cleanup` methods.
 */
export function initGlobalInjector(): GlobalInjectorHandle {
	let triggerMap = parseTriggerMap();

	/**
	 * WeakMap from element → list of currently registered interaction listeners.
	 * Used to remove them after a successful interaction-driven load, preventing
	 * the listener from firing again and causing a replay loop.
	 */
	const interactionListeners = new WeakMap<Element, { eventType: string; listener: EventListener }[]>();
	const intersectionObservers: IntersectionObserver[] = [];

	const unbindTrigger = (element: Element): void => {
		const boundListeners = interactionListeners.get(element) ?? [];
		for (const { eventType, listener } of boundListeners) {
			element.removeEventListener(eventType, listener, true);
		}
		interactionListeners.delete(element);
		element.removeAttribute('data-eco-bound');
		element.removeAttribute('data-eco-bound-trigger');
		element.removeAttribute('data-loaded-scripts');
		element.removeAttribute('data-loaded');
		element.removeAttribute('data-load-reason');
		element.removeAttribute('data-error');
	};

	const bindTrigger = (element: Element): void => {
		if (!(element instanceof HTMLElement)) return;

		const triggerId = element.getAttribute('data-eco-trigger');
		if (!triggerId) return;

		const alreadyBound = element.hasAttribute('data-eco-bound');
		const boundTriggerId = element.getAttribute('data-eco-bound-trigger');

		/**
		 * If the element is already bound to the same trigger ID there is nothing
		 * to do — all listeners and observers are already in place.
		 */
		if (alreadyBound && boundTriggerId === triggerId) return;

		/**
		 * The `data-eco-trigger` attribute was changed while the element was
		 * already bound. Tear down every listener, observer, and data attribute
		 * from the previous binding before proceeding with the new trigger ID.
		 */
		if (alreadyBound && boundTriggerId !== triggerId) {
			unbindTrigger(element);
		}

		const entry = triggerMap[triggerId];
		if (!entry) return;

		/**
		 * Deduplicated flat list of every script URL referenced by any rule for
		 * this trigger. Used after each rule loads to determine whether the element
		 * as a whole is fully loaded — i.e. whether `data-loaded` should be set.
		 */
		const allEntryScripts = Array.from(
			new Set(
				Object.values(entry)
					.flatMap((rule) => (Array.isArray(rule?.scripts) ? rule.scripts : []))
					.filter(Boolean),
			),
		);

		element.setAttribute('data-eco-bound', 'true');
		element.setAttribute('data-eco-bound-trigger', triggerId);

		for (const [ruleType, rule] of Object.entries(entry)) {
			if (!rule || !Array.isArray(rule.scripts) || rule.scripts.length === 0) continue;

			/**
			 * `on:idle` — load scripts as soon as the current task queue is drained.
			 *
			 * `queueMicrotask` defers execution until after the current synchronous
			 * work finishes, giving the rest of the page a chance to initialize
			 * before network requests begin.
			 */
			if (ruleType === 'on:idle') {
				queueMicrotask(() => {
					void loadRuleScripts(element, rule, 'idle').then(() => {
						const attr = element.getAttribute('data-loaded-scripts') ?? '';
						const loaded = new Set(attr.split(',').filter(Boolean));
						if (allEntryScripts.every((url) => loaded.has(url))) {
							element.setAttribute('data-loaded', '');
						}
					});
				});
				continue;
			}

			/**
			 * `on:visible` — load scripts when the element enters the viewport.
			 *
			 * An `IntersectionObserver` is created with the margin specified in
			 * `rule.value` (e.g. `"100px 0px"`), falling back to `"50px 0px"` when
			 * the value is absent or the literal string `"true"`. The observer
			 * disconnects immediately after the first intersection to avoid
			 * repeated loads.
			 */
			if (ruleType === 'on:visible') {
				const observer = new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (entry.isIntersecting) {
								void loadRuleScripts(element, rule, 'visible').then(() => {
									const attr = element.getAttribute('data-loaded-scripts') ?? '';
									const loaded = new Set(attr.split(',').filter(Boolean));
									if (allEntryScripts.every((url) => loaded.has(url))) {
										element.setAttribute('data-loaded', '');
									}
								});
								observer.disconnect();
							}
						}
					},
					{
						rootMargin:
							rule.value && rule.value !== 'true' ? (rule.value as string) : '50px 0px',
						threshold: 0.1,
					},
				);
				observer.observe(element);
				intersectionObservers.push(observer);
				continue;
			}

			/**
			 * `on:interaction` — load scripts when the user interacts with the element.
			 *
			 * `rule.value` is a comma-separated list of DOM event types
			 * (e.g. `"click,mouseenter"`). A capturing listener is registered for
			 * each type so it fires before any inner handlers. After the scripts
			 * finish loading the listeners are removed and the original event is
			 * replayed on the correct target.
			 */
			if (ruleType === 'on:interaction') {
				const eventTypes = ((rule.value as string) ?? '')
					.split(',')
					.map((t) => t.trim())
					.filter(Boolean);

				if (eventTypes.length === 0) continue;

				const elementListeners = interactionListeners.get(element) ?? [];

				for (const eventType of eventTypes) {
					const listener: EventListener = async (event) => {
						/**
						 * Bail out early if every script for this rule is already recorded
						 * in `data-loaded-scripts`. This prevents redundant network requests
						 * when the element receives repeated events after the initial load.
						 */
						const loadedScriptsAttr = element.getAttribute('data-loaded-scripts') ?? '';
						const loadedScripts = new Set(loadedScriptsAttr.split(',').filter(Boolean));
						if (rule.scripts.every((url) => loadedScripts.has(url))) return;

						event.stopImmediatePropagation();
						event.preventDefault();

						await loadRuleScripts(element, rule, `interaction:${event.type}`);

						/**
						 * After the current rule's scripts have loaded, re-read
						 * `data-loaded-scripts` and check whether every script across
						 * all rules for this trigger is now present. Only then is the
						 * element considered fully loaded and `data-loaded` is set.
						 */
						const updatedAttr = element.getAttribute('data-loaded-scripts') ?? '';
						const updatedLoaded = new Set(updatedAttr.split(',').filter(Boolean));
						if (allEntryScripts.every((url) => updatedLoaded.has(url))) {
							element.setAttribute('data-loaded', '');
						}

						/**
						 * Remove every capture listener that was registered for this
						 * element. Without this step the listener would intercept the
						 * replayed event below and trigger a second (no-op but disruptive)
						 * load cycle, causing the page to become temporarily unresponsive.
						 */
						const bound = interactionListeners.get(element) ?? [];
						for (const { eventType: et, listener: l } of bound) {
							element.removeEventListener(et, l, true);
						}
						interactionListeners.delete(element);

						/**
						 * Replay the original interaction on the element that the user
						 * actually targeted, now that the required scripts are loaded.
						 *
						 * `event.composedPath()[0]` is preferred over `event.target` because
						 * inside a shadow DOM (e.g. a Lit custom element) `event.target`
						 * resolves to the shadow host while `composedPath()[0]` resolves to
						 * the actual inner element — which is what the user clicked.
						 */
						const originalTarget =
							typeof event.composedPath === 'function'
								? (event.composedPath()[0] as Element | null)
								: null;

						if (event.type === 'click') {
							if (originalTarget instanceof HTMLElement && originalTarget !== element) {
								originalTarget.click();
							} else if (event.target instanceof HTMLElement && event.target !== element) {
								(event.target as HTMLElement).click();
							}
						}
					};

					element.addEventListener(eventType, listener, true);
					elementListeners.push({ eventType, listener });
				}

				interactionListeners.set(element, elementListeners);
			}
		}
	};

	/**
	 * Bind all elements that already exist in the DOM at initialization time.
	 */
	document.querySelectorAll('[data-eco-trigger]').forEach(bindTrigger);

	/**
	 * Watch for elements with `data-eco-trigger` that are added to the DOM after
	 * the initial render (e.g. via client-side rendering, portals, or dynamic
	 * HTML injection). Also responds to in-place `data-eco-trigger` attribute
	 * changes so that trigger reassignments are handled without a full re-init.
	 */
	const mutationObserver = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				for (const node of Array.from(mutation.addedNodes)) {
					if (!(node instanceof Element)) continue;
					if (node.hasAttribute('data-eco-trigger')) bindTrigger(node);
					node.querySelectorAll('[data-eco-trigger]').forEach(bindTrigger);
				}
				continue;
			}

			if (mutation.type === 'attributes' && mutation.attributeName === 'data-eco-trigger') {
				if (mutation.target instanceof Element) bindTrigger(mutation.target);
			}
		}
	});

	const observerOptions: MutationObserverInit = {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ['data-eco-trigger'],
	};

	if (document.body) {
		mutationObserver.observe(document.body, observerOptions);
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			document.querySelectorAll('[data-eco-trigger]').forEach(bindTrigger);
			mutationObserver.observe(document.body, observerOptions);
		});
	}

	let active = true;

	return {
		/**
		 * Re-parses all trigger-map scripts and re-binds every `[data-eco-trigger]`
		 * element currently in the DOM. Intended to be called from the framework's
		 * navigation or page-swap lifecycle hook.
		 *
		 * Has no effect after `cleanup()` has been called.
		 */
		refresh() {
			if (!active) return;
			triggerMap = parseTriggerMap();
			document.querySelectorAll('[data-eco-trigger]').forEach(bindTrigger);
		},
		/**
		 * Disconnects the `MutationObserver` and all `IntersectionObserver` instances
		 * so that nothing continues to run after the caller no longer needs the injector.
		 *
		 * After this is called, `refresh()` becomes a no-op.
		 */
		cleanup() {
			active = false;
			mutationObserver.disconnect();
			for (const obs of intersectionObservers) obs.disconnect();
		},
	};
}
