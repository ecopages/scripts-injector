import type { ScriptsInjector } from './scripts-injector';
import { type conditions } from './scripts-injector';
import { ScriptInjectorEvents } from './utils';

export type OnDataLoadedEvent = CustomEvent<{
	/** Array of script URLs that were successfully loaded or already existed */
	loadedScripts: string[];
	/** Array of script URLs that failed to load */
	failedScripts: string[];
}>;

export type Conditions = (typeof conditions)[number];

export type TriggerSpecificConfig = {
	value?: string | boolean;
	scripts: string[];
};

export type InjectorMapConfig = Record<string, TriggerSpecificConfig>;

export type GlobalInjectorMapConfig = Record<string, InjectorMapConfig>;

export interface GlobalInjectorHandle {
	refresh: () => void;
	cleanup: () => void;
}

export declare function initGlobalInjector(): GlobalInjectorHandle;

declare global {
	interface HTMLElementTagNameMap {
		'scripts-injector': ScriptsInjector;
	}
	namespace JSX {
		interface IntrinsicElements {
			'scripts-injector': HtmlTag & ScriptInjectorProps;
		}
	}
	interface HTMLElementEventMap {
		[ScriptInjectorEvents.DATA_LOADED]: OnDataLoadedEvent;
	}
}

export type InteractionEvent =
	| 'click'
	| 'dblclick'
	| 'mousedown'
	| 'mouseup'
	| 'mouseenter'
	| 'mouseleave'
	| 'mousemove'
	| 'mouseover'
	| 'mouseout'
	| 'touchstart'
	| 'touchend'
	| 'touchmove'
	| 'touchcancel'
	| 'keydown'
	| 'keypress'
	| 'keyup'
	| 'focus'
	| 'blur'
	| 'focusin'
	| 'focusout'
	| 'input'
	| 'change'
	| 'submit'
	| 'scroll'
	| 'resize';

export type InteractionEventsString =
	| InteractionEvent
	| `${InteractionEvent},${InteractionEvent}`
	| `${InteractionEvent},${InteractionEvent},${InteractionEvent}`
	| (string & {});

export declare type ScriptInjectorProps = {
	/**
	 * @description Load the script once the dom is ready
	 * @example <script-injector on:idle></script-injector>
	 */
	'on:idle'?: boolean;
	/**
	 * @description Load the script based on a series of events.
	 * Accepts a comma-separated list of event names.
	 * @example <script-injector on:interaction="mouseenter,focusin"></script-injector>
	 */
	'on:interaction'?: InteractionEventsString;
	/**
	 * @description Import a script to be loaded when the observer detects the element is in the viewport
	 * @example <script-injector on:visible="50px 1px"></script-injector>
	 */
	'on:visible'?: string | boolean;
	/**
	 * A list of scripts to be loaded, comma separated.
	 */
	scripts: string;
};
