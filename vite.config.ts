import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'copy-static-web-app-config',
    closeBundle() {
      copyFileSync(resolve(__dirname, 'staticwebapp.config.json'), resolve(__dirname, 'dist/staticwebapp.config.json'));
    }
  }],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        offline: resolve(__dirname, 'offline.html'),
        notFound: resolve(__dirname, '404.html')
      }
    }
  }
});
