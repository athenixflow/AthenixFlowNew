import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fix: Cast process to any to resolve Property 'cwd' does not exist on type 'Process' error
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
      // Direct mapping of the Vercel environment variable to the SDK requirement.
      // This bridges the user's custom 'gemini_api' name to the standard 'API_KEY' used in the code.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.gemini_api || ''),
    },
    server: {
      port: 3000,
    },
  };
});