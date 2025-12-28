import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  // Configure dev server to handle SPA routing
  plugins: [
    {
      name: 'spa-fallback',
      configureServer(server) {
        return () => {
          server.middlewares.use((req, res, next) => {
            // Only handle HTML requests (navigation)
            // Skip if it's a file request (has extension) or API request
            if (
              req.method === 'GET' &&
              !req.url.match(/\.[a-z0-9]+(\?.*)?$/i) &&
              !req.url.startsWith('/@') &&
              !req.url.startsWith('/node_modules')
            ) {
              req.url = '/app.html'
            }
            next()
          })
        }
      }
    }
  ]
})
