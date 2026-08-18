// js/product-detail.js

function formatearTitulo(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

document.addEventListener('DOMContentLoaded', () => {
    // Evitar conflictos con la inicialización normal de index.html
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'index.html';
        return;
    }

    iniciarCargaProducto(productId);
});

function iniciarCargaProducto(productId) {
    // 1. Intentar cargar desde caché (navegación instantánea y segura)
    try {
        const cached = sessionStorage.getItem('gc_producto_actual');
        if (cached) {
            const p = JSON.parse(cached);
            // Validar que el código coincida
            if (window.compararIDs ? window.compararIDs(p.codigo, productId) : p.codigo == productId) {
                if (typeof window.soloCaja === 'undefined') {
                    Promise.all([
                        import('./config/solo_caja.js?v=' + new Date().getTime()).then(m => { if(m.soloCaja) window.soloCaja = m.soloCaja; }).catch(()=>{}),
                        import('./config/solo_unidad.js?v=' + new Date().getTime()).then(m => { if(m.soloUnidad) window.soloUnidad = m.soloUnidad; }).catch(()=>{})
                    ]).then(() => renderizarProducto(p));
                } else {
                    renderizarProducto(p);
                }
                return; // Termina la inicialización sin esperar la API
            }
        }
    } catch (e) {
        console.warn("No se pudo leer de sessionStorage", e);
    }

    // 2. Si no hay caché, esperar a que la app esté inicializada y buscar el producto
    let intentos = 0;
    
    const checkInterval = setInterval(() => {
        // Asegurar que appState exista
        if (!window.appState || !window.appState.inventario || window.appState.inventario.length === 0) {
            intentos++;
            if (intentos > 100) { // 10 segundos
                clearInterval(checkInterval);
                mostrarErrorProducto();
            }
            return;
        }

        // Buscar el producto en el inventario actual
        let producto = window.appState.inventario.find(p => compararIDs(p.codigo, productId));
        
        if (producto) {
            clearInterval(checkInterval);
            renderizarProducto(producto);
            return;
        }

        // Si no está, chequear si todavía se están cargando grupos
        const totalGrupos = window.appState.gruposInventario ? window.appState.gruposInventario.length : 0;
        const gruposCargados = window.appState.gruposCargados ? window.appState.gruposCargados.length : 0;
        
        if (totalGrupos > 0 && gruposCargados >= totalGrupos) {
            // Ya cargó todo y no lo encontró
            clearInterval(checkInterval);
            mostrarErrorProducto();
        }

    }, 100);
}

