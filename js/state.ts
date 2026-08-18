/**
 * state.js - Estado Global Centralizado de la Aplicación
 */
const getItemSafe = (key: string) => {
    try {
        if (typeof safeGetItem === 'function') return safeGetItem(key);
        if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } catch(e) {}
    return null;
};

let parsedCart: any = null;
try {
    const rawCart = getItemSafe('gc_cart');
    parsedCart = rawCart ? JSON.parse(rawCart) : null;
} catch(e) {}
if (!parsedCart || typeof parsedCart !== 'object' || Array.isArray(parsedCart)) {
    parsedCart = {};
}

let parsedFavs: any = null;
try {
    const rawFavs = getItemSafe('gc_favs');
    parsedFavs = rawFavs ? JSON.parse(rawFavs) : null;
} catch(e) {}
if (!Array.isArray(parsedFavs)) {
    parsedFavs = [];
}

window.appState = {
    // Datos de Inventario
    inventario: [],
    gruposInventario: [],
    gruposCargados: [], // Registro de grupos ya descargados desde la API
    productosFiltrados: [],

    // Datos del Usuario
    carrito: parsedCart,
    totalCarrito: 0,
    favoritos: parsedFavs,

    // Configuración y Negocio
    tasaOficial: parseFloat(getItemSafe('tasaDolar') || '0') || 0,
    isTiendaAbierta: true,

    // Estado de la Interfaz (UI)
    filtros: { categoriaActual: 'LICORES', subcategoriaActual: null, modoVistaGlobal: 'unidad' },
    paginacion: { itemsPorPagina: 30, paginaActual: 1 },
    debounceTimer: null
};