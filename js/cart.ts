/**
 * cart.ts - Lógica del carrito de compras y checkout
 */

/** Guarda el estado actual del carrito en LocalStorage */
function guardarCarritoLS() {
    if (!appState.carrito || typeof appState.carrito !== 'object' || Array.isArray(appState.carrito)) {
        appState.carrito = {};
    }
    safeSetItem('gc_cart', JSON.stringify(appState.carrito));
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE STOCK INTELIGENTE
// Calcula el stock real restante descontando lo que ya está en el carrito.
// Combina unidades sueltas y cajas para un control preciso.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el stock real restante para un producto.
 */
function calcularStockRestante(nombreBase: any) {
    if (!nombreBase) {
        return { prodObj: null, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja: 12 };
    }
    const cleanName = String(nombreBase).replace(/ \((CAJA|UNIDAD)\)$/, "").trim();
    const prodObj = (appState && appState.inventario && appState.inventario.length > 0)
        ? appState.inventario.find((x: any) => x.Nombre === cleanName || x.Nombre === nombreBase || x.codigo === nombreBase)
        : null;

    if (!prodObj) {
        return { prodObj: null, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja: 12 };
    }

    const stockDisponible = Number.isFinite(Number(prodObj.StockNum)) ? Number(prodObj.StockNum) : 999;
    const unidadesPorCaja = (prodObj.CantidadGrup && Number(prodObj.CantidadGrup) > 0) ? Number(prodObj.CantidadGrup) : 12;

    if (stockDisponible >= 999) {
        return { prodObj, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja };
    }

    const cantUnidades = (appState.carrito && appState.carrito[`${cleanName} (UNIDAD)`]) ? appState.carrito[`${cleanName} (UNIDAD)`].cantidad || 0 : 0;
    const cantCajas = (appState.carrito && appState.carrito[`${cleanName} (CAJA)`]) ? appState.carrito[`${cleanName} (CAJA)`].cantidad || 0 : 0;
    const unidadesEnCarrito = cantUnidades + (cantCajas * unidadesPorCaja);
    const unidadesRestantes = Math.max(0, stockDisponible - unidadesEnCarrito);

    return { prodObj, stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja };
}

/**
 * Valida si hay stock suficiente para agregar un producto (unidad o caja).
 */
function tieneStockSuficiente(nombreBase: any, esCaja: any) {
    if (!appState || !appState.inventario || appState.inventario.length === 0) return true;

    const { prodObj, stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja } =
        calcularStockRestante(nombreBase);

    if (!prodObj) return true; // Failsafe
    if (stockDisponible >= 999) return true; // Stock ilimitado

    const unidadesPorAgregar = esCaja ? unidadesPorCaja : 1;

    if (unidadesRestantes <= 0) {
        mostrarToastError(
            `🚫 Límite de stock alcanzado`,
            `Solo hay <b>${stockDisponible}</b> unidad${stockDisponible !== 1 ? 'es' : ''} y ya las tienes todas en el carrito.`
        );
        return false;
    }

    if (unidadesPorAgregar > unidadesRestantes) {
        if (esCaja) {
            mostrarToastError(
                `📦 Stock insuficiente para una caja`,
                `Solo quedan <b>${unidadesRestantes}</b> unidad${unidadesRestantes !== 1 ? 'es' : ''} disponible${unidadesRestantes !== 1 ? 's' : ''}. Una caja requiere <b>${unidadesPorCaja}</b>.`
            );
        } else {
            mostrarToastError(
                `⚠️ Stock insuficiente`,
                `Solo quedan <b>${unidadesRestantes}</b> unidad${unidadesRestantes !== 1 ? 'es' : ''} disponible${unidadesRestantes !== 1 ? 's' : ''}.`
            );
        }
        return false;
    }
    return true;
}

/**
 * Muestra un toast de error con título y detalle.
 * Si el toast simple ya existe, lo reemplaza con uno más rico.
 */
function mostrarToastError(titulo: any, detalle: any) {
    const cont = document.getElementById('toast-container');
    if (!cont) { mostrarToast(titulo); return; }

    // Eliminar toasts de error anteriores para no apilarlos
    const prev = cont.querySelector('.toast-error');
    if (prev) prev.remove();

    const t = document.createElement('div');
    t.className = 'toast toast-error';
    (<HTMLElement>t).style.cssText = [
        'background: linear-gradient(135deg, #ff4b4b, #c0392b)',
        'border-left: 4px solid #ff1a1a',
        'min-width: 240px',
        'padding: 12px 16px',
        'border-radius: 12px',
        'box-shadow: 0 8px 24px rgba(234,67,53,0.35)',
        'animation: toastSlideIn 0.3s ease'
    ].join(';');
    t.innerHTML = `
        <div style="font-size:13px;font-weight:800;margin-bottom:3px;">${titulo}</div>
        <div style="font-size:12px;opacity:0.9;line-height:1.4;">${detalle}</div>
    `;
    cont.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

/** Anima un producto volando hacia el icono del carrito */
/** Anima un producto volando hacia el icono del carrito */
function animarAlCarrito(btnElement: any, imgSrc: any, cachedRect: any = null) {
    if (!imgSrc) return;

    // Buscar el icono del carrito activo (header en PC, nav en móvil)
    let cartIcon = document.querySelector('.header-right .icon-btn[aria-label="Carrito"]');
    const navCart = document.getElementById('nav-cart-bottom') || document.getElementById('nav-cart');
    const bottomNav = document.querySelector('.bottom-nav');

    if (navCart && bottomNav && getComputedStyle(bottomNav).display !== 'none') {
        cartIcon = navCart;
    }

    if (!cartIcon) return;

    let btnRect = cachedRect;
    if (!btnRect && btnElement && typeof btnElement.getBoundingClientRect === 'function') {
        btnRect = btnElement.getBoundingClientRect();
    }

    if (!btnRect || (btnRect.width === 0 && btnRect.height === 0 && btnRect.top === 0 && btnRect.left === 0)) {
        return; // Detener animación si no hay coordenadas válidas
    }

    const cartRect = cartIcon.getBoundingClientRect();
    const flyingImg = document.createElement('img');

    flyingImg.src = imgSrc;
    flyingImg.className = 'flying-img';
    (<HTMLElement>flyingImg).style.left = `${btnRect.left}px`;
    (<HTMLElement>flyingImg).style.top = `${btnRect.top}px`;
    document.body.appendChild(flyingImg);

    setTimeout(() => {
        (<HTMLElement>flyingImg).style.left = `${cartRect.left + (cartRect.width / 2) - 7.5}px`;
        (<HTMLElement>flyingImg).style.top = `${cartRect.top + (cartRect.height / 2) - 7.5}px`;
        (<HTMLElement>flyingImg).style.width = '15px';
        (<HTMLElement>flyingImg).style.height = '15px';
        (<HTMLElement>flyingImg).style.opacity = '0.3';
    }, 10);

    setTimeout(() => {
        flyingImg.remove();
        (<HTMLElement>cartIcon).style.transform = 'scale(1.2)';
        setTimeout(() => (<HTMLElement>cartIcon).style.transform = 'scale(1)', 200);
    }, 600);
}

/** Anima el rebote del contador visual del carrito */
function animarContadorCarrito() {
    const elements = [
        document.getElementById('cart-count'),
        document.getElementById('bottom-cart-count'),
        document.getElementById('btn-cart-header'),
        document.getElementById('nav-cart-bottom'),
        document.getElementById('nav-cart')
    ];

    elements.forEach((elem) => {
        if (!elem || !elem.classList) return;
        elem.classList.remove('cart-count-bounce');
        void elem.offsetWidth; // trigger reflow
        elem.classList.add('cart-count-bounce');
        setTimeout(() => {
            if (elem && elem.classList) elem.classList.remove('cart-count-bounce');
        }, 500);
    });
}

/** Añade un producto al estado del carrito y lanza efectos visuales */
function agregarAlCarrito(nombre: any, precio: any, btnElement: any, isCross = false, imgSrc = '', esCaja = false) {
    if (!nombre) return;

    // Guardar coordenadas de botón ANTES de manipular o refrescar el DOM
    let cachedRect: any = null;
    if (btnElement && typeof btnElement.getBoundingClientRect === 'function') {
        const r = btnElement.getBoundingClientRect();
        if (r.width > 0 || r.height > 0 || r.top > 0 || r.left > 0) {
            cachedRect = r;
        }
    }

    const nombreBase = String(nombre).replace(/ \((CAJA|UNIDAD)\)$/, "").trim();

    // --- AVISO DE HORARIO (NO BLOQUEA LA COMPRA) ---
    try {
        let d = new Date();
        let formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'America/Caracas' });
        let parts = formatter.format(d).split(':');
        let horaCaracas = parseInt(parts[0]);
        if (horaCaracas === 24) horaCaracas = 0;
        let isAbierto = (horaCaracas >= 8 && horaCaracas < 21);
        
        if (!isAbierto && typeof (window as any).mostrarAlertaModalTiendaCerrada === 'function') {
            (window as any).mostrarAlertaModalTiendaCerrada();
        }
    } catch (e) {}
    // --- FIN AVISO HORARIO ---

    // --- VALIDACIÓN DE STOCK ---
    if (!tieneStockSuficiente(nombreBase, esCaja)) {
        return; // Detener si no hay stock
    }
    // --- FIN VALIDACIÓN ---

    let nombreFinal = esCaja ? `${nombreBase} (CAJA)` : `${nombreBase} (UNIDAD)`;
    let precioNum = Number(precio) || 0;

    if (!appState.carrito) appState.carrito = {};

    let prodObj = (appState && appState.inventario && appState.inventario.length > 0)
        ? appState.inventario.find(( x: any ) => x.Nombre === nombreBase || x.Nombre === nombre)
        : null;

    if (appState.carrito[nombreFinal]) {
        appState.carrito[nombreFinal].cantidad++;
        appState.carrito[nombreFinal].subtotal = appState.carrito[nombreFinal].cantidad * appState.carrito[nombreFinal].precio;
    } else {
        appState.carrito[nombreFinal] = {
            precio: precioNum,
            cantidad: 1,
            subtotal: precioNum,
            codigo: prodObj ? prodObj.codigo : '',
            categoria: prodObj ? (prodObj.Grupo || prodObj.Subgrupo || prodObj.Cat || '') : '',
            esCaja: esCaja
        };
    }

    guardarCarritoLS();
    actualizarCartCount();

    // Haptic Feedback (Vibración nativa en móviles compatibles)
    if (typeof navigator !== 'undefined' && navigator.vibrate) { navigator.vibrate(50); }

    if (typeof (window as any).mostrarToastAgregarCarrito === 'function') {
        (window as any).mostrarToastAgregarCarrito(nombreBase, imgSrc, esCaja);
    }
    animarContadorCarrito();

    if (document.getElementById('lista-carrito')) {
        renderizarCarrito();
    }

    if (imgSrc) {
        animarAlCarrito(btnElement, imgSrc, cachedRect);
    }

    // Cambio visual de confirmación en el botón
    if (btnElement && btnElement.parentElement) {
        let parent = btnElement.parentElement;
        if (parent) {
            let iconoOriginal = btnElement.innerHTML;
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i>';
            (<HTMLElement>btnElement).style.background = "#fff";
            (<HTMLElement>btnElement).style.color = "var(--verde-btn)";

            // --- NUEVO: Texto de confirmación "¡Agregado al carrito!" debajo del botón ---
            (<HTMLElement>parent).style.position = 'relative'; // Convertir al padre en el punto de anclaje

            // Limpiar mensaje anterior si el usuario hace clics muy rápidos
            let oldMsg = parent.querySelector('.cart-msg-toast');
            if (oldMsg) oldMsg.remove();

            let msgConf = document.createElement('div');
            msgConf.className = 'cart-msg-toast';
            msgConf.innerText = "¡Agregado al carrito!";
            (<HTMLElement>msgConf).style.position = 'absolute';
            (<HTMLElement>msgConf).style.background = 'var(--color-success, #10B981)';
            (<HTMLElement>msgConf).style.color = 'white';
            (<HTMLElement>msgConf).style.fontSize = '10px';
            (<HTMLElement>msgConf).style.fontWeight = '700';
            (<HTMLElement>msgConf).style.padding = '4px 8px';
            (<HTMLElement>msgConf).style.borderRadius = '6px';
            (<HTMLElement>msgConf).style.whiteSpace = 'nowrap';
            (<HTMLElement>msgConf).style.pointerEvents = 'none'; // Para que no bloquee clics accidentales
            (<HTMLElement>msgConf).style.zIndex = '100';
            (<HTMLElement>msgConf).style.opacity = '0';
            (<HTMLElement>msgConf).style.transform = 'translateY(-5px)';
            (<HTMLElement>msgConf).style.transition = 'all 0.3s ease';
            (<HTMLElement>msgConf).style.boxShadow = 'var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.1))';

            // Posicionamiento dinámico: A la derecha y justo debajo del botón
            (<HTMLElement>msgConf).style.right = '0';
            (<HTMLElement>msgConf).style.top = (btnElement.offsetTop + btnElement.offsetHeight + 6) + 'px';

            parent.appendChild(msgConf);

            // Desencadenar animación de entrada fluida
            requestAnimationFrame(() => {
                (<HTMLElement>msgConf).style.opacity = '1';
                (<HTMLElement>msgConf).style.transform = 'translateY(0)';
            });

            setTimeout(() => {
                if (btnElement) {
                    btnElement.innerHTML = iconoOriginal;
                    (<HTMLElement>btnElement).style.background = esCaja ? "var(--dorado)" : "var(--verde-btn)";
                    (<HTMLElement>btnElement).style.color = esCaja ? "black" : "#fff";
                }
            }, 500);

            // Desaparecer y remover del código luego de 2 segundos
            setTimeout(() => {
                (<HTMLElement>msgConf).style.opacity = '0';
                (<HTMLElement>msgConf).style.transform = 'translateY(-5px)';
                setTimeout(() => msgConf.remove(), 300);
            }, 2000);
        }
    }

    // Lógica de Cross-Selling (Sugerencias Automáticas)
    if (!isCross && !esCaja && prodObj) {
        let catMayus = (prodObj.Cat || '').toUpperCase();
        let activadoresCrossSell = ["RON", "WHISKY", "VODKA", "GINEBRA", "LICOR", "TEQUILA"];
        if (activadoresCrossSell.some(( keyword: any ) => catMayus.includes(keyword))) {
            sugerirAcompañante();
        }
    }
}

