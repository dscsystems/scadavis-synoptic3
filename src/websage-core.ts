'use strict'
import { sprintf as sprintf_js } from 'sprintf-js'


/*
 * SCADAvis.io Synoptic API © 2018-2026 Ricardo L. Olsen / DSC Systems ALL RIGHTS RESERVED.
 * See license file for full license text.
 */

/**
 * WebSAGE Core Engine - Context-Aware Factory Function
 * This module provides a factory function that creates isolated WebSAGE engine
 * instances for use in Web Components.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/** External libraries that can be injected */
export interface ExternalLibs {
  d3?: any
  chroma?: any
  $?: any
}

/** Configuration options for the WebSAGE engine */
export interface WebSAGEConfig {
  backgroundSVG?: string
  svgMaxWidth?: number
  svgMaxHeight?: number
  toolbarColor?: string
  background?: string
  colorTable?: string[]
  pbiColorTable?: string[]
  pbiColors?: Record<string, string>
  alarmInhibitedColor?: string
  failedColor?: string
}

/** Options for creating a WebSAGE engine instance */
export interface WebSAGEOptions {
  rootElement: Element | ShadowRoot
  eventTarget: Element
  config?: WebSAGEConfig
  externalLibs?: ExternalLibs
}

/** Point data structure */
export interface PointData {
  value: number | boolean | string
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

/** Data input structure for processData */
export interface WebSAGEDataInput {
  values?: Record<string, number>
  flags?: Record<string, number>
  times?: Record<string, number>
  tags?: Record<string, string>
  npts?: Record<string, string | number>
  substations?: Record<string, string>
  bays?: Record<string, string>
  descriptions?: Record<string, string>
  annotations?: Record<string, string>
  statusOn?: Record<string, string>
  statusOff?: Record<string, string>
  limSups?: Record<string, number>
  limInfs?: Record<string, number>
}

/** WebSAGE Engine public API interface */
export interface WebSAGEEngine {
  init: (svgElement: any) => void
  showValsSVG: () => void
  processData: (data: WebSAGEDataInput) => void
  zoomPan: (opc: number, mul?: number, event?: any) => void
  setZoomParams: (x: number, y: number, w: number, h: number) => void
  setBgColor: (cor: string) => void
  translateColor: (cor: string) => string
  destroy: () => void
  getValue: (tagornumber: string | number) => number | boolean | string
  getFlags: (tagornumber: string | number) => number
  getInfLim: (tagornumber: string | number) => number
  getSupLim: (tagornumber: string | number) => number
  getSubstation: (tagornumber: string | number) => string
  getBay: (tagornumber: string | number) => string
  getDescription: (tagornumber: string | number) => string
  getTime: (tagornumber: string | number) => number
  getTag: (tagornumber: string | number) => string
  setValue: (
    tagOrNumber: string | number,
    value: number | boolean | string,
    flags?: number
  ) => void
  getTagsList: () => string[]
  getOrCreatePoint: (key: string | number) => PointData
  resolvePointKey: (tagornumber: string | number) => string | number | null
  sprintf: (fstring: string, ...args: any[]) => string
  LoadImage: (elem: any, imgpath: string) => void
  RemoveAnimate: (elem: any) => void
  Animate: (elem: any, animtype: string, params: any) => void
  addPointToList: (tag: string) => number | string
  _onElementClick: (pnt: number, event?: any) => void
  state: any
  setExecuteExtendedCallback: (callback: any) => void
  setInitializeExtendedCallback: (callback: any) => void
}

// ============================================
// GLOBAL DECLARATIONS
// ============================================

declare global {
  interface Window {
    $: any
    jQuery: any
    drgObject: any
    MOUSEX: number
    MOUSEY: number
    WebSAGE: any
    ShowHideTranslate: any
  }
}

// Use 'any' liberally for this legacy DOM manipulation code
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * sprintf implementation - uses npm sprintf-js package
 * @param fstring - Format string
 * @param args - Values to format
 * @returns Formatted string
 */
export function sprintf (fstring: string, ...args: any[]): string {
  try {
    return sprintf_js(fstring, ...args)
  } catch (e) {
    console.error('sprintf error:', e, 'fmt:', fstring, 'args:', args)
    return fstring // fallback
  }
}


/**
 * Load image to element
 * @param elem - SVG element to load image into
 * @param imgpath - Path to the image
 */
export function LoadImage (elem: any, imgpath: string): void {
  elem.setAttributeNS('http://www.w3.org/1999/xlink', 'href', imgpath)
}

/**
 * Make an SVG element draggable
 * @param elem - SVG element to make draggable
 */
export function makeDraggable (elem: any): void {
  if (!elem) return

  const $: any = window.$ || window.jQuery
  if (!$) return

  elem.style.cursor = 'crosshair'

  elem.drgDragging = false
  elem.drgX = 0
  elem.drgY = 0
  if (typeof elem.inittransform === 'undefined')
    elem.inittransform = elem.getAttributeNS(null, 'transform')
  if (elem.inittransform === null) elem.inittransform = ''

  $(elem).bind('mousedown', function (event: any) {
    if (elem.style.display == 'none') {
      elem.style.cursor = 'crosshair'
      elem.drgDragging = false
      elem.drgMouseOffsetX = 0
      elem.drgMouseOffsetY = 0
      window.drgObject = null
      return
    }

    elem.style.cursor = 'move'
    elem.drgDragging = true
    window.drgObject = elem
    let p = elem.ownerSVGElement.createSVGPoint()
    p.x = event.clientX
    p.y = event.clientY
    elem.drgMouseOffsetX = p.x - elem.drgX
    elem.drgMouseOffsetY = p.y - elem.drgY
  })

  $(elem).bind('mouseup', function (event: any) {
    elem.style.cursor = 'crosshair'
    elem.drgDragging = false
    elem.drgMouseOffsetX = 0
    elem.drgMouseOffsetY = 0
    window.drgObject = null
  })

  $(elem).bind('mousemove', function (event: any) {
    if (elem.drgDragging === true) {
      let p = elem.ownerSVGElement.createSVGPoint()
      p.x = event.clientX
      p.y = event.clientY

      let m = elem.parentNode.getScreenCTM()
      p.x -= elem.drgMouseOffsetX
      p.y -= elem.drgMouseOffsetY

      window.MOUSEX = event.clientX
      window.MOUSEY = event.clientY

      elem.drgX = p.x
      elem.drgY = p.y
      m.e = m.f = 0
      p = p.matrixTransform(m.inverse())
      elem.setAttributeNS(
        null,
        'transform',
        'translate(' + p.x + ',' + p.y + ') ' + elem.inittransform
      )
      event.stopPropagation()
    }
  })
}

/**
 * Remove all SMIL animations from an element
 * @param elem - Parent element to remove animations from
 */
export function RemoveAnimate (elem: any): void {
  if (elem === null) {
    return
  }
  let i = 0
  while (i < elem.childNodes.length) {
    const nodeName = (elem.childNodes[i] as any).nodeName
    if (
      nodeName == 'animate' ||
      nodeName == 'animateTransform' ||
      nodeName == 'animateMotion'
    ) {
      elem.removeChild(elem.childNodes[i])
      i = 0
    } else {
      i++
    }
  }
}

/**
 * Create SMIL animation
 * @param elem - Element to animate
 * @param animtype - Animation type
 * @param params - Animation parameters
 */
export function Animate (elem: any, animtype: string, params: any): void {
  const svgDoc = elem.ownerDocument
  const animation = svgDoc.createElementNS(
    'http://www.w3.org/2000/svg',
    animtype
  )

  for (const k in params) {
    if (params.hasOwnProperty(k)) {
      animation.setAttributeNS(null, k, params[k])
    }
  }

  setTimeout(function () {
    elem.appendChild(animation)
    if (typeof animation.beginElement !== 'undefined') {
      animation.endElement()
      animation.beginElement()
    }
  }, 100)
}

// ============================================
// FACTORY FUNCTION
// ============================================

/**
 * Create a WebSAGE engine instance
 * @param options - Configuration options
 * @returns WebSAGE engine instance
 */
export function createWebSAGEEngine (options: WebSAGEOptions): WebSAGEEngine {
  const { rootElement, eventTarget, config = {}, externalLibs = {} } = options

  let executeExtendedCallback: any = null
  let initializeExtendedCallback: any = null

  // ============================================
  // ENCAPSULATED STATE
  // ============================================

  function getOrCreatePoint (key: string | number): PointData {
    const strKey = String(key)
    if (!state.points.has(strKey)) {
      state.points.set(strKey, {
        value: 0,
        flags: 0xa0,
        time: 0,
        tag: '',
        substation: '',
        bay: '',
        description: '',
        annotation: '',
        statusOn: '',
        statusOff: '',
        limSup: 0,
        limInf: 0,
      })
    }
    return state.points.get(strKey)!
  }

  function ShowHideTranslate (idorobj: any, xd?: number, yd?: number): void {
    let obj: any

    xd = xd || 0
    yd = yd || 0

    const svgdoc = state.SVGDoc

    if (svgdoc === null) {
      return
    }

    if (typeof idorobj === 'object') obj = idorobj
    else obj = svgdoc.getElementById(idorobj)

    if (obj === null) {
      return
    }

    if (obj.style.display === 'none') {
      obj.style.display = 'block'
    } else {
      obj.style.display = 'none'
    }

    if (typeof obj.inittransform === 'undefined') {
      obj.inittransform = obj.getAttributeNS(null, 'transform')
    }

    if (obj.inittransform === null) {
      obj.inittransform = ''
    }

    if (xd != 0 || yd != 0)
      obj.setAttributeNS(
        null,
        'transform',
        obj.inittransform +
          ' translate(' +
          parseFloat(String(xd)) +
          ' ' +
          parseFloat(String(yd)) +
          ')'
      )
  }

  const state: any = {
    points: new Map(),
    TAGS: new Map(),
    NPTS: new Map(),
    INVTAGS: new Map(),
    SVGDoc: null,
    Color_BackgroundSVG: config.backgroundSVG || 'black',
    ScreenViewer_SVGMaxWidth: config.svgMaxWidth || 3840,
    ScreenViewer_SVGMaxHeight: config.svgMaxHeight || 2160,
    ScreenViewer_ToolbarColor: config.toolbarColor || 'none',
    ScreenViewer_Background: config.background || '#DDDDDD',
    ScreenViewer_ColorTable: config.colorTable || [],
    PBIColorTable: config.pbiColorTable || [],
    PBIColors: config.pbiColors || {},
    VisorTelas_CorAlarmeInibido: config.alarmInhibitedColor || 'yellow',
    VisorTelas_Medidas_Cor_Falha: config.failedColor || 'magenta',
    g_blinktimerID: 0,
    g_blinkperiod: 1000,
    g_blinkcnt: 0,
    g_blinkList: [],
    g_blinkListAna: [],
    g_blinkListOld: [],
    g_blinkListAnaOld: [],
    g_zpX: 0,
    g_zpY: 0,
    g_zpW: 0,
    g_zpH: 0,
    g_originalViewBox: null,
    g_containerW: 0,
    g_containerH: 0,
    g_isInkscape: false,
    g_loadtime: new Date(),
    g_idprefixes: [],
    lstpnt: '',
    InkSage: [],
    HAS_ALARMS: 0,
    d3: externalLibs.d3 || null,
    chroma: externalLibs.chroma || null,
  }

  const retnok = '????'

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  function emitEvent (type: string, detail: any = {}): void {
    const event = new CustomEvent(type, {
      bubbles: false,
      composed: false,
      detail,
    })
    eventTarget.dispatchEvent(event)
  }

  function $ (selector: string): any {
    return rootElement.querySelector(selector)
  }

  function $$ (selector: string): any {
    return rootElement.querySelectorAll(selector)
  }

  function getElementById (id: string): any {
    return (rootElement as any).getElementById
      ? (rootElement as any).getElementById(id)
      : rootElement.querySelector('#' + id)
  }

  // ============================================
  // CORE METHODS
  // ============================================

  function resolvePointKey (
    tagornumber: string | number
  ): string | null {
    const key = String(tagornumber)
    if (state.points.has(key)) return key
    if (
      state.NPTS.has(key) &&
      state.points.has(String(state.NPTS.get(key)))
    )
      return String(state.NPTS.get(key))
    return null
  }

  function getValue (
    tagornumber: string | number
  ): number | boolean | string {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.value as any
    return 0
  }

  function getFlags (tagornumber: string | number): number {
    const key = resolvePointKey(tagornumber)
    if (key !== null) {
      const f = state.points.get(key)!.flags
      if (!isNaN(f)) return f
    }
    const v = getValue(tagornumber)
    const isOn = v === 0 || v === true
    return 0xa0 | (isOn ? 0x02 : 0x01)
  }

  function getInfLim (tagornumber: string | number): number {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.limInf
    return 0
  }

  function getSupLim (tagornumber: string | number): number {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.limSup
    return 0
  }

  function getSubstation (tagornumber: string | number): string {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.substation
    return ''
  }

  function getBay (tagornumber: string | number): string {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.bay
    return ''
  }

  function getDescription (tagornumber: string | number): string {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.description
    return ''
  }

  function getTime (tagornumber: string | number): number {
    const key = resolvePointKey(tagornumber)
    if (key !== null) return state.points.get(key)!.time
    return 0
  }

  function getTag (tagornumber: string | number): string {
    const key = String(tagornumber)
    if (state.TAGS.has(key)) return String(state.TAGS.get(key)!)
    if (
      state.NPTS.has(key) &&
      state.TAGS.has(String(state.NPTS.get(key)!))
    )
      return String(state.TAGS.get(String(state.NPTS.get(key)!))!)
    if (state.points.has(key)) return key
    return ''
  }

  function tooltipRelac (item: any, pnt: any): void {
    if (pnt == 0 || pnt == 99999 || pnt == 99989 || item.hasTooltip) return

    item.hasTooltip = 1

    setTimeout(function () {
      if (item.parentNode && item.parentNode.hasTooltip) return
      if (item.querySelector('title')) return

      const tooltip = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'title'
      )
      tooltip.textContent =
        'Tag: ' + getTag(pnt) + '\n' + 'Descr: ' + getDescription(pnt) + '\n'

      item.appendChild(tooltip)
    }, 7000)
  }

