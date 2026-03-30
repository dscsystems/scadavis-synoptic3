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
 * HTML Template for SCADAvis Web Component
 * Extracted from synoptic.html lines 309-480
 */

export const TEMPLATE_ID = 'scada-vis-template'

/**
 * Creates the HTML template element for the SCADAvis component
 * @returns {HTMLTemplateElement} The template element
 */
export function createTemplate() {
  const template = document.createElement('template')
  template.id = TEMPLATE_ID

  template.innerHTML = `
    <div class="scada-vis-container">
      <!-- Toolbar with zoom controls -->
      <div class="bardiv" id="bardiv">
        <form name="fmTELA" method="get">
          <map id="immap" name="immap">
            <area
              shape="poly"
              id="ZPDesce"
              coords="12,20,20,20,32,32,0,32"
              alt="down"
              data-action="zoomPan"
              data-value="7"
            />
            <area
              shape="poly"
              id="ZPEsq"
              coords="12,20,12,12,0,0,0,31"
              alt="left"
              data-action="zoomPan"
              data-value="3"
            />
            <area
              shape="poly"
              id="ZPSobe"
              coords="12,12,20,12,32,0,0,0"
              alt="up"
              data-action="zoomPan"
              data-value="1"
            />
            <area
              shape="poly"
              id="ZPDir"
              coords="20,12,20,20,32,32,32,0"
              alt="right"
              data-action="zoomPan"
              data-value="5"
            />
            <area
              shape="poly"
              id="ZPCentro"
              coords="12,12,20,12,20,20,12,20"
              alt="center"
              data-action="zoomPan"
              data-value="4"
            />
          </map>
          <img
            id="ZOOMIN_ID"
            align="middle"
            width="32"
            height="32"
            data-action="zoomPan"
            data-value="2"
            style="display:none;cursor:pointer;"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='15' fill='rgba(0,0,0,0.6)'/%3E%3Ccircle cx='13' cy='13' r='8' fill='none' stroke='white' stroke-width='2'/%3E%3Cline x1='19' y1='19' x2='27' y2='27' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='13' y1='8' x2='13' y2='18' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"
          />
          <img
            id="ZOOMOUT_ID"
            align="middle"
            width="32"
            height="32"
            data-action="zoomPan"
            data-value="6"
            style="display:none;cursor:pointer;"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='15' fill='rgba(0,0,0,0.6)'/%3E%3Ccircle cx='13' cy='13' r='8' fill='none' stroke='white' stroke-width='2'/%3E%3Cline x1='19' y1='19' x2='27' y2='27' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"
          />
          <img
            id="MOVE_ID"
            align="middle"
            width="32"
            height="32"
            usemap="#immap"
            style="display:none;"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='15' fill='rgba(0,0,0,0.6)'/%3E%3Cpath d='M16 4 L20 10 L17 10 L17 15 L22 15 L22 12 L28 16 L22 20 L22 17 L17 17 L17 22 L20 22 L16 28 L12 22 L15 22 L15 17 L10 17 L10 20 L4 16 L10 12 L10 15 L15 15 L15 10 L12 10 Z' fill='white'/%3E%3C/svg%3E"
          />
          <input id="PLAY" name="PLAY" value="0" class="hidden-input" />
          <input id="PTELA" name="PTELA" value="" class="hidden-input" />
          <input id="ZPX" name="ZPX" value="0" class="hidden-input" />
          <input id="ZPY" name="ZPY" value="0" class="hidden-input" />
          <input id="ZPW" name="ZPW" value="" class="hidden-input" />
          <input id="ZPH" name="ZPH" value="" class="hidden-input" />
        </form>
        <div id="timemachinecontrols" class="timemachinecontrols">
          <input
            id="timesldr"
            type="range"
            step="1"
            min="0"
            max="86399"
            value="0"
          />
          <input
            type="date"
            name="dtpk"
            id="dtpk"
            step="1"
          />
          <input
            type="time"
            name="tmpk"
            id="tmpk"
            step="1"
          />
          <img
            id="TIMEMACHINECLOSE_ID"
            align="middle"
            width="16"
            height="16"
            style="position:relative;left:10px;cursor:pointer;vertical-align:middle;"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='7' fill='rgba(0,0,0,0.6)'/%3E%3Cline x1='5' y1='5' x2='11' y2='11' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='11' y1='5' x2='5' y2='11' stroke='white' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"
          />
        </div>
      </div>

      <!-- Loader animation -->
      <div id="loader" class="loader-container">
        <div class="loader-brand">SCADAvis.io™</div>
        <div class="loader"></div>
      </div>

      <!-- SVG container -->
      <div id="svgdiv" class="svgdiv"></div>

      <!-- Alarm box -->
      <div id="almbox" class="almbox">
        <div id="DIV_HORA" class="time-display">
          <span id="HORA_ATU">&nbsp;</span>
        </div>
        <div id="DIV_STATUS" class="status-display">
          <span id="SP_STATUS">&nbsp;</span>
        </div>
      </div>

      <!-- Preview div -->
      <div id="previewdiv" class="previewdiv">
        <iframe
          id="previewframe"
          width="700"
          height="480"
          frameborder="2"
        ></iframe>
      </div>

      <!-- Vega charts container -->
      <div id="VEGACHARTS" class="vega-charts"></div>

      <!-- Watermark -->
      <div id="WATERMARK" class="watermark">
        SCADAvis.io™
      </div>
    </div>
  `

  return template
}

/**
 * Get the template HTML as a string
 * @returns {string} The template HTML
 */
export function getTemplateHTML() {
  const template = createTemplate()
  return template.innerHTML
}

export default {
  createTemplate,
  getTemplateHTML,
  TEMPLATE_ID,
}