/** Muestra modal con sugerencias complementarias (Cross-Sell) */
function sugerirAcompañante() {
    let sugerencias = [];

    if (appState.codigosRecomendados && appState.codigosRecomendados.length > 0) {
        sugerencias = (appState.inventario || []).filter(( p: any ) => appState.codigosRecomendados!.includes(p.codigo) && p.StockNum > 0).slice(0, 3);
    } else {
        sugerencias = (appState.inventario || []).filter(( p: any ) => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3);
    }

    if (sugerencias.length > 0) {
        let cont = document.getElementById('cross-sell-items') as HTMLElement | null;
        let modal = document.getElementById('modal-cross-sell') as HTMLElement | null;

        if (cont && modal) {
            cont.innerHTML = sugerencias.map(( p: any ) => {
                let nombreB64 = codificarNombre(p.Nombre);
                let imgSrc = obtenerImgProducto(p);
                let attempts = p.ImagenUrl ? 0 : 1;
                return `
                    <div style="min-width:130px; border:1px solid var(--color-border); border-radius:var(--radius-md); padding:12px; text-align:center; background:var(--color-card); box-shadow:var(--shadow-sm);">
                        <img loading="lazy" src="${imgSrc}" width="60" height="60" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" style="height:60px; width:100%; object-fit:contain; margin-bottom:8px; mix-blend-mode:multiply;">
                        <p style="font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--color-text); font-family:'Inter',sans-serif;">${p.Nombre}</p>
                        <p style="font-size:15px; color:var(--color-text); font-weight:700; font-family:'Inter',sans-serif; margin-top:2px;">$${p.PrecioStr}</p>
                        <button onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, '${imgSrc}', false); cerrarCrossSell();" style="background:var(--color-primary); color:white; border:none; padding:8px; border-radius:var(--radius-full); font-size:12px; font-weight:700; width:100%; margin-top:8px; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-plus"></i> Añadir</button>
                    </div>`;
            }).join('');

            (<HTMLElement>modal).style.display = 'flex';
        }
    }
}

