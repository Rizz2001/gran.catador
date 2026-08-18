import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'assets/img', dest: 'assets' },
        { src: 'assets/banners', dest: 'assets' },
        { src: 'data', dest: '' },
        { src: 'logo.webp', dest: '' },
        { src: 'sw.js', dest: '' },
        { src: 'robots.txt', dest: '' },
        { src: '_headers', dest: '' }
      ]
    })
  ]
});

