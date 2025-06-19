import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',                       // чтобы пути к ассетам работали в мини-аппе
  build: { outDir: 'dist' }
});
