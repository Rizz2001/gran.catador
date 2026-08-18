import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    // No procesar los scripts clásicos (sin type="module")
    // Solo compilar los archivos .ts que sí son módulos
    rollupOptions: {
      input: {
        main: 'index.html',
        producto: 'producto.html',
        carrito: 'carrito/index.html'
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        // JavaScript y CSS (Vite no los copia porque no son módulos)
        { src: 'js', dest: '' },
        { src: 'assets/css', dest: 'assets' },
        // Imágenes y datos
        { src: 'assets/img', dest: 'assets' },
        { src: 'assets/banners', dest: 'assets' },
        { src: 'data', dest: '' },
        // Archivos raíz
        { src: 'logo.webp', dest: '' },
        { src: 'manifest.json', dest: '' },
        { src: 'sw.js', dest: '' },
        { src: 'robots.txt', dest: '' },
        { src: 'sitemap.xml', dest: '' },
        { src: '_headers', dest: '' }
      ]
    })
  ]
});