function cerrarCrossSell() {
    let modal = document.getElementById('modal-cross-sell') as HTMLElement | null;
    if (modal) modal.style.display = 'none';
}

function actualizarCartCount() {
    let totalItems = 0;
    for (let key in appState.carrito) {
        totalItems += appState.carrito[key].cantidad;
    }
    const cartCountElem = document.getElementById('cart-count');
    if (cartCountElem) cartCountElem.innerText = totalItems.toString();
    
    const bottomCartCountElem = document.getElementById('bottom-cart-count');
    if (bottomCartCountElem) bottomCartCountElem.innerText = totalItems.toString();

    if (typeof (window as any).sincronizarBotonesCards === 'function') {
        (window as any).sincronizarBotonesCards();
    }
}

function vaciarCarrito() {
    if (confirm("¿Estás seguro de vaciar tu pedido?")) {
        appState.carrito = {};
        guardarCarritoLS();
        actualizarCartCount();
        if (!window.location.href.includes('carrito')) {
            cerrarModal('modal-cart', 'nav-home');
        } else {
            renderizarCarrito();
        }
        mostrarToast("Pedido vaciado");
    }
}

function abrirCarrito() {
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('/carrito') || currentPath.includes('/carrito/')) {
        if (typeof renderizarCarrito === 'function') {
            renderizarCarrito();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    window.location.href = 'carrito/';
}

function repetirPedido(index: number) {
    let histStr = safeGetItem('gc_historial');
    let hist = histStr ? JSON.parse(histStr) : [];
    let ped = hist[index];
    if (!ped) return;

    appState.carrito = {};
    ped.items.forEach(( i: any ) => {
        appState.carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad, subtotal: i.precio * i.cantidad, codigo: i.codigo || '', categoria: i.categoria || '' };
    });

    guardarCarritoLS();
    actualizarCartCount();
    cerrarModal('modal-perfil', 'nav-home');
    abrirCarrito();
    mostrarToast("Pedido cargado");
}

