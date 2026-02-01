# Scripts Injector

The Scripts Injector is a custom element designed to dynamically load scripts into your web page. It provides a way to load scripts based on certain conditions and events, significantly improving page load performance by deferring non-critical resources.

## Packages

-   [@ecopages/scripts-injector](./packages/scripts-injector/README.md)

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

For detailed documentation, visit the [Documentation Page](./apps/www/src/pages/docs.mdx) or run the demo app.
