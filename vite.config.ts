import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Vite always adds crossorigin to the built script/link tags, with no
// config flag to turn it off. That's fine for a CDN-hosted bundle, but it
// tells the browser to fetch those assets WITHOUT credentials - which
// breaks everything behind HTTP Basic Auth (the UAT branch): the HTML
// loads (top-level nav sends auth), but the JS bundle 401s silently and
// never runs, so the page is just a blank <div id="root">. ClueLux always
// serves its assets from the same origin as the HTML, so crossorigin was
// never actually needed - safe to strip for every environment, not just UAT.
function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(="[^"]*")?/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripCrossorigin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
