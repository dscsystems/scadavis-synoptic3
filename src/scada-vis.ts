'use strict'

/*
 * SCADAvis.io Synoptic API © 2018-2026 Ricardo L. Olsen / DSC Systems ALL RIGHTS RESERVED.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * SCADAvis Web Component - Main Integration Module
 *
 * A modern Web Component implementation of the SCADAvis visualization library.
 * Uses Shadow DOM for style encapsulation and CustomEvents for communication.
 *
 * Integrates:
 * - WebSAGE Core Engine (SVG manipulation)
 * - Data Processor (data handling and commands)
 * - Vega Charts (chart rendering)
 *
 * @module scada-vis
 */

// Import types from other modules
import type { WebSAGEEngine } from './websage-core'

// ============================================
// TYPE DEFINITIONS
// ============================================

/** External libraries that can be injected into the component */
export interface ScadaVisExternalLibs {
  d3?: any
  vega?: any
  vegaLite?: any
  $?: any
}

/** Default configuration for SCADAvis */
export interface ScadaVisDefaultConfig {
  svgMaxWidth: number
  svgMaxHeight: number
  background: string
  backgroundSVG: string
  toolbarColor: string
  barBreakerSwColor: string
}

/** Color table entry - can be string or number */
export type ColorTableEntry = string | number

/** Colors table mapping color indices to color codes */
export interface ColorsTable {
  [index: number]: string
}

/** Configuration options for the ScadaVis component */
export interface ScadaVisConfig {
  colorTable: string[]
  pbiColorTable: string[]
  pbiColors: Record<string, string>
  [key: string]: any
}

/** Options for creating a ScadaVis component instance */
export interface ScadaVisOptions {
  debug?: boolean
  defaultColors?: string[]
  [key: string]: any
}

/** Tools enable/disable options */
export interface ToolOptions {
  panEnabled?: boolean
  zoomEnabled?: boolean
}

/** Mouse interaction options */
export interface MouseOptions {
  panEnabled?: boolean
  zoomEnabled?: boolean
}

/** Mouse wheel options */
export interface MouseWheelOptions {
  directionBackOut?: boolean
  blockEventPropagation?: boolean
}

/** Keyboard options */
export interface KeyboardOptions {
  enabled?: boolean
}

/** Init parameters for scadavisInit function */
export interface ScadaVisInitParams {
  container?: string | HTMLElement
  styleParams?: string
  svgurl?: string
  colorsTable?: string | ColorsTable
  iframeparams?: string
  [key: string]: any
}

/** Tags data entry */
export interface TagDataEntry {
  path: string
  value: number | boolean
  quality: boolean
  type: 'bool' | 'float'
}

/** Custom event detail for ready event */
export interface ScadaVisReadyDetail {
  tagsList: string[]
}

/** Custom event detail for error event */
export interface ScadaVisErrorDetail {
  error: string
}

/** Custom event detail for zoomPan event */
export interface ScadaVisZoomPanDetail {
  action: number
}

// ============================================
// EXTERNAL LIBRARY DECLARATIONS
// ============================================

declare global {
  interface Window {
    d3: any
    vega: any
    vegaLite: any
    vl: any
    jQuery: any
    $: any
  }
}

// Use 'any' liberally for this legacy library integration
/* eslint-disable @typescript-eslint/no-explicit-any */

// Import from other TypeScript modules
// Note: all local imports should include .js extension for ES modules in browser
import { createWebSAGEEngine, type WebSAGEConfig, type ExternalLibs } from './websage-core.js'
import { createDataProcessor } from './data-processor.js'
import { createVegaCharts } from './vega-charts.js'
import { createTemplate } from './template.js'
import styles from './styles.js'
import { loadDependencies, areDependenciesLoaded } from './deps-loader.js'
import {
  DEFAULT_CONFIG,
  PBI_COLOR_TABLE,
  PBI_COLORS,
  createColorTable,
} from './config.js'

/**
 * Version information
 */
const VERSION = '3.0.0'

// Track dependency loading state
let dependenciesReady = false
let dependenciesLoadingPromise: Promise<void> | null = null

/**
 * Ensure dependencies are loaded before component initialization
 * @returns {Promise<void>}
 */
async function ensureDependencies(): Promise<void> {
  if (dependenciesReady || areDependenciesLoaded()) {
    dependenciesReady = true
    return
  }

  if (!dependenciesLoadingPromise) {
    dependenciesLoadingPromise = loadDependencies().then(() => {
      dependenciesReady = true
    })
  }

  return dependenciesLoadingPromise
}

// ============================================
// COMPONENT STATE INTERFACES
// ============================================

/** Internal cached elements */
interface ScadaVisElements {
  container: HTMLElement | null
  bardiv: HTMLElement | null
  svgdiv: HTMLElement | null
  loader: HTMLElement | null
  watermark: HTMLElement | null
  zoomIn: HTMLElement | null
  zoomOut: HTMLElement | null
  moveImg: HTMLElement | null
  almbox: HTMLElement | null
  horaAtu: HTMLElement | null
  spStatus: HTMLElement | null
  vegaCharts: HTMLElement | null
  previewDiv: HTMLElement | null
  previewFrame: HTMLIFrameElement | null
}

