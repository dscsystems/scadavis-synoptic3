---
name: scadavis-api
description: Guide for integrating, controlling, and programmatically managing the SCADAvis Web Component. Optimized for building advanced, real-time industrial dashboards and visualization interfaces. Use when user mentions SCADAvis, API, or web component.
---

# 🚀 SCADAvis-API: Development Guide

The `<scada-vis>` web component is a high-performance, industrial-grade visualization engine for SVG-based SCADA displays. It encapsulates the WebSAGE core engine and provides a rich API for data binding, viewport control, and UI customization.

---

## 📦 Integration Patterns

The SCADAvis web component is a standard Custom Element and can be integrated into any HTML page using several patterns.

### 1. Modern ESM Import (Recommended)

This is the standard approach for projects using a build tool (Vite, Webpack, etc.) or modern browsers.

```html
<!-- Register the component -->
<script type="module">
  import './node_modules/@dscsystems/scadavis-web-component/dist/scada-vis.js'
</script>

<!-- Use the tag -->
<scada-vis src="diagram.svg"></scada-vis>
```

### 2. Standard Script Tag

Useful for quick prototyping or traditional multi-page applications.

```html
<!-- Load the bundle -->
<script
  src="./node_modules/@dscsystems/scadavis-web-component/dist/scada-vis.js"
  type="module"
></script>

<!-- Use the tag anywhere in the body -->
<scada-vis id="viewer" src="diagram.svg"></scada-vis>

<script>
  // Access via standard DOM methods
  const viewer = document.getElementById('viewer')
  viewer.addEventListener('ready', () => {
    viewer.setValue('TAG_01', 100)
  })
</script>
```

### 3. CDN Usage (No Installation)

If you haven't installed the package locally, you can use the SCADAvis.io server.

```html
<script type="module" src="https://scadavis.io/synoptic3/scada-vis.js"></script>

<scada-vis src="https://example.com/diagram.svg"></scada-vis>
```

---

## 🏗️ Complete HTML Template Example

Here is a full, production-ready template showing how to handle styles, and data updates.

```html
<html>
  <body>
    <script
      src="https://scadavis.io/synoptic3/scada-vis.js"
      type="module"
    ></script>
    <scada-vis id="scada-vis1" style="height:250px;width:250px;"></scada-vis>
    <script>
      window.onload = async () => {
        // Get reference to component
        const component = document.querySelector('#scada-vis1')
        // load SVG from URL, wait until ready
        await component.loadURL(
          'https://raw.githubusercontent.com/dscsystems/displayfiles/master/donut.svg'
        )
        // update values in the display at each 1.5 seconds
        setInterval(() => {
          component.setValue('TAG1', Math.random() * 100)
          if (component.getValue('TAG1') >= 75)
            component.setValue('TAG2', 'alarmed!')
          else component.setValue('TAG2', 'normal')
        }, 1500)
      }
    </script>
  </body>
</html>
```

