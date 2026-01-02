import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const base = process.env.VITE_BASE ?? './'

export default defineConfig({
  base,
  plugins: [react()],
})