/** Bound event handlers */
interface BoundHandlers {
  onZoomPan: (event: Event) => void
  onReady: (event: CustomEvent) => void
  onError: (event: CustomEvent) => void
  onInternalClick: (event: CustomEvent) => void
}

/**
 * SCADAvis Web Component
 *
 * @example
 * <!-- Declarative usage -->
 * <scada-vis src="diagram.svg"></scada-vis>
 *
 * @example
 * // Programmatic usage
 * const component = document.querySelector('scada-vis');
 * component.setValue('TAG001', 123.45);
 */
export class ScadaVis extends HTMLElement {
  // Observed attributes for attributeChangedCallback
  static get observedAttributes(): string[] {
    return ['svgurl', 'src', 'colorstable']
  }

  /**
   * Get the current version of the component
   * @returns {string} Version string
   */
  static get version(): string {
    return VERSION
  }

  // Engine instances (initialized in connectedCallback)
  private _engine: WebSAGEEngine | null = null
  private _dataProcessor: any = null
  private _vegaCharts: any = null

  // External libraries reference
  private _externalLibs: ScadaVisExternalLibs = {
    d3: null,
    vega: null,
    vegaLite: null,
    $: null,
  }

  // Configuration options
  private _config: ScadaVisConfig = {
    ...DEFAULT_CONFIG,
    colorTable: createColorTable(DEFAULT_CONFIG),
    pbiColorTable: [...PBI_COLOR_TABLE],
    pbiColors: { ...PBI_COLORS },
  }

  // Ready state
  private _ready: boolean = false
  private _tagsList: string[] = []

  private _boundHandlers: BoundHandlers = {
    onZoomPan: this._onZoomPan.bind(this),
    onReady: this._onReady.bind(this),
    onError: this._onError.bind(this),
    onInternalClick: this._onInternalClick.bind(this),
  }

  // Reference to internal elements (populated in connectedCallback)
  private _elements: ScadaVisElements = {
    container: null,
    bardiv: null,
    svgdiv: null,
    loader: null,
    watermark: null,
    zoomIn: null,
    zoomOut: null,
    moveImg: null,
    almbox: null,
    horaAtu: null,
    spStatus: null,
    vegaCharts: null,
    previewDiv: null,
    previewFrame: null,
  }

  // Intervals/timeouts for cleanup
  private _intervals: number[] = []
  private _timeouts: number[] = []

  // Promise resolution functions for refreshDisplay
  private _resolveFunction: ((value: boolean) => void) | null = null
  private _rejectFunction: ((reason: Error) => void) | null = null

