/**
 * cart.js - Lógica del carrito de compras y checkout
 */

/** Guarda el estado actual del carrito en LocalStorage */
function guardarCarritoLS() {
    localStorage.setItem('gc_cart', JSON.stringify(appState.carrito));
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE STOCK INTELIGENTE
// Calcula el stock real restante descontando lo que ya está en el carrito.
// Combina unidades sueltas y cajas para un control preciso.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula el stock real restante para un producto, descontando
 * las unidades y cajas que ya están en el carrito.
 * @param {string} nombreBase - Nombre del producto SIN sufijo (UNIDAD/CAJA).
 * @returns {{ prodObj: Object|null, stockDisponible: number, unidadesEnCarrito: number, unidadesRestantes: number, unidadesPorCaja: number }}
 */
function calcularStockRestante(nombreBase) {
    const prodObj = appState.inventario.find(x => x.Nombre === nombreBase);

    if (!prodObj) {
        return { prodObj: null, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja: 12 };
    }

    const stockDisponible = prodObj.StockNum;
    const unidadesPorCaja = prodObj.CantidadGrup > 0 ? prodObj.CantidadGrup : 12;

    // Stock ilimitado: devolver directamente sin calcular carrito
    if (stockDisponible >= 999) {
        return { prodObj, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja };
    }

    const cantUnidades = appState.carrito[`${nombreBase} (UNIDAD)`]?.cantidad || 0;
    const cantCajas = appState.carrito[`${nombreBase} (CAJA)`]?.cantidad || 0;
    const unidadesEnCarrito = cantUnidades + (cantCajas * unidadesPorCaja);
    const unidadesRestantes = Math.max(0, stockDisponible - unidadesEnCarrito);

    return { prodObj, stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja };
}

/**
 * Valida si hay stock suficiente para agregar un producto (unidad o caja).
 * Muestra un mensaje claro y contextual si no se puede agregar.
 * @param {string} nombreBase - Nombre base del producto (sin sufijo).
 * @param {boolean} esCaja - True si se intenta agregar una caja completa.
 * @returns {boolean}
 */
function tieneStockSuficiente(nombreBase, esCaja) {
    const { prodObj, stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja } =
        calcularStockRestante(nombreBase);

    if (!prodObj) return true; // Failsafe
    if (stockDisponible >= 999) return true; // Stock ilimitado

    const unidadesPorAgregar = esCaja ? unidadesPorCaja : 1;

    if (unidadesRestantes <= 0) {
        // Ya se agotó todo el stock disponible
        mostrarToastError(
            `🚫 Límite de stock alcanzado`,
            `Solo hay <b>${stockDisponible}</b> unidad${stockDisponible !== 1 ? 'es' : ''} y ya las tienes todas en el carrito.`
        );
        return false;
    }

    if (unidadesPorAgregar > unidadesRestantes) {
        if (esCaja) {
            // No alcanza el stock para una caja completa
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
function mostrarToastError(titulo, detalle) {
    const cont = document.getElementById('toast-container');
    if (!cont) { mostrarToast(titulo); return; }

    // Eliminar toasts de error anteriores para no apilarlos
    const prev = cont.querySelector('.toast-error');
    if (prev) prev.remove();

    const t = document.createElement('div');
    t.className = 'toast toast-error';
    t.style.cssText = [
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

/** Anima un producto volando hacia el icono del carrito flotante */
function animarAlCarrito(btnElement, imgSrc) {
    if (!btnElement || !imgSrc) return;

    // Buscar el icono del carrito activo (header en PC, nav en móvil)
    let cartIcon = document.querySelector('.header-right .icon-btn[aria-label="Carrito"]');
    const navCart = document.getElementById('nav-cart');
    const bottomNav = document.querySelector('.bottom-nav');

    if (navCart && bottomNav && getComputedStyle(bottomNav).display !== 'none') {
        cartIcon = navCart;
    }

    if (!cartIcon) return;

    const btnRect = btnElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();
    const flyingImg = document.createElement('img');

    flyingImg.src = imgSrc;
    flyingImg.className = 'flying-img';
    flyingImg.style.left = `${btnRect.left}px`;
    flyingImg.style.top = `${btnRect.top}px`;
    document.body.appendChild(flyingImg);

    setTimeout(() => {
        flyingImg.style.left = `${cartRect.left + (cartRect.width / 2) - 7.5}px`;
        flyingImg.style.top = `${cartRect.top + (cartRect.height / 2) - 7.5}px`;
        flyingImg.style.width = '15px';
        flyingImg.style.height = '15px';
        flyingImg.style.opacity = '0.3';
    }, 10);

    setTimeout(() => {
        flyingImg.remove();
        cartIcon.style.transform = 'scale(1.2)';
        setTimeout(() => cartIcon.style.transform = 'scale(1)', 200);
    }, 600);
}

/** Añade un producto al estado del carrito y lanza efectos visuales */
function agregarAlCarrito(nombre, precio, btnElement, isCross = false, imgSrc = '', esCaja = false) {
    // --- VALIDACIÓN DE STOCK ---
    if (!tieneStockSuficiente(nombre, esCaja)) {
        return; // Detener si no hay stock
    }
    // --- FIN VALIDACIÓN ---

    let nombreFinal = esCaja ? `${nombre} (CAJA)` : `${nombre} (UNIDAD)`;

    // Buscar el código para guardar la imagen en el carrito
    let prodObj = appState.inventario.find(x => x.Nombre === nombre);

    if (appState.carrito[nombreFinal]) {
        appState.carrito[nombreFinal].cantidad++;
    } else {
        appState.carrito[nombreFinal] = {
            precio: precio,
            cantidad: 1,
            codigo: prodObj ? prodObj.codigo : '',
            categoria: prodObj ? prodObj.Cat : ''
        };
    }

    guardarCarritoLS();
    actualizarCartCount();

    // Haptic Feedback (Vibración nativa en móviles compatibles)
    if (typeof navigator !== 'undefined' && navigator.vibrate) { navigator.vibrate(50); }

    if (btnElement && imgSrc) {
        animarAlCarrito(btnElement, imgSrc);
    }

    // Cambio visual de confirmación en el botón
    if (btnElement) {
        let iconoOriginal = btnElement.innerHTML;
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i>';
        btnElement.style.background = "#fff";
        btnElement.style.color = "var(--verde-btn)";

        // --- NUEVO: Texto flotante "¡Agregado al carrito!" debajo del botón ---
        let parent = btnElement.parentElement;
        parent.style.position = 'relative'; // Convertir al padre en el punto de anclaje

        // Limpiar mensaje anterior si el usuario hace clics muy rápidos
        let oldMsg = parent.querySelector('.cart-msg-toast');
        if (oldMsg) oldMsg.remove();

        let msgConf = document.createElement('div');
        msgConf.className = 'cart-msg-toast';
        msgConf.innerText = "¡Agregado al carrito!";
        msgConf.style.position = 'absolute';
        msgConf.style.background = 'var(--color-success, #10B981)';
        msgConf.style.color = 'white';
        msgConf.style.fontSize = '10px';
        msgConf.style.fontWeight = '700';
        msgConf.style.padding = '4px 8px';
        msgConf.style.borderRadius = '6px';
        msgConf.style.whiteSpace = 'nowrap';
        msgConf.style.pointerEvents = 'none'; // Para que no bloquee clics accidentales
        msgConf.style.zIndex = '100';
        msgConf.style.opacity = '0';
        msgConf.style.transform = 'translateY(-5px)';
        msgConf.style.transition = 'all 0.3s ease';
        msgConf.style.boxShadow = 'var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.1))';

        // Posicionamiento dinámico: A la derecha y justo debajo del botón
        msgConf.style.right = '0';
        msgConf.style.top = (btnElement.offsetTop + btnElement.offsetHeight + 6) + 'px';

        parent.appendChild(msgConf);

        // Desencadenar animación de entrada fluida
        requestAnimationFrame(() => {
            msgConf.style.opacity = '1';
            msgConf.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            btnElement.innerHTML = iconoOriginal;
            btnElement.style.background = esCaja ? "var(--dorado)" : "var(--verde-btn)";
            btnElement.style.color = esCaja ? "black" : "#fff";
        }, 500);

        // Desaparecer y remover del código luego de 2 segundos
        setTimeout(() => {
            msgConf.style.opacity = '0';
            msgConf.style.transform = 'translateY(-5px)';
            setTimeout(() => msgConf.remove(), 300);
        }, 2000);
    }

    // Lógica de Cross-Selling (Sugerencias Automáticas)
    if (!isCross && !esCaja && prodObj) {
        let catMayus = (prodObj.Cat || '').toUpperCase();
        let activadoresCrossSell = ["RON", "WHISKY", "VODKA", "GINEBRA", "LICOR", "TEQUILA"];
        if (activadoresCrossSell.some(keyword => catMayus.includes(keyword))) {
            sugerirAcompañante();
        }
    }
}

/** Muestra modal con sugerencias complementarias (Cross-Sell) */
function sugerirAcompañante() {
    let sugerencias = [];

    if (appState.codigosRecomendados && appState.codigosRecomendados.length > 0) {
        sugerencias = (appState.inventario || []).filter(p => appState.codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3);
    } else {
        sugerencias = (appState.inventario || []).filter(p => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3);
    }

    if (sugerencias.length > 0) {
        let cont = document.getElementById('cross-sell-items');
        let modal = document.getElementById('modal-cross-sell');

        if (cont && modal) {
            cont.innerHTML = sugerencias.map(p => {
                let nombreB64 = codificarNombre(p.Nombre);
                let imgSrc = obtenerImgProducto(p);
                let attempts = p.ImagenUrl ? 0 : 1;
                return `
                    <div style="min-width:130px; border:1px solid var(--color-border); border-radius:var(--radius-md); padding:12px; text-align:center; background:var(--color-card); box-shadow:var(--shadow-sm);">
                        <img loading="lazy" src="${imgSrc}" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" style="height:60px; width:100%; object-fit:contain; margin-bottom:8px; mix-blend-mode:multiply;">
                        <p style="font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--color-text); font-family:'Inter',sans-serif;">${p.Nombre}</p>
                        <p style="font-size:15px; color:var(--color-text); font-weight:700; font-family:'Inter',sans-serif; margin-top:2px;">$${p.PrecioStr}</p>
                        <button onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, '${imgSrc}', false); cerrarCrossSell();" style="background:var(--color-primary); color:white; border:none; padding:8px; border-radius:var(--radius-full); font-size:12px; font-weight:700; width:100%; margin-top:8px; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-plus"></i> Añadir</button>
                    </div>`;
            }).join('');

            modal.style.display = 'flex';
        }
    }
}

function cerrarCrossSell() {
    let modal = document.getElementById('modal-cross-sell');
    if (modal) modal.style.display = 'none';
}

function actualizarCartCount() {
    let totalItems = 0;
    for (let key in appState.carrito) {
        totalItems += appState.carrito[key].cantidad;
    }
    document.getElementById('cart-count').innerText = totalItems;
}

function vaciarCarrito() {
    if (confirm("¿Estás seguro de vaciar tu pedido?")) {
        appState.carrito = {};
        guardarCarritoLS();
        actualizarCartCount();
        cerrarModal('modal-cart', 'nav-home');
        mostrarToast("Pedido vaciado");
    }
}

function abrirCarrito() {
    cerrarModal('all');
    setActiveNav('nav-cart');
    document.getElementById('modal-cart').style.display = 'flex';
    renderizarCarrito();
}

function repetirPedido(index) {
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || [];
    let ped = hist[index];
    if (!ped) return;

    appState.carrito = {};
    ped.items.forEach(i => {
        appState.carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad, codigo: i.codigo || '', categoria: i.categoria || '' };
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
    appState.totalCarrito = 0;

    if (Object.keys(appState.carrito).length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center;">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.15; margin-bottom: 15px;">
                    <path d="M8 16.0001H16M12 12.0001V20.0001M4.91355 4.08203L5.0291 3.55703C5.25375 2.64533 6.05952 2.00005 7.0001 2.00005H17.0001C17.9407 2.00005 18.7465 2.64533 18.9711 3.55703L20.0001 8.00006M4.91355 4.08203L4.50006 6.00006C3.42598 6.00006 2.53003 6.89591 2.53003 8.00006V17.0001C2.53003 18.1046 3.42598 19.0001 4.53003 19.0001H19.4701C20.5742 19.0001 21.4701 18.1046 21.4701 17.0001V8.00006C21.4701 6.89591 20.5742 6.00006 19.5001 6.00006L19.0865 4.08203" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="var(--color-text)"/>
                </svg>
                <h3 style="color: var(--color-text); font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">Añade un Producto</h3>
                <p style="font-size: 14px; margin-top: 8px; line-height: 1.5;">Agrega botellas.</p>
                <button onclick="cerrarModal('modal-cart', 'nav-home')" class="btn-enviar" style="width: auto; padding: 12px 30px; margin-top: 25px; border-radius: var(--radius-full);">Explorar Catálogo</button>
            </div>`;
        document.getElementById('checkout-sections').style.display = 'none';
        return;
    }

    document.getElementById('checkout-sections').style.display = 'block';

    let renderHTML = '';
    for (let nombre in appState.carrito) {
        let nombreB64 = codificarNombre(nombre);
        let item = appState.carrito[nombre];
        let subTotalItem = parseFloat((item.precio * item.cantidad).toFixed(2));
        appState.totalCarrito += subTotalItem;

        let prodObj = appState.inventario.find(x => x.codigo === item.codigo);
        let imgSrc = obtenerImgProducto(prodObj || { codigo: item.codigo });
        let attempts = (prodObj && prodObj.ImagenUrl) ? 0 : 1;
        let imgHTML = item.codigo
            ? `<img loading="lazy" src="${imgSrc}" data-codigo="${item.codigo}" data-categoria="${item.categoria || ''}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" class="cart-item-img">`
            : `<div class="cart-item-img-placeholder"><i class="fa-solid fa-wine-bottle"></i></div>`;

        let btnMinus = item.cantidad > 1
            ? '<i class="fa-solid fa-minus"></i>'
            : '<i class="fa-solid fa-trash-can" style="color: var(--color-danger);"></i>';

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
                ${imgHTML}
                <div class="cart-item-info cart-item-info-container">
                    <p class="cart-item-title">${nombre}</p>
                    <p class="cart-item-price">$${item.precio.toFixed(2)} <span class="cart-item-price-bs">/ ${(item.precio * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span></p>
                    ${stockBadge}
                </div>
                <div class="cart-controls">
                    <button type="button" class="cart-btn" onclick="cambiarCantB64('${nombreB64}', -1)">${btnMinus}</button>
                    <span style="font-size:13px; font-weight:800; width:18px; text-align:center;">${item.cantidad}</span>
                    <button type="button" ${btnSumarAttrs}><i class="fa-solid ${bloquearSumar ? 'fa-lock' : 'fa-plus'}"></i></button>
                </div>
            </div>`;
    }

    lista.innerHTML = renderHTML;

    appState.totalCarrito = parseFloat(appState.totalCarrito.toFixed(2));
    document.getElementById('totalUsdModal').innerText = `$${appState.totalCarrito.toFixed(2)}`;
    document.getElementById('totalBsModal').innerText = `${(appState.totalCarrito * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
    calcularVuelto();
}

function cambiarCant(n, delta) {
    if (delta > 0) {
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
    }
    guardarCarritoLS();
    actualizarCartCount();
    renderizarCarrito();
}

function toggleDireccion() {
    let met = document.querySelector('input[name="metodoEntrega"]:checked').value;
    let dirInput = document.getElementById('direccionDelivery');
    let btnGeo = document.getElementById('btn-geo');
    let btnMap = document.getElementById('btnMap');

    if (met === 'Delivery') {
        dirInput.style.display = 'block';
        if (btnGeo) btnGeo.style.display = 'block';
        btnMap.style.display = 'none';
        if (localStorage.getItem('gc_direccion') && !dirInput.value) {
            dirInput.value = localStorage.getItem('gc_direccion');
        }
    } else {
        dirInput.style.display = 'none';
        if (btnGeo) btnGeo.style.display = 'none';
        btnMap.style.display = 'block';
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
            let input = document.getElementById(inputId);
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
    let selectElem = document.getElementById('metodoPagoSelect');
    let radioElem = document.querySelector('input[name="metodoPago"]:checked');
    let val = radioElem ? radioElem.value : (selectElem ? selectElem.value : 'Efectivo');

    let boxE = document.getElementById('box-efectivo');
    if (boxE) boxE.style.display = (val === 'Efectivo') ? 'block' : 'none';

    let boxPm = document.getElementById('box-pagomovil');
    if (boxPm) boxPm.style.display = (val === 'Pago Movil' || val === 'PagoMovil') ? 'block' : 'none';

    let boxZ = document.getElementById('box-zelle');
    if (boxZ) boxZ.style.display = (val === 'Zelle') ? 'block' : 'none';
}

function calcularVuelto() {
    let pago = parseFloat(document.getElementById('montoPago').value) || 0;
    let res = document.getElementById('res-vuelto');

    if (pago > 0 && pago > appState.totalCarrito) {
        let vUsd = parseFloat((pago - appState.totalCarrito).toFixed(2));
        let vBs = parseFloat((vUsd * appState.tasaOficial).toFixed(2));
        res.style.display = 'block';
        res.style.color = 'var(--verde-btn)';
        res.innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
    } else {
        res.style.display = 'none';
    }
}

/** Finaliza la compra y procesa el texto hacia WhatsApp */
function enviarPedido() {
    if (Object.keys(appState.carrito).length === 0) return alert("Tu carrito está vacío.");
    if (!appState.isTiendaAbierta) return alert("Lo sentimos, Gran Catador está cerrado en este momento.");

    // Validación de datos de perfil obligatorios
    let nombreUser = (localStorage.getItem('gc_nombre') || '').trim();
    let cedulaUser = (localStorage.getItem('gc_cedula') || '').trim();
    let telefonoUser = (localStorage.getItem('gc_telefono') || '').trim();

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
    let historial = JSON.parse(localStorage.getItem('gc_historial')) || [];
    let fechaDate = new Date();
    let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    let nuevoPedido = {
        fecha: fechaStr,
        total: appState.totalCarrito,
        items: Object.keys(appState.carrito).map(k => ({
            nombre: k,
            precio: appState.carrito[k].precio,
            cantidad: appState.carrito[k].cantidad,
            codigo: appState.carrito[k].codigo,
            categoria: appState.carrito[k].categoria
        }))
    };

    historial.unshift(nuevoPedido);
    if (historial.length > 5) historial.pop(); // Solo se guardan los últimos 5
    localStorage.setItem('gc_historial', JSON.stringify(historial));

    // Comienza la construcción del mensaje de WhatsApp
    let msg = `🔥 *NUEVO PEDIDO - GRAN CATADOR* 🔥\n\n👤 *Cliente:* ${nombreUser}\n🪪 *Cédula:* ${cedulaUser}\n📱 *Teléfono:* ${telefonoUser}\n--------------------------------\n`;

    for (let nombre in appState.carrito) {
        let iconoProducto = nombre.includes('(CAJA)') ? '📦' : '🍾';
        msg += `${iconoProducto} ${appState.carrito[nombre].cantidad}x *${nombre}*\n`;
    }
    msg += `--------------------------------\n`;

    let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value;
    msg += `📦 *Entrega:* ${entrega}\n`;

    if (entrega === 'Delivery') {
        let dir = document.getElementById('direccionDelivery').value.trim();
        if (!dir) return alert("Por favor, ingresa tu dirección para el delivery.");
        msg += `📍 *Dirección:* ${dir}\n`;
        if (!localStorage.getItem('gc_direccion')) localStorage.setItem('gc_direccion', dir);
    }

    let notas = document.getElementById('notasPedido').value.trim();
    if (notas) msg += `📝 *Notas:* ${notas}\n`;

    let selectMetodo = document.getElementById('metodoPagoSelect');
    let radioMetodo = document.querySelector('input[name="metodoPago"]:checked');
    let metodo = radioMetodo ? radioMetodo.value : (selectMetodo ? selectMetodo.value : 'Efectivo');
    msg += `💳 *Método de Pago:* ${metodo}\n`;

    if (metodo === 'Efectivo') {
        let pago = parseFloat(document.getElementById('montoPago').value) || 0;
        if (pago > appState.totalCarrito) {
            msg += `💵 _Paga con $${pago.toFixed(2)}_\n🟢 _Requiere vuelto: $${(pago - appState.totalCarrito).toFixed(2)}_\n`;
        }
    } else {
        if (metodo === 'Pago Movil' || metodo === 'PagoMovil') {
            let refPm = document.getElementById('refPagoMovil') ? document.getElementById('refPagoMovil').value.trim() : '';
            if (refPm) msg += `🧾 *Referencia:* ${refPm}\n`;
        } else if (metodo === 'Zelle') {
            let refZelle = document.getElementById('refZelle') ? document.getElementById('refZelle').value.trim() : '';
            if (refZelle) msg += `👤 *Titular Zelle:* ${refZelle}\n`;
        }

        msg += `📎 _[Capture adjunto en el siguiente mensaje]_\n`;
    }

    msg += `\n💰 *TOTAL A PAGAR: $${appState.totalCarrito.toFixed(2)}*\n💱 _(Tasa BCV: ${appState.tasaOficial.toFixed(2)} Bs)_`;

    // Limpieza post-compra
    localStorage.removeItem('gc_inv_time_v3');
    appState.carrito = {};
    guardarCarritoLS();
    actualizarCartCount();

    // Feedback visual en el botón antes de redirigir
    let btnEnviar = document.getElementById('btn-whatsapp');
    let originalHTML = btnEnviar.innerHTML;
    btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando WhatsApp...';
    btnEnviar.classList.add('disabled');
    btnEnviar.disabled = true;

    setTimeout(() => {
        window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank');
        cerrarModal('modal-cart', 'nav-home');
        btnEnviar.innerHTML = originalHTML;
        btnEnviar.classList.remove('disabled');
        btnEnviar.disabled = false;
    }, 800);
}

/** Helpers para base64 que se enlazan desde HTML de forma segura */
function agregarAlCarritoB64(b64, p, btn, c = false, img = '', esCaja = false) {
    agregarAlCarrito(decodificarNombre(b64), p, btn, c, img, esCaja);
}

function cambiarCantB64(b64, d) {
    cambiarCant(decodificarNombre(b64), d);
}