/** Dibuja los productos en la vista del Carrito de Compras (Performance Optimizado) */
function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito');
    if (!lista) return; // Safeguard if called on pages without the cart UI
    
    appState.totalCarrito = 0;
    appState.totalCarritoBs = 0;

    if (Object.keys(appState.carrito).length === 0) {
        lista.innerHTML = `
            <div class="cart-empty-state">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
                    <path d="M5 7h14l-1.5 9h-11L5 7zm3.5-3h7l1 3h-9l1-3z" fill="currentColor" opacity="0.15"/>
                    <path d="M7 8h10l1 6H6l1-6zm2-4h4l.8 3H8.2L9 4z" fill="currentColor"/>
                </svg>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega tus favoritos y continúa tu pedido rápido por WhatsApp.</p>
                <button onclick="window.location.href='../index.html'" class="btn-checkout-primary">Volver a la tienda</button>
            </div>`;
        let checkoutSections = document.getElementById('checkout-sections');
        if (checkoutSections) checkoutSections.style.display = 'none';
        return;
    }

    let checkoutSections = document.getElementById('checkout-sections');
    if (checkoutSections) checkoutSections.style.display = 'block';

    let renderHTML = '';
    for (let nombre in appState.carrito) {
        let nombreB64 = codificarNombre(nombre);
        let item = appState.carrito[nombre];
        let subTotalItem = parseFloat((item.precio * item.cantidad).toFixed(2));
        let subTotalItemBs = parseFloat((subTotalItem * appState.tasaOficial).toFixed(2));
        
        appState.totalCarrito += subTotalItem;
        appState.totalCarritoBs += subTotalItemBs;

        let prodObj = appState.inventario.find(( x: any ) => x.codigo === item.codigo);
        let imgSrc = obtenerImgProducto(prodObj || { codigo: item.codigo });
        let attempts = (prodObj && prodObj.ImagenUrl) ? 0 : 1;
        let imgInnerHTML = item.codigo
            ? `<img loading="lazy" src="${imgSrc}" width="60" height="60" data-codigo="${item.codigo}" data-categoria="${item.categoria || ''}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" class="cart-item-img">`
            : `<div class="cart-item-img-placeholder"><i class="fa-solid fa-wine-bottle"></i></div>`;
        let imgHTML = `<div class="cart-item-image">${imgInnerHTML}</div>`;

        let btnMinus = '<i class="fa-solid fa-minus"></i>';

        // ── STOCK INTELIGENTE: calcular si se puede agregar más ──────────────────
        const nombreBase = nombre.replace(/ \((CAJA|UNIDAD)\)$/, '');
        const esCajaItem = nombre.includes('(CAJA)');
        const { stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja } =
            calcularStockRestante(nombreBase);

        const enLimite = stockDisponible < 999 && unidadesRestantes <= 0;
        const noAlcanzaOtraCaja = esCajaItem && stockDisponible < 999 && unidadesRestantes < unidadesPorCaja;
        const bloquearSumar = enLimite || noAlcanzaOtraCaja;

        // Badge de stock restante / límite
        let stockBadge = '';
        if (stockDisponible < 999) {
            if (unidadesRestantes <= 0) {
                stockBadge = `<span class="cart-stock-badge limit">🔴 Stock máximo en carrito</span>`;
            } else if (unidadesRestantes <= 3) {
                stockBadge = `<span class="cart-stock-badge warning">⚠️ Quedan ${unidadesRestantes} unid. disponibles</span>`;
            } else {
                stockBadge = `<span class="cart-stock-badge info">${stockDisponible} unid. en stock</span>`;
            }
        }

        let btnSumarAttrs = bloquearSumar
            ? `class="cart-btn cart-btn-disabled" disabled title="Stock agotado — no hay más unidades disponibles"`
            : `class="cart-btn" onclick="cambiarCantB64('${nombreB64}', 1)"`;

        renderHTML += `
            <div class="cart-item">
                <div class="cart-item-left">
                    ${imgHTML}
                    <div class="cart-item-info">
                        <h4 class="cart-item-title" title="${nombre}">${nombre}</h4>
                        <p class="cart-item-unit">Unit: $${item.precio.toFixed(2)} <span class="cart-item-price-bs">(${(item.precio * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs)</span></p>
                        ${stockBadge}
                    </div>
                </div>
                <div class="cart-item-right">
                    <div class="cart-item-total">
                        <span class="subtotal-usd">$${subTotalItem.toFixed(2)}</span>
                        <span class="subtotal-bs">Bs. ${subTotalItemBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div class="cart-controls" aria-label="Controles de cantidad">
                        <button type="button" class="cart-btn" onclick="cambiarCantB64('${nombreB64}', -1)">${btnMinus}</button>
                        <span class="cart-item-qty">${item.cantidad}</span>
                        <button type="button" ${btnSumarAttrs}><i class="fa-solid ${bloquearSumar ? 'fa-lock' : 'fa-plus'}"></i></button>
                    </div>
                    <button type="button" class="cart-item-delete" onclick="cambiarCantB64('${nombreB64}', -${item.cantidad})" aria-label="Eliminar ${nombre}" title="Eliminar producto">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
    }

    lista.innerHTML = renderHTML;

    appState.totalCarrito = parseFloat(appState.totalCarrito.toFixed(2));
    appState.totalCarritoBs = parseFloat(appState.totalCarritoBs.toFixed(2));
    
    document.getElementById('totalUsdModal')!.innerText = `$${appState.totalCarrito.toFixed(2)}`;
    document.getElementById('totalBsModal')!.innerText = `${appState.totalCarritoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
    calcularVuelto();
    
    // Asegurar que siempre se inicie en el Paso 1 al abrir o refrescar el carrito
    setCheckoutStep(1);
    renderizarSugerenciasRapidasCarrito();
}

function renderizarSugerenciasRapidasCarrito() {
    const container = document.getElementById("cart-suggestions-container");
    if (!container) return;

    const enCarrito = Object.keys(appState.carrito || {});
    
    // Fallback garantizado de productos si el inventario no se ha cargado aún
    const fallbackItems = [
        { codigo: "HIELO_5K", Nombre: "BOLSA DE HIELO 5KG", PrecioNum: 2.5, Cat: "HIELO" },
        { codigo: "SNACK_PRINGLES", Nombre: "PAPITAS PRINGLES", PrecioNum: 3.0, Cat: "SNACKS" },
        { codigo: "REFRESCO_COCA", Nombre: "COCA-COLA 2.25L", PrecioNum: 2.2, Cat: "REFRESCO" },
        { codigo: "LIMON_MALLA", Nombre: "LIMONES FRESCOS 1KG", PrecioNum: 1.5, Cat: "FRUTAS" },
        { codigo: "SNACK_MANI", Nombre: "MANI SALADO 200G", PrecioNum: 1.8, Cat: "SNACKS" }
    ];

    let inventarioFuente = (appState.inventario && appState.inventario.length > 0) 
        ? appState.inventario 
        : fallbackItems;

    // Filtrar ítems que tengan existencias en stock y no estén en el carrito
    let candidatos = inventarioFuente.filter((p: any) => {
        if (!p || !p.Nombre) return false;
        const yaAgregado = enCarrito.some((itemNom) => itemNom.includes(p.Nombre));
        if (yaAgregado) return false;

        const { stockDisponible, unidadesRestantes } = calcularStockRestante(p.Nombre);
        const tieneStock = (p.StockNum === undefined || p.StockNum > 0) && (stockDisponible >= 999 || unidadesRestantes > 0);

        return tieneStock;
    });

    // Priorizar Hielos y Snacks
    let hielosYSnacks = candidatos.filter((p: any) => {
        const cat = (p.Cat || p.Categoria || "").toUpperCase();
        const nom = p.Nombre.toUpperCase();
        return ["HIELO", "SNACK", "PAPITA", "DORITOS", "MANI", "CHIP", "CHUCHERIA", "LIMON", "REFRESCO", "COCA", "AGUA", "TONICA"].some(
            (k) => cat.includes(k) || nom.includes(k)
        );
    });

    // Aleatorizar (shuffle) para recomendar variedad fresca en cada apertura
    hielosYSnacks.sort(() => Math.random() - 0.5);

    let sugerencias = hielosYSnacks.slice(0, 5);

    // Completar con otros productos aleatorios si faltan
    if (sugerencias.length < 3) {
        let otros = candidatos.filter((p: any) => !sugerencias.includes(p)).sort(() => Math.random() - 0.5);
        sugerencias = [...sugerencias, ...otros].slice(0, 5);
    }

    if (sugerencias.length === 0) {
        sugerencias = fallbackItems.filter((p) => !enCarrito.some((itemNom) => itemNom.includes(p.Nombre))).slice(0, 5);
    }

    let html = `
    <div class="cart-suggestions-widget">
      <div class="suggestions-header">
        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Añade a tu pedido con 1 clic</h4>
        <span class="suggestions-sub">🧊 Hielos, 🍿 Snacks y Mezcladores recomendados</span>
      </div>
      <div class="suggestions-grid">
    `;

    sugerencias.forEach((p: any) => {
        const nombreUnidad = `${p.Nombre} (UNIDAD)`;
        const nombreB64 = codificarNombre(nombreUnidad);
        const imgSrc = obtenerImgProducto(p);
        const precioUsd = (p.PrecioNum || 0).toFixed(2);
        const tasa = appState.tasaOficial || 36;
        const precioBs = ((p.PrecioNum || 0) * tasa).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        html += `
      <div class="suggestion-card">
        <div class="suggestion-img-wrap">
          <img src="${imgSrc}" class="suggestion-img" alt="${p.Nombre}" onerror="imgFallbackFolder(this)" data-codigo="${p.codigo || ''}">
        </div>
        <div class="suggestion-info">
          <h5 class="suggestion-title" title="${p.Nombre}">${p.Nombre}</h5>
          <p class="suggestion-price">$${precioUsd} <span class="suggestion-bs">(${precioBs} Bs)</span></p>
        </div>
        <button type="button" class="btn-fast-add" onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, '${imgSrc}', false)">
          <i class="fa-solid fa-plus"></i> Añadir
        </button>
      </div>
        `;
    });

    html += `
      </div>
    </div>
    `;

    container.innerHTML = html;
    container.style.display = "block";
}

function cambiarCant(n: any, delta: any) {
    if (delta > 0) {
        // --- VALIDACIÓN HORARIO EN TIEMPO REAL ---
        // --- VERIFICACIÓN DE HORARIO EN MODIFICAR CANTIDAD ---
        try {
            let d = new Date();
            let formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'America/Caracas' });
            let parts = formatter.format(d).split(':');
            let horaCaracas = parseInt(parts[0]);
            if (horaCaracas === 24) horaCaracas = 0;
            let isAbierto = (horaCaracas >= 8 && horaCaracas < 21);
            if (!isAbierto && typeof (window as any).mostrarAlertaModalTiendaCerrada === 'function') {
                (window as any).mostrarAlertaModalTiendaCerrada();
            }
        } catch (e) {}
        // --- FIN VERIFICACIÓN ---

        const esCaja = n.includes('(CAJA)');
        const nombreBase = n.replace(/ \((CAJA|UNIDAD)\)$/, '');

        // Doble verificación: validar antes de aplicar el cambio
        if (!tieneStockSuficiente(nombreBase, esCaja)) {
            renderizarCarrito(); // Refrescar UI para reflejar estado actual
            return;
        }
    }

    if (!appState.carrito[n]) return; // Seguridad: el ítem pudo eliminarse antes

    appState.carrito[n].cantidad += delta;
    if (appState.carrito[n].cantidad <= 0) {
        delete appState.carrito[n];
    } else {
        appState.carrito[n].subtotal = appState.carrito[n].cantidad * appState.carrito[n].precio;
    }
    guardarCarritoLS();
    actualizarCartCount();
    renderizarCarrito();
}

