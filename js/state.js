"use strict";
(() => {
  const getItemSafe = (key) => {
    try {
      if (typeof safeGetItem === "function") return safeGetItem(key);
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    } catch (e) {
    }
    return null;
  };
  let parsedCart = null;
  try {
    const rawCart = getItemSafe("gc_cart");
    parsedCart = rawCart ? JSON.parse(rawCart) : null;
  } catch (e) {
  }
  if (!parsedCart || typeof parsedCart !== "object" || Array.isArray(parsedCart)) {
    parsedCart = {};
  }
  let parsedFavs = null;
  try {
    const rawFavs = getItemSafe("gc_favs");
    parsedFavs = rawFavs ? JSON.parse(rawFavs) : null;
  } catch (e) {
  }
  if (!Array.isArray(parsedFavs)) {
    parsedFavs = [];
  }
  window.appState = {
    // Datos de Inventario
    inventario: [],
    gruposInventario: [],
    gruposCargados: [],
    // Registro de grupos ya descargados desde la API
    productosFiltrados: [],
    // Datos del Usuario
    carrito: parsedCart,
    totalCarrito: 0,
    favoritos: parsedFavs,
    // Configuración y Negocio
    tasaOficial: parseFloat(getItemSafe("tasaDolar") || "0") || 0,
    isTiendaAbierta: true,
    // Estado de la Interfaz (UI)
    filtros: { categoriaActual: "LICORES", subcategoriaActual: null, modoVistaGlobal: "unidad" },
    paginacion: { itemsPorPagina: 30, paginaActual: 1 },
    debounceTimer: null
  };
  let cartModulePromise = null;
  window.loadCartModule = function() {
    if (!cartModulePromise) {
      cartModulePromise = new Promise((resolve, reject) => {
        if (typeof window.guardarCarritoLS === "function" && !window.guardarCarritoLS._isStub) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        const isSubdir = window.location.pathname.toLowerCase().includes("/carrito");
        const basePath = isSubdir ? "../" : "";
        script.src = `${basePath}js/cart.js?v=4.1`;
        script.onload = () => resolve();
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    }
    return cartModulePromise;
  };
  window.actualizarCartCountBase = function() {
    if (!window.appState || !window.appState.carrito) return;
    let count = 0;
    for (let k in window.appState.carrito) {
      count += window.appState.carrito[k].cantidad || 0;
    }
    const c1 = document.getElementById("cart-count");
    if (c1) c1.innerText = count.toString();
    const c2 = document.getElementById("bottom-cart-count");
    if (c2) c2.innerText = count.toString();
  };
  const stubNames = ["guardarCarritoLS", "agregarAlCarrito", "agregarAlCarritoB64", "cambiarCant", "cambiarCantB64", "vaciarCarrito", "abrirCarrito", "renderizarCarrito", "enviarPedido", "setCheckoutStep"];
  stubNames.forEach((fnName) => {
    if (!window[fnName]) {
      const stubFn = function(...args) {
        return window.loadCartModule().then(() => {
          if (typeof window[fnName] === "function" && !window[fnName]._isStub) {
            return window[fnName](...args);
          }
        });
      };
      stubFn._isStub = true;
      window[fnName] = stubFn;
    }
  });
  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      window.actualizarCartCountBase();
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(() => window.loadCartModule());
      } else {
        setTimeout(() => window.loadCartModule(), 1500);
      }
    });
  }
})();
