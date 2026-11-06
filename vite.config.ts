import { defineConfig } from 'vite';

export default defineConfig({
  // 库模式不会自动替换 React 的 NODE_ENV，避免平台中访问不存在的 process。
  define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production') },
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist/web',
    target: 'es2022',
    cssCodeSplit: false,
    sourcemap: process.env.MINI_APP_DEBUG === '1' ? 'inline' : false,
    lib: { entry: 'src/main.tsx', name: 'KeyFly', formats: ['iife'], fileName: () => 'app.js', cssFileName: 'app' },
  },
});