function renderizarProducto(p) {
    let esModoCaja = (typeof modoVistaGlobal !== 'undefined' ? modoVistaGlobal : 'unidad') === 'caja';
    if (window.soloUnidad && (window.soloUnidad.includes(p.Nombre) || window.soloUnidad.includes(String(p.codigo).trim()))) esModoCaja = false;
    else if (window.soloCaja && (window.soloCaja.includes(p.Nombre) || window.soloCaja.includes(String(p.codigo).trim()))) esModoCaja = true;

    const cantCaja = p.CantidadGrup || 12;
    const isAgotado = esModoCaja ? (p.StockNum < cantCaja && p.StockNum < 999) : p.StockNum <= 0;
    
    const precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
    const precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
    const precioNum = esModoCaja ? p.PrecioCajaNum : p.PrecioNum;
    
    let textoUnidad = '';
    if (esModoCaja) {
        let undGrup = p.UnidadGrup ? p.UnidadGrup.toUpperCase() : 'CAJA';
        textoUnidad = `POR ${undGrup} (x${cantCaja})`;
    } else {
        let undSimp = p.UnidadSimple ? p.UnidadSimple.toUpperCase() : 'UNIDAD';
        textoUnidad = `POR ${undSimp}`;
    }

    let imgSrc = obtenerImgProducto(p);
    let stockStatusHTML = '';
    
    if (isAgotado) {
        stockStatusHTML = `<span class="product__stock danger"><i class="fa-solid fa-triangle-exclamation"></i> Agotado en ${esModoCaja ? 'Cajas' : 'Unidad'}</span>`;
    } else if (p.StockNum <= 5 && !esModoCaja) {
        stockStatusHTML = `<span class="product__stock warning"><i class="fa-solid fa-triangle-exclamation"></i> ¡Últimas ${p.StockNum} und!</span>`;
    } else if (esModoCaja && (p.StockNum < (cantCaja * 2))) {
        // Stock bajo en cajas (menos de 2 cajas disponibles)
        let cajasDisp = Math.floor(p.StockNum / cantCaja);
        if (cajasDisp > 0) {
            stockStatusHTML = `<span class="product__stock warning"><i class="fa-solid fa-triangle-exclamation"></i> ¡Solo ${cajasDisp} caja(s) disponible(s)!</span>`;
        } else {
            stockStatusHTML = `<span class="product__stock warning"><i class="fa-solid fa-triangle-exclamation"></i> Solo ${p.StockNum} und disponibles (No alcanza p/ caja)</span>`;
        }
    } else {
        stockStatusHTML = `<span class="product__stock ${p.StockNum <= 5 ? 'warning' : 'available'}"><i class="fa-solid fa-check-circle"></i> ${p.StockNum} und disponibles</span>`;
    }

    const nombreB64 = typeof codificarNombre === 'function' ? codificarNombre(p.Nombre) : btoa(encodeURIComponent(p.Nombre));

    // Sync switch
    const toggleCaja = document.getElementById('toggle-caja-unidad');
    if (toggleCaja) {
        toggleCaja.checked = esModoCaja;
        
        const forceUnidad = window.soloUnidad && (window.soloUnidad.includes(p.Nombre) || window.soloUnidad.includes(String(p.codigo).trim()));
        const forceCaja = window.soloCaja && (window.soloCaja.includes(p.Nombre) || window.soloCaja.includes(String(p.codigo).trim()));
        
        const switchContainer = toggleCaja.closest('.product__switch-container');
        if (switchContainer) {
            if (forceUnidad || forceCaja) {
                switchContainer.style.display = 'none';
            } else {
                switchContainer.style.display = '';
            }
        }
    }

    // Breadcrumb
    document.getElementById('product-breadcrumb').innerHTML = `
        <a href="index.html">Inicio</a>
        <span class="separator">/</span>
        <a href="index.html?cat=${encodeURIComponent(p.Cat)}">${formatearTitulo(p.Cat)}</a>
        <span class="separator">/</span>
        <span style="color: var(--color-text); font-weight: 600;">${p.Nombre}</span>
    `;

    // Titulos
    document.getElementById('product-category').textContent = p.SubCat || p.Cat || 'General';
    document.getElementById('product-category').classList.remove('skeleton-text', 'short');
    
    document.getElementById('product-title').textContent = p.Nombre;
    document.getElementById('product-title').classList.remove('skeleton-text', 'long');

    const skuEl = document.getElementById('product-sku');
    if (skuEl) {
        skuEl.textContent = `Código: ${p.codigo}`;
    }

    // Precios
    const priceBlock = document.getElementById('product-price-usd').parentElement;
    priceBlock.classList.remove('skeleton-box');
    
    document.getElementById('product-price-usd').innerHTML = `$${precioUsdDin} <span style="font-size: 14px; font-weight: 700; color: var(--dorado); letter-spacing: 0.5px; vertical-align: middle; margin-left: 5px;">${textoUnidad}</span>`;
    document.getElementById('product-price-bs').textContent = `Equivalente: ${precioBsDin} Bs`;

    // Stock
    document.getElementById('product-stock').outerHTML = stockStatusHTML;

    // Acción
    const actionBlock = document.getElementById('product-action-block');
    actionBlock.classList.remove('skeleton-box');
    actionBlock.innerHTML = `
        <div class="qty-selector">
            <button type="button" class="qty-btn" onclick="document.getElementById('prod-qty').stepDown()">-</button>
            <input type="number" id="prod-qty" class="qty-input" value="1" min="1" max="${p.StockNum < 999 ? p.StockNum : 99}">
            <button type="button" class="qty-btn" onclick="document.getElementById('prod-qty').stepUp()">+</button>
        </div>
        <button class="btn-add-main" ${isAgotado ? 'disabled' : ''} onclick="agregarDesdeDetalle('${nombreB64}', ${precioNum}, '${imgSrc}', ${esModoCaja})">
            <i class="fa-solid fa-cart-shopping"></i> ${isAgotado ? 'Agotado' : 'Agregar al Carrito'}
        </button>
        <button type="button" class="btn-share-main" onclick="compartirProductoDetalle('${p.codigo}', '${nombreB64}', '${precioUsdDin}')" title="Compartir producto">
            <i class="fa-solid fa-share-nodes"></i> Compartir
        </button>
    `;




    // Descripcion larga
    const descEl = document.getElementById('product-description');
    descEl.classList.remove('skeleton-text', 'multiple');
    descEl.innerHTML = p.DescAdicional ? p.DescAdicional.replace(/\n/g, '<br>') : 'No hay descripción adicional disponible para este producto. Para más información, contáctanos vía WhatsApp.';

    // Especificaciones completas
    document.getElementById('product-full-specs').innerHTML = `
        <div class="spec-row"><span class="spec-name">Código:</span> <span class="spec-value">${p.codigo}</span></div>
        <div class="spec-row"><span class="spec-name">Categoría:</span> <span class="spec-value">${formatearTitulo(p.Cat)}</span></div>
        <div class="spec-row"><span class="spec-name">Subcategoría:</span> <span class="spec-value">${formatearTitulo(p.SubCat || p.Cat)}</span></div>
        <div class="spec-row"><span class="spec-name">Medida/Peso:</span> <span class="spec-value">${p.Medida || 'N/A'}</span></div>
        <div class="spec-row"><span class="spec-name">Unidad de Manejo:</span> <span class="spec-value">${p.UnidadSimple || 'Unidad'}</span></div>
        <div class="spec-row"><span class="spec-name">Unidades por Mayor:</span> <span class="spec-value">${cantCaja} por ${p.UnidadGrup || 'Caja'}</span></div>
    `;

    // Imagen (al final para cargar suavemente)
    const imgWrapper = document.getElementById('product-image-wrapper');
    imgWrapper.classList.remove('skeleton-box');
    imgWrapper.innerHTML = `
        <img src="${imgSrc}" alt="${p.Nombre}" id="main-product-image" onerror="imgFallbackFolder(this)">
    `;

    // Productos Relacionados (Nueva Sección Custom)
    cargarProductosRelacionados(p, window.appState.inventario);

    // --- SINCRONIZAR SIDEBAR EN PRODUCTO.HTML ---
    // Asegurar que el menú lateral refleje automáticamente la categoría y subcategoría del producto actual
    try {
        let catStr = p.Cat || p.categoria || p.Categoria;
        let subcatStr = (p.SubCatId || p.SubCat || p.subcategoria || p.Subcategoria || '').toString().trim();
        let subcatName = (p.SubCat || p.subcategoria || p.Subcategoria || '').toString().trim();
        
        if (catStr) {
            try { 
                categoriaActual = catStr; 
                subcategoriaActual = subcatStr || null; 
                if (subcatName) subcategoriaNombreActual = subcatName; 
            } catch (e) { 
                window.categoriaActual = catStr; 
                window.subcategoriaActual = subcatStr || null; 
                if (subcatName) window.subcategoriaNombreActual = subcatName; 
            }

            // Esperar a que los grupos estén cargados antes de renderizar para evitar condiciones de carrera
            let intentosSidebar = 0;
            const sidebarInterval = setInterval(() => {
                if (window.appState && window.appState.gruposInventario && window.appState.gruposInventario.length > 0) {
                    clearInterval(sidebarInterval);
                    
                    // Actualizar visualmente los checkboxes del panel principal de grupos
                    if (typeof window.generarCategorias === 'function') {
                        window.generarCategorias();
                    }

                    // Ejecutar el drill-down del sidebar y renderizar las subcategorías correspondientes
                    if (typeof window.cargarSubcategoriasAPI === 'function') {
                        window.cargarSubcategoriasAPI(catStr);
                    }
                }
                
                intentosSidebar++;
                if (intentosSidebar > 100) clearInterval(sidebarInterval); // 10s timeout
            }, 100);
        }
    } catch (e) {
        console.warn("No se pudo sincronizar el estado del sidebar con el producto", e);
    }
}