  function addPointToList (tag: string): number | string {
    tag = tag.trim()

    if (
      tag.indexOf('!ALM') === 0 ||
      tag.indexOf('!TMP') === 0 ||
      tag.indexOf('!ALR') === 0 ||
      tag.indexOf('!TAG') === 0 ||
      tag.indexOf('!DCR') === 0
    ) {
      tag = tag.substr(4).trim()
    } else if (
      tag.indexOf('!SLIM') === 0 ||
      tag.indexOf('!ILIM') === 0 ||
      tag.indexOf('!STON') === 0
    ) {
      tag = tag.substr(5).trim()
    } else if (tag.indexOf('!STOFF') === 0 || tag.indexOf('!STVAL') === 0) {
      tag = tag.substr(6).trim()
    }

    if (isNaN(Number(tag))) {
      if (state.NPTS.has(tag)) {
        tag = String(state.NPTS.get(tag))
      } else {
        if (
          tag.indexOf('!') === 0 ||
          tag.indexOf('#') === 0 ||
          tag.indexOf('%') === 0
        )
          return 0
      }
    }

    if (
      state.lstpnt.indexOf(',' + tag + ',') < 0 &&
      !(state.lstpnt.indexOf(tag + ',') === 0)
    ) {
      state.lstpnt = state.lstpnt + tag + ','
    }

    return tag
  }

  function timerBlink (): void {
    requestAnimationFrame(timerBlinkDraw)
  }

  function timerBlinkDraw (): void {
    let i: number
    const half_opac = 0.5

    if (!(state.g_blinkcnt % 2)) {
      for (i = 0; i < state.g_blinkListOld.length; i++) {
        if (state.g_blinkList.indexOf(state.g_blinkListOld[i]) === -1)
          state.g_blinkListOld[i].style.fillOpacity = '1'
      }
      for (i = 0; i < state.g_blinkListAnaOld.length; i++) {
        if (state.g_blinkListAna.indexOf(state.g_blinkListAnaOld[i]) === -1)
          state.g_blinkListAnaOld[i].style.fillOpacity = '1'
      }
    }

    for (i = 0; i < state.g_blinkList.length; i++) {
      if (state.g_blinkcnt % 2) {
        state.g_blinkList[i].style.strokeOpacity = String(half_opac)
        state.g_blinkList[i].style.fillOpacity = String(half_opac)
      } else {
        state.g_blinkList[i].style.strokeOpacity = '1'
        state.g_blinkList[i].style.fillOpacity = '1'
      }
    }

    for (i = 0; i < state.g_blinkListAna.length; i++) {
      if (state.g_blinkcnt % 2) {
        state.g_blinkListAna[i].style.strokeOpacity = String(half_opac)
        state.g_blinkListAna[i].style.fillOpacity = String(half_opac)
      } else {
        state.g_blinkListAna[i].style.strokeOpacity = '1'
        state.g_blinkListAna[i].style.fillOpacity = '1'
      }
    }

    state.g_blinkListOld = state.g_blinkList.slice()
    state.g_blinkListAnaOld = state.g_blinkListAna.slice()

    state.g_blinkcnt++
  }

  function processInvalidTagInElement (tag: string, obj: any): void {
    if (!state.INVTAGS.has(tag)) {
      state.INVTAGS.set(tag, 0)
    }
    if (obj && obj.style.visibility !== 'collapse')
      obj.style.visibility = 'collapse'
  }

  function valueResolveCoded (tag: string, obj: any): number | string {
    if (tag == '' || typeof tag === 'undefined') {
      return retnok
    }

    let t = parseInt(tag)

    if (!isNaN(t)) {
      const key = resolvePointKey(t)
      if (key === null) {
        console.warn('[NaN DEBUG] valueResolveCoded: numeric tag not found:', tag, 'parsed as', t)
        return retnok
      } else {
        let ptValue = state.points.get(key)!.value
        // DEBUG: Log point value retrieval
        if (typeof ptValue === 'number' && isNaN(ptValue)) {
          console.warn('[NaN DEBUG] valueResolveCoded: point value is NaN for key:', key, 'tag:', tag)
        }
        // Legacy conversion: internal engine uses 0 for ON and 1 for OFF for digital points
        if (typeof ptValue === 'boolean') {
          ptValue = ptValue ? 0 : 1
        }
        return ptValue as any
      }
    }

    tag = tag.trim()

    if (state.NPTS.has(tag)) {
      if (obj && obj.style.visibility === 'collapse')
        obj.style.visibility = 'inherit'
      const pointKey = state.NPTS.get(tag)!
      const point = state.points.get(pointKey)
      if (typeof obj.autoTooltip !== 'undefined') {
        const tt = obj.getElementsByTagName('title')
        if (tt.length > 0)
          tt[0].textContent =
            'TAG: ' +
            tag +
            '\n' +
            'KEY: ' +
            pointKey +
            '\n' +
            'VAL: ' +
            (point ? point.value : 0)
      }
      let ptValue = point ? point.value : 0
      // DEBUG: Log point value retrieval for string tags
      if (typeof ptValue === 'number' && isNaN(ptValue)) {
        console.warn('[NaN DEBUG] valueResolveCoded: point value is NaN for string tag:', tag, 'key:', pointKey)
      }
      // Legacy conversion: internal engine uses 0 for ON and 1 for OFF for digital points
      if (typeof ptValue === 'boolean') {
        ptValue = ptValue ? 0 : 1
      }
      return ptValue as any
    }

    if (obj && obj.style.visibility === 'collapse')
      obj.style.visibility = 'inherit'

    const directKey = resolvePointKey(tag)
    if (directKey !== null) {
      let ptValue = state.points.get(directKey)!.value
      if (typeof ptValue === 'boolean') {
        ptValue = ptValue ? 0 : 1
      }
      return ptValue as any
    }

    if (tag.indexOf('#') == 0 || tag.indexOf('%') == 0) return retnok

    const f = getFlags(Number(tag))

    if (tag.indexOf('!SLIM') === 0) {
      t = parseInt(tag.substr(5).trim())
      if (isNaN(t)) t = Number(state.NPTS.get(tag.substr(5).trim()))
      const key = resolvePointKey(t)
      if (key === null) return 999999
      return state.points.get(key)!.limSup
    }

    if (tag.indexOf('!ILIM') === 0) {
      t = parseInt(tag.substr(5).trim())
      if (isNaN(t)) t = Number(state.NPTS.get(tag.substr(5).trim()))
      const key = resolvePointKey(t)
      if (key === null) return -999999
      return state.points.get(key)!.limInf
    }

    if (tag.indexOf('!TAG') === 0) {
      let t2 = tag.substr(4).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      if (!state.TAGS.has(t2)) return ''
      return state.TAGS.get(t2)
    }

    if (tag.indexOf('!DCR') === 0) {
      let t2 = tag.substr(4).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      const key = resolvePointKey(t2)
      if (key === null) return ''
      return state.points.get(key)!.description
    }

    if (tag.indexOf('!STON') === 0) {
      let t2 = tag.substr(5).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      const key = resolvePointKey(t2)
      if (key === null) return ''
      return state.points.get(key)!.statusOn
    }

    if (tag.indexOf('!STOFF') === 0) {
      let t2 = tag.substr(6).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      const key = resolvePointKey(t2)
      if (key === null) return ''
      return state.points.get(key)!.statusOff
    }

    if (tag.indexOf('!STVAL') === 0) {
      let t2 = tag.substr(6).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      const key = resolvePointKey(t2)
      if (key === null) return ''
      const point = state.points.get(key)!
      if ((f & 0x03) === 0x02) return point.statusOn
      if ((f & 0x03) === 0x01) return point.statusOff
      if ((f & 0x03) === 0x00) return ''
      if ((f & 0x03) === 0x03) return ''
    }

    if (tag.indexOf('!ALR') === 0) {
      let t2 = tag.substr(4).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      if (typeof f === 'undefined') return 0
      return f & 0x100 ? 1 : 0
    }

    if (tag.indexOf('!ALM') === 0) {
      let t2 = tag.substr(3).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      if (typeof f === 'undefined') return 0
      return f & 0x800 || f & 0x100 ? 1 : 0
    }

    if (tag.indexOf('!TMP') === 0) {
      let t2 = tag.substr(3).trim()
      if (isNaN(Number(t2))) t2 = String(state.NPTS.get(t2))
      return getTime(t2)
    }

    if (tag.indexOf('!EVAL') === 0) {
      const t2 = tag.substr(5).trim()
      try {
        const thisobj = (rootElement as any).getElementById(obj?.id || '')
        function evalprot (src: string): any {
          const $V = getValue
          const $F = getFlags
          const $T = getTime
          const NPTS = Object.fromEntries(state.NPTS)
          const $W: any = {}
          $W.getDescription = getDescription
          $W.RemoveAnimate = RemoveAnimate
          $W.Animate = Animate
          $W.LoadImage = LoadImage
          $W.lstpnt = state.lstpnt
          return eval(src)
        }
        return evalprot(t2)
      } catch (err) {
        processInvalidTagInElement(tag, obj)
        console.log(err)
        return retnok
      }
    }

    processInvalidTagInElement(tag, obj)
    return retnok
  }

