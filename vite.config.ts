import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`            → dist/ for GitHub Pages (base './' works at any repo path)
// `npm run build:prototype`  → prototype/luminaire-prototype.html, one self-contained file
export default defineConfig(({ mode }) => {
  const prototype = mode === 'prototype';
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Demo (browser-side marking, key bundled) only when no live endpoint is configured.
  const demo = prototype || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test((env.VITE_SHEETS_ENDPOINT ?? '').trim());
  return {
    base: './',
    define: { __DEMO__: JSON.stringify(demo) },
    plugins: [react(), tailwindcss(), ...(prototype ? [viteSingleFile()] : [])],
    build: prototype
      ? { outDir: 'prototype', assetsInlineLimit: 100_000_000, emptyOutDir: true }
      : { outDir: 'dist' },
  };
});
