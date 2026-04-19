import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({ 
      rollupTypes: true,
      insertTypesEntry: true,
      copyDtsFiles: false
    })
  ],
  build: {
    lib: {
      entry: 'src/scada-vis.ts',
      name: 'SCADAvis',
      fileName: 'scada-vis',
      formats: ['es', 'umd']
    },
    rollupOptions: {
      // Disable tree-shaking to preserve all local variables
      treeshake: false,
      output: {
        // Provide UMD global name
        name: 'SCADAvis',
        // Export as named for ES modules
        exports: 'named',
        // Global variables for UMD (for compatibility)
        globals: {
          d3: 'd3',
          vega: 'vega',
          'vega-lite': 'vegaLite',
          jquery: '$',
          'snapsvg': 'Snap',
          'chroma-js': 'chroma'
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'oxc'
  }
})
