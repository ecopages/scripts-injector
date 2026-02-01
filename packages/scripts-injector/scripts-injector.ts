import type { Conditions, OnDataLoadedEvent, ScriptInjectorProps } from './types';

/**
 * Static set tracking scripts currently being loaded across all instances.
 * Prevents race conditions when multiple injectors try to load the same script simultaneously.
 */
const scriptsInFlight = new Set<string>();

/**
 * Mouse event types that require MouseEvent constructor for proper replay.
 */
const MOUSE_EVENTS = new Set([
	'click',
	'dblclick',
	'mousedown',
	'mouseup',
	'mouseenter',
	'mouseleave',
	'mousemove',
	'mouseover',
	'mouseout',
]);

/**
 * Keyboard event types that require KeyboardEvent constructor for proper replay.
 */
const KEYBOARD_EVENTS = new Set(['keydown', 'keypress', 'keyup']);

/**
 * Focus event types that require FocusEvent constructor for proper replay.
 */
const FOCUS_EVENTS = new Set(['focus', 'blur', 'focusin', 'focusout']);

/**
 * Touch event types that require TouchEvent constructor for proper replay.
 */
const TOUCH_EVENTS = new Set(['touchstart', 'touchend', 'touchmove', 'touchcancel']);

/**
 * Events dispatched by the ScriptsInjector custom element.
 *
 * @remarks
 * These events enable coordination between multiple ScriptsInjector instances
 * on the same page to avoid loading the same script multiple times.
 */