## Complex example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pen</title>
    <script
      src="https://scadavis.io/synoptic3/scada-vis.js"
      type="module"
    ></script>
  </head>
  <body>
    <script>
      window.onload = () => {
        scadavisInit({
          styleParams: 'height="390" width="680"',
          svgurl:
            'https://raw.githubusercontent.com/dscsystems/displayfiles/master/kor1-v2.svg',
        }).then((substationsynoptic) => {
          substationsynoptic.zoomTo(0.42)
          substationsynoptic.enableTools(true, true)
          substationsynoptic.storeValue(
            'KOR1TR1--YTAP',
            Math.round(8 + Math.random()),
            false,
            false
          )
          substationsynoptic.storeValue('XCBROPEN', false)
          substationsynoptic.storeValue('KOR1XSWI1', false)
          substationsynoptic.storeValue('KOR1XSWI2', true)
          substationsynoptic.storeValue('KOR1XSWI4', true)
          substationsynoptic.storeValue('KOR1XSWI6', true)
          substationsynoptic.storeValue('KOR1XSWI8', true)
          substationsynoptic.storeValue('KOR1XSWI10', false)
          substationsynoptic.storeValue('KOR1XSWI12', true)
          substationsynoptic.storeValue('KOR1XSWI14', true)
          substationsynoptic.storeValue('KOR1XSWI16', false)
          substationsynoptic.storeValue('KOR1XSWI18', true)
          substationsynoptic.storeValue('KOR1XSWI20', true)
          substationsynoptic.storeValue('KOR1XSWI22', false)
          substationsynoptic.storeValue('KOR1XSWI48', true)
          substationsynoptic.storeValue('KOR1XSWI50', true)
          substationsynoptic.storeValue('KOR1XSWI46', false)
          substationsynoptic.storeValue('KOR1XSWI24', true)
          substationsynoptic.storeValue('KOR1XSWI26', true)
          substationsynoptic.storeValue('KOR1XSWI28', false)
          substationsynoptic.storeValue('KOR1XSWI30', true)
          substationsynoptic.storeValue('KOR1XSWI32', true)
          substationsynoptic.storeValue('KOR1XSWI34', true)
          substationsynoptic.storeValue('KOR1XSWI36', true)
          substationsynoptic.storeValue('KOR1XSWI38', false)
          substationsynoptic.storeValue('KOR1XSWI40', true)
          substationsynoptic.storeValue('KOR1XSWI42', true)
          substationsynoptic.storeValue('KOR1XSWI44', false)
          substationsynoptic.storeValue('KOR1XCBR2', true)
          substationsynoptic.storeValue('KOR1XCBR3', true)
          substationsynoptic.storeValue('KOR1XCBR4', true)
          substationsynoptic.storeValue('KOR1XCBR8', true)
          substationsynoptic.storeValue('KOR1XCBR5', true)
          substationsynoptic.storeValue('KOR1XCBR2401', false)
          substationsynoptic.storeValue('KOR1XCBR6', true)
          substationsynoptic.storeValue('KOR1AL11TC', true, false, false)
          substationsynoptic.storeValue('KOR1AL11RREC', true, false, false)
          substationsynoptic.storeValue('KOR1AL11PSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL12TC', true, false, false)
          substationsynoptic.storeValue('KOR1AL12RREC', true, false, false)
          substationsynoptic.storeValue('KOR1AL12PSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL13TC', true, false, false)
          substationsynoptic.storeValue('KOR1AL13RREC', true, false, false)
          substationsynoptic.storeValue('KOR1AL13PSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL14RREC', true, false, false)
          substationsynoptic.storeValue('KOR1AL14PSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL15TC', true, false, false)
          substationsynoptic.storeValue('KOR1AL15PSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL16TC', true, false, false)
          substationsynoptic.storeValue('KOR1AL16PSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL17TC', true, false, false)
          substationsynoptic.storeValue('KOR1AL17RREC', true, false, false)
          substationsynoptic.storeValue('KOR1ALTFTC', true, false, false)
          substationsynoptic.storeValue('KOR1ALTFRREC', true, false, false)
          substationsynoptic.storeValue('KOR1ALTFPSTI', true, false, false)
          substationsynoptic.storeValue('KOR1AL11MW', 0, false, false)
          substationsynoptic.storeValue('KOR1AL12MW', 0, false, false)
          substationsynoptic.storeValue('KOR1AL13MW', 0, false, false)
          substationsynoptic.storeValue('KOR1AL14MW', 0, false, false)
          substationsynoptic.storeValue('KOR1AL15MW', 0, false, false)
          substationsynoptic.storeValue('KOR1AL16MW', 0, false, false)
          substationsynoptic.storeValue('KOR1AL17MW', 0, false, false)

          function updateSubstation() {
            var xcbr1 = Math.random() > 0.2 ? true : false
            substationsynoptic.storeValue(
              'KOR1TR1-2XCBR5201',
              xcbr1,
              false,
              !xcbr1
            )
            var kv230 = 220 + Math.random() * 20
            var kv23 =
              (kv230 / 10.3) *
              xcbr1 *
              Math.sqrt(substationsynoptic.getValue('KOR1TR1--YTAP') / 7)
            substationsynoptic.storeValue(
              'KOR1KV230',
              kv230,
              false,
              kv230 > 239 || kv230 < 221
            )
            substationsynoptic.storeValue(
              'KOR1KV23',
              kv23,
              false,
              kv23 > 23.9 || kv23 < 22.1
            )

            var xcbr7 = Math.random() > 0.15 ? true : false
            substationsynoptic.storeValue('KOR1XCBR7', xcbr7, false, !xcbr7)
            substationsynoptic.storeValue(
              'KOR1AL14TC',
              Math.random() > 0.15 ? true : false,
              false,
              false
            )
            substationsynoptic.storeValue(
              'KOR1AL15RREC',
              Math.random() > 0.15 ? true : false,
              false,
              false
            )
            substationsynoptic.storeValue(
              'KOR1AL16RREC',
              true,
              Math.random() > 0.15 ? true : false,
              false
            )
            substationsynoptic.storeValue(
              'KOR1AL17PSTI',
              true,
              false,
              Math.random() > 0.15 ? true : false
            )

            var MW = 0,
              tMW = 0
            var MVAR = 0,
              tMVAR = 0
            tMW += MW = (5 + Math.random() * 2) * xcbr1 * xcbr7
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1 * xcbr7
            substationsynoptic.storeValue('KOR1AL11MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL11MVAR', MVAR, false, false)
            tMW += MW = (3 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1AL12MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL12MVAR', MVAR, false, false)
            tMW += MW = (6 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1AL13MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL13MVAR', MVAR, false, false)
            tMW += MW = (4 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1AL14MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL14MVAR', MVAR, false, false)
            tMW += MW = (5 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1AL15MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL15MVAR', MVAR, false, false)
            tMW += MW = (3 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1AL16MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL16MVAR', MVAR, false, false)
            tMW += MW = (5 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1AL17MW', MW, false, false)
            substationsynoptic.storeValue('KOR1AL17MVAR', MVAR, false, false)
            tMW += MW = (4 + Math.random() * 2) * xcbr1
            tMVAR += MVAR = (0.5 - Math.random() * 1) * xcbr1
            substationsynoptic.storeValue('KOR1ALTFMW', 0, false, false)
            substationsynoptic.storeValue('KOR1ALTFMVAR', 0, false, false)

            substationsynoptic.storeValue('KOR1TR1MW', tMW, false, false)
            substationsynoptic.storeValue('KOR1TR1MVAR', tMVAR, false, false)

            substationsynoptic.updateValues()
          }
          updateSubstation()
          setInterval(updateSubstation, 7000)

          substationsynoptic.on('click', function (event, tag) {
            console.log(event, tag)

            var v = substationsynoptic.getValue(tag)

            if (event.currentTarget.id === 'TAPUP') {
              substationsynoptic.setValue(tag, v + 1, false, false)
              return
            } else if (event.currentTarget.id === 'TAPDOWN') {
              substationsynoptic.setValue(tag, v - 1, false, false)
              return
            }

            if (event.currentTarget.id === 'XCBROPEN') {
              substationsynoptic.setValue(tag, false, false, false)
              return
            } else if (event.currentTarget.id === 'XCBRCLOSE') {
              substationsynoptic.setValue(tag, true, false, false)
              return
            }

            if (v === true)
              substationsynoptic.setValue(tag, false, false, false)
            else if (v === false)
              substationsynoptic.setValue(tag, true, false, false)
          })
        })
      }
    </script>
  </body>
</html>
```

---

## 🏗️ Architecture & Lifecycle

The component uses **Shadow DOM** for style encapsulation. It operates in three distinct lifecycle states:

1.  **State 0 (Unloaded)**: The component is in the DOM but no SVG source is specified.
2.  **State 1 (Graphic Ready)**: SVG markup is loaded and the graphics engine is initialized.
3.  **State 2 (Data Ready)**: Animations are bound, and the component is ready for real-time value updates.

---

## 🛠️ Declarative API (Attributes)

| Attribute        | Type            | Description                                                                         |
| ---------------- | --------------- | ----------------------------------------------------------------------------------- |
| `src` / `svgurl` | `string`        | **Required.** URL of the SVG file. Changing this triggers an automatic reload.      |
| `colorstable`    | `string` (JSON) | Optional. Maps indices to CSS colors. Format: `'{"1": "#ff0000", "2": "#00ff00"}'`. |

---

## 💻 Imperative API Reference: Methods

### 🔵 Real-time Data Binding

Efficiently push values to SVG animations.

#### `setValue(tag, value, failed?, alarmed?, description?)`

Updates a single point and immediately triggers an SVG redraw.

- **`tag`**: `string | number` (Tag name or Point index).
- **`value`**: `number | boolean | string`.
- **`failed`**: `boolean` (default `false`). If `true`, applies "Failed" styling (usually gray/dashed).
- **`alarmed`**: `boolean` (default `false`). If `true`, triggers "Alarm" styling (usually blinking red).

#### `storeValue(tag, value, ...)`

Same signature as `setValue`, but only updates the internal state. Does **not** redraw the SVG. Use this for high-frequency updates.

#### `updateValues(values?)`

Flushes all buffered `storeValue` updates to the SVG in a single redraw.

- **`values`**: Optional object `{ "tag1": val1, ... }` to add during the flush.

#### `refreshDisplay(values)`

🟢 **Returns `Promise<boolean>`**. The modern, async version of `updateValues`. Resolves when the rendering cycle is finished.

#### `getValue(tag)`

Returns the current cached value for a tag. Returns `null` if the tag is not found.

#### `getTagsList()` / `getTags()`

Returns an array of strings containing every valid tag name discovered in the current SVG.

---

### 🔍 Viewport & Interactivity

Fine-grained control over the user experience.

#### `zoomTo(level, target?)`

Zooms to a specific multiplier.

- **`level`**: `1.0` is original size.
- **`target`**: Optional element ID or `{x, y}` object to center the zoom on.

#### `moveBy(dx, dy)`

Pans the viewport by the specified pixel deltas.

#### `zoomToOriginal()`

Resets the viewport to the initial "Fit to Width" state.

#### `enableTools(options)`

Shows or hides built-in toolbar buttons.

- **`options`**: `{ panEnabled: boolean, zoomEnabled: boolean }`.

#### `enableMouse(options)`

Enables or disables mouse interactions.

- **`options`**: `{ panEnabled: boolean, zoomEnabled: boolean }`.

#### `setMouseWheel(options)`

Configures the scroll-to-zoom behavior.

- **`options`**: `{ directionBackOut: boolean, blockEventPropagation: boolean }`.

---

### 🎨 UI & Theming

#### `setBackgroundColor(color)`

Updates the background of the component container.

#### `setColor(index, color)` / `setColors(table)`

Updates the dynamic color palette. Index `-1` targets the SVG background.

#### `setStatus(text)` / `setTime(text)`

Updates the text content of the integrated status and time bars.

#### `setToolbarVisible(show)` / `setWatermarkVisible(show)`

Explicitly toggles the visibility of built-in UI overlays.

---

## 🔔 Event System

All events are standard `CustomEvent` objects dispatched from the `<scada-vis>` element.

| Event     | `detail` Payload                     | Description                                             |
| --------- | ------------------------------------ | ------------------------------------------------------- |
| `ready`   | `{ tagsList: string[] }`             | Fired when the component reaches State 2.               |
| `error`   | `{ error: string }`                  | Fired when a file fails to load or script errors occur. |
| `click`   | `{ tag: string, event: MouseEvent }` | Fired when a tagged SVG element is clicked.             |
| `zoomPan` | `{ action: number }`                 | Fired on any viewport transformation.                   |

---

## 🏛️ Legacy & Factory API

### `scadavisInit`

The recommended way to inject the component programmatically.

```javascript
import { scadavisInit } from '@dscsystems/scadavis-web-component'

scadavisInit({
  container: document.body,
  svgurl: 'panel.svg',
  styleParams: 'width="100%" height="500px"',
}).then((viewer) => {
  viewer.setValue('TEMP', 24.5)
})
```

---

## 💡 Comprehensive Usage Examples

### 1. Real-time Simulation Loop

```javascript
const viewer = document.querySelector('scada-vis')

viewer.addEventListener('ready', () => {
  setInterval(() => {
    // Collect updates without redrawing for each
    viewer.storeValue('TAG_VOLTAGE', 220 + Math.random() * 5)
    viewer.storeValue('TAG_CURRENT', 10 + Math.random())

    // Flush all updates in a single animation frame
    viewer.updateValues()
  }, 1000)
})
```

### 2. Custom Command Palette

```javascript
function focusSubstation(subId) {
  const viewer = document.getElementById('main-viewer')
  // Zoom to 2.5x and center on the specific equipment group
  viewer.zoomTo(2.5, subId)
  viewer.setStatus(`Focusing on Service Area: ${subId}`)
}
```

### 3. Advanced Click Handling

```javascript
viewer.on('click', (event, tagName) => {
  if (tagName.startsWith('BREAKER_')) {
    const currentState = viewer.getValue(tagName)
    const newState = !currentState

    // Toggle state and mark as "alarmed" while transitioning
    viewer.setValue(tagName, newState, false, true)
    console.log(`Command sent: Toggle ${tagName} to ${newState}`)
  }
})
```

### 4. Dynamic Theme Switching

```javascript
function applyNightMode() {
  const viewer = document.querySelector('scada-vis')
  viewer.setBackgroundColor('#121212')
  viewer.setColors({
    1: '#BB86FC', // Primary
    2: '#03DAC6', // Secondary
    '-1': '#1E1E1E', // SVG internal background
  })
}
```
