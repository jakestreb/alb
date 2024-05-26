import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from 'node:path'

export default defineConfig({
  server: {
      port: 3000,
      host: true,
  },
  plugins: [react()],
});
