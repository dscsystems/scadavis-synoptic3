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
- 📱 **Responsive** - Adapts to container size

## Installation

### NPM

```bash
npm install scadavis-synoptic3
```

### CDN

```html
<script type="module">
  import 'https://unpkg.com/scadavis-synoptic3/index.js';
</script>
```

### Local

Copy the `scadavis-synoptic3` folder to your project and import:

```html
<script type="module" src="./scadavis-synoptic3/scada-vis.js"></script>
```

### Usage

Add the component to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="https://scadavis.io/synoptic3/scada-vis.js"></script>
</head>
<body>
  <!-- Basic usage -->
  <scada-vis id="scada-vis1"></scada-vis>
  
</body>

</html>
```

### Programmatic Usage

Control the component via JavaScript:

```javascript
// Get reference to component
const component = document.querySelector('#scada-vis1');

// Load an SVG file
await component.loadSVG('diagram.svg');

// Set a single value
component.setValue('TAG001', 123.45);

// Set multiple values
component.setValues({
  'TAG001': 100,
  'TAG002': 200,
  'TAG003': true
});

// Set value with quality flags
component.setValue('TAG001', 123.45, false, false, 'Temperature Sensor');

// Get current value
const value = component.getValue('TAG001');

// Get all tags found in SVG
const tags = component.getTagsList();
```

## API Reference

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `src` | String | URL of the SVG file to load |
| `svgurl` | String | Alias for `src` |
| `colorstable` | String | JSON string of color mappings |

### Methods

#### SVG Loading

| Method | Parameters | Description |
|--------|------------|-------------|
| `loadSVG(url)` | `url: string` | Load an SVG file from URL |
| `setSVG(svgContent)` | `svgContent: string` | Set SVG content directly |

#### Data Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setValue(tag, value, failed?, alarmed?, description?)` | `tag: string, value: number\|boolean, failed?: boolean, alarmed?: boolean, description?: string` | Set a single tag value |
| `setValues(values, qualifs?)` | `values: Object, qualifs?: Object` | Set multiple tag values |
| `getValue(tag)` | `tag: string` | Get current value for a tag |
| `getTagsList()` | - | Get array of all tag names |
| `getTags()` | - | Alias for `getTagsList()` |
| `resetData()` | - | Clear all tag data |

#### View Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `zoomTo(level, target?)` | `level: number, target?: string\|Object` | Zoom to specific level |
| `moveBy(dx, dy)` | `dx: number, dy: number` | Pan the view |
| `zoomToOriginal()` | - | Reset to original viewBox |

#### Configuration Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `enableTools(options)` | `options: Object` | Enable/disable toolbar buttons |
| `enableMouse(options)` | `options: Object` | Enable/disable mouse interactions |
| `setMouseWheel(options)` | `options: Object` | Configure mouse wheel behavior |
| `enableAlarmFlash(enabled)` | `enabled: boolean` | Enable/disable alarm blinking |
| `hideWatermark()` | - | Hide the SCADAvis watermark |

#### Color Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setColor(colorNumber, colorCode)` | `colorNumber: number, colorCode: string` | Set a single color |
| `setColors(colorsTable)` | `colorsTable: Object` | Set multiple colors |

#### Display Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `setBackgroundColor(color)` | `color: string` | Set background color |
| `setToolbarVisible(show)` | `show: boolean` | Show/hide toolbar |
| `setWatermarkVisible(show)` | `show: boolean` | Show/hide watermark |
| `setStatus(status)` | `status: string` | Update status display |
| `setTime(time)` | `time: string` | Update time display |
| `showLoader()` | - | Show loading animation |
| `hideLoader()` | - | Hide loading animation |

#### Utility Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getVersion()` | - | Get component version string |
| `isReady()` | - | Check if component is initialized |

### Events

The component emits CustomEvents for various actions:

| Event | Description | Detail |
|-------|-------------|--------|
| `loaded` | Component initialized | `{ version: string }` |
| `ready` | SVG loaded and parsed | `{ tagsList: string[] }` |
| `valueChange` | Value updated | `{ tag: string, value: any, quality: boolean }` |
| `click` | Element clicked in SVG | `{ element: string, x: number, y: number }` |
| `zoomPan` | Zoom/pan action | `{ action: number }` |
| `error` | Error occurred | `{ error: string }` |

#### Event Example

```javascript
const component = document.querySelector('scada-vis');

// Listen for ready event
component.addEventListener('ready', (e) => {
  console.log('Component ready with tags:', e.detail.tagsList);
});

// Listen for errors
component.addEventListener('error', (e) => {
  console.error('Error:', e.detail.error);
});
```

## Multiple Instances

The component supports multiple independent instances on the same page:

```html
<scada-vis id="instanceA" src="diagram1.svg"></scada-vis>
<scada-vis id="instanceB" src="diagram2.svg"></scada-vis>

<script type="module">
  import 'https://scadavis.io/synoptic3/scada-vis.js';
  
  const instanceA = document.getElementById('instanceA');
  const instanceB = document.getElementById('instanceB');
  
  // Each instance has independent state
  instanceA.setValue('TAG001', 100);
  instanceB.setValue('TAG001', 200);  // Different value for same tag name
</script>
```

See `multi-instance-test.html` for a complete example.

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 67+ | ✅ Full |
| Firefox | 63+ | ✅ Full |
| Safari | 10.1+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| IE | - | ❌ Not supported |

### Required Features

- Custom Elements v1
- Shadow DOM v1
- ES6 Modules
- Fetch API

## License

SCADAvis.io Synoptic API © 2018-2026 Ricardo L. Olsen / DSC Systems

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.

See [LICENSE](LICENSE) for details.

## Links

- [SCADAvis.io](https://scadavis.io)
- [Documentation](https://scadavis.io/docs)
- [GitHub](https://github.com/dscsystems/scadavis-synoptic3)
- [NPM](https://www.npmjs.com/package/scadavis-synoptic3)

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
