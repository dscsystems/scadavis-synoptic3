# SCADAvis Web Component

A modern Web Component implementation of the SCADAvis visualization library for creating interactive SCADA diagrams and synoptic displays.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/version-3.0.0-green.svg)](https://github.com/scadavis/scadavis-webcomponent)

## Features

- 🎯 **Native Web Component** - Uses Shadow DOM for style encapsulation
- 📊 **SVG-based Visualization** - Render interactive SCADA diagrams
- 🔄 **Real-time Updates** - Dynamic data binding with live updates
- 🎨 **Customizable Colors** - Dynamic color table for state visualization
- 🔍 **Zoom & Pan** - Built-in navigation controls
- 📈 **Vega Charts** - Integrated chart rendering support
- 🔌 **Framework Agnostic** - Works with any framework or vanilla JS

## Installation

Clone the repository on self-hosted server:

```bash
git clone https://github.com/dscsystems/scadavis-synoptic3.git
```

Install dependencies and build:

```bash
npm install
npm run build
```

### Import from SCADAvis.io

```html
<script type="module" src="https://scadavis.io/synoptic3/scada-vis.js"></script>
```

### Import from self-hosted server

```html
<script type="module" src="./dist/scada-vis.js"></script>
```

### Basic Usage

Add the component to your HTML:

```html
<html>
  <head>
    <script
      type="module"
      src="https://scadavis.io/synoptic3/scada-vis.js"
    ></script>
  </head>
  <body>
    <!-- Use the SCADAvis.io custom element -->
    <scada-vis id="scada-vis1" style="height:250px;width:250px;"></scada-vis>
    <script>
      window.onload = async () => {
        // Get reference to component (id="scada-vis1")
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

### Advanced Usage

Control the component via JavaScript:

```html
<html>
  <head>
    <script
      src="https://scadavis.io/synoptic3/scada-vis.js"
      type="module"
    ></script>
  </head>
  <body>
    <script>
      window.onload = () => {
        // create a new scada-vis instance
        scadavisInit({
          svgurl:
            'https://raw.githubusercontent.com/dscsystems/displayfiles/master/speedometer.svg',
        }).then((sv) => {
          sv.enableMouse(true, true)
          sv.storeValue('TAG1', 0)
          // update at each .25 seconds
          setInterval(function () {
            let v =
              Math.random() * 10 -
              (2.5 * sv.getValue('TAG1')) / 60 +
              sv.getValue('TAG1')
            if (v < 0) v = 0
            if (v > 120) v = 120
            sv.storeValue('TAG1', v)
            sv.updateValues()
          }, 250)
        })
      }
    </script>
  </body>
</html>
```

## API/Custom Element Reference

### Properties (Attributes of the custom element `<scada-vis>`)

| Property      | Type   | Description                   |
| ------------- | ------ | ----------------------------- |
| `src`         | String | URL of the SVG file to load   |
| `svgurl`      | String | Alias for `src`               |
| `colorstable` | String | JSON string of color mappings |

### Methods

#### Initialization

| Function                | Parameters        | Description              | Returns             |
| ----------------------- | ----------------- | ------------------------ | ------------------- |
| `scadavisInit(options)` | `options: Object` | Initialize the component | `Promise<ScadaVis>` |

Options:

| Option         | Type   | Description                             |
| -------------- | ------ | --------------------------------------- |
| `container`    | String | Optional. DIV container element ID      |
| `svgurl`       | String | Optional. URL of the SVG file to load   |
| `styleParams`  | String | Optional. Style parameters              |
| `iframeparams` | String | Optional. Alias for `styleParams`       |
| `colorsTable`  | String | Optional. JSON string of color mappings |

#### SVG Loading

| Method               | Parameters           | Description               | Returns         |
| -------------------- | -------------------- | ------------------------- | --------------- |
| `loadSVG(url)`       | `url: string`        | Load an SVG file from URL | `Promise<void>` |
| `setSVG(svgContent)` | `svgContent: string` | Set SVG content directly  | `Promise<void>` |

#### Data Methods

| Method                                                    | Parameters                                                                                       | Description                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `setValue(tag, value, failed?, alarmed?, description?)`   | `tag: string, value: number\|boolean, failed?: boolean, alarmed?: boolean, description?: string` | Set a single tag value and update display                                       |
| `setValues(values, qualifs?)`                             | `values: Object, qualifs?: objects`                                                              | Set multiple { tag: value } and optional { tag: quality } and update display    |
| `storeValue(tag, value, failed?, alarmed?, description?)` | `tag: string, value: number\|boolean, failed?: boolean, alarmed?: boolean, description?: string` | Set a single tag value without updating display                                 |
| `updateValues(values)`                                    | Optional `values: Object` { tag: value } pairs to include                                        | Update display with values. If no values are provided, update all stored values |
| `getValue(tag)`                                           | `tag: string`                                                                                    | Get current value for a tag                                                     |
| `getTagsList()`                                           | -                                                                                                | Get array of all tag names                                                      |
| `getTags()`                                               | -                                                                                                | Alias for `getTagsList()`                                                       |
| `resetData()`                                             | -                                                                                                | Clear all tag data                                                              |

#### View Methods

| Method                   | Parameters                               | Description               |
| ------------------------ | ---------------------------------------- | ------------------------- |
| `zoomTo(level, target?)` | `level: number, target?: string\|Object` | Zoom to specific level    |
| `moveBy(dx, dy)`         | `dx: number, dy: number`                 | Pan the view              |
| `zoomToOriginal()`       | -                                        | Reset to original viewBox |

#### Configuration Methods

| Method                                                   | Parameters                                                  | Description                       |
| -------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------- |
| `enableTools(panEnabled, zoomEnabled)`                   | `panEnabled: boolean, zoomEnabled: boolean`                 | Enable/disable toolbar buttons    |
| `setToolbarVisible(show)`                                | `show: boolean`                                             | Show/hide toolbar                 |
| `enableMouse(panEnabled, zoomEnabled)`                   | `panEnabled: boolean, zoomEnabled: boolean`                 | Enable/disable mouse interactions |
| `setMouseWheel(directionBackOut, blockEventPropagation)` | `directionBackOut: boolean, blockEventPropagation: boolean` | Configure mouse wheel behavior    |
| `enableKeyboard(enabled)`                                | `enabled: boolean`                                          | Enable/disable keyboard shortcuts |
| `enableAlarmFlash(enabled)`                              | `enabled: boolean`                                          | Enable/disable alarm blinking     |
| `hideWatermark()`                                        | -                                                           | Hide the SCADAvis watermark       |
| `setWatermarkVisible(show)`                              | `show: boolean`                                             | Show/hide watermark               |

#### Color Methods

| Method                             | Parameters                               | Description         |
| ---------------------------------- | ---------------------------------------- | ------------------- |
| `setColor(colorNumber, colorCode)` | `colorNumber: number, colorCode: string` | Set a single color  |
| `setColors(colorsTable)`           | `colorsTable: Object`                    | Set multiple colors |

#### Display Methods

| Method                      | Parameters       | Description            |
| --------------------------- | ---------------- | ---------------------- |
| `setBackgroundColor(color)` | `color: string`  | Set background color   |
| `setStatus(status)`         | `status: string` | Update status display  |
| `setTime(time)`             | `time: string`   | Update time display    |
| `showLoader()`              | -                | Show loading animation |
| `hideLoader()`              | -                | Hide loading animation |

#### Utility Methods

| Method                  | Parameters | Description                       | Return Value                                                                                       |
| ----------------------- | ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `getVersion()`          | -          | Get component version string      | string                                                                                             |
| `getComponentVersion()` | -          | Get component version string      | string                                                                                             |
| `isReady()`             | -          | Check if component is initialized | boolean                                                                                            |
| `getComponentState()`   | -          | Get component state               | Number 0=not loaded, 1=loaded and ready for graphics, 2=SVG graphics processed and ready for data. |

### Events

The component emits CustomEvents for various actions:

| Event         | Description            | Detail                                          |
| ------------- | ---------------------- | ----------------------------------------------- |
| `loaded`      | Component initialized  | `{ version: string }`                           |
| `ready`       | SVG loaded and parsed  | `{ tagsList: string[] }`                        |
| `click`       | Element clicked in SVG | `{ element: string, x: number, y: number }`     |
| `zoomPan`     | Zoom/pan action        | `{ action: number }`                            |
| `error`       | Error occurred         | `{ error: string }`                             |

#### Event Example

```javascript
const component = document.querySelector('scada-vis')

// Listen for ready event
component.addEventListener('ready', (e) => {
  console.log('Component ready with tags:', e.detail.tagsList)
})

// Listen for errors
component.addEventListener('error', (e) => {
  console.error('Error:', e.detail.error)
})
```

## Multiple Instances

The component supports multiple independent instances on the same page:

```html
<scada-vis id="instanceA" src="diagram1.svg"></scada-vis>
<scada-vis id="instanceB" src="diagram2.svg"></scada-vis>

<script type="module">
  import 'https://scadavis.io/synoptic3/scada-vis.js'

  const instanceA = document.getElementById('instanceA')
  const instanceB = document.getElementById('instanceB')

  // Each instance has independent state
  instanceA.setValue('TAG001', 100)
  instanceB.setValue('TAG001', 200) // Different value for same tag name
</script>
```

## Browser Compatibility

| Browser | Version | Support          |
| ------- | ------- | ---------------- |
| Chrome  | 67+     | ✅ Full          |
| Firefox | 63+     | ✅ Full          |
| Safari  | 10.1+   | ✅ Full          |
| Edge    | 79+     | ✅ Full          |
| IE      | -       | ❌ Not supported |

### Required Features

- Custom Elements v1
- Shadow DOM v1
- ES6 Modules
- Fetch API

## Development Guides (AI Skills)

This repository includes specialized guides (AI Skills) to assist developers and AI coding assistants in utilizing the component effectively:

-   **[SCADAvis API Guide](skills/scadavis-api/SKILL.md)**: Comprehensive reference for all methods, attributes, and event patterns.
-   **[SCADAvis SVG Design Guide](skills/scadavis-svg/SKILL.md)**: Best practices and rules for creating SVGs optimized for the SCADAvis engine.

## License

SCADAvis.io Synoptic API © 2018-2026 Ricardo L. Olsen / DSC Systems

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.

See [LICENSE](LICENSE) for details.

## Links

- [SCADAvis.io](https://scadavis.io)
- [Documentation](https://scadavis.io/docs)
- [GitHub](https://github.com/dscsystems/scadavis-synoptic3)
- [NPM](https://www.npmjs.com/package/scadavis-synoptic3)
