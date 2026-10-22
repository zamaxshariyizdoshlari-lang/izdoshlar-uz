/// <reference types="vite-react-ssg" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    dirStyle: 'nested',
  },
})
