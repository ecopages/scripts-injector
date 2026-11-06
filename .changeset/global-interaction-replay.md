---
'@ecopages/scripts-injector': patch
---

Global `on:interaction` no longer swallows the first activation of a second trigger that shares an id with an already loaded one. Events pass through untouched when the scripts are loaded, are held while a script is still loading, and are replayed after load (clicks via `.click()`, other events cloned, including keyboard events and targets that are the trigger element itself).
