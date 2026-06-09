import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/calendario-equipos-omni/',
  define: {
    // npm_package_version es inyectado automáticamente por npm al ejecutar cualquier script
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  test: {
    globals: true,
    environment: 'node',
  },
})