function toggleDireccion() {
    let inputMetodo = document.querySelector('input[name="metodoEntrega"]:checked') as HTMLInputElement | null;
    if (!inputMetodo) return; // Salir si el DOM no tiene el checkout (ej: en index.html)
    
    let met = inputMetodo.value;
    let dirInput = document.getElementById('direccionDelivery');
    let btnGeo = document.getElementById('btn-geo');
    let btnMap = document.getElementById('btnMap');

    if (met === 'Delivery') {
        if (dirInput) (<HTMLElement>dirInput).style.display = 'block';
        if (btnGeo) (<HTMLElement>btnGeo).style.display = 'block';
        if (btnMap) (<HTMLElement>btnMap).style.display = 'none';
        if (dirInput && (safeGetItem('gc_direccion') || '') && !(dirInput as HTMLInputElement).value) {
            (dirInput as HTMLInputElement).value = (safeGetItem('gc_direccion') || '');
        }
    } else {
        if (dirInput) (<HTMLElement>dirInput).style.display = 'none';
        if (btnGeo) (<HTMLElement>btnGeo).style.display = 'none';
        if (btnMap) (<HTMLElement>btnMap).style.display = 'block';
    }
}

/** Obtiene las coordenadas GPS del cliente y las anexa a la dirección */
function obtenerUbicacion(inputId = 'direccionDelivery', btnId = 'btn-geo') {
    if (navigator.geolocation) {
        let btn = document.getElementById(btnId);
        let originalHTML = btn ? btn.innerHTML : '';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        navigator.geolocation.getCurrentPosition(function (pos) {
            let link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
            let input = document.getElementById(inputId) as HTMLInputElement | null;
            if (input) input.value = (input.value ? input.value + ' - ' : '') + '📍 Ubicación GPS: ' + link;
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-check" style="color: #10B981;"></i>';
                setTimeout(() => btn.innerHTML = originalHTML, 2000);
            }
        }, function (err) {
            alert("⚠️ No pudimos obtener tu ubicación. Verifica que el GPS esté encendido y hayas dado permisos al navegador.");
            if (btn) btn.innerHTML = originalHTML;
        }, { timeout: 10000, enableHighAccuracy: true });
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

function abrirMapa() {
    window.open('https://maps.app.goo.gl/tgjTHzaRd8xPdNbb7', '_blank');
}

function actualizarMetodoPago() {
    // Soporta tanto el <select> original como un grupo de botones tipo radio
    let selectElem = document.getElementById('metodoPagoSelect') as HTMLSelectElement | null;
    let radioElem = document.querySelector('input[name="metodoPago"]:checked') as HTMLInputElement | null;
    let val = radioElem ? radioElem.value : (selectElem ? selectElem.value : 'Efectivo');

    let boxE = document.getElementById('box-efectivo');
    if (boxE) (<HTMLElement>boxE).style.display = (val === 'Efectivo') ? 'block' : 'none';

    let boxPm = document.getElementById('box-pagomovil');
    if (boxPm) (<HTMLElement>boxPm).style.display = (val === 'Pago Movil' || val === 'PagoMovil') ? 'block' : 'none';

    let boxZ = document.getElementById('box-zelle');
    if (boxZ) (<HTMLElement>boxZ).style.display = (val === 'Zelle') ? 'block' : 'none';
}

function calcularVuelto() {
    let pago = parseFloat((<HTMLInputElement>document.getElementById('montoPago'))?.value) || 0;
    let res = document.getElementById('res-vuelto');

    if (pago > 0 && pago > appState.totalCarrito) {
        let vUsd = parseFloat((pago - appState.totalCarrito).toFixed(2));
        let vBs = parseFloat((vUsd * appState.tasaOficial).toFixed(2));
        (<HTMLElement>res).style.display = 'block';
        (<HTMLElement>res).style.color = 'var(--verde-btn)';
        (<HTMLElement>res).innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
    } else {
        (<HTMLElement>res).style.display = 'none';
    }
}

/** Finaliza la compra y procesa el texto hacia WhatsApp */
function enviarPedido() {
    if (Object.keys(appState.carrito).length === 0) return alert("Tu carrito está vacío.");

    // Validación de datos de perfil obligatorios
    let nombreUser = ((safeGetItem('gc_nombre') || '') || '').trim();
    let cedulaUser = ((safeGetItem('gc_cedula') || '') || '').trim();
    let telefonoUser = ((safeGetItem('gc_telefono') || '') || '').trim();

    if (!nombreUser || !cedulaUser || !telefonoUser) {
        alert("⚠️ Datos incompletos.\nPor favor, completa tu Nombre, Cédula y Teléfono en tu perfil antes de hacer el pedido.");
        abrirPerfil();
        return;
    }

    // Segunda capa de validación para asegurar que el formato es correcto
    let cedulaLimpia = cedulaUser.toUpperCase().replace(/\s/g, '');
    if (!/^[VEJGP]-?[\d\-]+$/.test(cedulaLimpia) && !/^[\d\-]+$/.test(cedulaLimpia)) {
        alert("⚠️ Cédula inválida.\nPor favor, verifica que tu Cédula contenga números válidos (Ej: V-12345678).");
        abrirPerfil();
        return;
    }

    if (!/^[\+0-9\-\s]+$/.test(telefonoUser) || telefonoUser.replace(/[^0-9]/g, '').length < 10) {
        alert("⚠️ Teléfono inválido.\nPor favor, ingresa un número de teléfono válido (Ej: 0414-1234567).");
        abrirPerfil();
        return;
    }

    // Generar registro histórico del pedido
    let historial = JSON.parse((safeGetItem('gc_historial') || '')) || [];
    let fechaDate = new Date();
    let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    let nuevoPedido = {
        fecha: fechaStr,
        total: appState.totalCarrito,
        items: Object.keys(appState.carrito).map(( k: any ) => ({
            nombre: k,
            precio: appState.carrito[k].precio,
            cantidad: appState.carrito[k].cantidad,
            codigo: appState.carrito[k].codigo,
            categoria: appState.carrito[k].categoria
        }))
    };

    historial.unshift(nuevoPedido);
    if (historial.length > 5) historial.pop(); // Solo se guardan los últimos 5
    safeSetItem('gc_historial', JSON.stringify(historial));

    // Comienza la construcción del mensaje de WhatsApp
    let msg = `🔥 *NUEVO PEDIDO - GRAN CATADOR* 🔥\n\n👤 *Cliente:* ${nombreUser}\n🪪 *Cédula:* ${cedulaUser}\n📱 *Teléfono:* ${telefonoUser}\n--------------------------------\n`;

    for (let nombre in appState.carrito) {
        let iconoProducto = nombre.includes('(CAJA)') ? '📦' : '🍾';
        msg += `${iconoProducto} ${appState.carrito[nombre].cantidad}x *${nombre}*\n`;
    }
    msg += `--------------------------------\n`;

    let entrega = (document.querySelector('input[name="metodoEntrega"]:checked') as HTMLInputElement).value;
    msg += `📦 *Entrega:* ${entrega}\n`;

    if (entrega === 'Delivery') {
        let dir = (<HTMLInputElement>document.getElementById('direccionDelivery'))?.value.trim();
        if (!dir) return alert("Por favor, ingresa tu dirección para el delivery.");
        msg += `📍 *Dirección:* ${dir}\n`;
        if (!(safeGetItem('gc_direccion') || '')) safeSetItem('gc_direccion', dir);
    }

    let notas = (<HTMLInputElement>document.getElementById('notasPedido'))?.value.trim();
    if (notas) msg += `📝 *Notas:* ${notas}\n`;

    let selectMetodo = document.getElementById('metodoPagoSelect') as HTMLSelectElement | null;
    let radioMetodo = document.querySelector('input[name="metodoPago"]:checked') as HTMLInputElement | null;
    let metodo = radioMetodo ? radioMetodo.value : (selectMetodo ? selectMetodo.value : 'Efectivo');
    msg += `💳 *Método de Pago:* ${metodo}\n`;

    if (metodo === 'Efectivo') {
        let pago = parseFloat((<HTMLInputElement>document.getElementById('montoPago'))?.value) || 0;
        if (pago > appState.totalCarrito) {
            msg += `💵 _Paga con $${pago.toFixed(2)}_\n🟢 _Requiere vuelto: $${(pago - appState.totalCarrito).toFixed(2)}_\n`;
        }
    } else {
        if (metodo === 'Pago Movil' || metodo === 'PagoMovil') {
            let refPm = document.getElementById('refPagoMovil') ? (<HTMLInputElement>document.getElementById('refPagoMovil'))?.value.trim() : '';
            if (refPm) msg += `🧾 *Referencia:* ${refPm}\n`;
        } else if (metodo === 'Zelle') {
            let refZelle = document.getElementById('refZelle') ? (<HTMLInputElement>document.getElementById('refZelle'))?.value.trim() : '';
            if (refZelle) msg += `👤 *Titular Zelle:* ${refZelle}\n`;
        }

        msg += `📎 _[Capture adjunto en el siguiente mensaje]_\n`;
    }

    msg += `\n💰 *TOTAL A PAGAR: $${appState.totalCarrito.toFixed(2)}* / *${appState.totalCarritoBs!.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs*\n💱 _(Tasa BCV: ${appState.tasaOficial.toFixed(2)} Bs)_`;

    // Limpieza post-compra
    safeRemoveItem('gc_inv_time_v3');
    appState.carrito = {};
    guardarCarritoLS();
    actualizarCartCount();

    let whatsappUrl = `https://wa.me/584245496366?text=${encodeURIComponent(msg)}`;
    
    // Abrimos la pestaña ANTES del timeout para evitar bloqueos por políticas anti-popups (ej. en iOS Safari)
    let win = window.open(whatsappUrl, '_blank');
    if (!win) {
        // Fallback robusto en caso de que el navegador lo bloquee de todas formas
        window.location.href = whatsappUrl;
    }

    // Feedback visual en el botón antes de redirigir
    let btnEnviar = document.getElementById('btn-whatsapp');
    if (!btnEnviar) return;
    let originalHTML = btnEnviar.innerHTML;
    btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando WhatsApp...';
    btnEnviar.classList.add('disabled');
    (<HTMLButtonElement>btnEnviar).disabled = true;

    setTimeout(() => {
        btnEnviar!.innerHTML = originalHTML;
        btnEnviar!.classList.remove('disabled');
        (<HTMLButtonElement>btnEnviar).disabled = false;
    }, 800);
}

/** Helpers para base64 que se enlazan desde HTML de forma segura */
function agregarAlCarritoB64(b64: any, p: any, btn: any, c = false, img = '', esCaja = false) {
    agregarAlCarrito(decodificarNombre(b64), p, btn, c, img, esCaja);
}

function cambiarCantB64(b64: any, d: any) {
    cambiarCant(decodificarNombre(b64), d);
}

/** 
 * Maneja el flujo de checkout en pasos (Local State)
 * @param {number} step - Paso actual (1, 2, 3, 4)
 */
function actualizarStepperCheckout(step: number) {
    const lineFill = document.getElementById("stepper-progress-fill");
    if (lineFill) {
        const percentages: Record<number, string> = { 1: "0%", 2: "33%", 3: "66%", 4: "100%" };
        lineFill.style.width = percentages[step] || "0%";
    }
    const steps = document.querySelectorAll(".stepper-step");
    steps.forEach((el) => {
        const s = parseInt(el.getAttribute("data-step") || "1");
        el.classList.remove("active", "completed");
        if (s === step) {
            el.classList.add("active");
        } else if (s < step) {
            el.classList.add("completed");
        }
    });
}

function setCheckoutStep(step: any) {
    appState.checkoutStep = step;
    actualizarStepperCheckout(step);
    
    let step1Summary = document.getElementById('step-1-summary');
    let step2Delivery = document.getElementById('step-2-delivery');
    let step3Payment = document.getElementById('step-3-payment');
    let step4Confirm = document.getElementById('step-4-confirm');
    
    // Fallback: si no se encuentran los elementos no hace nada
    if (!step1Summary || !step2Delivery || !step3Payment || !step4Confirm) return;

    if (step === 3) {
        // Validación de Delivery antes de pasar al método de pago
        let radioEntrega = document.querySelector('input[name="metodoEntrega"]:checked') as HTMLInputElement | null;
        let metodoEntrega = radioEntrega ? radioEntrega.value : 'Retiro';
        if (metodoEntrega === 'Delivery') {
            let dir = document.getElementById('direccionDelivery') as HTMLInputElement | null;
            if (dir && !dir.value.trim()) {
                alert("Por favor, ingresa tu dirección para el delivery antes de continuar.");
                appState.checkoutStep = 2; // Revertir estado
                actualizarStepperCheckout(2);
                return;
            }
        }
    }

    // Ocultar todos con animación (si se usa CSS para esto)
    (<HTMLElement>step1Summary).style.display = 'none';
    (<HTMLElement>step2Delivery).style.display = 'none';
    (<HTMLElement>step3Payment).style.display = 'none';
    (<HTMLElement>step4Confirm).style.display = 'none';

    if (step === 1) {
        (<HTMLElement>step1Summary).style.display = 'block';
    } else if (step === 2) {
        (<HTMLElement>step2Delivery).style.display = 'block';
    } else if (step === 3) {
        (<HTMLElement>step3Payment).style.display = 'block';
        
        let totalUsdEl3 = document.getElementById('totalUsdStep3');
        let totalBsEl3 = document.getElementById('totalBsStep3');
        if (totalUsdEl3) totalUsdEl3.innerText = document.getElementById('totalUsdModal')?.innerText || '';
        if (totalBsEl3) totalBsEl3.innerText = document.getElementById('totalBsModal')?.innerText || '';
    } else if (step === 4) {
        (<HTMLElement>step4Confirm).style.display = 'block';
        
        // Actualizar totales en la confirmación final por seguridad
        let totalUsdEl = document.getElementById('totalUsdModalFinal');
        let totalBsEl = document.getElementById('totalBsModalFinal');
        if (totalUsdEl) totalUsdEl.innerText = document.getElementById('totalUsdModal')?.innerText || '';
        if (totalBsEl) totalBsEl.innerText = document.getElementById('totalBsModal')?.innerText || '';
    }

    // Control responsive de la columna izquierda (ocultar solo en móvil para pasos 2, 3 y 4)
    let layout = document.querySelector('.premium-cart-layout');
    if (layout) {
        if (step > 1) {
            layout.classList.add('checkout-active');
        } else {
            layout.classList.remove('checkout-active');
        }
    }

    if (window.innerWidth <= 768) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Inicializar el contador visual del carrito cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    actualizarCartCount();
});

