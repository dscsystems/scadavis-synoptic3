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
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Data Processor Module for SCADAvis Web Component
 *
 * This module provides a factory function that creates a data processor
 * for handling SCADA data from various sources (OAS API, Google Sheets format)
 * and command messages (zoom, pan, color changes, etc.).
 *
 * Replaces the postMessage-based communication from getjsondata.js with
 * direct method calls and CustomEvent emission.
 *
 * @module data-processor
 */

import type { WebSAGEEngine, PointData } from './websage-core.js'

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Version identifier for the data processor
 * @constant {string}
 */
export const VERSION = '3.0.0'

/**
 * Configuration options for the data processor
 */
export interface DataProcessorConfig {
  /** Color table for dynamic styling */
  colorTable?: string[]
}

/**
 * OAS API tag parameter value structure
 */
export interface OASApiTagValue {
  /** Tag client item identifier */
  TagClientItem?: string | number
  /** Description */
  Desc?: string
  /** Location level 0 (substation) */
  LocationLevel0?: string
  /** Location level 1 (bay) */
  LocationLevel1?: string
  /** Timestamp */
  TimeStamp?: number
  /** Blocking annotation */
  BlockingAnnotation?: string
  /** Digital alarm text for TRUE state */
  DigitalAlarmTextAppendTrue?: string
  /** Digital alarm text for FALSE state */
  DigitalAlarmTextAppendFalse?: string
  /** Alarm state */
  Alarmed?: boolean
  /** Out of range indicator */
  OutOfRange?: number
}

/**
 * OAS API tag alarm limit structure
 */
export interface OASApiAlarmLimit {
  /** Alarm limit value */
  Value?: number | string
}

/**
 * OAS API tag parameters structure
 */
export interface OASApiTagParameters {
  /** Value parameters */
  Value?: OASApiTagValue
  /** High alarm limit */
  HighAlarmLimit?: OASApiAlarmLimit
  /** Low alarm limit */
  LowAlarmLimit?: OASApiAlarmLimit
  /** Additional parameters (dynamic) */
  [key: string]: OASApiAlarmLimit | OASApiTagValue | undefined
}

/**
 * OAS API tag entry structure
 */
export interface OASApiTag {
  /** Tag path/name */
  path: string
  /** Tag value */
  value: number | boolean | string
  /** Tag type: 'float', 'bool', 'string' */
  type?: 'float' | 'bool' | 'string'
  /** Quality indicator */
  quality?: boolean
  /** Tag parameters */
  parameters?: OASApiTagParameters
}

/**
 * OAS API data structure
 */
export interface OASApiData {
  /** Array of tags */
  tags?: OASApiTag[]
}

/**
 * Google Sheets valueRange row data
 */
export interface ValueRangeRow {
  /** Row values (can be string, number, boolean) */
  values: any[]
  /** Range string for this row */
  range?: string
}

/**
 * Google Sheets valueRange structure
 */
export interface ValueRange {
  /** Range string (e.g., "Sheet1!A1:D10") */
  range: string
  /** Major dimension: "ROWS" or "COLUMNS" */
  majorDimension?: string
  /** Array of row arrays */
  values: any[][]
}

/**
 * Google Sheets API response structure
 */
export interface GoogleSheetsData {
  /** Array of value ranges */
  valueRanges?: ValueRange[]
}

/**
 * Combined data input (supports both OAS API and Google Sheets formats)
 */
export interface DataInput {
  /** OAS API wrapped data */
  data?: OASApiData
  /** OAS API tags array */
  tags?: OASApiTag[]
  /** Google Sheets valueRanges */
  valueRanges?: ValueRange[]
}

/**
 * Zoom target can be a string element ID or coordinate object
 */
export type ZoomTarget = string | { x: number; y: number } | null

/**
 * ViewBox configuration
 */
