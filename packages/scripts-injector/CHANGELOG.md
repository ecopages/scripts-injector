# @ecopages/scripts-injector

## 0.1.5

### Patch Changes

- Refactor `@ecopages/scripts-injector/global` to be framework-agnostic by returning a handle from `initGlobalInjector()`:
    - `refresh()` to re-parse maps and re-bind trigger elements.
    - `cleanup()` to disconnect observers and disable further refresh processing.
- Remove built-in `eco:after-swap` coupling from the global injector.
- Improve global injector runtime correctness:
    - Keep per-element loaded script tracking for mixed rules.
    - Ensure `data-loaded` is set consistently when all rule scripts are satisfied.
    - Preserve listener teardown behavior to avoid interaction replay loops.
    - Emit `failedScripts` in `DATA_LOADED` detail and write `data-error` on failures.
- Expand and modernize the global injector test suite around idle/interaction/visible/mixed/binding/refresh lifecycles.

## 0.1.3

### Patch Changes

- [#3](https://github.com/ecopages/scripts-injector/pull/3) [`b37f8b0`](https://github.com/ecopages/scripts-injector/commit/b37f8b0b82c826e6370cb87b2d031ec2b4201e9f) Thanks [@andeeplus](https://github.com/andeeplus)! - feat(events-enhancements): enhance ScriptsInjector with event replay, race condition prevention, and error tracking

## 0.1.2

### Patch Changes

- [`e3cd579`](https://github.com/ecopages/scripts-injector/commit/e3cd57980931b15191927318e721640aec612b4e) - - Refactor to add TSDoc for all public methods
    - Improve cleanup in `disconnectedCallback`
    - Prevent duplicate script injections
    - Fix custom element re-registration issues for better HMR support

## 0.1.1

### Patch Changes

- [`b9ce9fa`](https://github.com/ecopages/scripts-injector/commit/b9ce9fabb534a2887dc2a91fbf151dbb8ab7bb1f) - Fixed exports in package.json

## 0.1.0

### Minor Changes

- [`68152e5`](https://github.com/ecopages/scripts-injector/commit/68152e54605d134a6b9f8fccb0bf5f9f273d77e4) - This update prepares the package for public release. It includes necessary configurations and optimizations to ensure the package is ready for distribution.
