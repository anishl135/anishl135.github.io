import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

/*
 * The page loads src/main.js and src/style.css as plain (non-module) files so the
 * site works by double-clicking index.html with zero build step. Vite's bundler
 * only processes module scripts, so for `vite build` we copy those two files into
 * dist/src so the production output is complete and self-contained.
 */
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(root, 'dist/src');
      mkdirSync(outDir, { recursive: true });
      copyFileSync(resolve(root, 'src/main.js'), resolve(outDir, 'main.js'));
      copyFileSync(resolve(root, 'src/style.css'), resolve(outDir, 'style.css'));
      copyFileSync(resolve(root, 'src/blog.js'), resolve(outDir, 'blog.js'));
    },
  };
}

export default defineConfig({
  // Relative base: works from file://, a repo subfolder, or any static host root.
  base: './',
  plugins: [copyStaticAssets()],
  build: {
    target: 'es2018',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        blog: resolve(root, 'blog.html'),
      },
    },
  },
});
