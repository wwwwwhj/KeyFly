import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist/web',
    target: 'es2022',
    cssCodeSplit: false,
    sourcemap: process.env.MINI_APP_DEBUG === '1' ? 'inline' : false,
    lib: { entry: 'src/main.tsx', name: 'KeyFly', formats: ['iife'], fileName: () => 'app.js', cssFileName: 'app' },
  },
});
