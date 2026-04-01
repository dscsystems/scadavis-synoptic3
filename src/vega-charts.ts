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
 * Vega Charts Module - Context-Aware Factory Function
 *
 * This module provides a factory function that creates isolated Vega chart
 * integration instances for use in Web Components. Each instance maintains
 * its own state and operates within a provided DOM context.
 *
 * Supports:
 * - #arc - D3 donut/arc charts with animated transitions
 * - #vega-lite - Vega-Lite specifications compiled to Vega
 * - #vega / #vega3 / #vega4 / #vega5 - Vega specifications
 * - #vega-json - JSON-updated Vega charts with periodic refresh
 *
 * @module vega-charts
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/** External libraries that can be injected */
export interface VegaExternalLibs {
  d3?: any
  vega?: any
  vegaLite?: any
  $?: any
}

/** Point data structure from state */
export interface PointData {
  value: number
  flags: number
  time: number
  tag: string
  substation: string
  bay: string
  description: string
  annotation: string
  statusOn: string
  statusOff: string
  limSup: number
  limInf: number
}

/** Application state reference */
export interface VegaState {
  points?: Map<string, PointData>
  SVGDoc?: Document | null
  InkSage?: InkSageItem[]
  V?: any
  F?: any
  TAGS?: string[]
}

/** InkSage item from SVG parsing with extended properties */
export interface InkSageItem {
  tag?: string
  parent?: ChartElement
  attr?: Record<string, string>
  valores?: any
  datas?: any
}

/** Extended SVG Element with chart properties - using any for flexibility with dynamic properties */
export type ChartElement = any

/** InkSage label parent reference type */
export type ChartElementRef = any

/** Label configuration from SVG element */
export interface InkSageLabel {
  tag: string
  src: string
  prompt: string
  parent: Element
}

/** Event detail for history requests */
export interface VegaHistoryRequestEventDetail {
  point: string
  timespan: number
  dataini?: number
  datafim?: number
  item: InkSageItem
}

/** Options for creating a Vega Charts instance */
export interface VegaChartsOptions {
  websageEngine?: any
  rootElement: Element | ShadowRoot
  eventTarget: Element
  externalLibs?: VegaExternalLibs
  state?: VegaState
}

/** Vega Charts Engine public API interface */
export interface VegaChartsEngine {
  initializeExtended: (inksageLabelvec: InkSageLabel[], lbv?: number, item?: Element) => void
  executeExtended: (i: number) => void
  updateChartData: (chartId: string, data: any[]) => void
  destroy: () => void
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a Vega Charts integration instance
 *
 * @param options - Configuration options
 * @param options.websageEngine - The WebSAGE engine instance
 * @param options.rootElement - The shadowRoot or container element for DOM queries
 * @param options.eventTarget - Element to dispatch events on
 * @param options.externalLibs - External libraries { d3, vega, vegaLite, $ }
 * @param options.state - Reference to state (V, F, TAGS, etc.)
 * @returns Vega Charts integration instance
 */
export function createVegaCharts(options: VegaChartsOptions): VegaChartsEngine {
  const { websageEngine, rootElement, eventTarget, externalLibs, state } = options

  // ============================================
  // ENCAPSULATED STATE
  // ============================================

  // Counter for unique Vega chart IDs
  let vegaNum = 0

  // Track intervals for cleanup
  const intervals: any[] = []

  // Track Vega views for cleanup
  const vegaViews: any[] = []

  // Default return value for unresolved tags
  const retnok = '????'

  /**
   * Extract index from placeholder string like "PNT#1"
   * @param placeholder - Placeholder string
   * @returns Index (0-based) or -1 if invalid
   */
  function getPlaceholderIndex(placeholder: string): number {
    const parts = placeholder.split('#')
    if (parts.length < 2) return -1
    const idx = parseInt(parts[1], 10)
    return isNaN(idx) ? -1 : idx - 1 // Convert to 0-based index
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Emit a CustomEvent
   * @param type - Event type
   * @param detail - Event detail object
   */
  function emitEvent(type: string, detail: any = {}): void {
    const event = new CustomEvent(type, {
      bubbles: true,
      composed: true,
      detail: { ...detail },
    })
    eventTarget.dispatchEvent(event)
  }

  /**
   * Query selector scoped to rootElement (jQuery-style)
   * @param selector - CSS selector
   * @returns Element|null
   */
  function scopedQuery(selector: string): Element | null {
    return rootElement.querySelector(selector)
  }

  /**
   * Get element by ID scoped to rootElement
   * @param id - Element ID
   * @returns Element|null
   */
  function getElementById(id: string): any {
    if ('getElementById' in rootElement) {
      return (rootElement as ShadowRoot).getElementById(id)
    }
    return rootElement.querySelector('#' + id)
  }

  /**
   * Resolve value with coded handling
   * @param tagornumber - Tag or point number
   * @param item - SVG element context
   * @returns Resolved value
   */
  function valueResolveCoded(tagornumber: string | number, item: any): string | number {
    // Check for coded values in the item's coded values map
    if (item._codedValues && item._codedValues[tagornumber] !== undefined) {
      return item._codedValues[tagornumber]
    }

    // Use websageEngine's getValue if available
    if (websageEngine && websageEngine.getValue) {
      const val = websageEngine.getValue(tagornumber)
      if (val !== undefined && val !== null && !isNaN(val)) {
        return val
      }
    }

    // Check state.points Map directly
    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        return state.points.get(key)!.value
      }
    }

    return retnok
  }

