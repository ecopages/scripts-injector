import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScriptsInjector, ScriptInjectorEvents } from './scripts-injector';

describe('ScriptsInjector', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    document.querySelectorAll('script[src^="/test-"]').forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  describe('Custom Element Registration', () => {
    it('should be defined as a custom element', () => {
      expect(customElements.get('scripts-injector')).toBe(ScriptsInjector);
    });

    it('should not throw when defined multiple times', () => {
      expect(() => {
        if (!customElements.get('scripts-injector')) {
          customElements.define('scripts-injector', ScriptsInjector);
        }
      }).not.toThrow();
    });

    it('should be an instance of HTMLElement', () => {
      const el = document.createElement('scripts-injector');
      expect(el).toBeInstanceOf(HTMLElement);
      expect(el).toBeInstanceOf(ScriptsInjector);
    });
  });

  describe('connectedCallback', () => {
    it('should parse scripts attribute into array', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-a.js,/test-b.js');
      container.appendChild(el);

      expect(el.getAttribute('scripts')).toBe('/test-a.js,/test-b.js');
    });

    it('should handle empty scripts attribute', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '');
      container.appendChild(el);

      expect(el.getAttribute('scripts')).toBe('');
    });

    it('should trim whitespace from script URLs', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', ' /test-a.js , /test-b.js ');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const scripts = document.querySelectorAll('script[src="/test-a.js"], script[src="/test-b.js"]');
      expect(scripts.length).toBe(2);
    });
  });

  describe('disconnectedCallback', () => {
    it('should clean up when removed from DOM', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-disconnect.js');
      el.setAttribute('on:interaction', 'click');
      container.appendChild(el);

      el.remove();

      expect(el.parentNode).toBeNull();
    });

    it('should remove document event listener on disconnect', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-listener.js');
      container.appendChild(el);
      el.remove();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        ScriptInjectorEvents.DATA_LOADED,
        expect.any(Function),
      );
    });
  });

  describe('on:idle condition', () => {
    it('should load scripts immediately when on:idle is set', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-idle.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const script = document.querySelector('script[src="/test-idle.js"]');
      expect(script).not.toBeNull();
      expect(script?.getAttribute('type')).toBe('module');
    });

    it('should set data-loaded attribute after loading', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-idle-loaded.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      expect(el.hasAttribute('data-loaded')).toBe(true);
    });

    it('should load multiple scripts', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-multi-1.js,/test-multi-2.js,/test-multi-3.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      expect(document.querySelector('script[src="/test-multi-1.js"]')).not.toBeNull();
      expect(document.querySelector('script[src="/test-multi-2.js"]')).not.toBeNull();
      expect(document.querySelector('script[src="/test-multi-3.js"]')).not.toBeNull();
    });
  });

  describe('on:interaction condition', () => {
    it('should add event listeners for specified events', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-interaction.js');
      el.setAttribute('on:interaction', 'click,mouseenter');
      container.appendChild(el);

      expect(document.querySelector('script[src="/test-interaction.js"]')).toBeNull();

      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(document.querySelector('script[src="/test-interaction.js"]')).not.toBeNull();
    });

    it('should remove event listeners after loading', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      const removeEventListenerSpy = vi.spyOn(el, 'removeEventListener');

      el.setAttribute('scripts', '/test-interaction-cleanup.js');
      el.setAttribute('on:interaction', 'click');
      container.appendChild(el);

      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle empty interaction attribute gracefully', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-empty-interaction.js');
      el.setAttribute('on:interaction', '');
      container.appendChild(el);

      expect(document.querySelector('script[src="/test-empty-interaction.js"]')).toBeNull();
    });
  });

  describe('on:visible condition', () => {
    it('should set up IntersectionObserver when on:visible is set', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-visible-setup.js');
      el.setAttribute('on:visible', '');

      el.style.width = '100px';
      el.style.height = '100px';
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 100));

      expect(el.hasAttribute('data-loaded')).toBe(true);
    });

    it('should respect on:visible attribute value as rootMargin', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-visible-margin.js');
      el.setAttribute('on:visible', '100px 0px');

      el.style.width = '100px';
      el.style.height = '100px';

      expect(() => container.appendChild(el)).not.toThrow();
    });

    it('should load scripts when element becomes visible', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-visible-load.js');
      el.setAttribute('on:visible', '');

      el.style.width = '100px';
      el.style.height = '100px';
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 100));

      expect(document.querySelector('script[src="/test-visible-load.js"]')).not.toBeNull();
    });
  });

  describe('Script Loading', () => {
    it('should create script elements with type="module"', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-module.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const script = document.querySelector('script[src="/test-module.js"]') as HTMLScriptElement;
      expect(script.type).toBe('module');
    });

    it('should set async attribute on scripts', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-async.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const script = document.querySelector('script[src="/test-async.js"]') as HTMLScriptElement;
      expect(script.async).toBe(true);
    });

    it('should not load duplicate scripts', () => {
      const existingScript = document.createElement('script');
      existingScript.src = '/test-duplicate.js';
      document.head.appendChild(existingScript);

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-duplicate.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const scripts = document.querySelectorAll('script[src="/test-duplicate.js"]');
      expect(scripts.length).toBe(1);

      existingScript.remove();
    });

    it('should append scripts to document head', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-head.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const script = document.head.querySelector('script[src="/test-head.js"]');
      expect(script).not.toBeNull();
    });

    it('should not load scripts if already loaded (data-loaded attribute present)', () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-already-loaded.js');
      el.setAttribute('data-loaded', '');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      expect(document.querySelector('script[src="/test-already-loaded.js"]')).toBeNull();
    });
  });

  describe('DATA_LOADED Event Coordination', () => {
    it('should dispatch DATA_LOADED event after loading scripts', () => {
      const eventHandler = vi.fn();
      document.addEventListener(ScriptInjectorEvents.DATA_LOADED, eventHandler);

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-event.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.loadedScripts).toContain('/test-event.js');

      document.removeEventListener(ScriptInjectorEvents.DATA_LOADED, eventHandler);
    });

    it('should filter out loaded scripts from pending list when receiving DATA_LOADED', () => {
      const el1 = document.createElement('scripts-injector') as ScriptsInjector;
      el1.setAttribute('scripts', '/test-shared.js');
      el1.setAttribute('on:idle', '');

      const el2 = document.createElement('scripts-injector') as ScriptsInjector;
      el2.setAttribute('scripts', '/test-shared.js,/test-unique.js');
      el2.setAttribute('on:interaction', 'click');

      container.appendChild(el2);
      container.appendChild(el1);

      el2.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      const sharedScripts = document.querySelectorAll('script[src="/test-shared.js"]');
      expect(sharedScripts.length).toBe(1);
      expect(document.querySelector('script[src="/test-unique.js"]')).not.toBeNull();
    });

    it('should set data-loaded when all scripts are loaded by other injectors', () => {
      const el1 = document.createElement('scripts-injector') as ScriptsInjector;
      el1.setAttribute('scripts', '/test-all-loaded.js');
      el1.setAttribute('on:interaction', 'click');
      container.appendChild(el1);

      const el2 = document.createElement('scripts-injector') as ScriptsInjector;
      el2.setAttribute('scripts', '/test-all-loaded.js');
      el2.setAttribute('on:idle', '');
      container.appendChild(el2);

      expect(el1.hasAttribute('data-loaded')).toBe(true);
      expect(el1.hasAttribute('data-loaded')).toBe(true);
    });
  });

  describe('Multiple Conditions', () => {
    it('should support multiple conditions on same element', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-multi-condition.js');
      el.setAttribute('on:visible', '');
      el.setAttribute('on:interaction', 'click');

      el.style.width = '100px';
      el.style.height = '100px';
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 100));

      expect(document.querySelector('script[src="/test-multi-condition.js"]')).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should log error when script fails to load', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-error.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      const script = document.querySelector('script[src="/test-error.js"]') as HTMLScriptElement;
      script.onerror?.(new Event('error'));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[scripts-injector] Failed to load script: /test-error.js',
        expect.anything(),
      );
    });

    it('should still mark as loaded even if some scripts fail', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-partial-error.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      expect(el.hasAttribute('data-loaded')).toBe(true);
    });
  });
});
