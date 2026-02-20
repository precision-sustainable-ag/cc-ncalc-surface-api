import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const baseURL = isDevelopment ? 'http://localhost:3003' : 'https://developapi.covercrop-ncalc.org';

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/BASE_URL/g, baseURL);
        },
      },
    ],
    server: {
      open: true,
      watch: {
        usePolling: true,
      },
      host: true, // needed for the Docker Container port mapping to work
      strictPort: true,
      port: 3000,
    },
    build: {
      outDir: '/usr/app/build',
    },
  };
});
