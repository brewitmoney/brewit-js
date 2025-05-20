// // tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/account/index.ts',
    'src/delegation/index.ts',
    'src/automation/index.ts'
  ],
  format: ['esm', 'cjs'],
  dts: {
    entry: {
      index: 'src/index.ts',
      'account/index': 'src/account/index.ts',
      'delegation/index': 'src/delegation/index.ts',
      'automation/index': 'src/automation/index.ts'
    }
  },
  splitting: false,
  clean: true,
  // Add source maps for better debugging
  sourcemap: true,
  treeshake: true,
  minify: false,
  outDir: 'dist',
  target: 'node16',
  skipNodeModulesBundle: true,
  shims: false,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js'
    }
  }
})