  function printCFormat (fmt: string, tag: string, obj: any): string {
    let valr: any = valueResolveCoded(tag, obj)

    // DEBUG: Log when value is being processed
    if (typeof valr === 'number' && isNaN(valr)) {
      console.warn('[NaN DEBUG] printCFormat: valueResolveCoded returned NaN for tag:', tag)
    }
    if (valr === retnok) {
      console.warn('[NaN DEBUG] printCFormat: valueResolveCoded returned retnok for tag:', tag)
      return String(valr)
    }

    if (typeof fmt == 'undefined' || fmt === '') {
      if (isNaN(parseFloat(String(valr)))) {
        fmt = '%s'
      } else {
        fmt = '%1.1f'
      }
    }

    if (fmt.search(/[udrla][\^▲▼△▽]/) >= 0) {
      fmt = fmt.replace(
        'u▲',
        Number(valr) > 0 ? '▲' : Number(valr) < 0 ? '▼' : ' '
      )
      fmt = fmt.replace(
        'd▼',
        Number(valr) > 0 ? '▼' : Number(valr) < 0 ? '▲' : ' '
      )
      fmt = fmt.replace(
        'u△',
        Number(valr) > 0 ? '△' : Number(valr) < 0 ? '▽' : ' '
      )
      fmt = fmt.replace(
        'd▽',
        Number(valr) > 0 ? '▽' : Number(valr) < 0 ? '△' : ' '
      )
      fmt = fmt.replace(
        'u^',
        String.fromCharCode(Number(valr) >= 0 ? 0x2191 : 0x2193)
      )
      fmt = fmt.replace(
        'd^',
        String.fromCharCode(Number(valr) >= 0 ? 0x2193 : 0x2191)
      )
      fmt = fmt.replace(
        'r^',
        String.fromCharCode(Number(valr) >= 0 ? 0x21a3 : 0x21a2)
      )
      fmt = fmt.replace(
        'l^',
        String.fromCharCode(Number(valr) >= 0 ? 0x21a2 : 0x21a3)
      )
      fmt = fmt.replace('a^', '')
      valr = Math.abs(Number(valr))
    }

    if (fmt.indexOf('%') < 0) {
      if (state.d3) {
        const fa = fmt.split('`')
        fa[0] = fa[0].replace('~', '%')
        return state.d3.format(fa[0])(valr) + (fa.length > 1 ? fa[1] : '')
      }
    }
    // DEBUG: Log when NaN is about to be passed to sprintf
    if (typeof valr === 'number' && isNaN(valr)) {
      console.warn('[NaN DEBUG] sprintf: passing NaN to sprintf with fmt:', fmt)
    }
    return sprintf(fmt, valr)
  }

  function pegaTagClone (item: any, lb: any): void {
    let j: number, k: number, l: number, poseq: number, poscloned: number
    let pattern: string

    if (typeof lb.list !== 'undefined') {
      for (j = 0; j < lb.list.length; j++) {
        if (typeof lb.list[j].tag !== 'undefined')
          if (lb.list[j].tag.indexOf('%') !== -1)
            if (item.parentNode && item.parentNode.nodeName === 'g') {
              for (k = 0; k < state.InkSage.length; k++) {
                if (state.InkSage[k].parent.id === item.parentNode.id) {
                  if (typeof item.parentNode.noTrace !== 'undefined') {
                    item.noTrace = item.parentNode.noTrace
                  }

                  for (l = 0; l < state.InkSage[k].map.length; l++) {
                    poseq = state.InkSage[k].map[l].indexOf('=')
                    pattern = state.InkSage[k].map[l].substring(0, poseq)
                    poscloned = lb.list[j].tag.indexOf('%')
                    if (
                      pattern ===
                      lb.list[j].tag.substring(
                        poscloned,
                        poscloned + pattern.length
                      )
                    ) {
                      lb.list[j].tag =
                        lb.list[j].tag.substring(0, poscloned) +
                        state.InkSage[k].map[l].substring(poseq + 1)
                      lb.tag = lb.list[j].tag
                      state.InkSage[k].tag = lb.list[j].tag
                    }
                  }
                  break
                }
              }
            }
      }
    } else {
      if (typeof lb.tag !== 'undefined')
        if (lb.tag.indexOf('%') !== -1)
          if (item.parentNode && item.parentNode.nodeName === 'g') {
            if (typeof item.parentNode.noTrace !== 'undefined') {
              item.noTrace = item.parentNode.noTrace
            }

            for (k = 0; k < state.InkSage.length; k++) {
              if (state.InkSage[k].parent.id === item.parentNode.id) {
                for (l = 0; l < state.InkSage[k].map.length; l++) {
                  poseq = state.InkSage[k].map[l].indexOf('=')
                  pattern = state.InkSage[k].map[l].substring(0, poseq)
                  poscloned = lb.tag.indexOf('%')
                  if (
                    pattern ===
                    lb.tag.substring(poscloned, poscloned + pattern.length)
                  ) {
                    lb.tag =
                      lb.tag.substring(0, poscloned) +
                      state.InkSage[k].map[l].substring(poseq + 1) +
                      lb.tag.substring(poscloned + pattern.length)
                    item.temPaiGrupo = 1
                  }
                }
                break
              }
            }
          }

      if (typeof lb.src !== 'undefined')
        if (lb.src.indexOf('%') !== -1)
          if (item.parentNode && item.parentNode.nodeName === 'g') {
            if (typeof item.parentNode.noTrace !== 'undefined') {
              item.noTrace = item.parentNode.noTrace
            }

            for (k = 0; k < state.InkSage.length; k++) {
              if (state.InkSage[k].parent.id === item.parentNode.id) {
                for (l = 0; l < state.InkSage[k].map.length; l++) {
                  poseq = state.InkSage[k].map[l].indexOf('=')
                  pattern = state.InkSage[k].map[l].substring(0, poseq)
                  poscloned = lb.src.indexOf('%')
                  if (
                    pattern ===
                    lb.src.substring(poscloned, poscloned + pattern.length)
                  ) {
                    lb.tag =
                      lb.src.substring(0, poscloned) +
                      state.InkSage[k].map[l].substring(poseq + 1) +
                      lb.src.substring(poscloned + pattern.length)
                    lb.src = lb.tag
                    item.temPaiGrupo = 1
                  }
                }
                break
              }
            }
          }

      if (lb.attr === 'tooltips') {
        for (j = 0; j < lb.param.length; j++) {
          if (lb.param[j].indexOf('!EVAL') !== -1)
            if (lb.param[j].indexOf('%') !== -1)
              if (item.parentNode && item.parentNode.nodeName === 'g') {
                if (typeof item.parentNode.noTrace !== 'undefined') {
                  item.noTrace = item.parentNode.noTrace
                }

                for (k = 0; k < state.InkSage.length; k++) {
                  if (state.InkSage[k].parent.id === item.parentNode.id) {
                    for (l = 0; l < state.InkSage[k].map.length; l++) {
                      poseq = state.InkSage[k].map[l].indexOf('=')
                      pattern = state.InkSage[k].map[l].substring(0, poseq)
                      poscloned = lb.param[j].indexOf('%')
                      if (
                        pattern ===
                        lb.param[j].substring(
                          poscloned,
                          poscloned + pattern.length
                        )
                      ) {
                        lb.param[j] =
                          lb.param[j].substring(0, poscloned) +
                          state.InkSage[k].map[l].substring(poseq + 1) +
                          lb.param[j].substring(poscloned + pattern.length)
                        item.temPaiGrupo = 1
                      }
                    }
                    break
                  }
                }
              }
        }
      }
    }
  }

  function setGroupDistrib (grp: any): void {
    let i: number,
      xright = 0,
      ybottom = 0,
      dif: number
    let tl: string

    const children = grp.children
    for (i = 0; i < children.length; i++) {
      if (i > 0) {
        if (typeof children[i].inittransform === 'undefined') {
          children[i].inittransform = children[i].getAttributeNS(
            null,
            'transform'
          )
        }
        const bb = children[i].getBoundingClientRect()

        if (typeof children[i].lastXlate === 'undefined') {
          children[i].lastXlate = 0
        }

        if (grp.groupDistribType === 'vertical') {
          dif =
            parseFloat(String(ybottom - bb.top + grp.groupDistribSpacing)) +
            children[i].lastXlate
          tl = ' translate(0 ' + dif + ')'
        } else {
          dif =
            parseFloat(String(xright - bb.left + grp.groupDistribSpacing)) +
            children[i].lastXlate
          tl = ' translate(' + dif + ' 0)'
        }

        children[i].setAttributeNS(
          null,
          'transform',
          children[i].inittransform + tl
        )
        children[i].lastXlate = dif
      }
      const bb = children[i].getBoundingClientRect()
      xright = bb.right
      ybottom = bb.bottom
      children[i].groupDistrib = 1
    }
  }