  constructor() {
    super()

    // Attach Shadow DOM for style encapsulation
    this.attachShadow({ mode: 'open' })

    // Initialize external libs as null
    this._externalLibs = {
      d3: null,
      vega: null,
      vegaLite: null,
      $: null,
    }

    // Configuration options
    this._config = {
      ...DEFAULT_CONFIG,
      colorTable: createColorTable(DEFAULT_CONFIG),
      pbiColorTable: [...PBI_COLOR_TABLE],
      pbiColors: { ...PBI_COLORS },
    }

    // Ready state
    this._ready = false
    this._tagsList = []

    // Store bound event handlers for cleanup
    this._boundHandlers = {
      onZoomPan: this._onZoomPan.bind(this),
      onReady: this._onReady.bind(this),
      onError: this._onError.bind(this),
      onInternalClick: this._onInternalClick.bind(this),
    }

    // Reference to internal elements (populated in connectedCallback)
    this._elements = {
      container: null,
      bardiv: null,
      svgdiv: null,
      loader: null,
      watermark: null,
      zoomIn: null,
      zoomOut: null,
      moveImg: null,
      almbox: null,
      horaAtu: null,
      spStatus: null,
      vegaCharts: null,
      previewDiv: null,
      previewFrame: null,
    }

    // Intervals/timeouts for cleanup
    this._intervals = []
    this._timeouts = []
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback(): void {
    // Render template and styles
    this._render()
    this._cacheElements()

    // Initialize asynchronously (waits for dependencies)
    this._initialize()
  }

  /**
   * Async initialization - waits for dependencies then sets up component
   * @private
   */
  private async _initialize(): Promise<void> {
    try {
      // Wait for external dependencies to load
      await ensureDependencies()

      // Initialize external libraries from global scope or property
      this._initExternalLibs()

      // Initialize engines
      this._initEngines()

      // Attach event listeners
      this._attachEventListeners()

      // Load SVG if src/svgurl attribute is provided
      const svgUrl = this.getAttribute('svgurl') || this.getAttribute('src')
      if (svgUrl) {
        this.loadURL(svgUrl)
      }

      // Parse colorsTable attribute if present
      const colorsTable = this.getAttribute('colorstable')
      if (colorsTable) {
        this._parseAndApplyColorsTable(colorsTable)
      }
    } catch (error) {
      console.error('ScadaVis: Failed to initialize:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      this._emitError(`Initialization failed: ${errorMessage}`)
    }
  }

  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback(): void {
    // Clean up engines
    if (this._engine && typeof this._engine.destroy === 'function') {
      this._engine.destroy()
    }

    if (this._vegaCharts && typeof this._vegaCharts.destroy === 'function') {
      this._vegaCharts.destroy()
    }

    // Clear intervals and timeouts
    this._intervals.forEach((id) => clearInterval(id))
    this._timeouts.forEach((id) => clearTimeout(id))
    this._intervals = []
    this._timeouts = []

    // Detach event listeners
    this._detachEventListeners()

    // Clear references
    this._elements = {
      container: null,
      bardiv: null,
      svgdiv: null,
      loader: null,
      watermark: null,
      zoomIn: null,
      zoomOut: null,
      moveImg: null,
      almbox: null,
      horaAtu: null,
      spStatus: null,
      vegaCharts: null,
      previewDiv: null,
      previewFrame: null,
    }
    this._engine = null
    this._dataProcessor = null
    this._vegaCharts = null
    this._ready = false
  }

  /**
   * Called when observed attributes change
   * @param name - Attribute name
   * @param oldValue - Old value
   * @param newValue - New value
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return

    switch (name) {
      case 'svgurl':
      case 'src':
        if (newValue) {
          this.loadURL(newValue)
        }
        break
      case 'colorstable':
        this._parseAndApplyColorsTable(newValue)
        break
    }
  }

  /**
   * Initialize external libraries from global scope
   * @private
   */
  private _initExternalLibs(): void {
    // Try to get libraries from global scope
    this._externalLibs = {
      d3: window.d3 || this._externalLibs.d3,
      vega: window.vega || this._externalLibs.vega,
      vegaLite: window.vegaLite || window.vl || this._externalLibs.vegaLite,
      $: window.jQuery || window.$ || this._externalLibs.$,
    }
  }

  /**
   * Initialize all engines
   * @private
   */
  private _initEngines(): void {
    if (!this.shadowRoot) return

    // Initialize WebSAGE engine
    this._engine = createWebSAGEEngine({
      rootElement: this.shadowRoot,
      eventTarget: this.shadowRoot as any,
      config: {
        ...this._config,
        colorTable: this._config.colorTable,
        pbiColorTable: this._config.pbiColorTable,
        pbiColors: this._config.pbiColors,
      },
      externalLibs: this._externalLibs as ExternalLibs,
    })

    // Expose engine globally for inline onclick handlers in SVG
    if (typeof window !== 'undefined') {
      ;(window as any).engine = this._engine
    }

    // Initialize data processor
    this._dataProcessor = createDataProcessor({
      websageEngine: this._engine,
      eventTarget: this.shadowRoot as any,
      config: {
        colorTable: this._config.colorTable,
      },
      state: this._engine.state,
    })

    // Initialize Vega charts
    this._vegaCharts = createVegaCharts({
      websageEngine: this._engine,
      rootElement: this.shadowRoot,
      eventTarget: this.shadowRoot as any,
      externalLibs: this._externalLibs,
      state: this._engine.state,
    })

    // Register the executeExtended callback with the engine
    if (
      this._engine.setExecuteExtendedCallback &&
      this._vegaCharts.executeExtended
    ) {
      this._engine.setExecuteExtendedCallback((i: any) => {
        this._vegaCharts.executeExtended(i)
      })
    }

    // Register the initializeExtended callback with the engine
    if (
      this._engine.setInitializeExtendedCallback &&
      this._vegaCharts.initializeExtended
    ) {
      this._engine.setInitializeExtendedCallback(
        (inksageLabelvec: any, lbv: any, item: any) => {
          this._vegaCharts.initializeExtended(inksageLabelvec, lbv, item)
        }
      )
    } else {
      console.warn('FAILED to register initializeExtended callback!')
    }
  }

  /**
   * Render the component template and styles into Shadow DOM
   * @private
   */
  private _render(): void {
    if (!this.shadowRoot) return

    // Create and append styles
    const styleElement = document.createElement('style')
    styleElement.textContent = styles as string
    this.shadowRoot.appendChild(styleElement)

    // Create and append template content
    const template = createTemplate()
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  /**
   * Cache references to internal elements
   * @private
   */
  private _cacheElements(): void {
    if (!this.shadowRoot) return

    this._elements = {
      container: this.shadowRoot.querySelector('.scada-vis-container'),
      bardiv: this.shadowRoot.querySelector('#bardiv'),
      svgdiv: this.shadowRoot.querySelector('#svgdiv'),
      loader: this.shadowRoot.querySelector('#loader'),
      watermark: this.shadowRoot.querySelector('#WATERMARK'),
      zoomIn: this.shadowRoot.querySelector('#ZOOMIN_ID'),
      zoomOut: this.shadowRoot.querySelector('#ZOOMOUT_ID'),
      moveImg: this.shadowRoot.querySelector('#MOVE_ID'),
      almbox: this.shadowRoot.querySelector('#almbox'),
      horaAtu: this.shadowRoot.querySelector('#HORA_ATU'),
      spStatus: this.shadowRoot.querySelector('#SP_STATUS'),
      vegaCharts: this.shadowRoot.querySelector('#VEGACHARTS'),
      previewDiv: this.shadowRoot.querySelector('#previewdiv'),
      previewFrame: this.shadowRoot.querySelector('#previewframe'),
    }
  }

  /**
   * Attach event listeners to internal elements and component
   * @private
   */
  private _attachEventListeners(): void {
    if (!this.shadowRoot) return

    // Zoom/Pan controls
    const zoomElements = this.shadowRoot.querySelectorAll(
      '[data-action="zoomPan"]'
    )
    zoomElements.forEach((el) => {
      el.addEventListener('click', this._boundHandlers.onZoomPan)
    })

    // Listen for internal events on shadowRoot
    if (this.shadowRoot) {
      this.shadowRoot.addEventListener('scadavis-ready', this._boundHandlers.onReady as EventListener)
      this.shadowRoot.addEventListener('scadavis-error', this._boundHandlers.onError as EventListener)
      this.shadowRoot.addEventListener('scadavis-click', this._boundHandlers.onInternalClick as EventListener)
    }
  }

  /**
   * Detach event listeners
   * @private
   */
  private _detachEventListeners(): void {
    if (!this.shadowRoot) return

    const zoomElements = this.shadowRoot.querySelectorAll(
      '[data-action="zoomPan"]'
    )
    zoomElements.forEach((el) => {
      el.removeEventListener('click', this._boundHandlers.onZoomPan)
    })

    if (this.shadowRoot) {
      this.shadowRoot.removeEventListener('scadavis-ready', this._boundHandlers.onReady as EventListener)
      this.shadowRoot.removeEventListener('scadavis-error', this._boundHandlers.onError as EventListener)
      this.shadowRoot.removeEventListener('scadavis-click', this._boundHandlers.onInternalClick as EventListener)
    }
  }

  /**
   * Handle zoom/pan button clicks
   * @param event - Click event
   * @private
   */
  private _onZoomPan(event: Event): void {
    const target = event.currentTarget as HTMLElement
    const action = parseInt(target.dataset.value || '0', 10)

    // Delegate to engine's zoomPan method
    if (this._engine) {
      this._engine.zoomPan(action)
    }

    // Emit event for external listeners
    this._emitEvent('zoomPan', { action })
  }

  /**
   * Handle ready event from engine
   * @param event - Ready event
   * @private
   */
  private _onReady(event: CustomEvent): void {
    this._ready = true
    this._tagsList = event.detail?.tagsList || []
    this.hideLoader()

    // Initialize Vega charts for the loaded SVG
    if (this._vegaCharts && this._engine && this._engine.state.SVGDoc) {
      this._vegaCharts.initializeExtended(this._engine.state.InkSage)
    }

    // Emit public 'ready' event for external listeners
    this._emitEvent('ready', {
      tagsList: this._tagsList,
    })
  }

  /**
   * Handle error event from engine
   * @param event - Error event
   * @private
   */
  private _onError(event: CustomEvent): void {
    this.hideLoader()
    console.error('ScadaVis Error:', event.detail?.error)
    this._emitEvent('error', event.detail)
  }

  /**
   * Handle internal click event from engine
   * @param event - Click event
   * @private
   */
  private _onInternalClick(event: CustomEvent): void {
    this._emitEvent('click', event.detail)
  }

  /**
   * Parse and apply colors table from attribute
   * @param colorsTableStr - JSON string of colors table
   * @private
   */
  private _parseAndApplyColorsTable(colorsTableStr: string | null): void {
    if (!colorsTableStr) return

    try {
      const colorsTable = JSON.parse(colorsTableStr)
      this.setColors(colorsTable)
    } catch (e) {
      const error = e as Error
      console.warn('ScadaVis: Invalid colorsTable JSON:', error.message)
    }
  }

  /**
   * Emit a CustomEvent
   * @param type - Event type
   * @param detail - Event detail object
   * @private
   */
  private _emitEvent<T = Record<string, any>>(type: string, detail: T = {} as T): void {
    const event = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: {
        version: VERSION,
        ...detail,
      },
    })
    this.dispatchEvent(event)
  }

  /**
   * Emit an error event
   * @param error - Error object or message
   * @private
   */
  private _emitError(error: Error | string): void {
    this._emitEvent('scadavis-error', {
      error: error instanceof Error ? error.message : error,
    })
  }

  // ============================================
  // PUBLIC API - Loader
  // ============================================

  /**
   * Show the loader animation
   */
  showLoader(): void {
    if (this._elements.loader) {
      this._elements.loader.style.display = 'flex'
    }
  }

  /**
   * Hide the loader animation
   */
  hideLoader(): void {
    if (this._elements.loader) {
      this._elements.loader.style.display = 'none'
    }
  }

  // ============================================
  // PUBLIC API - SVG Loading
  // ============================================

  /**
   * Load an SVG from a URL
   * @param url - URL of the SVG file
   * @returns {Promise<void>}
   */
  async loadURL(url: string): Promise<void> {
    // Wait for dependencies to be loaded first
    await loadDependencies()

    this.showLoader()
    this._ready = false

    try {
      // Check if running from file:// protocol
      if (window.location.protocol === 'file:') {
        console.warn(
          'ScadaVis: Loading external SVG files via file:// protocol is blocked by CORS. Use a local web server or setSVG() with inline content.'
        )
        this._emitError(
          'Cannot load SVG from file:// protocol. Use a local web server (e.g., `npx serve`) or use setSVG() with inline SVG content.'
        )
        this.hideLoader()
        return
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(
          `Failed to load SVG: ${response.status} ${response.statusText}`
        )
      }

      const svgText = await response.text()
      this.setSVG(svgText)
    } catch (error) {
      console.error('ScadaVis: Error loading SVG:', error)
      this._emitError(error as Error)
      this.hideLoader()
    }
  }

  /**
   * Set SVG content directly
   * @param svgContent - SVG markup string
   */
  setSVG(svgContent: string): void {
    if (!this._elements.svgdiv || !this._engine) {
      this._emitError('Component not initialized')
      return
    }

    // Clear existing content
    this._elements.svgdiv.innerHTML = svgContent

    // Get the SVG element
    const svgElement = this._elements.svgdiv.querySelector('svg')
    if (!svgElement) {
      this._emitError('No SVG element found in content')
      this.hideLoader()
      return
    }

    // Get the natural size from the SVG (width/height attributes or viewBox)
    // NOTE: We don't set the component size to natural size anymore
    // to match the iframe behavior where the component fills its container
    let naturalWidth = svgElement.getAttribute('width')
    let naturalHeight = svgElement.getAttribute('height')

    // If no width/height attributes, try to get from viewBox
    if (!naturalWidth || !naturalHeight) {
      const viewBox = svgElement.getAttribute('viewBox')
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number)
        if (parts.length === 4) {
          naturalWidth = String(parts[2])
          naturalHeight = String(parts[3])
        }
      }
    }