// Exponer funciones al scope global para que los botones en HTML funcionen
(window as any).guardarCarritoLS = guardarCarritoLS;
(window as any).calcularStockRestante = calcularStockRestante;
(window as any).tieneStockSuficiente = tieneStockSuficiente;
(window as any).mostrarToastError = mostrarToastError;
(window as any).animarAlCarrito = animarAlCarrito;
(window as any).animarContadorCarrito = animarContadorCarrito;
(window as any).agregarAlCarrito = agregarAlCarrito;
(window as any).cerrarCrossSell = cerrarCrossSell;
(window as any).actualizarCartCount = actualizarCartCount;
(window as any).vaciarCarrito = vaciarCarrito;
(window as any).abrirCarrito = abrirCarrito;
(window as any).repetirPedido = repetirPedido;
(window as any).renderizarCarrito = renderizarCarrito;
(window as any).cambiarCant = cambiarCant;
(window as any).toggleDireccion = toggleDireccion;
(window as any).obtenerUbicacion = obtenerUbicacion;
(window as any).abrirMapa = abrirMapa;
(window as any).actualizarMetodoPago = actualizarMetodoPago;
(window as any).calcularVuelto = calcularVuelto;
(window as any).enviarPedido = enviarPedido;
(window as any).agregarAlCarritoB64 = agregarAlCarritoB64;
(window as any).cambiarCantB64 = cambiarCantB64;
(window as any).setCheckoutStep = setCheckoutStep;
(window as any).actualizarStepperCheckout = actualizarStepperCheckout;
(window as any).renderizarSugerenciasRapidasCarrito = renderizarSugerenciasRapidasCarrito;
