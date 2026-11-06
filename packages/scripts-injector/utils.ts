/**
 * @packageDocumentation
 * Shared reusable utilities for the ScriptsInjector ecosystem.
 *
 * This module provides logic for loading scripts gracefully, intercepting
 * and cloning events robustly, and safely managing race conditions
 * using the script tags themselves (and a per-bundle in-flight map) for deduplication.
 */

/**
 * Events dispatched by the ScriptsInjector custom element and global script tracker.
 *
 * @remarks
 * These events enable coordination between multiple instances
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
 * Creates a clone of an event with all its original properties preserved.
 *
 * @param event - The original event to clone
 * @returns A new event of the appropriate type with all properties copied
 *
 * @remarks
 * Uses the correct event constructor (MouseEvent, KeyboardEvent, FocusEvent, TouchEvent)
 * based on the event type to ensure all relevant properties are preserved.
 * Falls back to a generic Event for unsupported event types.
 */
export function cloneEvent(event: Event): Event {
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
 * Attribute set on every `<script>` tag injected by this package.
 * Tags without it (SSR output, other loaders) are treated as already loaded.
 */
const INJECTED_ATTR = 'data-eco-injected';

/**
 * Attribute set on an injected `<script>` tag once its `load` event has fired.
 * Lives on the DOM so that the separately bundled custom element and global
 * injector can see each other's progress.
 */
const LOADED_ATTR = 'data-eco-loaded';

/**
 * Attribute set on an injected `<script>` tag whose `error` event fired. The tag
 * is kept (as before) and counts as settled, so failures are not retried or swallowed.
 */
const FAILED_ATTR = 'data-eco-failed';

/**
 * Pending load promises keyed by URL, for scripts injected by this bundle.
 */
const loadingScripts = new Map<string, Promise<void>>();

/**
 * Finds a `<script src>` element by its raw `src` attribute value.
 * Iterates instead of using an attribute selector so URLs need no escaping, and
 * also matches the resolved URL so `/x.js` and its absolute form find the same tag.
 */
function findScript(scriptUrl: string): HTMLScriptElement | null {
	let resolved: string | null = null;
	try {
		resolved = new URL(scriptUrl, document.baseURI).href;
	} catch {}
	for (const script of Array.from(document.scripts)) {
		if (script.getAttribute('src') === scriptUrl || (resolved !== null && script.src === resolved)) return script;
	}
	return null;
}

/**
 * Checks whether the script with the given URL is loaded in the document.
 *
 * @param scriptUrl - The script URL to check
 * @returns `true` when a matching tag exists and either was not injected by this
 * package (pre-existing tag) or has settled (loaded, or failed). `false` when there is no
 * tag, or when an injected tag is still in flight.
 */
export function isScriptLoaded(scriptUrl: string): boolean {
	const script = findScript(scriptUrl);
	if (!script) return false;
	return (
		!script.hasAttribute(INJECTED_ATTR) || script.hasAttribute(LOADED_ATTR) || script.hasAttribute(FAILED_ATTR)
	);
}

/**
 * Resolves when an already-injected, still-loading tag fires `load`; rejects on `error`.
 */
function waitForScript(script: HTMLScriptElement): Promise<void> {
	return new Promise((resolve, reject) => {
		script.addEventListener('load', () => resolve(), { once: true });
		script.addEventListener('error', (event) => reject(event), { once: true });
	});
}

/**
 * Loads a script as an ES module and resolves once it is loaded.
 *
 * @param scriptToLoad - The URL of the script to load
 *
 * @remarks
 * - Already loaded (see {@link isScriptLoaded}): resolves immediately.
 * - Tag present but still loading (injected by another trigger or bundle): waits
 *   for that tag's `load`/`error` instead of resolving early.
 * - Otherwise injects a `<script type="module" async>` tagged with
 *   `data-eco-injected`, adds `data-eco-loaded` on load and `data-eco-failed`
 *   on error. A failed tag stays in the document and is not retried.
 * - Concurrent calls for the same URL share one promise.
 */
export function loadScript(scriptToLoad: string): Promise<void> {
	const existing = findScript(scriptToLoad);
	if (existing) {
		return isScriptLoaded(scriptToLoad) ? Promise.resolve() : waitForScript(existing);
	}

	const pending = loadingScripts.get(scriptToLoad);
	if (pending) return pending;

	const promise = new Promise<void>((resolve, reject) => {
		const script = document.createElement('script');
		script.src = scriptToLoad;
		script.type = 'module';
		script.async = true;
		script.setAttribute(INJECTED_ATTR, '');

		script.onload = () => {
			script.setAttribute(LOADED_ATTR, '');
			resolve();
		};
		script.onerror = (error) => {
			script.setAttribute(FAILED_ATTR, '');
			console.error(`[scripts-injector] Failed to load script: ${scriptToLoad}`, error);
			reject(error);
		};

		document.head.appendChild(script);
	}).finally(() => {
		loadingScripts.delete(scriptToLoad);
	});

	loadingScripts.set(scriptToLoad, promise);
	return promise;
}
