# Scripts Injector

The Scripts Injector is a custom element designed to dynamically load scripts into your web page. It provides a way to load scripts based on certain conditions and events.

## Usage

To use the Scripts Injector, you need to include it in your HTML:

```tsx
<scripts-injector></scripts-injector>
```

## Props

The ScriptInjectorProps type defines the properties that can be used to control the behavior of the script-injector custom element. Here are the available properties:

`"on:idle"`: This optional boolean property determines whether the script should be loaded once the DOM is ready. For example, `<script-injector on:idle></script-injector>` will load the script as soon as the DOM is ready.

`"on:interaction"`: This optional property allows you to specify a series of events that will trigger the loading of the script. It can be either "touchstart,click" or "mouseenter,focusin". For example, `<script-injector on:interaction="mouseenter, focusin"></script-injector>` will load the script when the user either mouses over the element or focuses on it.

`"on:visible"`: This optional property can be either a string or a boolean. If it's a string, it should specify the root margin for an Intersection Observer that will load the script when the element comes into view. If it's a boolean and it's true, the script will be loaded when the element comes into view with a default root margin. For example, `<script-injector on:visible="50px 1px"></script-injector>` will load the script when the element comes into view, with a root margin of 50px 1px.

`scripts`: This property should be a comma-separated string of scripts to be loaded. For example, `<script-injector scripts="script1.js,script2.js"></script-injector>` will load script1.js and script2.js.

## Latest Features

### Full Event Replay with Property Preservation

For all interaction events, the Scripts Injector intercepts the initial event, prevents the default action, loads the required script, and then **replays the event** with all original properties preserved. This ensures that user actions are never lost, even if they happen before the script is fully loaded.

-   **Click events**: Use native `.click()` for best compatibility with links and forms
-   **Mouse events**: Preserve `clientX`, `clientY`, `screenX`, `screenY`, `button`, `buttons`, and modifier keys
-   **Keyboard events**: Preserve `key`, `code`, `location`, `repeat`, and modifier keys
-   **Focus events**: Preserve `relatedTarget`
-   **Touch events**: Preserve `touches`, `targetTouches`, `changedTouches`, and modifier keys

### Race Condition Prevention

Multiple script injectors requesting the same script will coordinate to prevent duplicate loading. A static registry tracks scripts currently being loaded, ensuring only one network request is made even when multiple injectors trigger simultaneously.

### Load Reason Tracking

After loading, the element receives a `data-load-reason` attribute indicating what triggered the load:

-   `idle` - Loaded via `on:idle`
-   `visible` - Loaded via `on:visible`
-   `interaction:click`, `interaction:mouseenter`, etc. - Loaded via the specific interaction event

### Error Tracking

If any scripts fail to load, the element receives a `data-error` attribute containing the comma-separated list of failed script URLs. The `DATA_LOADED` event also includes a `failedScripts` array in its detail.

```tsx
// Listen for load completion with error info
document.addEventListener('data-loaded', (event) => {
	const { loadedScripts, failedScripts } = event.detail;
	if (failedScripts.length > 0) {
		console.warn('Some scripts failed to load:', failedScripts);
	}
});
```

## Typical usage

This passage provides a standard use case for the custom element. The script is designed to load when the user interacts with it, either through mouse entry or a focus event. If multiple script injectors are present with the same script, only the first one will execute the load. This is because once a script is loaded, all script injectors are notified and subsequently remove the script from their loading responsibilities.

```tsx
<script-injector on:interaction="mouseenter,focusin" scripts={['path/to/my/element']}>
	<lit-counter class="lit-counter" count={8}></lit-counter>
</script-injector>
```

## Supported Events

The `on:interaction` prop supports a wide range of DOM events, as defined in `InteractionEvent`.

-   **Mouse:** `click`, `dblclick`, `mousedown`, `mouseup`, `mouseenter`, `mouseleave`, `mousemove`, `mouseover`, `mouseout`
-   **Touch:** `touchstart`, `touchend`, `touchmove`, `touchcancel`
-   **Focus:** `focus`, `blur`, `focusin`, `focusout`
-   **Keyboard:** `keydown`, `keypress`, `keyup`
-   **Form:** `input`, `change`, `submit`
-   **UI:** `scroll`, `resize`

## Data Attributes

After script loading completes, the following attributes are set on the element:

| Attribute          | Description                                                                        |
| ------------------ | ---------------------------------------------------------------------------------- |
| `data-loaded`      | Present when all scripts have been loaded (or attempted)                           |
| `data-load-reason` | The trigger that caused scripts to load (`idle`, `visible`, `interaction:<event>`) |
| `data-error`       | Comma-separated list of script URLs that failed to load (only if errors occurred)  |

## Inspiration

This is undeniably heavily influenced by [11ty/is-land](https://github.com/11ty/is-land), [Astro island](https://docs.astro.build/en/concepts/islands/) and the "component island" concept, originally introduced by Etsy's frontend architect, Katie Sylor-Miller.
