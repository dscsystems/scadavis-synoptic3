'use strict'

/*
 * SCADAvis.io Synoptic API © 2018-2022 Ricardo L. Olsen / DSC Systems ALL RIGHTS RESERVED.
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
 * Default Configuration for SCADAvis Web Component
 *
 * This module contains default color tables and configuration parameters
 * extracted from the original config_viewers_default.js
 *
 * @module config
 */

// PBI (Power BI) Color Table
export const PBI_COLOR_TABLE = [
  '#00B8F1',
  '#DE3A15',
  '#FF9A00',
  '#3ACB35',
  '#BBA8E8',
  '#DD6952',
  '#7FD5DB',
  '#60AF89',
  '#91A9D0',
  '#C7F073',
  '#5E69D8',
  '#BD8E29',
]

// PBI Colors
export const PBI_COLORS = {
  background: '#FFFFFF',
  foreground: '#D6862D',
  bad: 'red',
  good: 'green',
  maximum: 'red',
  minimum: 'green',
}

// Default color table for SCADA visualization
// User color palette (use in Inkscape+SAGE color fields as "-cor-05" or "-cor-49")
// Note: Dynamic references are resolved at runtime using DEFAULT_CONFIG values
export const DEFAULT_COLOR_TABLE = [
  'white', // 0
  'white', // 1 - sc ou dj falha
  'white', // 2
  '#DDDDDD', // 3 - dj ab (background color)
  'steelblue', // 4 - sc ou dj fc (bar/breaker/sw color)
  'steelblue', // 5 - sc ab (bar/breaker/sw color)
  'cornsilk', // 6 - sc ou dj 00
  'cornsilk', // 7 - sc ou dj 11
  'steelblue', // 8 - borda do dj ab (bar/breaker/sw color)
  '#AAAAAA', // 9 - unidades de medidas
  'cadetblue', // 10 - outras medida ok
  'red', // 11 - medida fora de faixa
  'white', // 12 - medida ou estado falhado
  'steelblue', // 13 - titulo da tela (SE) (bar/breaker/sw color)
  'steelblue', // 14 - texto de linha (bar/breaker/sw color)
  '#777777', // 15 - número de equipamento
  'steelblue', // 16 - barra 230kV (bar/breaker/sw color)
  'steelblue', // 17 - barra 138kV (bar/breaker/sw color)
  'steelblue', // 18 - barra de 69kV (bar/breaker/sw color)
  'steelblue', // 19 - barra de alimentadores 13kV/23kV (bar/breaker/sw color)
  'cadetblue', // 20 - medida de MW ok
  'cadetblue', // 21 - medida de MVAr ok
  'cadetblue', // 22 - medida de kV ok
  'cadetblue', // 23 - medida de corrente ok
  'cadetblue', // 24 - medida de tap ok
  'steelblue', // 25 - cor da barra de 500kV (bar/breaker/sw color)
  'gray', // 26 - texto estados
  'gray', // 27 - grade de estados
  'darkgreen', // 28 - estados off
  'darkred', // 29 - estado on
  'red', // 30 - estado de alarme
  'lightgray', // 31 - quadro de estados
  'black', // 32 - borda do quadro de estados
  '#D7D7D7', // 33 - área de operação
  'gray', // 34 - símbolo de aterramento
  'steelblue', // 35 - estado normal (bar/breaker/sw color)
  'mediumvioletred', // 36 - estado anormal
  'red', // 37 - estado alarmado
  '#999999', // 38 - texto estático
  '#DDE8DD', // 39 - quadro de status normal
  'yellow', // 40 - quadro de status alarme
  'deepskyblue', // 41 - medida congelada
  'red', // 42 - medida alarmada
  'cadetblue', // 43 - outras medidas ok
  'red', // 44 - alarm priority 0
  'yellow', // 45 - alarm priority 1
  'orange', // 46 - alarm priority 2
  'fucsia', // 47 - alarm priority 3 (diagnóstico)
  '#CCCCCC', // 48 - state box fill color inactive
  '#CCCCCC', // 49 - state box border color inactive
  '#505050', // 50 - state box active text color
  'lightsteelblue', // 51 - state box fill color ON
  'tan', // 52 - state box fill color OFF
  '#888888', // 53 - state box inactive text color
  'red', // 54 - state box operated text color
  'lightsteelblue', // 55 - analog range ok
  '#777777', // 56 - analog range out of limits
  'steelblue', // 57 - analog indicator ok (bar/breaker/sw color)
  'crimson', // 58 - analog indicator out of limits
  '#CCCCCC', // 59 - load rectangle MW or MVA or A
]

// Default configuration parameters
export const DEFAULT_CONFIG = {
  // SVG Screen dimensions (must match <svg> tag dimensions on SVG screens)
  svgMaxWidth: 3840, // default SVG screen width in pixels
  svgMaxHeight: 2160, // default SVG screen height in pixels

  // Background colors
  background: '#DDDDDD', // background color for Inkscape SAGE SVG screens
  backgroundSVG: 'black', // background color for Inkscape SAGE SVG container

  // Toolbar
  toolbarColor: 'none', // toolbar color

  // Bar/Breaker/Switch color (used for multiple color table entries)
  barBreakerSwColor: 'steelblue',
}

/**
 * Create a color table with resolved dynamic references
 * Useful when you want to customize the barBreakerSwColor
 *
 * @param {Object} options - Configuration options
 * @param {string} options.barBreakerSwColor - Color for bars, breakers, and switches
 * @param {string} options.background - Background color
 * @returns {string[]} Resolved color table array
 */
export function createColorTable(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  const colorTable = [...DEFAULT_COLOR_TABLE]

  // Resolve dynamic color references
  // Index 3: dj ab (background)
  colorTable[3] = config.background

  // Indices that use barBreakerSwColor
  const barBreakerSwIndices = [4, 5, 8, 13, 14, 16, 17, 18, 19, 25, 35, 57]
  barBreakerSwIndices.forEach((idx) => {
    colorTable[idx] = config.barBreakerSwColor
  })

  return colorTable
}

export default {
  PBI_COLOR_TABLE,
  PBI_COLORS,
  DEFAULT_COLOR_TABLE,
  DEFAULT_CONFIG,
  createColorTable,
}
