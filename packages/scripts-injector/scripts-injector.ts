import type { Conditions, InjectorMapConfig, OnDataLoadedEvent } from './types';
import { cloneEvent, isScriptLoaded, loadScript, ScriptInjectorEvents, scriptsInFlight } from './utils';

/**
 * The available loading condition types for the scripts-injector element.
 *
 * @remarks
 * - `on:visible` - Load scripts when the element enters the viewport (uses IntersectionObserver)
 * - `on:idle` - Load scripts immediately when the element connects to the DOM
 * - `on:interaction` - Load scripts when user interacts with the element
 */
export const conditions = ['on:visible', 'on:idle', 'on:interaction'] as const;

/**
 * A custom element that dynamically loads scripts based on configurable conditions.
 *
 * The ScriptsInjector element provides lazy-loading of JavaScript modules with support
 * for visibility-based, idle-based, and interaction-based loading strategies. Multiple
 * injectors on a page automatically coordinate to prevent duplicate script loading.
 *
 * @example
 * ```html
 * <!-- Load script when element becomes visible -->
 * <scripts-injector scripts="/js/component.js" on:visible></scripts-injector>
 *
 * <!-- Load script immediately on DOM ready -->
 * <scripts-injector scripts="/js/analytics.js" on:idle></scripts-injector>
 *
 * <!-- Load script on user interaction -->
 * <scripts-injector scripts="/js/widget.js" on:interaction="mouseenter,focusin">
 *   <div>Hover or focus me to load the widget</div>
 * </scripts-injector>
 *
 * <!-- Multiple scripts -->
 * <scripts-injector scripts="/js/a.js,/js/b.js" on:visible></scripts-injector>
 * ```
 *
 * @fires ScriptInjectorEvents.DATA_LOADED - When scripts finish loading
 *
 * @see {@link ScriptInjectorProps} for available attributes
 * @see {@link ScriptInjectorEvents} for events
 */
export class ScriptsInjector extends HTMLElement {
	/**
	 * Array of IntersectionObserver instances used for visibility-based loading.
	 * Multiple observers may exist when using the injector map with multiple `on:visible` triggers.
	 */
	private intersectionObservers: IntersectionObserver[] = [];

	/**
	 * Array of script URLs pending to be loaded.
	 * Populated from the `scripts` attribute or the injector map on connect.
	 */
	private scriptsToLoad: string[] = [];

	/**
	 * Array of script URLs that failed to load.
	 * Populated after loadScripts completes with errors.
	 */
	private failedScripts: string[] = [];

	/**
	 * Registry of event listeners attached to this element for cleanup.
	 * Used primarily for `on:interaction` event handlers.
	 */
	private registeredEvents: { type: string; listener: EventListener }[] = [];

	/**
	 * The parsed injector map configuration, if present.
	 * When set, the component uses map-based conditions instead of attribute-based ones.
	 */
	private configMap: InjectorMapConfig | null = null;

	/**
	 * Map of condition names to their handler methods.
	 * Enables dynamic dispatch based on which `on:*` attributes are present.
	 */
	private conditionsMap: Record<Conditions, () => void> = {
		'on:visible': this.onVisible.bind(this),
		'on:idle': this.onIdle.bind(this),
		'on:interaction': this.onInteraction.bind(this),
	};

	constructor() {
		super();
		this.loadScripts = this.loadScripts.bind(this);
		this.listenToDataLoaded = this.listenToDataLoaded.bind(this);
	}

	/**
	 * Called when the element is connected to the DOM.
	 *
	 * @remarks
	 * Delegates to `initFromMap` when an `ecopages/injector-map` script child
	 * is present, otherwise falls back to `initFromAttributes` for the
	 * traditional attribute-based configuration.
	 */
	connectedCallback(): void {
		const mapScriptContent = this.getMapScriptContent();

		if (mapScriptContent !== null) {
			this.initFromMap(mapScriptContent);
		} else if (this.hasAttribute('scripts')) {
			this.initFromAttributes();
		}

		document.addEventListener(ScriptInjectorEvents.DATA_LOADED, this.listenToDataLoaded);

		if (this.configMap) {
			this.applyMapConditions();
		} else {
			this.applyConditions();
		}
	}

	/**
	 * Finds the nearest injector-map script and returns its raw text content.
	 * Falls back to manual script iteration for robustness across selector/parser edge cases.
	 */
	private getMapScriptContent(): string | null {
		const directMatch = this.querySelector('script[type="ecopages/injector-map"]');
		if (directMatch) {
			return directMatch.textContent ?? '';
		}

		for (const script of this.querySelectorAll('script')) {
			if (script.getAttribute('type') === 'ecopages/injector-map') {
				return script.textContent ?? '';
			}
		}

		return null;
	}

