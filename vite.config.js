import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'assets/img',
          dest: ''
        },
        {
          src: 'assets/banners',
          dest: ''
        }
      ]
    })
  ]
});
