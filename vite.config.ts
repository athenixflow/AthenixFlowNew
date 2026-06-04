
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: The Gemini API key is intentionally NOT injected into the client bundle.
// All AI calls go through the server-side functions in /api (analyze, education,
// revalidate), which read the key from process.env.Google_api on the server.
export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html',
        },
      },
    },
    server: {
      port: 3000,
    },
  };
});