function mostrarErrorProducto() {
    const container = document.querySelector('.product-main-layout');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 60px; color: #ea4335; margin-bottom: 20px;"></i>
                <h1 style="font-size: 24px; color: var(--color-text); margin-bottom: 10px;">Producto no encontrado</h1>
                <p style="color: var(--color-text-muted); margin-bottom: 30px;">El producto que estás buscando no existe o ya no está disponible en nuestro catálogo.</p>
                <a href="index.html" class="btn-add-main" style="display: inline-flex; width: auto; padding: 0 30px;"><i class="fa-solid fa-arrow-left"></i> Volver a la tienda</a>
            </div>
        `;
        document.querySelector('.product-description-layout').style.display = 'none';
        document.getElementById('product-breadcrumb').style.display = 'none';
    }
}

// Interfaz para el botón de agregar
window.agregarDesdeDetalle = function(nombreB64, precioNum, imgSrc, esModoCaja) {
    const qtyInput = document.getElementById('prod-qty');
    const cantidad = parseInt(qtyInput.value) || 1;
    
    // Necesitamos pasar un elemento "btn" falso para la animación si es requerida por la función original
    const btnMock = document.querySelector('.btn-add-main');
    
    // La función agregarAlCarritoB64 existe en cart.js (espera cantidad como parte del modal o por defecto 1)
    // Ya que no podemos modificar agregarAlCarritoB64 para aceptar cantidad directa fácilmente sin tocar cart.js,
    // llamaremos la función N veces, o mejor usamos una adición manual si la API lo permite, 
    // pero lo mejor es usar la función de cart.js
    
    // Decodificamos y usamos la lógica directa de agregar
    if (typeof agregarAlCarritoDirecto === 'function') {
        // Si tienes una funcion directa
    } else {
        // En cart.js la función es agregarAlCarritoB64(nombreBase64, precioNum, botonElem, sumarAlerta, imgSrc, esCaja)
        // Agregamos tantas veces como cantidad
        for(let i=0; i<cantidad; i++) {
            // Pasamos true en sumarAlerta solo en la última para no espamear
            const mostrarAlerta = (i === cantidad - 1);
            agregarAlCarritoB64(nombreB64, precioNum, btnMock, mostrarAlerta, imgSrc, esModoCaja);
        }
    }
};

window.toggleModoVistaProducto = function(checkbox) {
    const modo = checkbox.checked ? 'caja' : 'unidad';
    try { modoVistaGlobal = modo; } catch (e) { window.modoVistaGlobal = modo; }
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if(productId && window.appState && window.appState.inventario) {
        let producto = window.appState.inventario.find(p => (window.compararIDs ? window.compararIDs(p.codigo, productId) : p.codigo == productId));
        if(producto) {
            renderizarProducto(producto);
        }
    }
};



/**
 * Renderiza productos sugeridos basados en la categoría del producto actual.
 */
function cargarProductosRelacionados(productoActual, todosLosProductos) {
  try {
    const rootRelacionados = document.getElementById('productos-relacionados-root');
    if (!rootRelacionados) return;

    // Si el inventario aún no ha cargado (ej. se cargó el producto desde caché)
    // entonces esperamos hasta que appState.inventario esté listo.
    if (!todosLosProductos || !Array.isArray(todosLosProductos) || todosLosProductos.length === 0) {
      let reintentos = 0;
      const intervalo = setInterval(() => {
        reintentos++;
        if (window.appState && window.appState.inventario && window.appState.inventario.length > 0) {
          clearInterval(intervalo);
          cargarProductosRelacionados(productoActual, window.appState.inventario);
        } else if (reintentos > 100) { // Timeout 10 seg
          clearInterval(intervalo);
          rootRelacionados.style.display = 'none';
        }
      }, 100);
      return;
    }

    const catActual = (productoActual.Cat || productoActual.categoria || productoActual.Categoria || '').toLowerCase().trim();
    const catIdActual = productoActual.CatId;

    let productosFiltrados = todosLosProductos.filter(producto => {
      // Excluir el producto actual
      if (String(producto.codigo) === String(productoActual.codigo)) return false;
      
      // Excluir productos sin stock
      if (!producto.StockNum || producto.StockNum <= 0) return false;
      
      // Coincidencia de categoría
      const catProd = (producto.Cat || producto.categoria || producto.Categoria || '').toLowerCase().trim();
      if (catActual && catProd === catActual) return true;
      if (catIdActual && producto.CatId === catIdActual) return true;
      
      return false;
    });

    // Mezclar aleatoriamente el array resultante
    productosFiltrados.sort(() => 0.5 - Math.random());

    let productosAMostrar = productosFiltrados.slice(0, 10);

    // Fallback: Si no hay suficientes, rellenar con otros al azar en stock
    if (productosAMostrar.length < 10) {
      let fallback = todosLosProductos.filter(p => 
        String(p.codigo) !== String(productoActual.codigo) && 
        p.StockNum > 0 &&
        !productosAMostrar.find(pm => String(pm.codigo) === String(p.codigo))
      );
      fallback.sort(() => 0.5 - Math.random()); // Mezclar fallback también
      productosAMostrar = productosAMostrar.concat(fallback.slice(0, 10 - productosAMostrar.length));
    }

    if (productosAMostrar.length === 0) {
      rootRelacionados.style.display = 'none';
      return;
    } else {
      rootRelacionados.style.display = 'block';
    }

    let html = `<section class="related-products-section">
      <h2 style="font-size: 1.5rem; margin-bottom: 20px;">También te podría interesar</h2>
      <div class="related-carousel-container" style="position: relative;">
        <button class="related-carousel-btn left" onclick="scrollRelatedProducts(-1)"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="related-carousel-track" id="related-carousel-track">`;

    let itemsHTML = '';
    productosAMostrar.forEach(producto => {
      if (typeof crearHTMLProducto === 'function') {
        itemsHTML += crearHTMLProducto(producto);
      } else {
        // Fallback en caso extremadamente raro de que la función global no esté disponible
        let imgSrc = typeof obtenerImgProducto === 'function' ? obtenerImgProducto(producto) : (producto.imagen || 'assets/img/placeholder.webp');
        itemsHTML += `<div class="producto-card" onclick="irADetalle('${producto.codigo.replace(/'/g, "\\'")}')" style="cursor: pointer; padding: 10px; border: 1px solid #eee; border-radius: 8px; text-align: center;">
          <img src="${imgSrc}" style="width: 100%; height: 180px; object-fit: contain;">
          <h3 style="font-size: 0.9rem; margin-top: 10px;">${producto.Nombre || 'Producto'}</h3>
        </div>`;
      }
    });

    html += itemsHTML;

    html += `   </div>
        <button class="related-carousel-btn right" onclick="scrollRelatedProducts(1)"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </section>`;
    
    rootRelacionados.innerHTML = html;
  } catch (e) {
    console.error("Error cargando productos relacionados:", e);
  }
}

window.scrollRelatedProducts = function(direction) {
  const track = document.getElementById('related-carousel-track');
  if (track) {
    const cardWidth = track.querySelector('.producto-card') ? track.querySelector('.producto-card').offsetWidth : 180;
    track.scrollBy({ left: direction * (cardWidth + 15), behavior: 'smooth' });
  }
};

window.compartirProductoDetalle = function(codigo, nombreB64, precioUsd) {
    let nombre = 'Producto';
    try {
        nombre = typeof decodificarNombre === 'function' ? decodificarNombre(nombreB64) : decodeURIComponent(escape(atob(nombreB64)));
    } catch(e){}

    if (typeof compartirProducto === 'function') {
        compartirProducto(nombre, precioUsd);
    } else {
        const shareUrl = window.location.origin + '/producto.html?id=' + encodeURIComponent(codigo);
        const text = `¡Mira este producto en Gran Catador! ${nombre} a $${precioUsd}. ${shareUrl}`;
        if (navigator.share) {
            navigator.share({ title: 'Gran Catador', text: text, url: shareUrl }).catch(() => {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                if (typeof mostrarToast === 'function') mostrarToast("Enlace del producto copiado al portapapeles.");
            });
        }
    }
};