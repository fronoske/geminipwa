import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = __dirname;
const staticFiles = [
  'manifest.json',
  'sw.js',
  'marked.js',
  'icon-192x192.png',
  'src/recovery.js',
  'src/utilities.js',
  'src/main.js',
  'src/input-preset.js',
] as const;

function copyPwaStaticFiles(): Plugin {
  return {
    name: 'copy-pwa-static-files',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(
          /href=["']\.\/assets\/manifest-[^"']+\.json["']/,
          'href="manifest.json"',
        );
      },
    },
    generateBundle(_options, bundle) {
      for (const filename of Object.keys(bundle)) {
        if (/^assets\/manifest-[^/]+\.json$/.test(filename)) delete bundle[filename];
      }
    },
    writeBundle(options) {
      const outputDirectory = resolve(projectRoot, options.dir ?? 'dist');
      mkdirSync(outputDirectory, { recursive: true });

      for (const filename of staticFiles) {
        const destination = resolve(outputDirectory, filename);
        mkdirSync(resolve(destination, '..'), { recursive: true });
        copyFileSync(resolve(projectRoot, filename), destination);
      }

      const indexPath = resolve(outputDirectory, 'index.html');
      const builtHtml = readFileSync(indexPath, 'utf8');
      const normalizedHtml = builtHtml.replace(
        /href=["']\.\/assets\/manifest-[^"']+\.json["']/,
        'href="manifest.json"',
      );
      writeFileSync(indexPath, normalizedHtml);
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [copyPwaStaticFiles()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        assetFileNames(assetInfo) {
          return assetInfo.names.some((name) => name.endsWith('.css'))
            ? 'src/styles/app.css'
            : 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
