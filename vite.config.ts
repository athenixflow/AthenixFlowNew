
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
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
    define: {
      // Robustly map the API key. Checks API_KEY (standard), Google_api (Vercel specific from prompt), or VITE_API_KEY.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.Google_api || env.VITE_API_KEY || ''),
    },
    server: {
      port: 3000,
    },
  };
});