    // Configure SVG element
    svgElement.id = 'svgid'
    svgElement.style.width = '100%'
    svgElement.style.height = '100%'

    // Initialize the engine with the SVG
    this._engine.init(svgElement)

    // The engine will emit 'scadavis-ready' when initialization is complete
  }

  // ============================================
  // PUBLIC API - Data Methods (delegate to dataProcessor)
  // ============================================

  /**
   * Set a value for a tag and immediately update the display.
   * Mirrors synopticapi.js setValue().
   * Point key can be a string tag name or a numeric point number.
   * @param tag - Tag name or point number
   * @param value - Value for the tag
   * @param failed - Whether the point is in failed state
   * @param alarmed - Whether the point is alarmed
   * @param description - Optional description
   * @returns True if successful
   */
  setValue(
    tag: string | number,
    value: number | boolean | string,
    failed: boolean = false,
    alarmed: boolean = false,
    description: string | null = null
  ): boolean {
    if (!this._dataProcessor) return false
    return this._dataProcessor.setValue(
      tag,
      value,
      failed,
      alarmed,
      description
    )
  }

  /**
   * Store a value for a tag without triggering a display redraw.
   * Call updateValues() afterwards to flush buffered values.
   * Mirrors synopticapi.js storeValue().
   * Point key can be a string tag name or a numeric point number.
   * @param tag - Tag name or point number
   * @param value - Value for the tag
   * @param failed - Whether the point is in failed state
   * @param alarmed - Whether the point is alarmed
   * @param description - Optional description
   * @returns True (always buffered)
   */
  storeValue(
    tag: string | number,
    value: number | boolean | string,
    failed: boolean = false,
    alarmed: boolean = false,
    description: string | null = null
  ): boolean {
    if (!this._dataProcessor) return false
    return this._dataProcessor.storeValue(
      tag,
      value,
      failed,
      alarmed,
      description
    )
  }

  /**
   * Flush all values buffered by storeValue() to the display.
   * Mirrors synopticapi.js updateValues().
   * @param values - Optional additional { tag: value } pairs to include
   * @returns True if successful
   */
  updateValues(values?: Record<string, number | boolean | string>): boolean {
    if (!this._dataProcessor) return false
    return this._dataProcessor.updateValues(values)
  }

  /**
   * Update values for tags to the component. Work as a promise. Only available for version 2+.
   * Mirrors synopticapi.js refreshDisplay().
   * @param values - values in a object like { "tag1" : 1.0, "tag2": 1.2, "tag3": true }.
   * @returns Promise that resolves after the display refresh is completed.
   */
  refreshDisplay(values?: Record<string, number | boolean | string>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this._ready || !this._dataProcessor) {
        reject(new Error('Not ready for data!'))
        return
      }
      if (this._resolveFunction) {
        reject(new Error('Ongoing display refresh!'))
        return
      }

      this._resolveFunction = resolve
      this._rejectFunction = reject

      try {
        this.updateValues(values)
        // If updateValues is synchronous (which it currently is via data-processor),
        // we can immediately resolve. If it does become asynchronous, this logic
        // will need to hook into the actual flush completion.
        if (this._resolveFunction) {
          const resFn = this._resolveFunction
          this._resolveFunction = null
          this._rejectFunction = null
          resFn(true)
        }
      } catch (err) {
        if (this._rejectFunction) {
          const rejFn = this._rejectFunction
          this._resolveFunction = null
          this._rejectFunction = null
          rejFn(err as Error)
        }
      }
    })
  }

  /**
   * Set multiple values at once
   * @param values - Object with tag-value pairs
   * @param qualifs - Object with tag-quality pairs (optional)
   */
  setValues(values: Record<string, number | boolean>, qualifs: Record<string, number | boolean> = {}): void {
    if (!this._dataProcessor) return

    const tagsData: TagDataEntry[] = Object.entries(values).map(([path, value]) => ({
      path,
      value,
      quality: qualifs[path] !== false && qualifs[path] !== 0x80,
      type: typeof value === 'boolean' ? 'bool' : 'float',
    }))

    this._dataProcessor.processTagsData(tagsData)
  }

  /**
   * Get the current value for a tag or point number.
   * Point key can be a string tag name or a numeric point number.
   * Mirrors synopticapi.js getValue().
   * @param tag - Tag name or point number
   * @returns Current value, or null if not found
   */
  getValue(tag: string | number): number | boolean | string | null {
    if (this._engine) {
      const v = this._engine.getValue(tag)
      // getValue returns 0 for unknown points; return null when genuinely absent
      // so callers can distinguish "zero" from "not found"
      return v
    }
    return null
  }

  /**
   * Get list of all tags
   * @returns Array of tag names
   */
  getTagsList(): string[] {
    if (this._engine) {
      return this._engine.getTagsList()
    }
    return this._tagsList.slice()
  }

  /**
   * Get list of all tags (alias for getTagsList)
   * @returns Array of tag names
   */
  getTags(): string[] {
    return this.getTagsList()
  }

  /**
   * Clear all tag data and reset state
   * @returns True if successful
   */
  resetData(): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.resetData()
    }
    return false
  }

  // ============================================
  // PUBLIC API - View Methods (delegate to dataProcessor)
  // ============================================

  /**
   * Zoom to a specific level
   * @param zoomLevel - Zoom level
   * @param target - Target element ID or coordinates
   * @returns True if successful
   */
  zoomTo(zoomLevel: number, target: string | Object | null = null): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.zoomTo(zoomLevel, target)
    }
    return false
  }

  /**
   * Pan the view by specified amounts
   * @param dx - Horizontal pan distance
   * @param dy - Vertical pan distance
   * @returns True if successful
   */
  moveBy(dx: number, dy: number): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.moveBy(dx, dy)
    }
    return false
  }

  /**
   * Reset zoom to original viewBox
   * @returns True if successful
   */
  zoomToOriginal(): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.zoomToOriginal()
    }
    return false
  }

  // ============================================
  // PUBLIC API - Configuration Methods
  // ============================================

  /**
   * Enable/disable toolbar buttons
   * @param panEnabled - Toolbar options or panEnabled boolean
   * @param zoomEnabled - Enable/disable Zoom tool (classic API)
   * @returns True if successful
   */
  enableTools(panEnabled: boolean | ToolOptions = true, zoomEnabled: boolean = false): boolean {
    if (this._dataProcessor) {
      if (typeof panEnabled === 'object' && panEnabled !== null) {
        return this._dataProcessor.enableTools(panEnabled)
      }

      const options: ToolOptions = {
        panEnabled: typeof panEnabled === 'undefined' ? true : !!panEnabled,
        zoomEnabled: !!zoomEnabled,
      }
      return this._dataProcessor.enableTools(options)
    }
    return false
  }

  /**
   * Enable/disable mouse interactions
   * @param panEnabled - Mouse options or panEnabled boolean
   * @param zoomEnabled - Enable/disable zoom via mouse (classic API)
   * @returns True if successful
   */
  enableMouse(panEnabled: boolean | MouseOptions = true, zoomEnabled: boolean = true): boolean {
    if (this._dataProcessor) {
      if (typeof panEnabled === 'object' && panEnabled !== null) {
        return this._dataProcessor.enableMouse(panEnabled)
      }

      const options: MouseOptions = {
        panEnabled: typeof panEnabled === 'undefined' ? true : !!panEnabled,
        zoomEnabled: typeof zoomEnabled === 'undefined' ? true : !!zoomEnabled,
      }
      return this._dataProcessor.enableMouse(options)
    }
    return false
  }

  /**
   * Configure mouse wheel behavior
   * @param directionBackOut - Mouse wheel options or directionBackOut boolean
   * @param blockEventPropagation - Prevent event bubbling (classic API)
   * @returns True if successful
   */
  setMouseWheel(directionBackOut: boolean | MouseWheelOptions = true, blockEventPropagation: boolean = true): boolean {
    if (this._dataProcessor) {
      if (typeof directionBackOut === 'object' && directionBackOut !== null) {
        return this._dataProcessor.setMouseWheel(directionBackOut)
      }

      const options: MouseWheelOptions = {
        directionBackOut:
          typeof directionBackOut === 'undefined' ? true : !!directionBackOut,
        blockEventPropagation:
          typeof blockEventPropagation === 'undefined' ? true : !!blockEventPropagation,
      }
      return this._dataProcessor.setMouseWheel(options)
    }
    return false
  }

  /**
   * Enable/disable keyboard functions (zoom & pan)
   * @param keyEnabled - Keyboard options or keyEnabled boolean
   * @returns True if successful
   */
  enableKeyboard(keyEnabled: boolean | KeyboardOptions = true): boolean {
    if (this._dataProcessor) {
      if (typeof keyEnabled === 'object' && keyEnabled !== null) {
        return this._dataProcessor.enableKeyboard(keyEnabled)
      }

      const options: KeyboardOptions = {
        enabled: typeof keyEnabled === 'undefined' ? true : !!keyEnabled,
      }
      return this._dataProcessor.enableKeyboard(options)
    }
    return false
  }

  /**
   * Enable/disable alarm blinking animation
   * @param enabled - Enable/disable alarm flash
   * @returns True if successful
   */
  enableAlarmFlash(enabled: boolean = true): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.enableAlarmFlash(enabled)
    }
    return false
  }

  /**
   * Hide the SCADAvis watermark
   * @returns True if successful
   */
  hideWatermark(): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.hideWatermark()
    }
    return false
  }

  /**
   * Update a single color in the color table
   * @param colorNumber - Color index (-1 for background)
   * @param colorCode - CSS color value
   * @returns True if successful
   */
  setColor(colorNumber: number, colorCode: string): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.setColor(colorNumber, colorCode)
    }
    return false
  }

  /**
   * Update multiple colors in the color table
   * @param colorsTable - Object mapping color indices to color codes
   * @returns True if successful
   */
  setColors(colorsTable: ColorsTable): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.setColors(colorsTable)
    }
    return false
  }

  // ============================================
  // PUBLIC API - Data Processing Methods
  // ============================================

  /**
   * Process OAS API format tags data
   * @param tags - Array of tag objects from OAS API
   * @returns True if successful
   */
  processTagsData(tags: any[]): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.processTagsData(tags)
    }
    return false
  }

  /**
   * Process Google Sheets format valueRanges data
   * @param valueRanges - Array of valueRange objects
   * @returns True if successful
   */
  processValueRanges(valueRanges: any[]): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.processValueRanges(valueRanges)
    }
    return false
  }

  /**
   * Process raw data object (supports both formats)
   * @param obj - Data object to process
   * @returns True if successful
   */
  processData(obj: any): boolean {
    if (this._dataProcessor) {
      return this._dataProcessor.processData(obj)
    }
    return false
  }

  // ============================================
  // PUBLIC API - Display Methods
  // ============================================

  /**
   * Set the background color
   * @param color - CSS color value
   */
  setBackgroundColor(color: string): void {
    this._config.background = color

    if (this._elements.container) {
      this._elements.container.style.backgroundColor = color
    }

    if (this._engine) {
      this._engine.setBgColor(color)
    }
  }

  /**
   * Show or hide the toolbar
   * @param show - Whether to show the toolbar
   */
  setToolbarVisible(show: boolean): void {
    if (this._elements.bardiv) {
      this._elements.bardiv.style.display = show ? 'block' : 'none'
    }
  }

  /**
   * Show or hide the watermark
   * @param show - Whether to show the watermark
   */
  setWatermarkVisible(show: boolean): void {
    if (this._elements.watermark) {
      this._elements.watermark.style.display = show ? 'block' : 'none'
    }
  }

  /**
   * Update the status display
   * @param status - Status text
   */
  setStatus(status: string): void {
    if (this._elements.spStatus) {
      this._elements.spStatus.textContent = status
    }
  }

  /**
   * Update the time display
   * @param time - Time string
   */
  setTime(time: string): void {
    if (this._elements.horaAtu) {
      this._elements.horaAtu.textContent = time
    }
  }

  // ============================================
  // PUBLIC API - External Libraries
  // ============================================

  /**
   * Set external libraries for Vega charts
   * @param libs - External libraries { d3, vega, vegaLite, $ }
   */
  set externalLibs(libs: ScadaVisExternalLibs) {
    if (libs) {
      this._externalLibs = {
        d3: libs.d3 || this._externalLibs.d3,
        vega: libs.vega || this._externalLibs.vega,
        vegaLite: libs.vegaLite || libs.$ || this._externalLibs.vegaLite,
        $: libs.$ || (libs as any).jQuery || this._externalLibs.$,
      }

      // Re-initialize Vega charts with new libraries if already initialized
      if (this._vegaCharts && this._ready && this._engine) {
        this._vegaCharts.destroy()
        this._vegaCharts = createVegaCharts({
          websageEngine: this._engine,
          rootElement: this.shadowRoot!,
          eventTarget: this,
          externalLibs: this._externalLibs,
          state: this._engine.state,
        })

        if (this._engine.state.InkSage) {
          // this._vegaCharts.initializeExtended(this._engine.state.InkSage)
        }
      }
    }
  }

  /**
   * Get external libraries reference
   * @returns External libraries
   */
  get externalLibs(): ScadaVisExternalLibs {
    return { ...this._externalLibs }
  }

  // ============================================
  // PUBLIC API - Version and State
  // ============================================

  /**
   * Get the current version
   * @returns Version string
   */
  getVersion(): string {
    return VERSION
  }

  /**
   * Get the current version
   * @returns Version string
   */
  getComponentVersion(): string {
    return VERSION
  }

  /**
   * Check if the component is ready
   * @returns True if ready
   */
  isReady(): boolean {
    return this._ready
  }

  /**
   * Get the current component state
   * 0=not loaded, 1=loaded and ready for graphics, 2=SVG graphics processed and ready for data.
   * @returns State value
   */
  getComponentState(): number {
    if (!this._engine) return 0
    if (!this._ready) return 1
    return 2
  }

  /**
   * Get internal state for debugging
   * @returns State snapshot
   */
  _getState(): any {
    if (this._engine) {
      return this._engine.state
    }
    return null
  }

  /**
   * Compatibility method for event binding analogous to the classic iframe API
   * @param eventName - Event name such as "ready", "click", or "error"
   * @param callback - Callback function
   * @returns True if supported event
   */
  on(eventName: string, callback: (event: any, tag?: any) => void): boolean {
    if (typeof callback !== 'function') return false

    let actualEventName = eventName
    // Map classic event names if needed
    if (eventName === 'click') actualEventName = 'click'
    if (eventName === 'error') actualEventName = 'error'

    this.addEventListener(actualEventName, ((e: CustomEvent) => {
      // Classic SCADAvis click event sends (event, tag)
      if (actualEventName === 'click' && e.detail) {
        callback(e.detail.event || e, e.detail.tag)
      } else if (actualEventName === 'error' && e.detail) {
        callback(e.detail.error || e.detail.message || e.detail)
      } else if (actualEventName === 'ready' && e.detail) {
        callback(e, e.detail.tagsList)
      } else {
        callback(e)
      }
    }) as EventListener)
    return true
  }
}