export enum ScriptInjectorEvents {
	/**
	 * Dispatched when scripts have been loaded, notifying other injectors
	 * to remove these scripts from their pending load list.
	 *
	 * @eventProperty detail.loadedScripts - Array of script URLs that were loaded
	 */
	DATA_LOADED = 'data-loaded',
}

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
	 * The IntersectionObserver instance used for visibility-based loading.
	 * Only created when `on:visible` attribute is present.
	 */
	private intersectionObserver?: IntersectionObserver | null = null;

	/**
	 * Array of script URLs pending to be loaded.
	 * Populated from the `scripts` attribute on connect.
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
	 * Parses the `scripts` attribute, registers the global data-loaded listener,
	 * and applies any loading conditions specified via `on:*` attributes.
	 */
	connectedCallback(): void {
		const scriptsAttr = this.getAttribute('scripts');
		this.scriptsToLoad = scriptsAttr
			? scriptsAttr
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: [];

		document.addEventListener(ScriptInjectorEvents.DATA_LOADED, this.listenToDataLoaded);
		this.applyConditions();
	}

	/**
	 * Called when the element is disconnected from the DOM.
	 *
	 * @remarks
	 * Performs cleanup by removing event listeners and disconnecting observers.
	 * Also removes the global data-loaded listener to prevent memory leaks.
	 */
	disconnectedCallback(): void {
		document.removeEventListener(ScriptInjectorEvents.DATA_LOADED, this.listenToDataLoaded);
		this.unregisterEvents();
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}
	}

	/**
	 * Dispatches a DATA_LOADED event to notify other injectors which scripts were loaded.
	 *
	 * @remarks
	 * Other ScriptsInjector instances listen for this event and remove any matching
	 * scripts from their pending load list, preventing duplicate loading.
	 * Also includes any failed scripts so other injectors can handle them appropriately.
	 */
	private notifyInjectors(): void {
		document.dispatchEvent(
			new CustomEvent(ScriptInjectorEvents.DATA_LOADED, {
				detail: {
					loadedScripts: this.scriptsToLoad,
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
	 * Handler for the `on:visible` condition.
	 * Sets up an IntersectionObserver to load scripts when the element enters the viewport.
	 */
	private onVisible(): void {
		this.setupIntersectionObserver();
	}

	/**
	 * Handler for the `on:idle` condition.
	 * Loads scripts immediately when the element connects to the DOM.
	 * Uses queueMicrotask to defer execution until after the current synchronous code completes,
	 * ensuring the element is fully connected before loading scripts.
	 */
	private onIdle(): void {
		queueMicrotask(() => this.loadScripts('idle'));
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
	private onInteraction(): void {
		const interaction = this.getAttribute('on:interaction') as ScriptInjectorProps['on:interaction'];

		if (!interaction) return;

		for (const event of interaction.split(',')) {
			const eventType = event.trim();
			if (eventType) {
				const listener = async (e: Event) => {
					await this.handleInteraction(e);
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
	private async handleInteraction(event: Event): Promise<void> {
		event.stopImmediatePropagation();
		event.preventDefault();

		await this.loadScripts(`interaction:${event.type}`);

		if (event.target === this) return;

		if (event.type === 'click' && event.target instanceof HTMLElement) {
			event.target.click();
			return;
		}

		const clonedEvent = this.cloneEvent(event);
		if (clonedEvent) {
			event.target?.dispatchEvent(clonedEvent);
		}
	}

	/**
	 * Creates a clone of an event with all its original properties preserved.
	 *
	 * @param event - The original event to clone
	 * @returns A new event of the appropriate type with all properties copied
	 *
	 * @remarks
	 * Uses the correct event constructor (MouseEvent, KeyboardEvent, FocusEvent, TouchEvent)
	 * based on the event type to ensure all relevant properties are preserved.
	 * Falls back to a generic Event for unsupported event types.
	 *
	 * Supported types:
	 * - Mouse events preserve coordinates, buttons, and modifier keys
	 * - Keyboard events preserve key codes, location, and modifier keys
	 * - Focus events preserve relatedTarget
	 * - Touch events preserve touch lists and modifier keys
	 */
	private cloneEvent(event: Event): Event {
		const baseInit: EventInit = {
			bubbles: event.bubbles,
			cancelable: event.cancelable,
			composed: event.composed,
		};

		if (MOUSE_EVENTS.has(event.type) && event instanceof MouseEvent) {
			return new MouseEvent(event.type, {
				...baseInit,
				screenX: event.screenX,
				screenY: event.screenY,
				clientX: event.clientX,
				clientY: event.clientY,
				button: event.button,
				buttons: event.buttons,
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey,
				altKey: event.altKey,
				metaKey: event.metaKey,
				relatedTarget: event.relatedTarget,
			});
		}

		if (KEYBOARD_EVENTS.has(event.type) && event instanceof KeyboardEvent) {
			return new KeyboardEvent(event.type, {
				...baseInit,
				key: event.key,
				code: event.code,
				location: event.location,
				repeat: event.repeat,
				isComposing: event.isComposing,
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey,
				altKey: event.altKey,
				metaKey: event.metaKey,
			});
		}

		if (FOCUS_EVENTS.has(event.type) && event instanceof FocusEvent) {
			return new FocusEvent(event.type, {
				...baseInit,
				relatedTarget: event.relatedTarget,
			});
		}

		if (TOUCH_EVENTS.has(event.type) && event instanceof TouchEvent) {
			return new TouchEvent(event.type, {
				...baseInit,
				touches: Array.from(event.touches),
				targetTouches: Array.from(event.targetTouches),
				changedTouches: Array.from(event.changedTouches),
				ctrlKey: event.ctrlKey,
				shiftKey: event.shiftKey,
				altKey: event.altKey,
				metaKey: event.metaKey,
			});
		}

		return new Event(event.type, baseInit);
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
		this.intersectionObserver?.disconnect();

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
	private async loadScripts(reason: string = 'unknown'): Promise<void> {
		if (this.hasAttribute('data-loaded')) return;

		this.failedScripts = [];
		const loadResults: { script: string; promise: Promise<void> }[] = [];

		for (const script of this.scriptsToLoad) {
			if (!this.isScriptLoaded(script) && !scriptsInFlight.has(script)) {
				scriptsInFlight.add(script);
				loadResults.push({ script, promise: this.loadScript(script) });
			}
		}

		const results = await Promise.allSettled(loadResults.map((r) => r.promise));

		for (let i = 0; i < results.length; i++) {
			const result = results[i];
			const scriptUrl = loadResults[i].script;
			scriptsInFlight.delete(scriptUrl);

			if (result.status === 'rejected') {
				this.failedScripts.push(scriptUrl);
			}
		}

		this.setAttribute('data-loaded', '');
		this.setAttribute('data-load-reason', reason);

		if (this.failedScripts.length > 0) {
			this.setAttribute('data-error', this.failedScripts.join(','));
		}

		this.unregisterEvents();
		this.notifyInjectors();
	}

	/**
	 * Checks if a script with the given URL already exists in the document.
	 *
	 * @param scriptUrl - The script URL to check
	 * @returns `true` if a script with this src already exists, `false` otherwise
	 */
	private isScriptLoaded(scriptUrl: string): boolean {
		return document.querySelector(`script[src="${scriptUrl}"]`) !== null;
	}

	/**
	 * Creates and appends a script element for the given URL.
	 *
	 * @param scriptToLoad - The URL of the script to load
	 * @returns Promise that resolves when the script is loaded
	 *
	 * @remarks
	 * Scripts are loaded as ES modules (`type="module"`) with async loading enabled.
	 * Error handling is provided via the script's onerror event.
	 *
	 * Includes a double-check before appending to prevent race conditions
	 * if another injector loaded the script during the async wait.
	 */
	private loadScript(scriptToLoad: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.isScriptLoaded(scriptToLoad)) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = scriptToLoad;
			script.type = 'module';
			script.async = true;

			script.onload = () => resolve();
			script.onerror = (error) => {
				console.error(`[scripts-injector] Failed to load script: ${scriptToLoad}`, error);
				reject(error);
			};

			document.head.appendChild(script);
		});
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
	private setupIntersectionObserver(): void {
		const visibleAttr = this.getAttribute('on:visible');
		const rootMargin = visibleAttr && visibleAttr !== '' && visibleAttr !== 'true' ? visibleAttr : '50px 0px';

		const options: IntersectionObserverInit = {
			rootMargin,
			threshold: 0.1,
		};

		this.intersectionObserver = new IntersectionObserver((entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					this.loadScripts('visible');
				}
			}
		}, options);

		this.intersectionObserver.observe(this);
	}
}

if (typeof window !== 'undefined' && !customElements.get('scripts-injector')) {
	customElements.define('scripts-injector', ScriptsInjector);
}
