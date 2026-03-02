/**
 * @packageDocumentation
 * Shared reusable utilities for the ScriptsInjector ecosystem.
 *
 * This module provides logic for loading scripts gracefully, intercepting
 * and cloning events robustly, and safely managing race conditions
 * using a single global Script `Set` for deduplication.
 */

/**
 * Static set tracking scripts currently being loaded across all instances.
 * Prevents race conditions when multiple injectors try to load the same script simultaneously.
 *
 * @remarks
 * Scripts are added to this set before loading begins and removed in a `finally` block
 * after `Promise.allSettled` completes, ensuring cleanup occurs even if an error is thrown
 * during result processing. This prevents memory leaks where script URLs could otherwise
 * remain in the set indefinitely, blocking future load attempts.
 */
export const scriptsInFlight = new Set<string>();

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
 * Checks if a script with the given URL already exists in the document.
 *
 * @param scriptUrl - The script URL to check
 * @returns `true` if a script with this src already exists, `false` otherwise
 */
export function isScriptLoaded(scriptUrl: string): boolean {
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
export function loadScript(scriptToLoad: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (isScriptLoaded(scriptToLoad)) {
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