  function processInkscapeSAGETags (item: any): void {
    let inksage_labeltxt: any =
      item.getAttributeNS(null, 'inkscape:label') ||
      item.getAttributeNS(
        'http://www.inkscape.org/namespaces/inkscape',
        'label'
      )
    let lbv: number, pnt: any, j: number, i: number
    let tspl: string[], src: string[], xsacsrc: any, arrcores: string[]
    let tooltip: any, tooltiptext: string
    let bb: any, sep: string
    let tfm: any, auxobj: any, pospfx: number, aft: string
    let arr: string[] = []

    if (inksage_labeltxt === null || inksage_labeltxt == '') {
      return
    }

    if (typeof inksage_labeltxt != 'undefined') {
      try {
        while ((pospfx = inksage_labeltxt.indexOf('$$#')) >= 0) {
          aft = inksage_labeltxt.substr(pospfx)
          inksage_labeltxt =
            inksage_labeltxt.substr(0, pospfx) +
            state.g_idprefixes[
              parseInt(inksage_labeltxt.substr(pospfx + 3)) - 1
            ] +
            aft.substr(aft.indexOf('_') + 1)
        }

        var inksage_labelvec = JSON.parse('[' + inksage_labeltxt + ']')
      } catch (Exception) {
        return
      }

      for (lbv = 0; lbv < inksage_labelvec.length; lbv++) {
        inksage_labelvec[lbv].parent = item
        pegaTagClone(item, inksage_labelvec[lbv])
        if (typeof inksage_labelvec[lbv].tag != 'undefined') {
          pnt = addPointToList(inksage_labelvec[lbv].tag)
          if (pnt !== 99999 && pnt !== 0)
            if (typeof item.blockPopup == 'undefined')
              if (item.pontoPopup == undefined) {
                tooltipRelac(item, pnt)
                const clickHandler = function(this: any, event: any) {
                  if (event && event.stopPropagation) event.stopPropagation()
                  event.closestGroup = { id: event.target.closest('g').id }
                  _onElementClick(pnt, event)
                }
                item.onclick = clickHandler
                if (item.style !== null) {
                  item.style.cursor = 'pointer'
                }
              }
        }

        switch (inksage_labelvec[lbv].attr) {
          case 'set':
            switch (inksage_labelvec[lbv].tag) {
              case '#exec_once':
              case '#exec':
                try {
                  const thisobj = inksage_labelvec[lbv].parent
                  function evalprot (src: string): any {
                    const $V = getValue
                    const $F = getFlags
                    const $T = getTime
                    const NPTS = Object.fromEntries(state.NPTS)
                    const $W: any = {}
                    $W.getDescription = getDescription
                    $W.RemoveAnimate = RemoveAnimate
                    $W.Animate = Animate
                    $W.LoadImage = LoadImage
                    $W.makeDraggable = makeDraggable
                    $W.lstpnt = state.lstpnt
                    window.WebSAGE = $W
                    return eval(src)
                  }
                  evalprot(inksage_labelvec[lbv].src)
                } catch (err) {
                  console.error('Error in #exec_once:', err)
                }
                break
              case '#copy_xsac_from':
                if (inksage_labelvec[lbv].src != '') {
                  src = inksage_labelvec[lbv].src.split(',')
                  for (j = 0; j < src.length; j++) {
                    auxobj = getElementById(src[j])
                    if (auxobj !== null) {
                      xsacsrc =
                        auxobj.getAttributeNS(null, 'inkscape:label') ||
                        auxobj.getAttributeNS(
                          'http://www.inkscape.org/namespaces/inkscape',
                          'label'
                        )
                      if (xsacsrc != '') {
                        item.setAttribute('inkscape:label', xsacsrc)
                        processInkscapeSAGETags(item)
                      }
                    }
                  }
                }
                break
              case '#set_group_distribution':
                sep = String(parseFloat(inksage_labelvec[lbv].src))
                if (isNaN(parseFloat(sep))) {
                  item.groupDistribSpacing = 0
                } else {
                  item.groupDistribSpacing = parseFloat(sep)
                }

                if (inksage_labelvec[lbv].prompt === 'vertical') {
                  item.groupDistribType = 'vertical'
                } else {
                  item.groupDistribType = 'horizontal'
                }

                setGroupDistrib(item)
                break
              case '#arc':
                if (initializeExtendedCallback) {
                  initializeExtendedCallback(inksage_labelvec, lbv, item)
                } else {
                  console.warn(
                    'processInkscapeSAGETags: initializeExtendedCallback NOT REGISTERED for #arc!'
                  )
                }
                break
              case '#vega':
              case '#vega3':
              case '#vega4':
              case '#vega5':
              case '#vega-lite':
              case '#vega-json':
              case '#vega3-json':
              case '#vega4-json':
              case '#vega5-json':
                if (initializeExtendedCallback) {
                  initializeExtendedCallback(inksage_labelvec, lbv, item)
                } else {
                  console.warn(
                    'processInkscapeSAGETags: initializeExtendedCallback NOT REGISTERED for',
                    inksage_labelvec[lbv].tag
                  )
                }
                break
              default:
                if (
                  inksage_labelvec[lbv].tag?.startsWith('#') &&
                  initializeExtendedCallback
                ) {
                  initializeExtendedCallback(inksage_labelvec, lbv, item)
                }
                break
            }
            break
          case 'popup':
            if (inksage_labelvec[lbv].src === 'block') {
              item.setAttributeNS(null, 'onclick', '')
              if (item.style != null) {
                item.style.cursor = ''
              }
              item.blockPopup = 1
              item.noTrace = 1
            } else if (inksage_labelvec[lbv].src === 'notrace') {
              item.noTrace = 1
            } else {
              pnt = addPointToList(inksage_labelvec[lbv].src)
              tooltipRelac(item, pnt)
              // Use onclick property instead of inline onclick
              const clickHandler = function(this: any, event: any) {
                if (event && event.stopPropagation) event.stopPropagation()
                event.closestGroup = { id: event.target.closest('g').id }
                _onElementClick(pnt, event)
              }
              item.onclick = clickHandler
              if (item.style !== null || typeof item.style === 'undefined') {
                item.style.cursor = 'pointer'
              }
              item.pontoPopup = pnt
            }
            break
          case 'get':
            if (
              inksage_labelvec[lbv].parent &&
              inksage_labelvec[lbv].parent.textContent
            ) {
              if (
                inksage_labelvec[
                  lbv
                ].parent.textContent.indexOf('|') >= 0
              ) {
                inksage_labelvec[lbv].txtOFFON =
                  inksage_labelvec[
                    lbv
                  ].parent.textContent.split('|')
              } else {
                inksage_labelvec[lbv].formatoC =
                  inksage_labelvec[lbv].parent.textContent
              }
            } else {
              inksage_labelvec[lbv].formatoC =
                inksage_labelvec[lbv].format || ''
            }
            pnt = inksage_labelvec[lbv].tag
            break
          case 'color':
            if (item.style !== null) {
              inksage_labelvec[lbv].initfill = item.style.fill
              inksage_labelvec[lbv].initstroke = item.style.stroke
            } else {
              inksage_labelvec[lbv].initfill = ''
              inksage_labelvec[lbv].initstroke = ''
            }
            for (j = 0; j < inksage_labelvec[lbv].list.length; j++) {
              pnt = addPointToList(inksage_labelvec[lbv].list[j].tag)
              inksage_labelvec[lbv].list[j].cscript = ''
              inksage_labelvec[lbv].list[j].cfill = ''
              inksage_labelvec[lbv].list[j].cstroke = ''
              inksage_labelvec[lbv].list[j].cattrib = ''
              inksage_labelvec[lbv].list[j].cattribval = ''

              if (
                inksage_labelvec[lbv].list[j].param.indexOf('attrib: ') === 0
              ) {
                arr = inksage_labelvec[lbv].list[j].param.substr(8).split('=')
                if (arr.length > 1) {
                  inksage_labelvec[lbv].list[j].cattrib = arr[0]
                  inksage_labelvec[lbv].list[j].cattribval = arr[1]
                }
              } else if (
                inksage_labelvec[lbv].list[j].param.indexOf('script: ') === 0
              ) {
                inksage_labelvec[lbv].list[j].cscript =
                  inksage_labelvec[lbv].list[j].param.substr(8)
              } else {
                arrcores = inksage_labelvec[lbv].list[j].param.split('|')
                inksage_labelvec[lbv].list[j].cfill = translateColor(
                  arrcores[0]
                )
                if (arrcores.length > 1) {
                  inksage_labelvec[lbv].list[j].cstroke = translateColor(
                    arrcores[1]
                  )
                } else {
                  inksage_labelvec[lbv].list[j].cstroke =
                    inksage_labelvec[lbv].list[j].cfill
                }
              }

              if (pnt != 99999)
                if (typeof item.blockPopup == 'undefined')
                  if (item.pontoPopup === undefined)
                    if (j === 0) {
                      tooltipRelac(item, pnt)
                      // Use onclick property instead of inline onclick
                      const clickHandler = function(this: any, event: any) {
                        if (event && event.stopPropagation) event.stopPropagation()
                        event.closestGroup = { id: event.target.closest('g').id }
                        _onElementClick(pnt, event)
                      }
                      item.onclick = clickHandler
                      if (item.style !== null) {
                        item.style.cursor = 'pointer'
                      }
                    }
            }
            break
          case 'bar':
            inksage_labelvec[lbv].initheight = item.getAttributeNS(
              null,
              'height'
            )
            break
          case 'opac':
            break
          case 'open':
            if (inksage_labelvec[lbv].istag == 0) {
              if (inksage_labelvec[lbv].src.indexOf('new:') === 0) {
                item.style.cursor = 'pointer'
                item.setAttributeNS(
                  null,
                  'onclick',
                  "window.open( '" +
                    inksage_labelvec[lbv].src.substr(4) +
                    "','','dependent=yes,height=" +
                    inksage_labelvec[lbv].height +
                    ',width=' +
                    inksage_labelvec[lbv].width +
                    ",toolbar=no,directories=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes' );"
                )
              }
            } else {
              if (item.tagName === 'rect') {
                inksage_labelvec[lbv].grafico = document.createElementNS(
                  'http://www.w3.org/2000/svg',
                  'polyline'
                )
                item.parentNode.appendChild(inksage_labelvec[lbv].grafico)
                inksage_labelvec[lbv].grafico.setAttributeNS(
                  null,
                  'style',
                  'fill:none; stroke:white; stroke-width: 2'
                )
                tfm = item.getAttributeNS(null, 'transform')
                if (tfm != null) {
                  inksage_labelvec[lbv].grafico.setAttributeNS(
                    null,
                    'transform',
                    tfm
                  )
                }

                if (item.style != undefined) {
                  if (item.style.strokeWidth != '') {
                    inksage_labelvec[lbv].grafico.style.strokeWidth =
                      item.style.strokeWidth
                  }
                  if (item.style.stroke != '') {
                    inksage_labelvec[lbv].grafico.style.stroke =
                      item.style.stroke
                  }
                }

                tspl = inksage_labelvec[lbv].src.split('|')
                inksage_labelvec[lbv].tag = tspl[0]
                if (typeof tspl[1] != 'undefined') {
                  if (tspl[1].trim() != '') {
                    inksage_labelvec[lbv].grafico.setAttributeNS(
                      null,
                      'style',
                      tspl[1]
                    )
                  }
                }

                inksage_labelvec[lbv].valores = []
                inksage_labelvec[lbv].datas = []
                bb = item.getBBox()
                inksage_labelvec[lbv].bb = {
                  x: bb.x,
                  y: bb.y,
                  width: bb.width,
                  height: bb.height,
                  left: bb.x,
                  right: bb.x + bb.width,
                  top: bb.y,
                  bottom: bb.y + bb.height,
                }
                pnt = addPointToList(inksage_labelvec[lbv].tag)
                if (typeof item.blockPopup == 'undefined')
                  if (item.pontoPopup == undefined) {
                    tooltipRelac(item, pnt)
                    // Use onclick property instead of inline onclick
                    const clickHandler = function(this: any, event: any) {
                      if (event && event.stopPropagation) event.stopPropagation()
                      event.closestGroup = { id: event.target.closest('g').id }
                      _onElementClick(pnt, event)
                    }
                    item.onclick = clickHandler
                    if (item.style != null) {
                      item.style.cursor = 'pointer'
                    }
                  }
              }
            }
            break
          case 'rotate':
            if (item.getAttributeNS(null, 'transform') === null) {
              inksage_labelvec[lbv].inittransform = ''
            } else {
              inksage_labelvec[lbv].inittransform = item.getAttributeNS(
                null,
                'transform'
              )
            }
            break
          case 'tooltips':
            tooltiptext = ''
            for (j = 0; j < inksage_labelvec[lbv].param.length; j++) {
              if (j > 0) {
                tooltiptext = tooltiptext + '\n'
              }
              tooltiptext = tooltiptext + inksage_labelvec[lbv].param[j]
            }
            tooltip = document.createElementNS(
              'http://www.w3.org/2000/svg',
              'title'
            )
            tooltip.textContent = tooltiptext
            item.appendChild(tooltip)
            item.hasTooltip = 1
            if (tooltiptext.indexOf('!EVAL') !== -1) {
              inksage_labelvec[lbv].hasActiveTooltip = 1
              inksage_labelvec[lbv].tooltipTitle = tooltip
              inksage_labelvec[lbv].tooltipText = tooltiptext
            }
            break
          case 'slider':
            if (item.getAttributeNS(null, 'transform') === null) {
              inksage_labelvec[lbv].inittransform = ''
            } else {
              inksage_labelvec[lbv].inittransform = item.getAttributeNS(
                null,
                'transform'
              )
            }
            inksage_labelvec[lbv].min = parseFloat(inksage_labelvec[lbv].min)
            inksage_labelvec[lbv].max = parseFloat(inksage_labelvec[lbv].max)

            let clone: any = undefined
            const nohs = state.SVGDoc.getElementsByTagName('use')
            for (i = 0; i < nohs.length; i++) {
              if (
                nohs
                  .item(i)
                  .getAttributeNS('http://www.w3.org/1999/xlink', 'href') ==
                '#' + item.getAttributeNS(null, 'id')
              ) {
                clone = nohs.item(i)
                inksage_labelvec[lbv].clone = clone
                break
              }
            }
            if (clone != undefined) {
              clone.style.display = 'none'
              const clonetfm = clone.getAttributeNS(null, 'transform')
              const st1 = clonetfm.indexOf('(')
              let st2 = clonetfm.indexOf(',')
              if (st2 === -1) st2 = clonetfm.indexOf(' ')
              const st3 = clonetfm.indexOf(')')
              if (st2 == -1) st2 = st3
              inksage_labelvec[lbv].rangex =
                parseFloat(clonetfm.substring(st1 + 1, st2)) || 0
              inksage_labelvec[lbv].rangey =
                parseFloat(clonetfm.substring(st2 + 1, st3)) || 0
            }
            break
          case 'zoom':
            bb = item.getBoundingClientRect()
            item.setAttributeNS(
              null,
              'onclick',
              'if(typeof engine!=="undefined"){engine.setZoomParams(' +
                bb.left +
                ',' +
                bb.top +
                ',' +
                bb.width * 2.0 +
                ',' +
                bb.height * 2.0 +
                ');engine.zoomPan(10);}'
            )
            break
          case 'script':
            for (i = 0; i < inksage_labelvec[lbv].list.length; i++) {
              switch (inksage_labelvec[lbv].list[i].evt) {
                case 'vega':
                case 'vega3':
                case 'vega4':
                case 'vega5':
                case 'vega-lite':
                  inksage_labelvec[lbv].tag =
                    '#' + inksage_labelvec[lbv].list[i].evt
                  inksage_labelvec[lbv].src =
                    inksage_labelvec[lbv].list[i].param.split('\n')[0]
                  inksage_labelvec[lbv].prompt = inksage_labelvec[lbv].list[
                    i
                  ].param.substring(
                    inksage_labelvec[lbv].list[i].param.indexOf('\n') + 1
                  )
                  if (initializeExtendedCallback) {
                    initializeExtendedCallback(inksage_labelvec, lbv, item)
                  }
                  break
                case 'vega-json':
                case 'vega3-json':
                case 'vega4-json':
                case 'vega5-json':
                  inksage_labelvec[lbv].tag =
                    '#' + inksage_labelvec[lbv].list[i].evt
                  inksage_labelvec[lbv].prompt =
                    inksage_labelvec[lbv].list[i].param
                  if (initializeExtendedCallback) {
                    initializeExtendedCallback(inksage_labelvec, lbv, item)
                  }
                  break
                case 'mouseup':
                case 'mousedown':
                case 'mouseover':
                case 'mouseout':
                case 'mousemove':
                case 'keydown':
                  item.setAttributeNS(
                    null,
                    'on' + inksage_labelvec[lbv].list[i].evt,
                    'thisobj=evt.currentTarget;' +
                      inksage_labelvec[lbv].list[i].param
                  )
                  if (inksage_labelvec[lbv].list[i].evt.indexOf('mouse') >= 0)
                    if (typeof item.blockPopup == 'undefined')
                      if (item.style !== null) item.style.cursor = 'pointer'
                  break
                case 'exec_once':
                  try {
                    const thisobj = inksage_labelvec[lbv].parent
                    function evalprot (src: string): any {
                      const $V = getValue
                      const $F = getFlags
                      const $T = getTime
                      const NPTS = Object.fromEntries(state.NPTS)
                      const $W: any = {}
                      $W.getDescription = getDescription
                      $W.RemoveAnimate = RemoveAnimate
                      $W.Animate = Animate
                      $W.LoadImage = LoadImage
                      $W.lstpnt = state.lstpnt
                      return eval(src)
                    }
                    evalprot(inksage_labelvec[lbv].list[i].param)
                  } catch (err) {
                    console.error('Error in exec_once:', err)
                  }
                  break
                case 'exec_on_update':
                  break
                default:
                  break
              }
            }
            break
          case 'text':
            break
          case 'clone':
            if (
              'map' in inksage_labelvec[lbv] &&
              inksage_labelvec[lbv].map.length > 0
            ) {
              const var_tag = inksage_labelvec[lbv].map[0].split('=')
              pnt = addPointToList(var_tag[1])
              if (pnt !== 0) {
                // Use onclick property instead of inline onclick
                const clickHandler = function(this: any, event: any) {
                  if (event && event.stopPropagation) event.stopPropagation()
                  event.closestGroup = { id: event.target.closest('g').id }
                  _onElementClick(pnt, event)
                }
                item.onclick = clickHandler
                if (item.style !== null || typeof item.style === 'undefined')
                  item.style.cursor = 'pointer'
                item.pontoPopup = pnt
              }
            }
            break
          default:
            break
        }

        state.InkSage.push(inksage_labelvec[lbv])
      }
    }
  }