export interface ViewBoxConfig {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Tools enable/disable options
 */
export interface ToolsOptions {
  /** Show/hide zoom buttons */
  zoomEnabled?: boolean
  /** Show/hide pan buttons */
  panEnabled?: boolean
}

/**
 * Mouse enable/disable options
 */
export interface MouseOptions {
  /** Enable/disable pan via mouse */
  panEnabled?: boolean
  /** Enable/disable zoom via mouse */
  zoomEnabled?: boolean
}

/**
 * Mouse wheel configuration options
 */
export interface MouseWheelOptions {
  /** Reverse scroll direction */
  directionBackOut?: boolean
  /** Prevent event bubbling */
  blockEventPropagation?: boolean
}

/**
 * Keyboard enable/disable options
 */
export interface KeyboardOptions {
  /** Enable/disable keyboard interactions */
  enabled?: boolean
}

/**
 * Set value options (object form)
 */
export interface SetValueOptions {
  /** Failed state */
  failed?: boolean
  /** Alarmed state */
  alarmed?: boolean
  /** Description */
  description?: string
}

/**
 * Event detail for scadavis-updated
 */
export interface UpdateEventDetail {
  /** Event type */
  type: string
  /** Handle ID from request */
  handle: string | null
  /** Version string */
  version: string
  /** Error message if any */
  error: string | null
}

/**
 * Event detail for scadavis-zoom
 */
export interface ZoomEventDetail {
  /** Event type */
  type: string
  /** Zoom level */
  zoomLevel?: number
  /** Target element or coordinates */
  target?: ZoomTarget
  /** Current viewBox */
  viewBox: ViewBoxConfig
}

/**
 * Event detail for scadavis-pan
 */
export interface PanEventDetail {
  /** Event type */
  type: string
  /** Horizontal distance */
  dx: number
  /** Vertical distance */
  dy: number
  /** Current viewBox */
  viewBox: ViewBoxConfig
}

/**
 * Event detail for mouse/keyboard configuration
 */
export interface ConfigEventDetail {
  /** Event type */
  type: string
  /** Pan enabled state */
  panEnabled?: boolean
  /** Zoom enabled state */
  zoomEnabled?: boolean
  /** Direction back out */
  directionBackOut?: boolean
  /** Block event propagation */
  blockEventPropagation?: boolean
  /** Keyboard enabled state */
  enabled?: boolean
  /** Alarm flash enabled state */
  alarmFlashEnabled?: boolean
}

/**
 * Event detail for color change
 */
export interface ColorChangeEventDetail {
  /** Event type */
  type: string
  /** Color number (-1 for background) */
  colorNumber?: number
  /** Color code */
  colorCode?: string
  /** Colors table (for setColors) */
  colorsTable?: Record<string, string>
}

/**
 * Data reset event detail
 */
export interface DataResetEventDetail {
  /** Event type */
  type: string
}

/**
 * Data processor options for factory function
 */
export interface DataProcessorOptions {
  /** The WebSAGE engine instance (required) */
  websageEngine: WebSAGEEngine
  /** Element to dispatch events on (required) */
  eventTarget: Element
  /** Configuration options */
  config?: DataProcessorConfig
  /** Reference to state object (uses engine state if not provided) */
  state?: any
}

/**
 * Data Processor Engine public API interface
 */
export interface DataProcessorEngine {
  /** Process OAS API format tags data */
  processTagsData: (tags: OASApiTag[], handle?: string | null) => boolean
  /** Process Google Sheets format valueRanges data */
  processValueRanges: (valueRanges: ValueRange[], handle?: string | null) => boolean
  /** Process raw data object (supports both formats) */
  processData: (obj: DataInput, handle?: string | null) => boolean
  /** Set a single value and redraw */
  setValue: (tag: string | number, value: number | boolean | string, failed?: boolean | SetValueOptions, alarmed?: boolean, description?: string) => boolean
  /** Store a value without redrawing */
  storeValue: (tag: string | number, value: number | boolean | string, failed?: boolean, alarmed?: boolean, description?: string) => boolean
  /** Flush stored values to display */
  updateValues: (values?: Record<string, number | boolean | string> | null) => boolean
  /** Zoom to a specific level */
  zoomTo: (zoomLevel: number, target?: ZoomTarget) => boolean
  /** Pan by delta amounts */
  moveBy: (dx: number, dy: number) => boolean
  /** Reset zoom to original view */
  zoomToOriginal: () => boolean
  /** Show/hide toolbar buttons */
  enableTools: (options: ToolsOptions) => boolean
  /** Enable/disable mouse interactions */
  enableMouse: (options: MouseOptions) => boolean
  /** Configure mouse wheel behavior */
  setMouseWheel: (options: MouseWheelOptions) => boolean
  /** Enable/disable keyboard */
  enableKeyboard: (options: KeyboardOptions) => boolean
  /** Enable/disable alarm flash */
  enableAlarmFlash: (enabled: boolean) => boolean
  /** Hide watermark */
  hideWatermark: () => boolean
  /** Set a single color */
  setColor: (colorNumber: number, colorCode: string) => boolean
  /** Set multiple colors */
  setColors: (colorsTable: Record<string, string>) => boolean
  /** Reset all data */
  resetData: () => boolean
  /** Emit a custom event */
  emitEvent: (type: string, detail?: any) => void
  /** Version constant */
  VERSION: string
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a data processor instance
 *
 * @param options - Configuration options
 * @param options.websageEngine - The WebSAGE engine instance
 * @param options.eventTarget - Element to dispatch events on
 * @param options.config - Configuration options
 * @param options.config.colorTable - Color table for dynamic styling
 * @param options.state - Reference to state object (uses engine state if not provided)
 * @returns Data processor instance
 */
export function createDataProcessor(options: DataProcessorOptions): DataProcessorEngine {
  const {
    websageEngine,
    eventTarget,
    config = {},
    state: externalState,
  } = options

  if (!websageEngine) {
    throw new Error('createDataProcessor: websageEngine is required')
  }
  if (!eventTarget) {
    throw new Error('createDataProcessor: eventTarget is required')
  }

  // Use external state or get from engine
  const state = externalState || (websageEngine as any).state

  // Color table reference
  const colorTable: string[] = config.colorTable || []

  // ============================================
  // EVENT EMISSION
  // ============================================

  /**
   * Emit a CustomEvent
   * @param type - Event type
   * @param detail - Event detail object
   */
  function emitEvent(type: string, detail: any = {}): void {
    const event = new CustomEvent(type, {
      bubbles: true,
      composed: true, // Important for Shadow DOM
      detail: {
        ...detail,
      },
    })
    eventTarget.dispatchEvent(event)
  }

  /**
   * Emit an update event after data processing
   * @param handle - Optional handle ID from the request
   * @param error - Error if any
   */
  function emitUpdateEvent(handle: string | null = null, error: Error | null = null): void {
    emitEvent('scadavis-updated', {
      type: 'updated',
      handle: handle,
      version: VERSION,
      error: error ? error.message : null,
    })
  }

  // ============================================
  // DATA PROCESSING METHODS
  // ============================================

  /**
   * Process OAS API format tags data
   *
   * Parses the tags array from OAS API format and updates internal state.
   * Handles analog (float), digital (bool), and string types.
   *
   * @param tags - Array of tag objects from OAS API
   * @param handle - Optional handle ID for response
   * @returns True if processing succeeded
   */
  function processTagsData(tags: OASApiTag[], handle: string | null = null): boolean {
    let error: Error | null = null

    try {
      for (let i = 0; i < tags.length; i++) {
        const vars = tags[i]
        const tag = vars.path

        // Default type based on value if not specified
        if (!vars.hasOwnProperty('type')) {
          vars.type = typeof vars.value === 'boolean' ? 'bool' : 'float'
        }

        // Default quality to true if not specified
        if (!vars.hasOwnProperty('quality')) {
          vars.quality = true
        }

        // Initialize parameters if not present
        if (!vars.hasOwnProperty('parameters')) {
          vars.parameters = {}
        }
        if (!vars.parameters.hasOwnProperty('Value')) {
          vars.parameters.Value = {}
        }
        if (!vars.parameters.hasOwnProperty('HighAlarmLimit')) {
          vars.parameters.HighAlarmLimit = {}
        }
        if (!vars.parameters.hasOwnProperty('LowAlarmLimit')) {
          vars.parameters.LowAlarmLimit = {}
        }

        // Determine point key as string
        // If TagClientItem provides a valid key, prefer it; otherwise use the tag path.
        const tagClientItem = (vars.parameters.Value as OASApiTagValue)?.TagClientItem
        const pointKey = tagClientItem !== undefined && tagClientItem !== null && tagClientItem !== ''
          ? String(tagClientItem)
          : String(tag)

        // Update state using Map-based structure
        state.NPTS.set(tag, pointKey)
        state.TAGS.set(pointKey, tag)

        // Get or create point data object
        const point = websageEngine.getOrCreatePoint(pointKey)
        point.tag = tag
        point.description = (vars.parameters.Value as OASApiTagValue)?.Desc || tag
        point.substation = (vars.parameters.Value as OASApiTagValue)?.LocationLevel0 || ''
        point.bay = (vars.parameters.Value as OASApiTagValue)?.LocationLevel1 || ''
        point.time = (vars.parameters.Value as OASApiTagValue)?.TimeStamp || new Date().getTime()
        point.annotation = (vars.parameters.Value as OASApiTagValue)?.BlockingAnnotation || ''

        if (vars.type === 'float') {
          // Analog value
          const highLimit = (vars.parameters.HighAlarmLimit as OASApiAlarmLimit)?.Value
          const lowLimit = (vars.parameters.LowAlarmLimit as OASApiAlarmLimit)?.Value
          point.limSup = highLimit !== undefined ? parseFloat(String(highLimit)) : Number.POSITIVE_INFINITY
          point.limInf = lowLimit !== undefined ? parseFloat(String(lowLimit)) : Number.NEGATIVE_INFINITY
          point.value = vars.value as number
          if (typeof point.value === 'number' && isNaN(point.value)) {
            console.warn('[NaN DEBUG] processTagsData: NaN detected in float value for', tag)
          }
          point.flags = vars.quality ? 0x20 : 0x20 | 0x80
        } else if (vars.type === 'bool') {
          // Digital state
          point.statusOn = (vars.parameters.Value as OASApiTagValue)?.DigitalAlarmTextAppendTrue || '_TRUE_'
          point.statusOff = (vars.parameters.Value as OASApiTagValue)?.DigitalAlarmTextAppendFalse || '_FALSE_'
          point.flags = vars.quality ? 0x00 : 0x80

          if (vars.value) {
            // ON
            point.value = true
            point.flags = point.flags | 0x02
          } else {
            // OFF
            point.value = false
            point.flags = point.flags | 0x01
          }

          // Handle out of range for double point binary
          const oor = (vars.parameters.Value as OASApiTagValue)?.OutOfRange || 0
          if (oor !== 0) {
            point.value = !!vars.value
            point.flags = point.flags | (vars.value ? 0x03 : 0x00)
          }
        } else if (vars.type === 'string') {
          // String value
          const highLimit = (vars.parameters.HighAlarmLimit as OASApiAlarmLimit)?.Value
          const lowLimit = (vars.parameters.LowAlarmLimit as OASApiAlarmLimit)?.Value
          point.limSup = highLimit !== undefined ? parseFloat(String(highLimit)) : Number.POSITIVE_INFINITY
          point.limInf = lowLimit !== undefined ? parseFloat(String(lowLimit)) : Number.NEGATIVE_INFINITY
          point.value = String(vars.value)
          point.flags = vars.quality ? 0x00 : 0x80
        }

        // Set alarmed flag
        point.flags = point.flags | ((vars.parameters.Value as OASApiTagValue)?.Alarmed ? 0x100 : 0)
      }

      // Trigger display update
      websageEngine.showValsSVG()
    } catch (e) {
      error = e as Error
      console.error('processTagsData error:', e)
    }

    emitUpdateEvent(handle, error)
    return error === null
  }

  /**
   * Process Google Sheets format valueRanges data
   *
   * Parses the valueRanges array from Google Sheets API format.
   * Infers types from values (boolean, number, string).
   *
   * @param valueRanges - Array of valueRange objects from Google Sheets API
   * @param handle - Optional handle ID for response
   * @returns True if processing succeeded
   */
  function processValueRanges(valueRanges: ValueRange[], handle: string | null = null): boolean {
    let error: Error | null = null

    try {
      for (let i = 0; i < valueRanges.length; i++) {
        const range = valueRanges[i]

        // majorDimension must be ROWS (but can not be present on data)
        if (
          !range.hasOwnProperty('majorDimension') ||
          range.majorDimension === 'ROWS'
        ) {
          for (let j = 0; j < range.values.length; j++) {
            const vars = range.values[j]

            let value: number | null = null
            let qual = true
            let ts: number | null = null
            let tag: string | null = null
            let desc: string | null = null
            let vnumb1: number | null = null
            let vnumb2: number | null = null
            let vbool1: boolean | null = null
            let vbool2: boolean | null = null
            let vstr1: string | null = null
            let vstr2: string | null = null
            let digital = false

            // Parse values by type
            for (let k = 0; k < vars.length; k++) {
              switch (typeof vars[k]) {
                case 'boolean': // use as quality
                  if (vbool1 !== null && vbool2 === null) vbool2 = vars[k]
                  if (vbool1 === null) vbool1 = vars[k]
                  break
                case 'number': // use as value or timestamp
                  if (vnumb1 !== null && vnumb2 === null) vnumb2 = vars[k]
                  if (vnumb1 === null) vnumb1 = vars[k]
                  break
                case 'string': // use as tag (as long as dont repeat)
                  if (vstr1 !== null && vstr2 === null) vstr2 = vars[k]
                  if (vstr1 === null) vstr1 = vars[k]
                  break
                default:
                  break
              }
            }

            // First try to find a value
            if (vnumb1 !== null) {
              value = vnumb1
              if (vstr1 !== null && isNaN(parseFloat(vstr1))) {
                // so tag can be the first string
                tag = vstr1
              } else if (vstr2 !== null && isNaN(parseFloat(vstr2))) {
                // or the second string
                tag = vstr2
              }
            } else {
              // Can't find a type number, then try to use the string as value if possible
              if (vstr1 !== null && !isNaN(parseFloat(vstr1))) {
                value = parseFloat(vstr1) // a number
                if (vstr2 !== null && isNaN(parseFloat(vstr2))) {
                  // so tag can be the second string
                  tag = vstr2
                }
              } else if (vstr2 !== null && !isNaN(parseFloat(vstr2))) {
                // Try the reverse
                value = parseFloat(vstr2) // a number
                if (vstr1 !== null && isNaN(parseFloat(vstr1))) {
                  // so tag can be the first string
                  tag = vstr1
                }
              }
            }

            // If don't have a value but has 1 or 2 bools, the first is value and the second is quality (digital point)
            if (value === null && vbool1 !== null) {
              value = vbool1 ? 1 : 0
              digital = true
              if (vbool2 !== null) qual = vbool2
            } else {
              // Has value
              if (vbool1 !== null) {
                // So bool is quality
                qual = vbool1
              }
              // A second number may be a timestamp
              if (vnumb2 !== null) {
                ts = vnumb2
              }
            }

            if (tag === null || tag === '') {
              // Could not find a tag
              tag = (range.range || 'range') + '-' + (j + 1) // use range and the row number for the range
            } else {
              // Has tag, second string can be a description
              if (vstr2 !== null) desc = vstr2
            }

            // Use tag directly as string key
            const pointKey = String(tag)

            // Update state using Map-based structure
            state.NPTS.set(tag, pointKey)
            state.TAGS.set(pointKey, tag)

            // Get or create point data object
            const point = websageEngine.getOrCreatePoint(pointKey)
            point.tag = tag
            point.description = desc || tag
            point.substation = range.range
            point.bay = ''
            point.time = ts || new Date().getTime()
            point.annotation = ''

            if (!digital) {
              // Analog value
              point.limSup = 999999999
              point.limInf = -999999999
              point.value = value ?? 0
              point.flags = qual ? 0x00 : 0x80
            } else {
              // Digital state
              point.statusOn = '_TRUE_'
              point.statusOff = '_FALSE_'
              point.flags = qual ? 0x20 : 0x20 | 0x80

              if (value && value !== 0) {
                // ON
                point.value = 0
                point.flags = point.flags | 0x02
              } else {
                // OFF
                point.value = 1
                point.flags = point.flags | 0x01
              }
            }
          }
        }
      }

      // Trigger display update
      websageEngine.showValsSVG()
    } catch (e) {
      error = e as Error
      console.error('processValueRanges error:', e)
    }

    emitUpdateEvent(handle, error)
    return error === null
  }

  /**
   * Process raw data object (supports both OAS API and Google Sheets formats)
   *
   * @param obj - Data object to process
   * @param handle - Optional handle ID for response
   * @returns True if processing succeeded
   */
  function processData(obj: DataInput, handle: string | null = null): boolean {
    let error: Error | null = null

    try {
      // Handle OAS API wrapped data
      if (obj.hasOwnProperty('data')) {
        obj = obj.data as OASApiData
      }

      // Process OAS API format
      if (obj.hasOwnProperty('tags')) {
        processTagsData(obj.tags!, null)
      }

      // Process Google Sheets format
      if (obj.hasOwnProperty('valueRanges')) {
        processValueRanges(obj.valueRanges!, null)
      }
    } catch (e) {
      error = e as Error
      console.error('processData error:', e)
    }

    emitUpdateEvent(handle, error)
    return error === null
  }

  // ============================================
  // COMMAND METHODS
  // ============================================

  /**
   * Zoom to a specific level, optionally centered on a target
   *
   * @param zoomLevel - Zoom level (higher = more zoomed in)
   * @param target - Target element ID or {x, y} coordinates
   * @returns True if zoom succeeded
   */
  function zoomTo(zoomLevel: number, target: ZoomTarget = null): boolean {
    if (!state.SVGDoc) {
      return false
    }

    try {
      let tx = 0
      let ty = 0

      // Determine target center point
      if (typeof target === 'string' && state.SVGDoc.getElementById(target)) {
        const bbox = state.SVGDoc.getElementById(target).getBBox()
        tx = bbox.x + bbox.width / 2
        ty = bbox.y + bbox.height / 2
      } else if (typeof target === 'object' && target !== null) {
        tx = target.x || 0
        ty = target.y || 0
      }

      // Calculate new viewBox dimensions
      const w = state.g_zpW / zoomLevel
      const h = state.g_zpH / zoomLevel
      const x =
        state.g_zpX - (w - state.g_zpW) * ((tx - state.g_zpX) / state.g_zpW)
      const y =
        state.g_zpY - (h - state.g_zpH) * ((ty - state.g_zpY) / state.g_zpH)

      // Update zoom state
      state.g_zpX = x
      state.g_zpY = y
      state.g_zpW = w
      state.g_zpH = h

      // Apply to SVG
      state.SVGDoc.setAttributeNS(
        null,
        'viewBox',
        `${state.g_zpX} ${state.g_zpY} ${state.g_zpW} ${state.g_zpH}`
      )

      emitEvent('scadavis-zoom', {
        type: 'zoomTo',
        zoomLevel,
        target,
        viewBox: {
          x: state.g_zpX,
          y: state.g_zpY,
          width: state.g_zpW,
          height: state.g_zpH,
        },
      })

      return true
    } catch (e) {
      console.error('zoomTo error:', e)
      return false
    }
  }

  /**
   * Pan the view by specified amounts
   *
   * @param dx - Horizontal pan distance
   * @param dy - Vertical pan distance
   * @returns True if pan succeeded
   */
  function moveBy(dx: number, dy: number): boolean {
    if (!state.SVGDoc) {
      return false
    }

    try {
      state.g_zpX += dx
      state.g_zpY += dy

      state.SVGDoc.setAttributeNS(
        null,
        'viewBox',
        `${state.g_zpX} ${state.g_zpY} ${state.g_zpW} ${state.g_zpH}`
      )

      emitEvent('scadavis-pan', {
        type: 'moveBy',
        dx,
        dy,
        viewBox: {
          x: state.g_zpX,
          y: state.g_zpY,
          width: state.g_zpW,
          height: state.g_zpH,
        },
      })

      return true
    } catch (e) {
      console.error('moveBy error:', e)
      return false
    }
  }

  /**
   * Reset zoom to original viewBox dimensions
   *
   * @returns True if reset succeeded
   */
  function zoomToOriginal(): boolean {
    if (!state.SVGDoc) {
      return false
    }

    try {
      // Restore to the container dimensions recorded at load time,
      // which match the iframe's initial 1:1 SVG-unit-to-CSS-pixel zoom level.
      state.g_zpX = 0
      state.g_zpY = 0
      state.g_zpW = state.g_containerW || state.ScreenViewer_SVGMaxWidth
      state.g_zpH = state.g_containerH || state.ScreenViewer_SVGMaxHeight

      state.SVGDoc.setAttributeNS(
        null,
        'viewBox',
        `${state.g_zpX} ${state.g_zpY} ${state.g_zpW} ${state.g_zpH}`
      )

      emitEvent('scadavis-zoom', {
        type: 'zoomToOriginal',
        viewBox: {
          x: state.g_zpX,
          y: state.g_zpY,
          width: state.g_zpW,
          height: state.g_zpH,
        },
      })

      return true
    } catch (e) {
      console.error('zoomToOriginal error:', e)
      return false
    }
  }

  /**
   * Show/hide zoom and pan toolbar buttons
   *
   * @param options - Toolbar options
   * @param options.zoomEnabled - Show/hide zoom buttons
   * @param options.panEnabled - Show/hide pan buttons
   * @returns True if successful
   */
  function enableTools(options: ToolsOptions): boolean {
    try {
      const root = eventTarget.shadowRoot ? eventTarget.shadowRoot : eventTarget as Element & DocumentFragment

      const zoomInBtn = root.getElementById('ZOOMIN_ID')
      const zoomOutBtn = root.getElementById('ZOOMOUT_ID')
      const moveBtn = root.getElementById('MOVE_ID')

      if (zoomInBtn && 'zoomEnabled' in options) {
        zoomInBtn.style.display = options.zoomEnabled ? '' : 'none'
      }
      if (zoomOutBtn && 'zoomEnabled' in options) {
        zoomOutBtn.style.display = options.zoomEnabled ? '' : 'none'
      }
      if (moveBtn && 'panEnabled' in options) {
        moveBtn.style.display = options.panEnabled ? '' : 'none'
      }

      return true
    } catch (e) {
      console.error('enableTools error:', e)
      return false
    }
  }

  /**
   * Enable/disable mouse pan and zoom interactions
   *
   * @param options - Mouse options
   * @param options.panEnabled - Enable/disable pan via mouse
   * @param options.zoomEnabled - Enable/disable zoom via mouse
   * @returns True if successful
   */
  function enableMouse(options: MouseOptions): boolean {
    try {
      // Store in state for use by event handlers
      if ('panEnabled' in options) {
        state.mousePanBlocked = options.panEnabled === false
      }
      if ('zoomEnabled' in options) {
        state.mouseZoomBlocked = options.zoomEnabled === false
      }

      emitEvent('scadavis-mouse-config', {
        type: 'enableMouse',
        panEnabled: options.panEnabled,
        zoomEnabled: options.zoomEnabled,
      })

      return true
    } catch (e) {
      console.error('enableMouse error:', e)
      return false
    }
  }

  /**
   * Configure mouse wheel behavior
   *
   * @param options - Mouse wheel options
   * @param options.directionBackOut - Reverse scroll direction
   * @param options.blockEventPropagation - Prevent event bubbling
   * @returns True if successful
   */
  function setMouseWheel(options: MouseWheelOptions): boolean {
    try {
      if ('directionBackOut' in options) {
        state.wheelDirBackOut = options.directionBackOut === true
      }
      if ('blockEventPropagation' in options) {
        state.wheelBlockEventPropagation =
          options.blockEventPropagation === true
      }

      emitEvent('scadavis-mousewheel-config', {
        type: 'setMouseWheel',
        directionBackOut: options.directionBackOut,
        blockEventPropagation: options.blockEventPropagation,
      })

      return true
    } catch (e) {
      console.error('setMouseWheel error:', e)
      return false
    }
  }

  /**
   * Enable/disable keyboard interactions
   *
   * @param options - Keyboard options
   * @param options.enabled - Enable/disable keyboard interactions
   * @returns True if successful
   */
  function enableKeyboard(options: KeyboardOptions): boolean {
    try {
      if ('enabled' in options) {
        state.keyboardBlocked = options.enabled === false
      }

      emitEvent('scadavis-keyboard-config', {
        type: 'enableKeyboard',
        enabled: options.enabled,
      })

      return true
    } catch (e) {
      console.error('enableKeyboard error:', e)
      return false
    }
  }

  /**
   * Enable/disable alarm blinking animation
   *
   * @param enabled - Enable/disable alarm flash
   * @returns True if successful
   */
  function enableAlarmFlash(enabled: boolean): boolean {
    try {
      // The WebSAGE engine handles the blink timer
      // This flag controls whether blinking is active
      state.alarmFlashEnabled = enabled === true

      emitEvent('scadavis-alarm-flash-config', {
        type: 'enableAlarmFlash',
        alarmFlashEnabled: enabled,
      })

      return true
    } catch (e) {
      console.error('enableAlarmFlash error:', e)
      return false
    }
  }

  /**
   * Hide the SCADAvis watermark
   *
   * @returns True if successful
   */
  function hideWatermark(): boolean {
    try {
      const root = eventTarget.shadowRoot ? eventTarget.shadowRoot : eventTarget as Element & DocumentFragment
      const watermark = root.getElementById('WATERMARK')

      if (watermark) {
        watermark.style.display = 'none'
      }

      return true
    } catch (e) {
      console.error('hideWatermark error:', e)
      return false
    }
  }

  /**
   * Update a single color in the color table
   *
   * @param colorNumber - Color index (-1 for background color)
   * @param colorCode - CSS color value
   * @returns True if successful
   */
  function setColor(colorNumber: number, colorCode: string): boolean {
    try {
      if (typeof colorNumber !== 'number' || typeof colorCode !== 'string') {
        return false
      }

      if (colorNumber === -1) {
        websageEngine.setBgColor(colorCode)
      } else {
        colorTable[colorNumber] = colorCode
        // Trigger redraw to apply color change
        websageEngine.showValsSVG()
      }

      emitEvent('scadavis-color-change', {
        type: 'setColor',
        colorNumber,
        colorCode,
      })

      return true
    } catch (e) {
      console.error('setColor error:', e)
      return false
    }
  }

  /**
   * Update multiple colors in the color table
   *
   * @param colorsTable - Object mapping color indices to color codes
   * @returns True if successful
   */
  function setColors(colorsTable: Record<string, string>): boolean {
    try {
      if (typeof colorsTable !== 'object' || colorsTable === null) {
        return false
      }

      for (const colorNumber in colorsTable) {
        if (Object.prototype.hasOwnProperty.call(colorsTable, colorNumber)) {
          const num = parseInt(colorNumber)
          if (num === -1) {
            websageEngine.setBgColor(colorsTable[colorNumber])
          } else {
            colorTable[num] = colorsTable[colorNumber]
          }
        }
      }

      // Trigger redraw to apply color changes
      websageEngine.showValsSVG()

      emitEvent('scadavis-color-change', {
        type: 'setColors',
        colorsTable,
      })

      return true
    } catch (e) {
      console.error('setColors error:', e)
      return false
    }
  }

  /**
   * Clear all tag data and reset state maps
   *
   * @returns True if successful
   */
  function resetData(): boolean {
    try {
      if (state.points) state.points.clear()
      if (state.TAGS) state.TAGS.clear()
      if (state.NPTS) state.NPTS.clear()
      if (state.INVTAGS) state.INVTAGS.clear()

      emitEvent('scadavis-data-reset', {
        type: 'resetData',
      })

      return true
    } catch (e) {
      console.error('resetData error:', e)
      return false
    }
  }

  // ============================================
  // VALUE WRITE HELPERS
  // ============================================

  function storeValue(tag: string | number, value: number | boolean | string, failed?: boolean, alarmed?: boolean, description?: string): boolean {
    if (tag === '' || tag === undefined || tag === null) return true
    failed = failed || false
    alarmed = alarmed || false
    description =
      description !== undefined && description !== null ?
        description
      : String(tag)

    const pointKey = String(tag)
    state.NPTS.set(tag, pointKey)
    state.TAGS.set(pointKey, String(tag))
    
    const point = websageEngine.getOrCreatePoint(pointKey)

    point.tag = String(tag)
    point.description = description

    if (typeof value === 'boolean') {
      // Digital point
      if (!point.statusOn) point.statusOn = '_TRUE_'
      if (!point.statusOff) point.statusOff = '_FALSE_'
      point.flags = failed ? 0x80 : 0x00
      point.value = value
      point.flags |= value ? 0x02 : 0x01
      if (alarmed) point.flags |= 0x100
    } else {
      // Analog or string point
      point.value = value as any
      if (typeof point.value === 'number' && isNaN(point.value)) {
        console.warn('[NaN DEBUG] storeValue: NaN detected in analog value for', tag)
      }
      point.flags = (failed ? 0x80 : 0x20) | (alarmed ? 0x100 : 0)
    }

    return true
  }

  /**
   * Flush all values written by storeValue() to the display.
   * Since storeValue() already wrote directly into the engine's point store,
   * this only needs to trigger a redraw.
   * Mirrors synopticapi.js updateValues().
   *
   * @param values - Optional additional { tag: value } pairs to include
   * @returns True if successful
   */
  function updateValues(values?: Record<string, number | boolean | string> | null): boolean {
    if (typeof values === 'object' && values !== null) {
      Object.keys(values).forEach((tag) => storeValue(tag, values[tag]))
    }
    websageEngine.showValsSVG()
    emitUpdateEvent(null, null)
    return true
  }

  /**
   * Write a value into the engine's point store and immediately redraw.
   * Mirrors synopticapi.js setValue().
   *
   * Point addressing: `tag` can be a string tag name or a numeric point number.
   *
   * @param tag - Tag name or point number
   * @param value - Value for the tag
   * @param failed - Whether the point is in failed state (or SetValueOptions object)
   * @param alarmed - Whether the point is alarmed
   * @param description - Optional description
   * @returns True if successful
   */
  function setValue(tag: string | number, value: number | boolean | string, failed?: boolean | SetValueOptions, alarmed?: boolean, description?: string): boolean {
    // Support both object-options style {failed, alarmed, description}
    // and positional-args style (tag, value, failed, alarmed, description)
    let f: boolean = false
    let a: boolean = false
    let d: string | null = null
    if (typeof failed === 'object' && failed !== null) {
      f = (failed.failed as boolean) || false
      a = (failed.alarmed as boolean) || false
      d = failed.description || null
    } else {
      f = (failed as boolean) || false
      a = (alarmed as boolean) || false
      d = description || null
    }

    try {
      storeValue(tag, value, f, a, d ?? undefined)
      websageEngine.showValsSVG()
      emitUpdateEvent(null, null)
      return true
    } catch (e) {
      console.error('setValue error:', e)
      return false
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    // Data processing methods
    processTagsData,
    processValueRanges,
    processData,
    setValue,
    storeValue,
    updateValues,

    // Command methods
    zoomTo,
    moveBy,
    zoomToOriginal,
    enableTools,
    enableMouse,
    setMouseWheel,
    enableKeyboard,
    enableAlarmFlash,
    hideWatermark,
    setColor,
    setColors,
    resetData,

    // Utility
    emitEvent,

    // Version
    VERSION,
  }
}
