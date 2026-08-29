import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [preact(), tailwindcss(), cssInjectedByJsPlugin()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'chat-widget.js',
        chunkFileNames: 'widget-[name].js',
        assetFileNames: 'chat-widget.[ext]'
      }
    }
  }
})
