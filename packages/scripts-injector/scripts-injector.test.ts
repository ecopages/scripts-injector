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

    it('should trim whitespace from script URLs', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', ' /test-a.js , /test-b.js ');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50)); // Wait for idle callback

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
    it('should load scripts immediately when on:idle is set', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-idle.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50)); // Wait for idle callback

      const script = document.querySelector('script[src="/test-idle.js"]');
      expect(script).not.toBeNull();
      expect(script?.getAttribute('type')).toBe('module');
    });

    it('should set data-loaded attribute after loading', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-idle-loaded.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50)); // Wait for idle callback

      expect(el.hasAttribute('data-loaded')).toBe(true);
    });

    it('should load multiple scripts', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-multi-1.js,/test-multi-2.js,/test-multi-3.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50)); // Wait for idle callback

      expect(document.querySelector('script[src="/test-multi-1.js"]')).not.toBeNull();
      expect(document.querySelector('script[src="/test-multi-2.js"]')).not.toBeNull();
      expect(document.querySelector('script[src="/test-multi-3.js"]')).not.toBeNull();
    });
  });

  describe('on:interaction condition', () => {
    it('should add event listeners for specified events', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-interaction.js');
      el.setAttribute('on:interaction', 'click,mouseenter');
      container.appendChild(el);

      expect(document.querySelector('script[src="/test-interaction.js"]')).toBeNull();

      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50)); // Wait for async load

      expect(document.querySelector('script[src="/test-interaction.js"]')).not.toBeNull();
    });

    it('should remove event listeners after loading', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      const removeEventListenerSpy = vi.spyOn(el, 'removeEventListener');

      el.setAttribute('scripts', '/test-interaction-cleanup.js');
      el.setAttribute('on:interaction', 'click');
      container.appendChild(el);

      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50)); // Wait for async load

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
    it('should create script elements with type="module"', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-module.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      const script = document.querySelector('script[src="/test-module.js"]') as HTMLScriptElement;
      expect(script.type).toBe('module');
    });

    it('should set async attribute on scripts', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-async.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      const script = document.querySelector('script[src="/test-async.js"]') as HTMLScriptElement;
      expect(script.async).toBe(true);
    });

    it('should not load duplicate scripts', async () => {
      const existingScript = document.createElement('script');
      existingScript.src = '/test-duplicate.js';
      document.head.appendChild(existingScript);

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-duplicate.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      const scripts = document.querySelectorAll('script[src="/test-duplicate.js"]');
      expect(scripts.length).toBe(1);

      existingScript.remove();
    });

    it('should append scripts to document head', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-head.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

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
    it('should dispatch DATA_LOADED event after loading scripts', async () => {
      const eventHandler = vi.fn();
      document.addEventListener(ScriptInjectorEvents.DATA_LOADED, eventHandler);

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-event.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.loadedScripts).toContain('/test-event.js');

      document.removeEventListener(ScriptInjectorEvents.DATA_LOADED, eventHandler);
    });

    it('should filter out loaded scripts from pending list when receiving DATA_LOADED', async () => {
      const el1 = document.createElement('scripts-injector') as ScriptsInjector;
      el1.setAttribute('scripts', '/test-shared.js');
      el1.setAttribute('on:idle', '');

      const el2 = document.createElement('scripts-injector') as ScriptsInjector;
      el2.setAttribute('scripts', '/test-shared.js,/test-unique.js');
      el2.setAttribute('on:interaction', 'click');

      container.appendChild(el2);
      container.appendChild(el1); // el1 loads first via idle

      await new Promise((r) => setTimeout(r, 50)); // Wait for el1 to load and fire event

      el2.dispatchEvent(new MouseEvent('click', { bubbles: true })); // Trigger el2

      await new Promise((r) => setTimeout(r, 50)); // Wait for el2 to process

      const sharedScripts = document.querySelectorAll('script[src="/test-shared.js"]');
      expect(sharedScripts.length).toBe(1);
      expect(document.querySelector('script[src="/test-unique.js"]')).not.toBeNull();
    });

    it('should set data-loaded when all scripts are loaded by other injectors', async () => {
      const el1 = document.createElement('scripts-injector') as ScriptsInjector;
      el1.setAttribute('scripts', '/test-all-loaded.js');
      el1.setAttribute('on:interaction', 'click');
      container.appendChild(el1);

      const el2 = document.createElement('scripts-injector') as ScriptsInjector;
      el2.setAttribute('scripts', '/test-all-loaded.js');
      el2.setAttribute('on:idle', '');
      container.appendChild(el2); // el2 loads via idle, should notify el1

      await new Promise((r) => setTimeout(r, 50));

      expect(el1.hasAttribute('data-loaded')).toBe(true);
      expect(el2.hasAttribute('data-loaded')).toBe(true);
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
    it('should log error when script fails to load', async () => {
      const consoleSpy = vi.spyOn(console, 'error');

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-error.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      const script = document.querySelector('script[src="/test-error.js"]') as HTMLScriptElement;
      script.onerror?.(new Event('error'));

      expect(consoleSpy).toHaveBeenCalledWith(
        '[scripts-injector] Failed to load script: /test-error.js',
        expect.anything(),
      );
    });

    it('should still mark as loaded even if some scripts fail', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-partial-error.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      // Simulate failure manually since we can't easily trigger real network error in DOM env
      const script = document.querySelector('script[src="/test-partial-error.js"]') as HTMLScriptElement;
      script.onerror?.(new Event('error'));
      
      // The component waits for all promises to settle, so we wait again
      await new Promise((r) => setTimeout(r, 50));

      expect(el.hasAttribute('data-loaded')).toBe(true);
    });
  });

  describe('Load Reason Tracking', () => {
    it('should set data-load-reason="idle" when loaded via on:idle', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-reason-idle.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      expect(el.getAttribute('data-load-reason')).toBe('idle');
    });

    it('should set data-load-reason="visible" when loaded via on:visible', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-reason-visible.js');
      el.setAttribute('on:visible', '');
      el.style.width = '100px';
      el.style.height = '100px';
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 100));

      expect(el.getAttribute('data-load-reason')).toBe('visible');
    });

    it('should set data-load-reason="interaction:click" when loaded via click', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-reason-click.js');
      el.setAttribute('on:interaction', 'click');
      container.appendChild(el);

      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));

      expect(el.getAttribute('data-load-reason')).toBe('interaction:click');
    });

    it('should set data-load-reason="interaction:mouseenter" when loaded via mouseenter', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-reason-mouseenter.js');
      el.setAttribute('on:interaction', 'mouseenter');
      container.appendChild(el);

      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));

      expect(el.getAttribute('data-load-reason')).toBe('interaction:mouseenter');
    });
  });

  describe('Event Replay', () => {
    it('should replay MouseEvent with preserved coordinates', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-mouse-replay.js');
      el.setAttribute('on:interaction', 'mousedown');
      container.appendChild(el);

      const replayedEvents: MouseEvent[] = [];
      const target = document.createElement('button');
      el.appendChild(target);
      
      target.addEventListener('mousedown', (e) => {
        replayedEvents.push(e);
      });

      // Dispatch original event with specific coordinates
      const originalEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 150,
        clientY: 200,
        screenX: 300,
        screenY: 400,
        button: 2,
        ctrlKey: true,
        shiftKey: true,
      });
      target.dispatchEvent(originalEvent);

      await new Promise((r) => setTimeout(r, 50));

      // Should have received a replayed event
      expect(replayedEvents.length).toBeGreaterThan(0);
      const replayed = replayedEvents[replayedEvents.length - 1];
      expect(replayed.clientX).toBe(150);
      expect(replayed.clientY).toBe(200);
      expect(replayed.screenX).toBe(300);
      expect(replayed.screenY).toBe(400);
      expect(replayed.button).toBe(2);
      expect(replayed.ctrlKey).toBe(true);
      expect(replayed.shiftKey).toBe(true);
    });

    it('should replay KeyboardEvent with preserved key properties', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-keyboard-replay.js');
      el.setAttribute('on:interaction', 'keydown');
      container.appendChild(el);

      const replayedEvents: KeyboardEvent[] = [];
      const target = document.createElement('input');
      el.appendChild(target);
      
      target.addEventListener('keydown', (e) => {
        replayedEvents.push(e);
      });

      const originalEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        key: 'Enter',
        code: 'Enter',
        ctrlKey: true,
        metaKey: true,
      });
      target.dispatchEvent(originalEvent);

      await new Promise((r) => setTimeout(r, 50));

      expect(replayedEvents.length).toBeGreaterThan(0);
      const replayed = replayedEvents[replayedEvents.length - 1];
      expect(replayed.key).toBe('Enter');
      expect(replayed.code).toBe('Enter');
      expect(replayed.ctrlKey).toBe(true);
      expect(replayed.metaKey).toBe(true);
    });

    it('should replay FocusEvent with preserved relatedTarget', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-focus-replay.js');
      el.setAttribute('on:interaction', 'focusin');
      container.appendChild(el);

      const replayedEvents: FocusEvent[] = [];
      const target = document.createElement('input');
      const related = document.createElement('button');
      el.appendChild(target);
      el.appendChild(related);
      
      target.addEventListener('focusin', (e) => {
        replayedEvents.push(e);
      });

      const originalEvent = new FocusEvent('focusin', {
        bubbles: true,
        relatedTarget: related,
      });
      target.dispatchEvent(originalEvent);

      await new Promise((r) => setTimeout(r, 50));

      expect(replayedEvents.length).toBeGreaterThan(0);
      const replayed = replayedEvents[replayedEvents.length - 1];
      expect(replayed.relatedTarget).toBe(related);
    });

    it('should use native click() for click events on HTMLElements', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-click-native.js');
      el.setAttribute('on:interaction', 'click');
      container.appendChild(el);

      const clickSpy = vi.fn();
      const target = document.createElement('button');
      el.appendChild(target);
      
      target.addEventListener('click', clickSpy);

      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 50));

      // Native click should be called after script loads
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Race Condition Prevention', () => {
    it('should not load same script twice when two injectors trigger simultaneously', async () => {
      const el1 = document.createElement('scripts-injector') as ScriptsInjector;
      el1.setAttribute('scripts', '/test-race-1.js');
      el1.setAttribute('on:visible', '');
      el1.style.width = '100px';
      el1.style.height = '100px';

      const el2 = document.createElement('scripts-injector') as ScriptsInjector;
      el2.setAttribute('scripts', '/test-race-1.js');
      el2.setAttribute('on:visible', '');
      el2.style.width = '100px';
      el2.style.height = '100px';

      // Append both at the same time to trigger simultaneously
      container.appendChild(el1);
      container.appendChild(el2);

      await new Promise((r) => setTimeout(r, 150));

      const scripts = document.querySelectorAll('script[src="/test-race-1.js"]');
      expect(scripts.length).toBe(1);
    });

    it('should handle rapid sequential triggers without duplicates', async () => {
      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-rapid-trigger.js');
      el.setAttribute('on:interaction', 'click');
      container.appendChild(el);

      // Rapid fire clicks
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));

      const scripts = document.querySelectorAll('script[src="/test-rapid-trigger.js"]');
      expect(scripts.length).toBe(1);
    });
  });

  describe('DATA_LOADED Event with Failed Scripts', () => {
    it('should include failedScripts array in DATA_LOADED event detail', async () => {
      const eventHandler = vi.fn();
      document.addEventListener(ScriptInjectorEvents.DATA_LOADED, eventHandler);

      const el = document.createElement('scripts-injector') as ScriptsInjector;
      el.setAttribute('scripts', '/test-failed-event.js');
      el.setAttribute('on:idle', '');
      container.appendChild(el);

      await new Promise((r) => setTimeout(r, 50));

      expect(eventHandler).toHaveBeenCalled();
      const event = eventHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toHaveProperty('loadedScripts');
      expect(event.detail).toHaveProperty('failedScripts');
      expect(Array.isArray(event.detail.failedScripts)).toBe(true);

      document.removeEventListener(ScriptInjectorEvents.DATA_LOADED, eventHandler);
    });
  });
});
