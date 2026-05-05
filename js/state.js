/**
 * state.js - Estado Global Centralizado de la Aplicación
 */
window.appState = {
    // Datos de Inventario
    inventario: [],
    gruposInventario: [],
    gruposCargados: [], // Registro de grupos ya descargados desde la API
    productosFiltrados: [],

    // Datos del Usuario
    carrito: JSON.parse(localStorage.getItem('gc_cart')) || {},
    totalCarrito: 0,
    favoritos: JSON.parse(localStorage.getItem('gc_favs')) || [],

    // Configuración y Negocio
    tasaOficial: 36.25,
    isTiendaAbierta: true,

    // Estado de la Interfaz (UI)
    filtros: { categoriaActual: 'LICORES', subcategoriaActual: null, modoVistaGlobal: 'unidad' },
    paginacion: { itemsPorPagina: 30, paginaActual: 1 },
    debounceTimer: null
};