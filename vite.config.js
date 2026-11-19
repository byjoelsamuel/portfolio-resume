import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works at byjoelsamuel.github.io/portfolio-resume/
export default defineConfig({
  base: './',
  plugins: [react()],
})
