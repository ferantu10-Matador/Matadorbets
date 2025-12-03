import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // @ts-ignore process is a node global
  const cwd = process.cwd();
  const env = loadEnv(mode, cwd, '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env so it works in the browser build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      
      // Supabase Keys
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      
      // Support VITE_ prefix as well just in case
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      
      // Prevent "process is not defined" errors in some libs
      'process.env': {}
    },
    build: {
      outDir: 'dist',
    }
  };
});