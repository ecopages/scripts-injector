import type { Conditions, OnDataLoadedEvent, ScriptInjectorProps } from './types';

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
    // Parse comma-separated script URLs, filtering empty strings
    const scriptsAttr = this.getAttribute('scripts');
    this.scriptsToLoad = scriptsAttr
      ? scriptsAttr.split(',').map((s) => s.trim()).filter(Boolean)
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
   */
  private notifyInjectors(): void {
    document.dispatchEvent(
      new CustomEvent(ScriptInjectorEvents.DATA_LOADED, {
        detail: { loadedScripts: this.scriptsToLoad },
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
   */
  private onIdle(): void {
    this.loadScripts();
  }

  /**
   * Handler for the `on:interaction` condition.
   * Attaches event listeners for the specified interaction events.
   *
   * @remarks
   * The `on:interaction` attribute value is a comma-separated list of event types
   * (e.g., "mouseenter,focusin"). Scripts load on the first matching event.
   */
  private onInteraction(): void {
    const interaction = this.getAttribute('on:interaction') as ScriptInjectorProps['on:interaction'];

    if (!interaction) return;

    for (const event of interaction.split(',')) {
      const eventType = event.trim();
      if (eventType) {
        this.addEventListener(eventType, this.loadScripts);
        this.registeredEvents.push({ type: eventType, listener: this.loadScripts });
      }
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
    this.intersectionObserver?.disconnect();

    for (const { type, listener } of this.registeredEvents) {
      this.removeEventListener(type, listener);
    }
    this.registeredEvents = [];
  }

  /**
   * Loads all pending scripts and handles completion/cleanup.
   *
   * @remarks
   * Creates a `<script type="module">` element for each script URL and appends
   * it to the document head. After loading, marks the element as complete,
   * cleans up listeners, and notifies other injectors.
   */
  private loadScripts(): void {
    if (this.hasAttribute('data-loaded')) return;

    try {
      for (const script of this.scriptsToLoad) {
        if (!this.isScriptLoaded(script)) {
          this.loadScript(script);
        }
      }
    } catch (error) {
      console.error('[scripts-injector] Error loading scripts:', error);
    } finally {
      this.setAttribute('data-loaded', '');
      this.unregisterEvents();
      this.notifyInjectors();
    }
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
   *
   * @remarks
   * Scripts are loaded as ES modules (`type="module"`) with async loading enabled.
   * Error handling is provided via the script's onerror event.
   */
  private loadScript(scriptToLoad: string): void {
    const script = document.createElement('script');
    script.src = scriptToLoad;
    script.type = 'module';
    script.async = true;

    script.onerror = (error) => {
      console.error(`[scripts-injector] Failed to load script: ${scriptToLoad}`, error);
    };

    document.head.appendChild(script);
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
    // Parse custom rootMargin from attribute if provided
    const visibleAttr = this.getAttribute('on:visible');
    const rootMargin = visibleAttr && visibleAttr !== '' && visibleAttr !== 'true'
      ? visibleAttr
      : '50px 0px';

    const options: IntersectionObserverInit = {
      rootMargin,
      threshold: 0.1,
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.loadScripts();
        }
      }
    }, options);

    this.intersectionObserver.observe(this);
  }
}

if (!customElements.get('scripts-injector')) {
  customElements.define('scripts-injector', ScriptsInjector);
}
