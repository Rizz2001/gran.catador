/**
 * Configuración de Banners Publicitarios para la cuadrícula de productos
 * Solo se mostrarán en dispositivos PC y Tablets (anchos de pantalla mayores a 768px).
 * Puedes añadir, modificar o eliminar banners desde aquí.
 */

window.bannersGrid = [
    {
        imagen: 'assets/banners/caroreña1.jpg', // Ruta de la imagen
        url: '#', // Link tradicional (déjalo en '#' si usarás codigoProducto)
        codigoProducto: '7591446009601', // ¡NUEVO! Coloca aquí el código de barras para abrir el popup del producto
        alt: 'Publicidad 1',
        activo: true // Cambia a false si quieres ocultarlo temporalmente
    },
    {
        imagen: 'assets/banners/caroreña2.jpg', // Ruta de la imagen
        url: '#', // Link tradicional (déjalo en '#' si usarás codigoProducto)
        codigoProducto: '7591446009601', // ¡NUEVO! Coloca aquí el código de barras para abrir el popup del producto
        alt: 'Publicidad 2',
        activo: true // Cambia a false si quieres ocultarlo temporalmente
    }

];

// Frecuencia: Cada cuántos productos quieres que aparezca un banner (Recomendado: 12, 16 o 20)
window.bannersGridFrecuencia = 12;
