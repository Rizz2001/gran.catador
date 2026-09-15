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

// Carga perezosa del módulo de carrito/checkout para reducir el critical path JS
let cartModulePromise: Promise<void> | null = null;
(window as any).loadCartModule = function() {
    if (!cartModulePromise) {
        cartModulePromise = new Promise((resolve, reject) => {
            if (typeof (window as any).guardarCarritoLS === 'function' && !(window as any).guardarCarritoLS._isStub) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            const isSubdir = window.location.pathname.toLowerCase().includes('/carrito');
            const basePath = isSubdir ? '../' : '';
            script.src = `${basePath}js/cart.js?v=4.1`;
            script.onload = () => resolve();
            script.onerror = (err) => reject(err);
            document.head.appendChild(script);
        });
    }
    return cartModulePromise;
};

// Contador de carrito base síncrono para no depender de cart.js en primer render
(window as any).actualizarCartCountBase = function() {
    if (!window.appState || !window.appState.carrito) return;
    let count = 0;
    for (let k in window.appState.carrito) {
        count += (window.appState.carrito[k].cantidad || 0);
    }
    const c1 = document.getElementById('cart-count');
    if (c1) c1.innerText = count.toString();
    const c2 = document.getElementById('bottom-cart-count');
    if (c2) c2.innerText = count.toString();
};

// Stubs transparentes que cargan cart.js bajo demanda si se invoca alguna función antes de cargar el bundle completo
const stubNames = ['guardarCarritoLS', 'agregarAlCarrito', 'agregarAlCarritoB64', 'cambiarCant', 'cambiarCantB64', 'vaciarCarrito', 'abrirCarrito', 'renderizarCarrito', 'enviarPedido', 'setCheckoutStep'];
stubNames.forEach(fnName => {
    if (!(window as any)[fnName]) {
        const stubFn = function(...args: any[]) {
            return (window as any).loadCartModule().then(() => {
                if (typeof (window as any)[fnName] === 'function' && !(window as any)[fnName]._isStub) {
                    return (window as any)[fnName](...args);
                }
            });
        };
        stubFn._isStub = true;
        (window as any)[fnName] = stubFn;
    }
});

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        (window as any).actualizarCartCountBase();
        // Carga en segundo plano tras render inicial
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => (window as any).loadCartModule());
        } else {
            setTimeout(() => (window as any).loadCartModule(), 1500);
        }
    });
}