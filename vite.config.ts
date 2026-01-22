
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
      // Robustly map the API key. Prioritizes 'Google_api' as per Vercel configuration.
      'process.env.API_KEY': JSON.stringify(env.Google_api || env.API_KEY || env.VITE_API_KEY || ''),
    },
    server: {
      port: 3000,
    },
  };
});