  function preprocessSVGDisplay (): void {
    if (state.SVGDoc === null) {
      return
    }
    let i: number

    let nohs = state.SVGDoc.getElementsByTagName('g')
    for (i = 0; i < nohs.length; i++) {
      processInkscapeSAGETags(nohs.item(i))
    }

    nohs = state.SVGDoc.getElementsByTagName('text')
    try {
      for (i = 0; i < nohs.length; i++) {
        processInkscapeSAGETags(nohs.item(i))
      }
    } catch (err) {
      console.error('Error processing text elements:', err)
    }

    nohs = []
    let tmp: any = state.SVGDoc.getElementsByTagName('rect')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('ellipse')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('path')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('image')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('circle')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('line')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('polyline')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('polygon')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))
    tmp = state.SVGDoc.getElementsByTagName('use')
    for (i = 0; i < tmp.length; i++) nohs.push(tmp.item(i))

    for (i = 0; i < nohs.length; i++) {
      if (nohs[i].nodeName !== 'g' && nohs[i].nodeName !== 'text') {
        try {
          processInkscapeSAGETags(nohs[i])
        } catch (err) {
          console.error('Error processing element:', nohs[i].id, err)
        }
      }
    }
  }

  function blinkAlarmed (tag: any, item: any): void {
    const f = getFlags(tag)
    if (f & 0x100) {
      if ((f & 0x20) == 0) {
        if (state.g_blinkList.indexOf(item) === -1) state.g_blinkList.push(item)
      } else {
        if (state.g_blinkListAna.indexOf(item) === -1)
          state.g_blinkListAna.push(item)
      }
    } else {
      let i = state.g_blinkList.indexOf(item)
      item.style.fillOpacity = '1'
      item.style.strokeOpacity = '1'
      if (i !== -1) state.g_blinkList.splice(i, 1)
      i = state.g_blinkListOld.indexOf(item)
      if (i !== -1) state.g_blinkListOld.splice(i, 1)
      i = state.g_blinkListAna.indexOf(item)
      if (i !== -1) state.g_blinkListAna.splice(i, 1)
      i = state.g_blinkListAnaOld.indexOf(item)
      if (i !== -1) state.g_blinkListAnaOld.splice(i, 1)
      return
    }
  }

  function drawSVG (): void {
    const svgdiv = getElementById('svgdiv')
    if (!svgdiv) return

    try {
      state.SVGDoc = svgdiv.children[0]
    } catch (exception) {
      console.log('Unsupported browser!')
      return
    }

    let fill: string, stroke: string, attrib: string, attribval: string
    let bb: any, ft: number, i: number, j: number
    let digital: boolean, val: string, tag: string, vt: any, ch: string

    for (i = 0; i < state.InkSage.length; i++) {
      if (typeof state.InkSage[i].xdone != 'undefined') continue

      if (state.InkSage[i].tag != undefined) {
        tag = state.InkSage[i].tag
        vt = valueResolveCoded(tag, state.InkSage[i].parent)
      }

      if (
        vt != retnok ||
        state.InkSage[i].attr === 'color' ||
        state.InkSage[i].attr === 'set' ||
        state.InkSage[i].attr === 'script'
      ) {
        switch (state.InkSage[i].attr) {
          case 'set':
            switch (state.InkSage[i].tag) {
              case '#exec_on_update':
                try {
                  const thisobj = state.InkSage[i].parent
                  function evalprot (src: string): any {
                    const $V = getValue
                    const $F = getFlags
                    const $T = getTime
                    const NPTS = Object.fromEntries(state.NPTS)
                    const $W: any = {}
                    $W.getDescription = getDescription
                    $W.RemoveAnimate = RemoveAnimate
                    $W.Animate = Animate
                    $W.LoadImage = LoadImage
                    $W.lstpnt = state.lstpnt
                    return eval(src)
                  }
                  evalprot(state.InkSage[i].src)
                } catch (err) {
                  console.error('Error in #exec_on_update:', err)
                }
                break
              default:
                if (executeExtendedCallback) {
                  executeExtendedCallback(i)
                }
                break
            }
            break
          case 'open':
            if (state.InkSage[i].istag == 1)
              if (state.InkSage[i].parent.tagName === 'rect') {
                let indv: number, xx: number, yy: number
                let dotlist = ''
                const d = new Date()

                if (state.InkSage[i].hasOwnProperty('valores'))
                  if (typeof state.InkSage[i].valores[tag] == 'undefined') {
                    state.InkSage[i].valores[tag] = []
                    state.InkSage[i].datas[tag] = []
                  }

                if (state.InkSage[i].hasOwnProperty('valores'))
                  if (typeof state.InkSage[i].valores[tag] != 'undefined')
                    if (state.InkSage[i].valores[tag].length > 0)
                      if (
                        vt ==
                        state.InkSage[i].valores[tag][
                          state.InkSage[i].valores[tag].length - 1
                        ]
                      )
                        if (
                          (d.getTime() -
                            state.InkSage[i].datas[tag][
                              state.InkSage[i].datas[tag].length - 1
                            ]) /
                            1000 <
                          30
                        )
                          break

                if (state.InkSage[i].hasOwnProperty('valores'))
                  if (typeof state.InkSage[i].valores[tag] != 'undefined') {
                    state.InkSage[i].valores[tag].push(vt)
                    state.InkSage[i].datas[tag].push(d.getTime())
                    bb = state.InkSage[i].bb
                    if (state.InkSage[i].width > 0)
                      for (
                        indv = state.InkSage[i].valores[tag].length - 1;
                        indv >= 0;
                        indv--
                      ) {
                        const secdif =
                          (d.getTime() - state.InkSage[i].datas[tag][indv]) /
                          1000
                        if (secdif > Math.abs(state.InkSage[i].width)) {
                          state.InkSage[i].valores[tag].splice(indv, 1)
                          state.InkSage[i].datas[tag].splice(indv, 1)
                        } else {
                          xx =
                            bb.right -
                            parseFloat(
                              String(
                                (secdif / Math.abs(state.InkSage[i].width)) *
                                  bb.width
                              )
                            )
                          yy =
                            bb.bottom -
                            parseFloat(
                              String(
                                ((state.InkSage[i].valores[tag][indv] -
                                  state.InkSage[i].y) /
                                  state.InkSage[i].height) *
                                  bb.height
                              )
                            )
                          if (yy > bb.bottom) yy = bb.bottom
                          if (yy < bb.top) yy = bb.top
                          const sep = indv === 0 ? '' : ','
                          dotlist =
                            dotlist + xx.toFixed(3) + ' ' + yy.toFixed(3) + sep
                        }
                      }
                    else
                      for (
                        indv = state.InkSage[i].valores[tag].length - 1;
                        indv >= 0;
                        indv--
                      ) {
                        const secdif =
                          (state.InkSage[i].datas[tag][indv] -
                            state.InkSage[i].dataini) /
                          1000
                        if (
                          state.InkSage[i].datas[tag][indv] >
                          state.InkSage[i].datafim
                        ) {
                          state.InkSage[i].valores[tag] = []
                          state.InkSage[i].datas[tag] = []
                          const dtn = new Date()
                          state.InkSage[i].dataini =
                            dtn.getTime() -
                            (dtn.getTime() %
                              (Math.abs(state.InkSage[i].width) * 1000)) +
                            ((dtn.getTimezoneOffset() * 60 * 1000) %
                              (Math.abs(state.InkSage[i].width) * 1000))
                          state.InkSage[i].datafim =
                            state.InkSage[i].dataini +
                            Math.abs(state.InkSage[i].width * 1000)
                        } else {
                          xx =
                            bb.left +
                            parseFloat(
                              String(
                                (secdif / Math.abs(state.InkSage[i].width)) *
                                  bb.width
                              )
                            )
                          yy =
                            bb.bottom -
                            parseFloat(
                              String(
                                ((state.InkSage[i].valores[tag][indv] -
                                  state.InkSage[i].y) /
                                  state.InkSage[i].height) *
                                  bb.height
                              )
                            )
                          if (yy > bb.bottom) yy = bb.bottom
                          if (yy < bb.top) yy = bb.top
                          const sep = indv === 0 ? '' : ','
                          dotlist =
                            dotlist + xx.toFixed(3) + ' ' + yy.toFixed(3) + sep
                        }
                      }

                    if (dotlist.charAt(dotlist.length - 1) === ',') {
                      dotlist = dotlist.substring(0, dotlist.length - 1)
                    }
                    state.InkSage[i].grafico.setAttributeNS(
                      null,
                      'points',
                      dotlist
                    )
                  }
              }
            break
          case 'get':
            if (typeof state.InkSage[i].txtOFFON !== 'undefined') {
              if (valueResolveCoded(tag, state.InkSage[i].parent) === 0)
                val = String(state.InkSage[i].txtOFFON[1])
              else val = String(state.InkSage[i].txtOFFON[0])
            } else {
              val = printCFormat(
                state.InkSage[i].formatoC,
                tag,
                state.InkSage[i].parent
              )
            }
            if (
              state.InkSage[i].parent &&
              val !==
                state.InkSage[i].parent.textContent
            ) {
              if (state.InkSage[i].parent?.firstElementChild?.nodeName === "tspan") {
                state.InkSage[i].parent.firstElementChild.textContent =
                  val
              } else {
                state.InkSage[i].parent.textContent = val
              }
              if (state.InkSage[i].parent.groupDistrib) {
                setGroupDistrib(state.InkSage[i].parent.parentNode)
              }
              state.InkSage[i].lastVal = getValue(tag)
            }
            blinkAlarmed(tag, state.InkSage[i].parent)
            break
          case 'color':
            let script = ''
            fill = ''
            stroke = ''
            attrib = ''
            attribval = ''
            tag = ''
            vt = 0
            for (j = 0; j < state.InkSage[i].list.length; j++) {
              if (tag !== state.InkSage[i].list[j].tag) {
                tag = state.InkSage[i].list[j].tag
                vt = Number(valueResolveCoded(tag, state.InkSage[i].parent))
              }

              if (typeof getFlags(tag) === 'undefined') {
                if (vt === retnok) {
                  ft = 0x80 | 0x20
                } else {
                  ft = 0x20
                }
              } else {
                ft = getFlags(tag)
              }
              digital = (ft & 0x20) === 0

              if (vt !== retnok) {
                ch = state.InkSage[i].list[j].data
                if (digital) {
                  const numVal = parseInt(ch)
                  if (
                    (!isNaN(numVal) && (ft & 0x03) >= numVal) ||
                    (!isNaN(numVal) && (ft & 0x83) >= (numVal | 0x80)) ||
                    (ch === 'a' && ft & 0x100) ||
                    (ch === 'f' && ft & 0x80)
                  ) {
                    fill = state.InkSage[i].list[j].cfill
                    stroke = state.InkSage[i].list[j].cstroke
                    script = state.InkSage[i].list[j].cscript
                    attrib = state.InkSage[i].list[j].cattrib
                    attribval = state.InkSage[i].list[j].cattribval
                  }
                } else {
                  const numVal = parseFloat(ch)
                  if (
                    (ch === 'n' && ft & 0x800) ||
                    (ch === 'c' && ft & 0x1000) ||
                    (ch === 'a' && ft & 0x100) ||
                    (ch === 'f' && ft & 0x80) ||
                    (!isNaN(numVal) && vt >= numVal)
                  ) {
                    let strf: string, atustrf: string, proxval: number
                    if (typeof state.InkSage[i].list[j + 1] != 'undefined') {
                      strf = state.InkSage[i].list[j + 1].cfill
                      if (strf[0] === '@') {
                        strf = strf.substring(1)
                        atustrf = state.InkSage[i].list[j].cfill
                        if (atustrf[0] === '@') atustrf = atustrf.substring(1)
                        proxval = parseFloat(state.InkSage[i].list[j + 1].data)
                        if (state.chroma) {
                          fill = state.chroma
                            .mix(
                              atustrf,
                              strf,
                              (vt - numVal) / (proxval - numVal),
                              'hsl'
                            )
                            .toString()
                        } else {
                          fill = state.InkSage[i].list[j].cfill
                        }
                      } else fill = state.InkSage[i].list[j].cfill

                      strf = state.InkSage[i].list[j + 1].cstroke
                      if (strf[0] === '@') {
                        strf = strf.substring(1)
                        atustrf = state.InkSage[i].list[j].cstroke
                        if (atustrf[0] === '@') atustrf = atustrf.substring(1)
                        proxval = parseFloat(state.InkSage[i].list[j + 1].data)
                        if (state.chroma) {
                          stroke = state.chroma
                            .mix(
                              atustrf,
                              strf,
                              (vt - numVal) / (proxval - numVal),
                              'hsl'
                            )
                            .toString()
                        } else {
                          stroke = state.InkSage[i].list[j].cstroke
                        }
                      } else stroke = state.InkSage[i].list[j].cstroke
                    } else {
                      fill = state.InkSage[i].list[j].cfill
                      if (fill[0] === '@') fill = fill.substring(1)
                      stroke = state.InkSage[i].list[j].cstroke
                      if (stroke[0] === '@') stroke = stroke.substring(1)
                    }

                    script = state.InkSage[i].list[j].cscript
                    attrib = state.InkSage[i].list[j].cattrib
                    attribval = state.InkSage[i].list[j].cattribval
                  }
                }

                blinkAlarmed(tag, state.InkSage[i].parent)
              }
            }

            if (typeof state.InkSage[i].parent.temAnimacao !== 'undefined')
              if (state.InkSage[i].parent.temAnimacao) {
                RemoveAnimate(state.InkSage[i].parent)
              }

            if (attrib !== '') {
              state.InkSage[i].parent.setAttributeNS(null, attrib, attribval)
            } else if (script !== '') {
              state.InkSage[i].parent.temAnimacao = 1
              state.InkSage[i].parent.style.fill = state.InkSage[i].initfill
              state.InkSage[i].parent.style.stroke = state.InkSage[i].initstroke
              try {
                const thisobj = state.InkSage[i].parent
                function evalprot (src: string): any {
                  const $V = getValue
                  const $F = getFlags
                  const $T = getTime
                  const NPTS = Object.fromEntries(state.NPTS)
                  const $W: any = {}
                  $W.getDescription = getDescription
                  $W.RemoveAnimate = RemoveAnimate
                  $W.Animate = Animate
                  $W.LoadImage = LoadImage
                  $W.lstpnt = state.lstpnt
                  return eval(src)
                }
                evalprot(script)
              } catch (err) {
                console.error('Error in color script:', err)
              }
            } else {
              if (fill !== '') {
                state.InkSage[i].parent.style.fill = fill
              } else {
                state.InkSage[i].parent.style.fill = state.InkSage[i].initfill
              }

              if (stroke !== '') {
                state.InkSage[i].parent.style.stroke = stroke
              } else {
                state.InkSage[i].parent.style.stroke =
                  state.InkSage[i].initstroke
              }
            }
            if (state.InkSage[i].parent.groupDistrib) {
              setGroupDistrib(state.InkSage[i].parent.parentNode)
            }
            if (tag == '99999') {
              state.InkSage[i].xdone = 1
            }
            break
          case 'bar':
            let height =
              (Number(state.InkSage[i].initheight) *
                (vt - state.InkSage[i].min)) /
              (state.InkSage[i].max - state.InkSage[i].min)
            if (height < 0) height = 0
            if (height > Number(state.InkSage[i].initheight))
              height = Number(state.InkSage[i].initheight)
            state.InkSage[i].parent.setAttributeNS(
              null,
              'height',
              String(height)
            )
            blinkAlarmed(tag, state.InkSage[i].parent)
            break
          case 'opac':
            let opac = 1
            if (state.InkSage[i].max === state.InkSage[i].min) opac = 1
            else {
              opac =
                (vt - state.InkSage[i].min) /
                (state.InkSage[i].max - state.InkSage[i].min)
              if (opac < 0) opac = 0
              if (opac > 1) opac = 1
            }
            if (isNaN(opac)) opac = 1
            state.InkSage[i].parent.style.opacity = String(opac)
            blinkAlarmed(tag, state.InkSage[i].parent)
            break
          case 'rotate':
            bb = state.InkSage[i].parent.getBBox()
            let tcx = parseFloat(
              state.InkSage[i].parent.getAttributeNS(
                null,
                'inkscape:transform-center-x'
              ) ||
                state.InkSage[i].parent.getAttributeNS(
                  'http://www.inkscape.org/namespaces/inkscape',
                  'transform-center-x'
                ) ||
                '0'
            )
            let tcy = parseFloat(
              state.InkSage[i].parent.getAttributeNS(
                null,
                'inkscape:transform-center-y'
              ) ||
                state.InkSage[i].parent.getAttributeNS(
                  'http://www.inkscape.org/namespaces/inkscape',
                  'transform-center-y'
                ) ||
                '0'
            )
            if (isNaN(tcx)) tcx = 0
            if (isNaN(tcy)) tcy = 0
            const xcen = bb.x + bb.width / 2 + tcx
            const ycen = bb.y + bb.height / 2 - tcy
            const ang =
              ((vt - state.InkSage[i].min) /
                (state.InkSage[i].max - state.InkSage[i].min)) *
              360
            state.InkSage[i].parent.setAttributeNS(
              null,
              'transform',
              state.InkSage[i].inittransform +
                ' rotate(' +
                ang +
                ' ' +
                xcen +
                ' ' +
                ycen +
                ') '
            )
            blinkAlarmed(tag, state.InkSage[i].parent)
            break
          case 'tooltips':
            if (typeof state.InkSage[i].hasActiveTooltip !== 'undefined')
              if (state.InkSage[i].hasActiveTooltip === 1) {
                let pini: number
                let pend: number
                let ev: any
                let tc: string = state.InkSage[i].tooltipText
                do {
                  pini = tc.indexOf('!EVAL', 0)
                  pend = tc.indexOf('!END', 1)
                  if (pend === -1) pend = 9999999
                  if (pini !== -1) {
                    const thisobj = state.InkSage[i].parent
                    function evalprot (src: string): any {
                      const $V = getValue
                      const $F = getFlags
                      const $T = getTime
                      const NPTS = Object.fromEntries(state.NPTS)
                      const $W: any = {}
                      $W.getDescription = getDescription
                      $W.RemoveAnimate = RemoveAnimate
                      $W.Animate = Animate
                      $W.LoadImage = LoadImage
                      $W.lstpnt = state.lstpnt
                      return eval(src)
                    }
                    ev = evalprot(tc.substring(pini + 5, pend))
                    if (!isNaN(Number(ev))) {
                      ev = sprintf('%1.3f', ev)
                    }
                    tc = tc.substring(0, pini) + ev + tc.substring(pend + 4)
                  }
                } while (pini !== -1)

                if (state.InkSage[i].tooltipTitle.textContent !== tc) {
                  state.InkSage[i].tooltipTitle.textContent = tc
                }
              }
            break
          case 'slider':
            if (vt > state.InkSage[i].max) vt = state.InkSage[i].max
            if (vt < state.InkSage[i].min) vt = state.InkSage[i].min
            const proporcao =
              (vt - state.InkSage[i].min) /
              (state.InkSage[i].max - state.InkSage[i].min)
            state.InkSage[i].parent.setAttributeNS(
              null,
              'transform',
              state.InkSage[i].inittransform +
                ' translate(' +
                proporcao * state.InkSage[i].rangex +
                ' ' +
                proporcao * state.InkSage[i].rangey +
                ') '
            )
            blinkAlarmed(tag, state.InkSage[i].parent)
            break
          case 'text':
            if (typeof getFlags(tag) == 'undefined') {
              ft = Number(vt)
            } else {
              ft = getFlags(tag)
            }
            digital = (ft & 0x20) == 0
            let txt = ''
            for (j = 0; j < state.InkSage[i].map.length; j++) {
              const poseq = state.InkSage[i].map[j].indexOf('=')
              ch = state.InkSage[i].map[j].substring(0, 1)
              if (digital) {
                const numVal = parseInt(state.InkSage[i].map[j].substring(0, poseq))
                if (
                  (ft & 0x03) >= numVal ||
                  (ft & 0x83) >= (numVal | 0x80) ||
                  (ch === 'a' && ft & 0x100) ||
                  (ch === 'f' && ft & 0x80)
                ) {
                  txt = state.InkSage[i].map[j].substring(poseq + 1)
                }
              } else {
                const numVal = parseFloat(state.InkSage[i].map[j].substring(0, poseq))
                if (
                  vt >= numVal ||
                  (ch === 'a' && ft & 0x100) ||
                  (ch === 'f' && ft & 0x80)
                ) {
                  txt = state.InkSage[i].map[j].substring(poseq + 1)
                }
              }
            }
            if (txt != state.InkSage[i].parent.textContent) {
              if (
                state.InkSage[i].parent.firstChild &&
                state.InkSage[i].parent.firstChild.tagName === 'tspan'
              )
                state.InkSage[i].parent.firstChild.textContent = txt
              else state.InkSage[i].parent.textContent = txt
            }
            blinkAlarmed(tag, state.InkSage[i].parent)
            break
          case 'clone':
            break
          case 'script':
            for (j = 0; j < state.InkSage[i].list.length; j++) {
              switch (state.InkSage[i].list[j].evt) {
                case 'vega':
                case 'vega3':
                case 'vega4':
                case 'vega5':
                case 'vega-json':
                case 'vega3-json':
                case 'vega4-json':
                case 'vega5-json':
                case 'vega-lite':
                  if (executeExtendedCallback) {
                    executeExtendedCallback(i)
                  }
                  break
                case 'exec_on_update':
                  try {
                    const thisobj = state.InkSage[i].parent
                    function evalprot (src: string): any {
                      const $V = getValue
                      const $F = getFlags
                      const $T = getTime
                      const NPTS = Object.fromEntries(state.NPTS)
                      const $W: any = {}
                      $W.getDescription = getDescription
                      $W.RemoveAnimate = RemoveAnimate
                      $W.Animate = Animate
                      $W.LoadImage = LoadImage
                      $W.lstpnt = state.lstpnt
                      return eval(src)
                    }
                    evalprot(state.InkSage[i].list[j].param)
                  } catch (err) {
                    console.error('Error in exec_on_update:', err)
                  }
                  break
                default:
                  break
              }
            }
            break
          default:
            if (
              state.InkSage[i].tag &&
              state.InkSage[i].tag.startsWith('#') &&
              executeExtendedCallback
            ) {
              executeExtendedCallback(i)
            }
            break
        }
      }
    }

    const svgdivEl = getElementById('svgdiv')
    if (svgdivEl && svgdivEl.style.opacity == '0') svgdivEl.style.opacity = '1'
  }

  function showValsSVG (): void {
    if (document.hidden || !requestAnimationFrame) {
      drawSVG()
    } else {
      requestAnimationFrame(drawSVG)
    }
  }

  function zoomPan (opc: number, mul?: number, event?: any): void {
    if (state.SVGDoc === null) {
      return
    }
    let ptScr: any, ptSvg: any, w: number, h: number

    if (mul === undefined) mul = 1

    switch (opc) {
      case 12:
        ptScr = state.SVGDoc.createSVGPoint()
        ptScr.x = event.clientX
        ptScr.y = event.clientY
        ptSvg = ptScr.matrixTransform(state.SVGDoc.getScreenCTM().inverse())
        state.g_zpW = state.g_zpW * 0.95
        state.g_zpH = state.g_zpH * 0.95
        w = state.g_zpW / 0.95
        h = state.g_zpH / 0.95
        state.g_zpX =
          state.g_zpX +
          (w - state.g_zpW) * ((ptSvg.x - state.g_zpX) / state.g_zpW) -
          2.5
        state.g_zpY =
          state.g_zpY +
          (h - state.g_zpH) * ((ptSvg.y - state.g_zpY) / state.g_zpH) -
          1.5
        break
      case 18:
        ptScr = state.SVGDoc.createSVGPoint()
        ptScr.x = event.clientX
        ptScr.y = event.clientY
        ptSvg = ptScr.matrixTransform(state.SVGDoc.getScreenCTM().inverse())
        state.g_zpW = state.g_zpW * 1.05
        state.g_zpH = state.g_zpH * 1.05
        w = state.g_zpW / 1.05
        h = state.g_zpH / 1.05
        state.g_zpX =
          state.g_zpX +
          (w - state.g_zpW) * ((ptSvg.x - state.g_zpX) / state.g_zpW) -
          2.5
        state.g_zpY =
          state.g_zpY +
          (h - state.g_zpH) * ((ptSvg.y - state.g_zpY) / state.g_zpH) -
          1.5
        break
      case 0:
      case 2:
        state.g_zpW = state.g_zpW * 0.9
        state.g_zpH = state.g_zpH * 0.9
        state.g_zpX = state.g_zpX + 1
        break
      case 1:
        state.g_zpY =
          state.g_zpY +
          (mul * 20 * state.g_zpW) /
            (state.g_containerW || state.ScreenViewer_SVGMaxWidth)
        break
      case 3:
        state.g_zpX =
          state.g_zpX +
          (mul * 30 * state.g_zpW) /
            (state.g_containerW || state.ScreenViewer_SVGMaxWidth)
        break
      case 4:
        state.g_zpX = 0
        state.g_zpY = 0
        state.g_zpW = state.g_containerW || state.ScreenViewer_SVGMaxWidth
        state.g_zpH = state.g_containerH || state.ScreenViewer_SVGMaxHeight
        break
      case 5:
        state.g_zpX =
          state.g_zpX -
          (mul * 30 * state.g_zpW) /
            (state.g_containerW || state.ScreenViewer_SVGMaxWidth)
        break
      case 6:
      case 8:
        state.g_zpW = state.g_zpW * 1.1
        state.g_zpH = state.g_zpH * 1.1
        state.g_zpX = state.g_zpX + 1
        break
      case 7:
        state.g_zpY =
          state.g_zpY -
          (mul * 20 * state.g_zpW) /
            (state.g_containerW || state.ScreenViewer_SVGMaxWidth)
        break
      case 9:
        state.g_zpW = state.g_zpW * 1.3
        state.g_zpH = state.g_zpH * 1.3
        state.g_zpX = state.g_zpX + 1
        break
      case 10:
        break
      default:
        break
    }

    state.SVGDoc.setAttributeNS(
      null,
      'viewBox',
      state.g_zpX + ' ' + state.g_zpY + ' ' + state.g_zpW + ' ' + state.g_zpH
    )
  }

  function setZoomParams (x: number, y: number, w: number, h: number): void {
    state.g_zpX = x
    state.g_zpY = y
    state.g_zpW = w
    state.g_zpH = h
  }

  function setBgColor (cor: string): void {
    if (cor == 'none') {
      const sodipodibase = state.SVGDoc.getElementById('base')
      if (sodipodibase)
        state.Color_BackgroundSVG = cor =
          sodipodibase.attributes.pagecolor.value
      else return
    }

    state.SVGDoc.setAttributeNS(null, 'style', 'background-color: ' + cor + ';')
    // bg color on SVG div id="svgdiv"
    const svgdiv = document.getElementById('svgdiv')
    if (svgdiv) svgdiv.style.backgroundColor = cor

    emitEvent('backgroundColor', { color: cor })
  }

  function translateColor (cor: string): string {
    let num: number
    if (
      cor.substr(0, 5) == '-cor-' ||
      cor.substr(0, 5) == '-clr-' ||
      cor.substr(0, 5) == '-pbi-'
    )
      switch (cor) {
        case '-pbi-background':
          cor = state.PBIColors?.background || '#FFFFFF'
          break
        case '-pbi-foreground':
          cor = state.PBIColors?.foreground || '#D6862D'
          break
        case '-pbi-bad':
          cor = state.PBIColors?.bad || 'red'
          break
        case '-pbi-good':
          cor = state.PBIColors?.good || 'green'
          break
        case '-pbi-maximum':
          cor = state.PBIColors?.maximum || 'red'
          break
        case '-pbi-minimum':
          cor = state.PBIColors?.minimum || 'green'
          break
        case '-pbi-selected':
          cor = state.PBIColors?.selected || 'none'
          break
        case '-pbi-negative':
          cor = state.PBIColors?.negative || 'none'
          break
        case '-pbi-positive':
          cor = state.PBIColors?.positive || 'none'
          break
        case '-clr-background':
        case '-clr-bgd':
        case '-cor-bgd':
          cor = state.Color_BackgroundSVG
          break
        case '-clr-tbr':
        case '-cor-tbr':
          cor = state.ScreenViewer_ToolbarColor
          break
        case '-clr-almini':
        case '-cor-almini':
          cor = state.VisorTelas_CorAlarmeInibido
          break
        case '-clr-failed':
        case '-cor-medfal':
          cor = state.VisorTelas_Medidas_Cor_Falha
          break
        default:
          if (cor.substr(0, 5) == '-pbi-') {
            num = parseInt(cor.substr(5, 3), 10)
            if (isNaN(num)) {
              cor = 'none'
            } else {
              num = num > 0 ? num - 1 : 0
              cor = state.PBIColorTable[num] || 'none'
            }
          } else {
            num = parseInt(cor.substr(5, 3), 10)
            if (isNaN(num)) {
              cor = 'none'
            } else {
              cor = state.ScreenViewer_ColorTable[num] || 'none'
            }
          }
          break
      }

    return cor
  }

  function init (svgElement: any): void {
    state.g_loadtime = new Date()
    state.points.set('99999', {
      value: 0,
      flags: 0xa0,
      time: 0,
      tag: '99999',
      substation: '',
      bay: '',
      description: '',
      annotation: '',
      statusOn: '',
      statusOff: '',
      limSup: 0,
      limInf: 0,
    })
    state.points.set('99989', {
      value: 0,
      flags: 0xa0,
      time: 0,
      tag: '99989',
      substation: '',
      bay: '',
      description: '',
      annotation: '',
      statusOn: '',
      statusOff: '',
      limSup: 0,
      limInf: 0,
    })

    try {
      window.ShowHideTranslate = ShowHideTranslate
      state.SVG

      if (svgElement == null) {
        console.warn('SVG element is null or undefined - cannot initialize')
        return
      }

      // Assign the SVG element to state
      state.SVGDoc = svgElement

      if (!state.SVGDoc) {
        console.warn('SVG element is null - cannot initialize')
        return
      }

      const originalViewBox = state.SVGDoc.viewBox
      if (originalViewBox && originalViewBox.baseVal) {
        state.g_originalViewBox = originalViewBox.baseVal.valueAsString
      }

      state.g_isInkscape =
        (state.SVGDoc.getAttributeNS(null, 'inkscape:version') ||
          state.SVGDoc.getAttributeNS(
            'http://www.inkscape.org/namespaces/inkscape',
            'version'
          )) != ''
      if (state.g_isInkscape) {
        state.Color_BackgroundSVG = state.ScreenViewer_Background
        const sodipodibase = state.SVGDoc.getElementsByTagName("sodipodi:namedview")[0]
        if ('attributes' in sodipodibase) {
          state.Color_BackgroundSVG = sodipodibase.attributes?.pagecolor?.value ?? sodipodibase.attributes['inkscape:deskcolor']?.value
        }
      }

      if (state.SVGDoc != null) setBgColor(state.Color_BackgroundSVG)
    } catch (exception) {
      console.error('Error initializing SVG:', exception)
    }

    state.g_blinktimerID = setInterval(timerBlink, state.g_blinkperiod)

    if (typeof state.SVGDoc != 'undefined')
      if (state.SVGDoc != null) {
        state.SVGDoc.setAttributeNS(
          null,
          'width',
          String(state.ScreenViewer_SVGMaxWidth)
        )
        state.SVGDoc.setAttributeNS(
          null,
          'height',
          String(state.ScreenViewer_SVGMaxHeight)
        )
      }

    if (state.SVGDoc) {
      const rect = state.SVGDoc.getBoundingClientRect()
      const containerW =
        rect.width > 0 ? Math.round(rect.width) : state.ScreenViewer_SVGMaxWidth
      const containerH =
        rect.height > 0
          ? Math.round(rect.height)
          : state.ScreenViewer_SVGMaxHeight

      state.g_containerW = containerW
      state.g_containerH = containerH
      state.g_zpW = containerW
      state.g_zpH = containerH
    } else {
      // Fallback
      state.g_containerW = state.ScreenViewer_SVGMaxWidth
      state.g_containerH = state.ScreenViewer_SVGMaxHeight
      state.g_zpW = state.ScreenViewer_SVGMaxWidth
      state.g_zpH = state.ScreenViewer_SVGMaxHeight
    }

    if (state.SVGDoc) {
      state.SVGDoc.setAttributeNS(
        null,
        'viewBox',
        `${state.g_zpX} ${state.g_zpY} ${state.g_zpW} ${state.g_zpH}`
      )
    }

    try {
      preprocessSVGDisplay()
    } catch (err) {
      console.error('Error preprocessing SVG:', err)
    }

    emitEvent('scadavis-ready', {
      tagsList: state.lstpnt.split(',').filter((t: string) => t),
    })
  }

  function processData (data: WebSAGEDataInput): void {
    if (data.values) {
      for (const key in data.values) {
        const point = getOrCreatePoint(key)
        point.value = data.values[key]
      }
    }
    if (data.flags) {
      for (const key in data.flags) {
        const point = getOrCreatePoint(key)
        point.flags = data.flags[key]
      }
    }
    if (data.times) {
      for (const key in data.times) {
        const point = getOrCreatePoint(key)
        point.time = data.times[key]
      }
    }
    if (data.tags) {
      for (const key in data.tags) {
        state.TAGS.set(key, data.tags[key])
      }
    }
    if (data.npts) {
      for (const key in data.npts) {
        state.NPTS.set(key, data.npts[key])
      }
    }
    if (data.substations) {
      for (const key in data.substations) {
        const point = getOrCreatePoint(key)
        point.substation = data.substations[key]
      }
    }
    if (data.bays) {
      for (const key in data.bays) {
        const point = getOrCreatePoint(key)
        point.bay = data.bays[key]
      }
    }
    if (data.descriptions) {
      for (const key in data.descriptions) {
        const point = getOrCreatePoint(key)
        point.description = data.descriptions[key]
      }
    }
    if (data.annotations) {
      for (const key in data.annotations) {
        const point = getOrCreatePoint(key)
        point.annotation = data.annotations[key]
      }
    }
    if (data.statusOn) {
      for (const key in data.statusOn) {
        const point = getOrCreatePoint(key)
        point.statusOn = data.statusOn[key]
      }
    }
    if (data.statusOff) {
      for (const key in data.statusOff) {
        const point = getOrCreatePoint(key)
        point.statusOff = data.statusOff[key]
      }
    }
    if (data.limSups) {
      for (const key in data.limSups) {
        const point = getOrCreatePoint(key)
        point.limSup = data.limSups[key]
      }
    }
    if (data.limInfs) {
      for (const key in data.limInfs) {
        const point = getOrCreatePoint(key)
        point.limInf = data.limInfs[key]
      }
    }

    showValsSVG()
  }

  function setValue (
    tagOrNumber: string | number,
    value: number | boolean | string,
    flags?: number
  ): void {
    const npt = state.NPTS.get(String(tagOrNumber)) || tagOrNumber
    const point = getOrCreatePoint(npt)
    point.value = value
    if (flags !== undefined) {
      point.flags = flags
    }
  }

  function getTagsList (): string[] {
    return state.lstpnt.split(',').filter((t: string) => t)
  }

  function destroy (): void {
    if (state.g_blinktimerID) {
      clearInterval(state.g_blinktimerID)
      state.g_blinktimerID = 0
    }
    state.InkSage = []
    state.g_blinkList = []
    state.g_blinkListAna = []
    state.g_blinkListOld = []
    state.g_blinkListAnaOld = []
  }

  function _onElementClick (pnt: number, event?: any): void {
    emitEvent('scadavis-click', {
      event,
      point: pnt,
      tag: getTag(pnt),
      value: getValue(pnt),
      flags: getFlags(pnt),
      description: getDescription(pnt),
    })
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init,
    showValsSVG,
    processData,
    zoomPan,
    setZoomParams,
    setBgColor,
    translateColor,
    destroy,
    getValue,
    getFlags,
    getInfLim,
    getSupLim,
    getSubstation,
    getBay,
    getDescription,
    getTime,
    getTag,
    setValue,
    getTagsList,
    getOrCreatePoint,
    resolvePointKey,
    sprintf,
    LoadImage,
    RemoveAnimate,
    Animate,
    addPointToList,
    _onElementClick,
    get state () {
      return state
    },
    setExecuteExtendedCallback (callback: any) {
      executeExtendedCallback = callback
    },
    setInitializeExtendedCallback (callback: any) {
      initializeExtendedCallback = callback
    },
  }
}