// Register the custom element
if (!customElements.get('scada-vis')) {
  customElements.define('scada-vis', ScadaVis)
}

/**
 * Initialization of the web component via promise.
 * @param container - ID of the container element, or a config object
 * @param styleParams - Style string for the web component (width, height)
 * @param svgurl - URL for the SVG file
 * @returns Promise that resolves to the ScadaVis element when ready
 */
function scadavisInit(
  container?: string | HTMLElement | ScadaVisInitParams,
  styleParams?: string,
  svgurl?: string
): Promise<ScadaVis> {
  return new Promise((resolve, reject) => {
    try {
      let params: ScadaVisInitParams = {}

      if (typeof container === 'object' && container !== null) {
        params = { ...container }
        svgurl = svgurl || params.svgurl
        styleParams = styleParams || params.styleParams || params.iframeparams
        container = params.container
      }

      let containerEl: HTMLElement | null = null
      if (typeof container === 'string' && container.trim() !== '') {
        containerEl = document.getElementById(container)
      } else if (container instanceof HTMLElement) {
        containerEl = container
      }

      if (!containerEl) {
        containerEl = document.body
      }

      // Default the iframeparams if not provided, exactly like the classic version
      styleParams = styleParams || 'height="250" width="250"'

      // Create the web component
      const sv = document.createElement('scada-vis') as ScadaVis

      // Parse dimensions from iframeparams and explicitly size the component wrapper
      if (typeof styleParams === 'string') {
        const widthMatch = styleParams.match(/width=["']?([^"'\s>]+)["']?/)
        const heightMatch = styleParams.match(/height=["']?([^"'\s>]+)["']?/)
        if (widthMatch) {
          sv.style.width =
            isNaN(Number(widthMatch[1])) ? widthMatch[1] : `${widthMatch[1]}px`
        }
        if (heightMatch) {
          sv.style.height =
            isNaN(Number(heightMatch[1]))
              ? heightMatch[1]
              : `${heightMatch[1]}px`
        }
      }

      // Apply any parameter properties supported
      if (params.colorsTable) {
        sv.setAttribute(
          'colorstable',
          typeof params.colorsTable === 'string'
            ? params.colorsTable
            : JSON.stringify(params.colorsTable)
        )
      }

      // Append to DOM
      containerEl.appendChild(sv)

      if (!svgurl) {
        // If no SVG URL, resolve immediately once the element is added
        resolve(sv)
        return
      }

      // Bind events for resolving the promise
      sv.on('error', (errMsg: any) => reject(new Error(errMsg)))
      sv.on('ready', () => resolve(sv))

      // Trigger the SVG load
      sv.loadURL(svgurl)
    } catch (e) {
      reject(e)
    }
  })
}

// Ensure scadavisInit is available globally attached to window (like the classic version)
if (typeof window !== 'undefined') {
  (window as any).scadavisInit = scadavisInit
}

export { VERSION, scadavisInit }
export default ScadaVis

