import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend calls /api/*, Vite forwards it to the Express proxy on :3001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