  /**
   * Get flags for a point
   * @param tagornumber - Tag or point number
   * @returns Flags value
   */
  function getFlags(tagornumber: string | number): number {
    if (websageEngine && websageEngine.getFlags) {
      return websageEngine.getFlags(tagornumber)
    }

    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        const f = state.points.get(key)!.flags
        if (!isNaN(f)) return f
      }
    }
    const val = valueResolveCoded(tagornumber, {})
    return 0xa0 | (val == 0 ? 0x02 : 0x01)
  }

  /**
   * Get inferior limit for a point
   * @param tagornumber - Tag or point number
   * @returns Inferior limit
   */
  function getInfLim(tagornumber: string | number): number {
    if (websageEngine && websageEngine.getInfLim) {
      return websageEngine.getInfLim(tagornumber)
    }
    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        return state.points.get(key)!.limInf
      }
    }
    return 0
  }

  /**
   * Get superior limit for a point
   * @param tagornumber - Tag or point number
   * @returns Superior limit
   */
  function getSupLim(tagornumber: string | number): number {
    if (websageEngine && websageEngine.getSupLim) {
      return websageEngine.getSupLim(tagornumber)
    }
    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        return state.points.get(key)!.limSup
      }
    }
    return 0
  }

  /**
   * Get description for a point
   * @param tagornumber - Tag or point number
   * @returns Description
   */
  function getDescription(tagornumber: string | number): string {
    if (websageEngine && websageEngine.getDescription) {
      return websageEngine.getDescription(tagornumber)
    }
    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        return state.points.get(key)!.description
      }
    }
    return ''
  }

  /**
   * Get bay for a point
   * @param tagornumber - Tag or point number
   * @returns Bay name
   */
  function getBay(tagornumber: string | number): string {
    if (websageEngine && websageEngine.getBay) {
      return websageEngine.getBay(tagornumber)
    }
    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        return state.points.get(key)!.bay
      }
    }
    return ''
  }

  /**
   * Get substation for a point
   * @param tagornumber - Tag or point number
   * @returns Substation name
   */
  function getSubstation(tagornumber: string | number): string {
    if (websageEngine && websageEngine.getSubstation) {
      return websageEngine.getSubstation(tagornumber)
    }
    if (state?.points) {
      const key = websageEngine && websageEngine.resolvePointKey 
        ? websageEngine.resolvePointKey(tagornumber)
        : String(tagornumber)
      if (key !== null && state.points.has(key)) {
        return state.points.get(key)!.substation
      }
    }
    return ''
  }

  /**
   * Add point to the list of points to be requested
   * @param pnt - Point tag name
   */
  function addPointToList(pnt: string): void {
    if (websageEngine && websageEngine.addPointToList) {
      websageEngine.addPointToList(pnt)
    }
  }

  // ============================================
  // VEGA PARSING FUNCTIONS
  // ============================================

  /**
   * Parse and render Vega specification (V3+)
   * @param spec - Vega specification
   * @param item - SVG rectangle element
   * @param context - Additional context
   */
  function parseVegaSpec(spec: any, item: any, context: any): void {
    // Get vega and d3 from externalLibs dynamically
    const vega = externalLibs?.vega || (window as any).vega
    const d3 = externalLibs?.d3 || (window as any).d3
    
    if (!vega) {
      console.error('Vega library not available')
      return
    }

    // Determine table name from spec
    if (typeof spec.data[0].name !== 'undefined') {
      item.vgTableName = item.vgTableName || []
      item.vgTableName[0] = spec.data[0].name
    } else {
      item.vgTableName = item.vgTableName || []
      item.vgTableName[0] = 'table'
    }

    // Parse and create view
    const view = vega.parse(spec)

    vegaNum++
    item.vgId = 'vega_' + vegaNum

    // Create container for the chart
    const vegaChartsContainer = getElementById('VEGACHARTS')
    if (vegaChartsContainer) {
      const chartDiv = document.createElement('div')
      chartDiv.id = item.vgId
      vegaChartsContainer.appendChild(chartDiv)
    }

    // Create Vega view
    item.vw = new vega.View(view, { renderer: 'svg' }).initialize().run()

    // Track view for cleanup
    vegaViews.push(item.vw)

    item.vw.runAfter(function () {
      const pms = item.vw.toSVG()
      pms.then(function (svgstr: string) {
        // Restore format if needed
        if (
          typeof item.vgFormat !== 'undefined' &&
          typeof item.vw._model !== 'undefined'
        ) {
          item.vw._model._defs.data[0].format = item.vgFormat
        }

        // Determine layer
        let layer = 'layer1'
        const sodipodibase = state?.SVGDoc
          ? state.SVGDoc.getElementById('base')
          : null
        if (sodipodibase && sodipodibase.attributes['inkscape:current-layer']) {
          layer = sodipodibase.attributes['inkscape:current-layer'].value
        }

        // Select SVG document
        const svg = d3.select(state?.SVGDoc)

        // Remove existing element with same name
        svg.select('#vg_' + item.id).remove()

        // Append new group
        if (item.parentNode && item.parentNode.nodeName === 'g') {
          item.vg = svg
            .select('#' + item.parentNode.id)
            .append('g')
            .html(svgstr)
        } else {
          item.vg = svg
            .select('#' + layer)
            .append('g')
            .html(svgstr)
        }

        // Set ID
        if (item.vg._groups && item.vg._groups[0] && item.vg._groups[0][0]) {
          item.vg._groups[0][0].id = 'vg_' + item.id

          // Position according to the rectangle
          const transform =
            (item.getAttributeNS(null, 'transform') || '') +
            ' translate(' +
            item.getAttributeNS(null, 'x') +
            ' ' +
            item.getAttributeNS(null, 'y') +
            ') ' +
            ' scale(' +
            item.getAttributeNS(null, 'width') / (item.vw._width || 100) +
            ' ' +
            item.getAttributeNS(null, 'height') / (item.vw._height || 100) +
            ') '

          item.vg._groups[0][0].setAttributeNS(null, 'transform', transform)
          item.inittransform = transform
        }

        // Store initial data
        if (
          item.vw._runtime &&
          item.vw._runtime.data &&
          item.vw._runtime.data[item.vgTableName[0]]
        ) {
          item.vgInitData = JSON.parse(
            JSON.stringify(
              item.vw._runtime.data[item.vgTableName[0]].values.value,
            ),
          )
        }
      })
    })
  }

  // ============================================
  // INITIALIZATION HANDLERS
  // ============================================

  /**
   * Initialize arc chart
   * @param label - Label configuration
   * @param item - SVG rectangle element
   */
  function initializeArc(label: InkSageLabel, item: ChartElementRef): void {
    // Get d3 from externalLibs dynamically (may not be available at factory creation time)
    const d3 = externalLibs?.d3 || (window as any).d3
    
    // Skip if already initialized - prevents scale(0,0) bug when re-initializing hidden elements
    if (item._d3arc) {
      return
    }
    
    if (!d3) {
      console.error('D3 library not available for arc chart')
      return
    }

    if (!item) {
      console.error('initializeArc: No item element provided')
      return
    }

    if (!item.parentNode) {
      console.error('initializeArc: Item has no parentNode')
      return
    }

    addPointToList(label.src)
    item._d3arc_tag = label.src

    // Parse parameters
    const params = (label.prompt || '0,100,0,750').split(',')
    item._d3arc_min = parseFloat(params[0] || '0')
    item._d3arc_max = parseFloat(params[1] || '100')
    item._d3arc_innerRadius = parseFloat(params[2] || '0')
    item._d3arc_duration = parseFloat(params[3] || '750')

    // Create D3 arc generator
    const arc = d3
      .arc()
      .innerRadius(item._d3arc_innerRadius)
      .outerRadius(100)
      .startAngle(0)
      .endAngle(0)

    // Append path to parent
    const sl = d3
      .select(item.parentNode)
      .append('path')
      .style('fill', 'red')
      .attr('d', arc)

    item._d3arc = sl
    item._d3arc.datum({ oldAngle: 0 })

    // Copy styles
    if (sl._groups && sl._groups[0] && sl._groups[0][0]) {
      sl._groups[0][0].style.cssText = item.style.cssText

      // Set transform
      const bb = item.getBBox()
      sl._groups[0][0].setAttributeNS(
        null,
        'transform',
        (item.getAttributeNS(null, 'transform') || '') +
          ' translate( ' +
          (bb.x + bb.width / 2) +
          ',' +
          (bb.y + bb.height / 2) +
          ' ' +
          ') ' +
          ' scale( ' +
          bb.width / 200 +
          ',' +
          bb.height / 200 +
          ' ' +
          ') ',
      )
    }

    // Hide the rectangle
    item.style.display = 'none'
  }

  /**
   * Initialize Vega-Lite chart
   * @param label - Label configuration
   * @param item - SVG rectangle element
   */
  function initializeVegaLite(label: InkSageLabel, item: ChartElementRef): void {
    // console.log('initializeVegaLite called with:', { label, item })
    
    // Get vegaLite and vega from externalLibs dynamically
    const vegaLite = externalLibs?.vegaLite || (window as any).vl || (window as any).vegaLite
    const vega = externalLibs?.vega || (window as any).vega
    const $ = externalLibs?.$ || (window as any).jQuery || (window as any).$
    
    // console.log('initializeVegaLite: vegaLite available:', !!vegaLite, 'vega available:', !!vega, '$ available:', !!$)
    
    if (!vegaLite || !vega) {
      console.error('Vega-Lite or Vega library not available')
      return
    }

    if (!item) {
      console.error('initializeVegaLite: No item element provided')
      return
    }

    item.vgTableName = []
    item.style.display = 'none'

    // Parse point list
    item.pnts = label.src.split(',')
    for (let j = 0; j < item.pnts.length; j++) {
      addPointToList(item.pnts[j])
    }

    /**
     * Process Vega-Lite specification
     * @param data - Vega-Lite spec object or JSON string
     */
    function processVegaLite(data: any): void {
      let spec: any
      if (typeof data === 'object') {
        spec = vegaLite.compile(data).spec
        spec['width'] = spec['width'] || 100
        spec['height'] = spec['height'] || 100
      } else {
        const obj = JSON.parse(data)
        spec = vegaLite.compile(obj).spec
        spec['width'] = spec['width'] || obj.width || 100
        spec['height'] = spec['height'] || obj.height || 100
      }

      // Handle format
      if (typeof spec['data'][0].format !== 'undefined') {
        item.vgFormat = spec['data'][0].format
        spec['data'][0].format = {}
      }

      parseVegaSpec(spec, item, {})
    }

    // Check if it's inline JSON or URL
    if (label.prompt.indexOf('{') === 0) {
      processVegaLite(label.prompt)
    } else if ($) {
      $.get(label.prompt + '?' + new Date().getTime(), processVegaLite)
    }
  }

  /**
   * Initialize Vega chart
   * @param label - Label configuration
   * @param item - SVG rectangle element
   */
  function initializeVega(label: InkSageLabel, item: ChartElementRef): void {
    // console.log('initializeVega called with:', { label, item })
    
    // Get vega and $ from externalLibs dynamically
    const vega = externalLibs?.vega || (window as any).vega
    const $ = externalLibs?.$ || (window as any).jQuery || (window as any).$
    
    // console.log('initializeVega: vega available:', !!vega, '$ available:', !!$)
    
    if (!vega) {
      console.error('Vega library not available')
      return
    }

    if (!item) {
      console.error('initializeVega: No item element provided')
      return
    }

    item.vgTableName = []
    item.style.display = 'none'

    // Parse source for points and timespan
    const srcsplit = label.src.split('|')
    if (srcsplit.length > 1) {
      const paramsplit = srcsplit[1].split(',')
      if (paramsplit.length === 0) {
        item.timespan = item.width.baseVal.value
      } else {
        item.timespan = paramsplit[0]
      }
    } else {
      item.timespan = item.width.baseVal.value
    }

    // Parse point list
    item.pnts = srcsplit[0].split(',')
    for (let j = 0; j < item.pnts.length; j++) {
      addPointToList(item.pnts[j])
    }

    /**
     * Process Vega specification
     * @param data - Vega spec object or JSON string
     */
    function processVega(data: any): void {
      let spec: any
      if (typeof data === 'object') {
        spec = data
      } else {
        spec = JSON.parse(data)
      }
      spec['width'] = spec['width'] || 100
      spec['height'] = spec['height'] || 100
      parseVegaSpec(spec, item, {})
    }

    // Check if it's inline JSON or URL
    if (label.prompt.indexOf('{') === 0) {
      const spec = JSON.parse(label.prompt)
      spec['width'] = spec['width'] || 100
      spec['height'] = spec['height'] || 100
      parseVegaSpec(spec, item, {})
    } else if ($) {
      $.get(label.prompt + '?' + new Date().getTime(), processVega)
    }
  }

  /**
   * Initialize Vega JSON chart (with periodic updates)
   * @param label - Label configuration
   * @param item - SVG rectangle element
   */
  function initializeVegaJson(label: InkSageLabel, item: ChartElementRef): void {
    // Get vega and $ from externalLibs dynamically
    const vega = externalLibs?.vega || (window as any).vega
    const $ = externalLibs?.$ || (window as any).jQuery || (window as any).$
    
    if (!vega || !$) {
      console.error('Vega or jQuery library not available')
      return
    }

    item.vgTableName = []
    item.style.display = 'none'

    /**
     * Process Vega JSON specification
     * @param data - Vega spec object or JSON string
     */
    function processVegaJson(data: any): void {
      let spec: any
      if (typeof data === 'object') {
        spec = data
      } else {
        spec = JSON.parse(data)
      }
      parseVegaSpec(spec, item, {})

      // Set up periodic updates for data sources
      if (spec.data.length > 0 && typeof spec.data[0].url !== 'undefined') {
        if (typeof spec.data[0].update_period !== 'undefined') {
          const interval = setInterval(function () {
            $.get(spec.data[0].url, function (data: any) {
              let parsedData: any
              if (typeof data === 'string') {
                parsedData = JSON.parse(data)
              } else {
                parsedData = data
              }

              item.vw
                .change(
                  spec.data[0].name,
                  vega
                    .changeset()
                    .remove(function (d: any) {
                      return true
                    })
                    .insert(parsedData),
                )
                .run()

              item.vw.runAfter(function () {
                const pms = item.vw.toSVG()
                pms.then(function (svgstr: string) {
                  item.vg.html(svgstr)
                })
              })
            })
          }, spec.data[0].update_period * 1000)

          intervals.push(interval)
        }
      }

      // Second data source
      if (spec.data.length > 1 && typeof spec.data[1].url !== 'undefined') {
        if (typeof spec.data[1].update_period !== 'undefined') {
          const interval = setInterval(function () {
            $.get(spec.data[1].url, function (data: any) {
              let parsedData: any
              if (typeof data === 'string') {
                parsedData = JSON.parse(data)
              } else {
                parsedData = data
              }

              item.vw
                .change(
                  spec.data[1].name,
                  vega
                    .changeset()
                    .remove(function (d: any) {
                      return true
                    })
                    .insert(parsedData),
                )
                .run()

              item.vw.runAfter(function () {
                const pms = item.vw.toSVG()
                pms.then(function (svgstr: string) {
                  item.vg.html(svgstr)
                })
              })
            })
          }, spec.data[1].update_period * 1000)

          intervals.push(interval)
        }
      }
    }

    // Check if it's inline JSON or URL
    if (label.prompt.indexOf('{') === 0) {
      processVegaJson(label.prompt)
    } else {
      $.get(label.prompt + '?' + new Date().getTime(), processVegaJson)
    }
  }

  // ============================================
  // EXECUTION HANDLERS
  // ============================================

  /**
   * Execute arc chart update
   * @param inkSageItem - InkSage item with parent reference
   */
  function executeArc(inkSageItem: InkSageItem): void {
    // Get d3 from externalLibs dynamically (may not be available at factory creation time)
    const d3 = externalLibs?.d3 || (window as any).d3
    
    if (!d3) {
      console.warn('executeArc: D3 not available')
      return
    }

    const parent = inkSageItem.parent as ChartElement | undefined
    if (!parent) {
      return
    }

    if (!parent._d3arc) {
      return
    }

    const vt = valueResolveCoded(parent._d3arc_tag, parent)
    const proporcao =
      (Number(vt) - parent._d3arc_min) / (parent._d3arc_max - parent._d3arc_min)

    const arc = d3
      .arc()
      .innerRadius(parent._d3arc_innerRadius)
      .outerRadius(100)
      .startAngle(0)

    function arcTween(newAngle: number) {
      return function (d: any) {
        const interpolate = d3.interpolate(d.oldAngle, newAngle)
        return function (t: number) {
          d.endAngle = interpolate(t)
          return arc(d)
        }
      }
    }

    parent._d3arc
      .transition()
      .duration(parent._d3arc_duration)
      .attrTween('d', arcTween(proporcao * 2 * Math.PI))
      .on('end', function () {
        parent._d3arc.datum({ oldAngle: proporcao * 2 * Math.PI })
      })
  }

  /**
   * Execute Vega chart update
   * @param inkSageItem - InkSage item with parent reference
   */
  function executeVega(inkSageItem: InkSageItem): void {
    const parent = inkSageItem.parent as ChartElement | undefined

    if (
      typeof parent?.vw === 'undefined' ||
      typeof parent?.vgInitData === 'undefined' ||
      parent?.vgInitData === ''
    ) {
      return
    }

    // Remove existing data
    parent.vw.data(parent.vgTableName[0]).remove(function (d: any) {
      return true
    })

    // Copy initial data
    let newdata = JSON.parse(JSON.stringify(parent.vgInitData))

    // Process placeholder replacements
    const d = new Date()
    let cnt_his = 0

    if (parent.hasOwnProperty('vgInitData')) {
      // Process each data item
      for (let index = 0; index < parent.vgInitData.length; index++) {
        const value = parent.vgInitData[index]
        for (const ix in value) {
          if (value.hasOwnProperty(ix)) {
            const vl = value[ix]
            try {
              if (typeof vl === 'string') {
                // Handle historical data placeholder
                if (vl.indexOf('HIS#') >= 0) {
                  cnt_his++
                  const pnt = parent.pnts[getPlaceholderIndex(vl)]

                  if (cnt_his === 1) newdata = []

                  if (
                    inkSageItem.hasOwnProperty('valores') &&
                    typeof inkSageItem.valores[pnt] !== 'undefined'
                  ) {
                    // Use cached historical data
                    for (let j = 0; j < inkSageItem.valores[pnt].length; j++) {
                      newdata.push({
                        pnt: '' + pnt,
                        x: inkSageItem.datas[pnt][j],
                        y: inkSageItem.valores[pnt][j],
                      })
                    }

                    // Add new value to history
                    const pointValue = state?.points && state.points.has(String(pnt)) 
                      ? state.points.get(String(pnt))!.value 
                      : 0
                    inkSageItem.valores[pnt].push(pointValue)
                    inkSageItem.datas[pnt].push(d.getTime())

                    // Remove old values
                    for (
                      let indv = inkSageItem.valores[pnt].length - 1;
                      indv >= 0;
                      indv--
                    ) {
                      const secdif =
                        (d.getTime() - inkSageItem.datas[pnt][indv]) / 1000
                      if (secdif > parent.timespan * 60) {
                        inkSageItem.valores[pnt].splice(indv, 1)
                        inkSageItem.datas[pnt].splice(indv, 1)
                      }
                    }
                  } else {
                    // Initialize historical data storage
                    if (!inkSageItem.valores) inkSageItem.valores = {}
                    if (!inkSageItem.datas) inkSageItem.datas = {}
                    if (!inkSageItem.valores[pnt]) {
                      inkSageItem.valores[pnt] = []
                      inkSageItem.datas[pnt] = []
                    }

                    // Mark for historical data request
                    if (!parent.histCalls) parent.histCalls = {}
                    if (!parent.histCalls.hasOwnProperty(pnt)) {
                      parent.histCalls[pnt] = true
                      emitEvent('vega:historyRequest', {
                        point: pnt,
                        timespan: parent.timespan,
                        item: inkSageItem,
                      })
                    }
                  }
                }

                // Handle value placeholder
                if (vl.indexOf('PNT#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    const vt = valueResolveCoded(
                      parent.pnts[getPlaceholderIndex(vl)],
                      parent,
                    )
                    if (vt !== retnok) {
                      newdata[index][ix] = vt
                    } else {
                      newdata.splice(-1, 1)
                    }
                  } else {
                    newdata.splice(-1, 1)
                  }
                }
                // Handle tag placeholder
                else if (vl.indexOf('TAG#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    const vt = valueResolveCoded(
                      parent.pnts[getPlaceholderIndex(vl)],
                      parent,
                    )
                    if (vt !== retnok) {
                      newdata[index][ix] = parent.pnts[getPlaceholderIndex(vl)]
                    }
                  } else {
                    newdata.splice(-1, 1)
                  }
                }
                // Handle flags placeholder
                else if (vl.indexOf('FLG#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getFlags(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle flag bit placeholder
                else if (vl.indexOf('FLR#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] =
                      getFlags(parent.pnts[getPlaceholderIndex(vl)]) & 0x80 ? 1 : 0
                  }
                }
                // Handle inferior limit placeholder
                else if (vl.indexOf('LMI#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getInfLim(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle superior limit placeholder
                else if (vl.indexOf('LMS#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getSupLim(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle description placeholder
                else if (vl.indexOf('DCR#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getDescription(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle bay placeholder
                else if (vl.indexOf('BAY#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getBay(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle substation placeholder
                else if (vl.indexOf('SUB#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getSubstation(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
              }
            } catch (E) {
              // Ignore errors in placeholder processing
            }
          }
        }
      }
    }

    // Update Vega view
    if (typeof parent.vw !== 'undefined') {
      parent.vw.data(parent.vgTableName[0]).insert(newdata)
      parent.vw.update()

      // Update DOM
      const vegaElement = getElementById(parent.vgId)
      if (vegaElement) {
        const vegaContainer = vegaElement.querySelector('.vega')
        if (
          vegaContainer &&
          vegaContainer.childNodes[0] &&
          vegaContainer.childNodes[0].childNodes[0]
        ) {
        const childNode = vegaContainer.childNodes[0]?.childNodes?.[0] as HTMLElement | undefined
          if (childNode) {
            parent.vg.html(childNode.innerHTML)
          }
        }
      }
    }
  }

  /**
   * Execute Vega-Lite chart update
   * @param inkSageItem - InkSage item with parent reference
   */
  function executeVegaLite(inkSageItem: InkSageItem): void {
    const parent = inkSageItem.parent as ChartElement | undefined

    if (
      typeof parent?.vw === 'undefined' ||
      typeof parent?.vgInitData === 'undefined' ||
      parent?.vgInitData === ''
    ) {
      return
    }

    // Copy initial data
    let newdata = JSON.parse(JSON.stringify(parent.vgInitData))

    // Process placeholder replacements
    const d = new Date()
    let cnt_his = 0

    if (parent.hasOwnProperty('vgInitData')) {
      // Process each data item
      for (let index = 0; index < parent.vgInitData.length; index++) {
        const value = parent.vgInitData[index]
        for (const ix in value) {
          if (value.hasOwnProperty(ix)) {
            const vl = value[ix]
            try {
              if (typeof vl === 'string') {
                // Handle historical data placeholder
                if (vl.indexOf('HIS#') >= 0) {
                  cnt_his++
                  const pnt = parent.pnts[getPlaceholderIndex(vl)]

                  if (cnt_his === 1) newdata = []

                  if (
                    inkSageItem.hasOwnProperty('valores') &&
                    typeof inkSageItem.valores[pnt] !== 'undefined'
                  ) {
                    // Use cached historical data
                    for (let j = 0; j < inkSageItem.valores[pnt].length; j++) {
                      newdata.push({
                        pnt: '' + pnt,
                        x: inkSageItem.datas[pnt][j],
                        y: inkSageItem.valores[pnt][j],
                      })
                    }

                    // Add new value to history
                    const pointValue = state?.points && state.points.has(String(pnt)) 
                      ? state.points.get(String(pnt))!.value 
                      : 0
                    inkSageItem.valores[pnt].push(pointValue)
                    inkSageItem.datas[pnt].push(d.getTime())

                    // Remove old values based on timespan
                    for (
                      let indv = inkSageItem.valores[pnt].length - 1;
                      indv >= 0;
                      indv--
                    ) {
                      const secdif =
                        (d.getTime() - inkSageItem.datas[pnt][indv]) / 1000
                      if (parent.timespan > 0) {
                        if (secdif > parent.timespan * 60) {
                          inkSageItem.valores[pnt].splice(indv, 1)
                          inkSageItem.datas[pnt].splice(indv, 1)
                        }
                      } else {
                        // Handle negative timespan (cyclic)
                        if (inkSageItem.datas[pnt][indv] > parent.datafim) {
                          // Reset for new cycle
                          inkSageItem.valores.forEach(
                            function (element: any, idx: number, arr: any[]) {
                              arr[idx] = []
                            },
                          )
                          inkSageItem.datas.forEach(
                            function (element: any, idx: number, arr: any[]) {
                              arr[idx] = []
                            },
                          )

                          // Calculate new cycle boundaries
                          parent.dataini =
                            new Date().getTime() -
                            (new Date().getTime() %
                              (Math.abs(parent.timespan * 60) * 1000)) +
                            ((new Date().getTimezoneOffset() * 60 * 1000) %
                              (Math.abs(parent.timespan * 60) * 1000))
                          parent.datafim =
                            parent.dataini +
                            Math.abs(parent.timespan * 60 * 1000)
                        }
                      }
                    }
                  } else {
                    // Initialize historical data storage
                    if (!inkSageItem.valores) inkSageItem.valores = {}
                    if (!inkSageItem.datas) inkSageItem.datas = {}
                    if (!inkSageItem.valores[pnt]) {
                      inkSageItem.valores[pnt] = []
                      inkSageItem.datas[pnt] = []
                    }

                    // Handle negative timespan initialization
                    if (parent.timespan < 0) {
                      parent.dataini =
                        new Date().getTime() -
                        (new Date().getTime() %
                          (Math.abs(parent.timespan * 60) * 1000)) +
                        ((new Date().getTimezoneOffset() * 60 * 1000) %
                          (Math.abs(parent.timespan * 60) * 1000))
                      parent.datafim =
                        parent.dataini + Math.abs(parent.timespan * 60 * 1000)
                    }

                    // Mark for historical data request
                    if (!parent.histCalls) parent.histCalls = {}
                    if (!parent.histCalls.hasOwnProperty(pnt)) {
                      parent.histCalls[pnt] = true
                      emitEvent('vega:historyRequest', {
                        point: pnt,
                        timespan: parent.timespan,
                        dataini: parent.dataini,
                        item: inkSageItem,
                      })
                    }
                  }
                }

                // Handle value placeholder
                if (vl.indexOf('PNT#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    const vt = valueResolveCoded(
                      parent.pnts[getPlaceholderIndex(vl)],
                      parent,
                    )
                    if (vt !== retnok) {
                      newdata[index][ix] = vt
                    } else {
                      newdata.splice(-1, 1)
                    }
                  } else {
                    newdata.splice(-1, 1)
                  }
                }
                // Handle tag placeholder
                else if (vl.indexOf('TAG#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    const vt = valueResolveCoded(
                      parent.pnts[getPlaceholderIndex(vl)],
                      parent,
                    )
                    if (vt !== retnok) {
                      newdata[index][ix] = parent.pnts[getPlaceholderIndex(vl)]
                    }
                  } else {
                    newdata.splice(-1, 1)
                  }
                }
                // Handle flags placeholder
                else if (vl.indexOf('FLG#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getFlags(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle flag bit placeholder
                else if (vl.indexOf('FLR#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] =
                      getFlags(parent.pnts[getPlaceholderIndex(vl)]) & 0x80 ? 1 : 0
                  }
                }
                // Handle inferior limit placeholder
                else if (vl.indexOf('LMI#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getInfLim(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle superior limit placeholder
                else if (vl.indexOf('LMS#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getSupLim(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle description placeholder
                else if (vl.indexOf('DCR#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getDescription(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle bay placeholder
                else if (vl.indexOf('BAY#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getBay(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
                // Handle substation placeholder
                else if (vl.indexOf('SUB#') >= 0) {
                  if (parent.pnts.length > getPlaceholderIndex(vl)) {
                    newdata[index][ix] = getSubstation(
                      parent.pnts[getPlaceholderIndex(vl)],
                    )
                  }
                }
              }
            } catch (E) {
              // Ignore errors in placeholder processing
            }
          }
        }
      }
    }

    // Update Vega view
    if (typeof parent.vw !== 'undefined') {
      // Get vega from externalLibs dynamically
      const vega = externalLibs?.vega || (window as any).vega
      
      parent.vw
        .change(
          parent.vgTableName[0],
          vega
            .changeset()
            .remove(function (d: any) {
              return true
            })
            .insert(newdata),
        )
        .run()

      parent.vw.runAfter(function () {
        const pms = parent!.vw.toSVG()
        pms.then(function (svgstr: string) {
          parent.vg!.html(svgstr)
        })
      })
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Initialize extended chart types
   * @param inksageLabelvec - Label vector from SVG parsing
   * @param lbv - Index in label vector (optional, if omitted iterates all)
   * @param item - SVG element to initialize (optional)
   */
  function initializeExtended(inksageLabelvec: InkSageLabel[], lbv?: number, item?: Element): void {
    // console.log('initializeExtended CALLED - lbv:', lbv, 'item:', item, 'inksageLabelvec:', inksageLabelvec)
    
    // If called with just the array, iterate over all items
    if (lbv === undefined || item === undefined) {
      if (!Array.isArray(inksageLabelvec)) {
        console.warn('initializeExtended: InkSage is not an array', inksageLabelvec)
        return
      }
      // console.log('initializeExtended: Processing', inksageLabelvec.length, 'items from InkSage')
      for (let i = 0; i < inksageLabelvec.length; i++) {
        const label = inksageLabelvec[i]
        if (!label) {
          // console.log('initializeExtended: Skipping null label at index', i)
          continue
        }
        if (!label.tag) {
          // console.log('initializeExtended: Skipping label without tag at index', i, label)
          continue
        }

        // console.log('initializeExtended: Found tag:', label.tag, 'attr:', label.attr)
        switch (label.tag) {
          case '#arc':
            // console.log('initializeExtended: Initializing #arc with parent:', label.parent)
            initializeArc(label, label.parent)
            break

          case '#vega-lite':
            initializeVegaLite(label, label.parent)
            break

          case '#vega':
          case '#vega3':
          case '#vega4':
          case '#vega5':
            initializeVega(label, label.parent)
            break

          case '#vega-json':
          case '#vega3-json':
          case '#vega4-json':
          case '#vega5-json':
            initializeVegaJson(label, label.parent)
            break
        }
      }
      return
    }

    // Called with specific index and item - this is the callback from websage-core
    const label = inksageLabelvec[lbv]
    if (!label || !label.tag) return

    // console.log('initializeExtended: Called with lbv=', lbv, 'item=', item, 'label=', label)
    switch (label.tag) {
      case '#arc':
        // console.log('initializeExtended: Initializing #arc with specific item')
        initializeArc(label, item)
        break

      case '#vega-lite':
        initializeVegaLite(label, item)
        break

      case '#vega':
      case '#vega3':
      case '#vega4':
      case '#vega5':
        initializeVega(label, item)
        break

      case '#vega-json':
      case '#vega3-json':
      case '#vega4-json':
      case '#vega5-json':
        initializeVegaJson(label, item)
        break
    }
  }

  /**
   * Execute extended chart updates
   * @param i - Index in InkSage array
   */
  function executeExtended(i: number): void {
    if (!state?.InkSage || !state.InkSage[i]) return

    const tag = state.InkSage[i].tag
    // console.log('executeExtended called for index', i, 'tag:', tag)

    switch (tag) {
      case '#arc':
        // console.log('executeExtended: Executing arc for index', i)
        executeArc(state.InkSage[i])
        break

      case '#vega':
        executeVega(state.InkSage[i])
        break

      case '#vega-lite':
      case '#vega3':
      case '#vega4':
        executeVegaLite(state.InkSage[i])
        break
    }
  }

  /**
   * Update chart data directly
   * @param chartId - Chart element ID
   * @param data - New data to insert
   */
  function updateChartData(chartId: string, data: any[]): void {
    // Get vega from externalLibs dynamically
    const vega = externalLibs?.vega || (window as any).vega
    
    const chartElement = getElementById(chartId)
    if (!chartElement || !chartElement.vw) return

    const tableName = chartElement.vgTableName
      ? chartElement.vgTableName[0]
      : 'table'

    chartElement.vw
      .change(
        tableName,
        vega
          .changeset()
          .remove(function (d: any) {
            return true
          })
          .insert(data),
      )
      .run()

    chartElement.vw.runAfter(function () {
      const pms = chartElement.vw.toSVG()
      pms.then(function (svgstr: string) {
        if (chartElement.vg) {
          chartElement.vg.html(svgstr)
        }
      })
    })
  }

  /**
   * Clean up all resources
   */
  function destroy(): void {
    // Clear all intervals
    intervals.forEach(function (interval: number) {
      clearInterval(interval)
    })
    intervals.length = 0

    // Finalize all Vega views
    vegaViews.forEach(function (view: any) {
      if (view && view.finalize) {
        view.finalize()
      }
    })
    vegaViews.length = 0
  }

  return {
    initializeExtended,
    executeExtended,
    updateChartData,
    destroy,
  }
}
