# Scripts Injector

The Scripts Injector is a custom element designed to dynamically load scripts into your web page. It provides a way to load scripts based on certain conditions and events, significantly improving page load performance by deferring non-critical resources.

## Packages

- [@ecopages/scripts-injector](./packages/scripts-injector/README.md)

## Getting Started

To use the Scripts Injector, include the custom element in your project:

```tsx
<scripts-injector></scripts-injector>
```

### Installation

```bash
npm install @ecopages/scripts-injector
```

## Usage Examples

## Web Component (`<scripts-injector>`) Examples

### 1. Load on Idle

Load non-critical scripts (e.g., analytics) when the browser is idle.

```tsx
<scripts-injector scripts="analytics.js" on:idle>
  <!-- Content -->
</scripts-injector>
```

### 2. Load on Interaction

Load heavy interactive scripts only when the user interacts (e.g., click, hover).

```tsx
<scripts-injector scripts="heavy-chart.js" on:interaction="mouseenter,focusin">
	<button>Show Chart</button>
</scripts-injector>
```

### 3. Load on Visible

Load scripts when an element enters the viewport.

```tsx
<scripts-injector scripts="lazy-image.js" on:visible="50px">
	<img src="..." />
</scripts-injector>
```

### 4. Multi-Trigger Configuration

To prevent deeply nested injectors when combining multiple triggers, you can provide an internal `<script>` tag mapping.

```html
<scripts-injector>
	<script type="ecopages/injector-map">
		{
			"on:idle": { "scripts": ["/_assets/tracker.js"] },
			"on:interaction": {
				"value": "click",
				"scripts": ["/_assets/heavy-ui.js"]
			}
		}
	</script>
	<div class="my-component">...</div>
</scripts-injector>
```

## Global Injector Examples (No Web Component)

Use a global JSON map plus `data-eco-trigger` attributes when you want lazy loading without wrapping markup in a custom element.

### 1. Add a global map

```html
<script type="ecopages/global-injector-map">
{
	"analytics-trigger": {
		"on:idle": {
			"scripts": ["/_assets/tracker.js"]
		}
	},
	"hero-trigger": {
		"on:interaction": {
			"value": "mouseenter,focusin",
			"scripts": ["/_assets/hero-effects.js"]
		},
		"on:visible": {
			"value": "100px",
			"scripts": ["/_assets/hero-visual.js"]
		}
	}
}
</script>
```

### 2. Bind standard elements

```html
<div data-eco-trigger="analytics-trigger"></div>

<section data-eco-trigger="hero-trigger">
	<h2>Interactive Hero</h2>
</section>
```

### 3. Initialize the global injector

```ts
import { initGlobalInjector } from '@ecopages/scripts-injector/global';

initGlobalInjector();
```

For detailed documentation, visit the [Web Component docs](./apps/www/src/pages/docs.mdx) and [Global Injector docs](./apps/www/src/pages/global.mdx), or run the demo app.
