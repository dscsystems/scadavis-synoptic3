/*
 * SCADAvis.io Synoptic API © 2018-2024 Ricardo L. Olsen / DSC Systems ALL RIGHTS RESERVED.
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
 * External Dependencies Loader
 *
 * Loads required external libraries from npm packages:
 * - jQuery (required by WebSAGE core)
 * - D3 (required by WebSAGE core)
 * - Snap.svg (required by WebSAGE core)
 * - Vega (required for charts)
 * - Vega-Lite (required for charts)
 * - Chroma.js (required for color manipulation)
 *
 * These packages are now bundled with the library, so they're already available.
 * The imports register them as globals for legacy code compatibility.
 *
 * @module deps-loader
 */

// Import npm packages (except snapsvg which has issues with bundling)
import jQuery from 'jquery'
import * as d3 from 'd3'
import * as vega from 'vega'
import * as vl from 'vega-lite'
import chroma from 'chroma-js'

// Load snapsvg from CDN since it has bundling issues
const CDN_URLS = {
  snapsvg: 'https://unpkg.com/snapsvg@0.5.1/dist/snap.svg-min.js',
}

// Register on window for legacy code that uses globals
if (typeof window !== 'undefined') {
  ;(window as any).$ = jQuery
  ;(window as any).jQuery = jQuery
  ;(window as any).d3 = d3
  ;(window as any).vega = vega
  ;(window as any).vl = vl
  ;(window as any).chroma = chroma
}

/**
 * Interface for DepsLoader options
 */
interface DepsLoaderOptions {
  /** Base URL for CDN resources (deprecated, not used) */
  baseUrl?: string
  /** Whether to preload dependencies (deprecated, not used) */
  preload?: boolean
}

/**
 * Interface for DepsLoader engine
 */
interface DepsLoaderEngine {
  /** Load all dependencies */
  loadDependencies: () => Promise<void>
  /** Check if dependencies are loaded */
  areDependenciesLoaded: () => boolean
}

// Track loading state
let isLoaded = false

/**
 * Load a script from a URL
 * @param url - The URL of the script to load
 * @returns Promise that resolves when the script is loaded
 */
function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${url}"]`)
    if (existingScript) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = false // Maintain execution order

    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`))

    document.head.appendChild(script)
  })
}

/**
 * Load all required external dependencies
 * @returns Promise that resolves when all dependencies are loaded
 */
export async function loadDependencies(): Promise<void> {
  if (isLoaded) {
    return Promise.resolve()
  }

  // Load CDN dependencies (snapsvg has bundling issues)
  await loadScript(CDN_URLS.snapsvg)

  isLoaded = true
}

/**
 * Check if dependencies are loaded
 * @returns True since dependencies are bundled
 */
export function areDependenciesLoaded(): boolean {
  return isLoaded
}

export default loadDependencies