	/**
	 * Initializes the component from a JSON injector map configuration.
	 */
	private initFromMap(jsonContent: string): void {
		try {
			this.configMap = JSON.parse(jsonContent);
			const allScripts = new Set<string>();
			for (const key in this.configMap) {
				for (const script of this.configMap[key].scripts || []) {
					allScripts.add(script);
				}
			}
			this.scriptsToLoad = Array.from(allScripts);
		} catch (e) {
			console.error('[scripts-injector] Failed to parse injector-map JSON', e);
		}
	}

	/**
	 * Initializes the component from traditional HTML attributes.
	 */
	private initFromAttributes(): void {
		const scriptsAttr = this.getAttribute('scripts');
		this.scriptsToLoad = scriptsAttr
			? scriptsAttr
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];
	}

	/**
	 * Called when the element is disconnected from the DOM.
	 */
	disconnectedCallback(): void {
		document.removeEventListener(ScriptInjectorEvents.DATA_LOADED, this.listenToDataLoaded);
		this.unregisterEvents();
	}

	/**
	 * Dispatches a DATA_LOADED event to notify other injectors which scripts were loaded.
	 *
	 * @remarks
	 * Other ScriptsInjector instances listen for this event and remove any matching
	 * scripts from their pending load list, preventing duplicate loading.
	 * Also includes any failed scripts so other injectors can handle them appropriately.
	 */
	private notifyInjectors(loadedScripts?: string[]): void {
		document.dispatchEvent(
			new CustomEvent(ScriptInjectorEvents.DATA_LOADED, {
				detail: {
					loadedScripts: loadedScripts || this.scriptsToLoad,
					failedScripts: this.failedScripts,
				},
			}),
		);
	}

	/**
	 * Checks for `on:*` attributes and invokes the corresponding condition handlers.
	 *
	 * @remarks
	 * Multiple conditions can be applied simultaneously. Each condition that matches
	 * a present attribute will be activated.
	 */
	private applyConditions(): void {
		const conditionKeys = Object.keys(this.conditionsMap) as Conditions[];
		for (const condition of conditionKeys) {
			if (this.hasAttribute(condition)) {
				this.conditionsMap[condition]();
			}
		}
	}

	/**
	 * Parses the interior configuration map to determine which conditions
	 * to listen for, isolating the specific scripts for each trigger.
	 */
	private applyMapConditions(): void {
		if (!this.configMap) return;
		for (const triggerKey in this.configMap) {
			if (triggerKey.startsWith('on:idle')) {
				this.onIdle(this.configMap[triggerKey].scripts);
			} else if (triggerKey.startsWith('on:interaction')) {
				const eventsStr = this.configMap[triggerKey].value as string;
				this.onInteraction(eventsStr, this.configMap[triggerKey].scripts);
			} else if (triggerKey.startsWith('on:visible')) {
				const margin = this.configMap[triggerKey].value as string | undefined;
				this.onVisible(margin, this.configMap[triggerKey].scripts);
			}
		}
	}

	/**
	 * Handler for the `on:visible` condition.
	 * Sets up an IntersectionObserver to load scripts when the element enters the viewport.
	 */
	private onVisible(marginOverride?: string, specificScripts?: string[]): void {
		this.setupIntersectionObserver(marginOverride, specificScripts);
	}

	/**
	 * Handler for the `on:idle` condition.
	 * Loads scripts immediately when the element connects to the DOM.
	 * Uses queueMicrotask to defer execution until after the current synchronous code completes,
	 * ensuring the element is fully connected before loading scripts.
	 */
	private onIdle(specificScripts?: string[]): void {
		queueMicrotask(() => this.loadScripts('idle', specificScripts));
	}

	/**
	 * Handler for the `on:interaction` condition.
	 * Attaches event listeners for the specified interaction events.
	 *
	 * @remarks
	 * The `on:interaction` attribute value is a comma-separated list of event types
	 * (e.g., "mouseenter,focusin"). Scripts load on the first matching event.
	 * Event listeners are stored as references to enable proper cleanup.
	 */
	private onInteraction(interactionOverride?: string, specificScripts?: string[]): void {
		const interaction = interactionOverride || (this.getAttribute('on:interaction') as string);
		if (!interaction) return;

		for (const event of interaction.split(',')) {
			const eventType = event.trim();
			if (eventType) {
				const listener = async (e: Event) => {
					await this.handleInteraction(e, specificScripts);
				};

				this.addEventListener(eventType, listener);
				this.registeredEvents.push({ type: eventType, listener });
			}
		}
	}

	/**
	 * Handles the interaction event.
	 *
	 * @remarks
	 * This method performs the following actions:
	 * 1. Stops immediate propagation and default behavior of the event.
	 * 2. Loads the assigned scripts.
	 * 3. Replays the event once scripts are loaded with all original properties preserved.
	 *
	 * If the event target is the scripts-injector element itself, the event is not
	 * replayed since there's no meaningful action on the container element.
	 *
	 * For click events on HTMLElements, uses the native `.click()` method to ensure
	 * default behaviors (like navigation or form submission) are triggered.
	 * For other events, clones and dispatches a new event with all properties.
	 */
	private async handleInteraction(event: Event, specificScripts?: string[]): Promise<void> {
		event.stopImmediatePropagation();
		event.preventDefault();

		await this.loadScripts(`interaction:${event.type}`, specificScripts);

		if (event.target === this) return;

		if (event.type === 'click' && event.target instanceof HTMLElement) {
			event.target.click();
			return;
		}

		const clonedEvent = cloneEvent(event);
		if (clonedEvent) {
			event.target?.dispatchEvent(clonedEvent);
		}
	}

	/**
	 * Listener for DATA_LOADED events from other ScriptsInjector instances.
	 *
	 * @param event - The DATA_LOADED custom event containing loaded script URLs
	 *
	 * @remarks
	 * Removes any scripts from this instance's pending list that have already been
	 * loaded by another injector. If all scripts are loaded, marks this element
	 * as complete and cleans up event listeners.
	 */
	private listenToDataLoaded(event: Event): void {
		if (this.hasAttribute('data-loaded')) return;
		const { loadedScripts } = (event as OnDataLoadedEvent).detail;
		this.scriptsToLoad = this.scriptsToLoad.filter((script) => !loadedScripts.includes(script));
		if (this.scriptsToLoad.length === 0) {
			this.setAttribute('data-loaded', '');
			this.unregisterEvents();
		}
	}

	/**
	 * Removes all registered event listeners and disconnects the intersection observer.
	 *
	 * @remarks
	 * Called after scripts are loaded or when all pending scripts have been loaded
	 * by other injectors to clean up resources.
	 */
	private unregisterEvents(): void {
		for (const observer of this.intersectionObservers) {
			observer.disconnect();
		}
		this.intersectionObservers = [];

		for (const { type, listener } of this.registeredEvents) {
			this.removeEventListener(type, listener);
		}
		this.registeredEvents = [];
	}

	/**
	 * Loads all pending scripts and handles completion/cleanup.
	 *
	 * @param reason - The trigger reason for loading (e.g., 'idle', 'visible', 'interaction:click')
	 *
	 * @remarks
	 * Creates a `<script type="module">` element for each script URL and appends
	 * it to the document head. After loading, marks the element as complete,
	 * cleans up listeners, and notifies other injectors.
	 *
	 * Sets `data-load-reason` attribute with the trigger reason for debugging.
	 * If any scripts fail to load, sets `data-error` attribute with the failed URLs.
	 * Checks both if the script already exists and if it's currently being loaded
	 * to prevent duplicate loading across multiple injectors.
	 */
	private async loadScripts(reason: string = 'unknown', specificScripts?: string[]): Promise<void> {
		if (this.hasAttribute('data-loaded')) return;

		this.failedScripts = [];
		const loadResults: { script: string; promise: Promise<void> }[] = [];
		const targetScripts = specificScripts || this.scriptsToLoad;

		for (const script of targetScripts) {
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
					this.failedScripts.push(loadResults[i].script);
				}
			}
		} finally {
			for (const { script } of loadResults) {
				scriptsInFlight.delete(script);
			}
		}

		this.setAttribute('data-load-reason', reason);

		if (this.failedScripts.length > 0) {
			const currentError = this.getAttribute('data-error');
			const newErrors = currentError
				? `${currentError},${this.failedScripts.join(',')}`
				: this.failedScripts.join(',');
			this.setAttribute('data-error', newErrors);
		}

		const allLoaded = this.scriptsToLoad.every((s) => isScriptLoaded(s));
		if (allLoaded) {
			this.setAttribute('data-loaded', '');
			this.unregisterEvents();
		}

		this.notifyInjectors(targetScripts);
	}

	/**
	 * Sets up an IntersectionObserver to detect when the element enters the viewport.
	 *
	 * @remarks
	 * Uses a root margin of 50px to trigger slightly before the element is visible,
	 * and a threshold of 0.1 (10% visibility). When triggered, loads all pending scripts.
	 *
	 * The `on:visible` attribute value can optionally specify a custom root margin
	 * (e.g., `on:visible="100px 0px"`), otherwise the default is used.
	 */
	private setupIntersectionObserver(marginOverride?: string, specificScripts?: string[]): void {
		const visibleAttr = this.getAttribute('on:visible');
		const rootMargin =
			marginOverride !== undefined
				? marginOverride
				: visibleAttr && visibleAttr !== '' && visibleAttr !== 'true'
					? visibleAttr
					: '50px 0px';

		const options: IntersectionObserverInit = {
			rootMargin,
			threshold: 0.1,
		};

		const observer = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					this.loadScripts('visible', specificScripts);
				}
			}
		}, options);

		observer.observe(this);
		this.intersectionObservers.push(observer);
	}
}

if (typeof window !== 'undefined' && !customElements.get('scripts-injector')) {
	customElements.define('scripts-injector', ScriptsInjector);
}
