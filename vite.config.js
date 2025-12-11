import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separera React och ReactDOM först
          if (id.includes('react-dom')) {
            return 'react-dom';
          }
          if (id.includes('react') && id.includes('node_modules')) {
            return 'react';
          }
          // Separera Firebase i egen chunk
          if (id.includes('firebase') && id.includes('node_modules')) {
            return 'firebase';
          }
          // Separera lucide-react ikoner i egen chunk
          if (id.includes('lucide-react') && id.includes('node_modules')) {
            return 'icons';
          }
          // Alla andra node_modules går till vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Återställ till standard
  },
});

