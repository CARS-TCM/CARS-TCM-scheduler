import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths so the built site works under any GitHub Pages address (username.github.io/repo-name/).
  base: './',
  plugins: [react()],
});
