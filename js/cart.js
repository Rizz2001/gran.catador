/**
 * cart.js - Lógica del carrito de compras y checkout
 */

/** Guarda el estado actual del carrito en LocalStorage */
function guardarCarritoLS() { 
    localStorage.setItem('gc_cart', JSON.stringify(appState.carrito)); 
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
    let nombreFinal = esCaja ? `${nombre} (CAJA)` : `${nombre} (UNIDAD)`;
    
    // Buscar el código para guardar la imagen en el carrito
    let prodObj = appState.inventario.find(x => x.Nombre === nombre);
    
    if (appState.carrito[nombreFinal]) {
        appState.carrito[nombreFinal].cantidad++; 
    } else {
        appState.carrito[nombreFinal] = { 
            precio: precio, 
            cantidad: 1, 
            codigo: prodObj ? prodObj.codigo : '' 
        };
    }
    
    guardarCarritoLS(); 
    actualizarCartCount(); 
    
    if (btnElement && imgSrc) {
        animarAlCarrito(btnElement, imgSrc);
    }
    
    // Cambio visual de confirmación en el botón
    if (btnElement) { 
        let iconoOriginal = btnElement.innerHTML; 
        btnElement.innerHTML = '<i class="fa-solid fa-check"></i>'; 
        btnElement.style.background = "#fff"; 
        btnElement.style.color = "var(--verde-btn)"; 
        
        setTimeout(() => { 
            btnElement.innerHTML = iconoOriginal; 
            btnElement.style.background = esCaja ? "var(--dorado)" : "var(--verde-btn)"; 
            btnElement.style.color = esCaja ? "black" : "#fff"; 
        }, 500); 
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
    
    if (appState.codigosRecomendados.length > 0) { 
        sugerencias = appState.inventario.filter(p => appState.codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3); 
    } else { 
        sugerencias = appState.inventario.filter(p => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3); 
    }
    
    if (sugerencias.length > 0) { 
        let cont = document.getElementById('cross-sell-items'); 
        cont.innerHTML = sugerencias.map(p => {
            let nombreB64 = codificarNombre(p.Nombre); 
            return `
                <div style="min-width:130px; border:1px solid var(--color-border); border-radius:var(--radius-md); padding:12px; text-align:center; background:var(--color-card); box-shadow:var(--shadow-sm);">
                    <img src="assets/img/${p.codigo}/1.webp" data-codigo="${p.codigo}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)" style="height:60px; width:100%; object-fit:contain; margin-bottom:8px; mix-blend-mode:multiply;">
                    <p style="font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--color-text); font-family:'Inter',sans-serif;">${p.Nombre}</p>
                    <p style="font-size:15px; color:var(--color-text); font-weight:700; font-family:'Inter',sans-serif; margin-top:2px;">$${p.PrecioStr}</p>
                    <button onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, 'assets/img/${p.codigo}/1.webp', false); cerrarCrossSell();" style="background:var(--color-primary); color:white; border:none; padding:8px; border-radius:var(--radius-full); font-size:12px; font-weight:700; width:100%; margin-top:8px; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-plus"></i> Añadir</button>
                </div>`;
        }).join('');
        
        document.getElementById('modal-cross-sell').style.display = 'flex'; 
    }
}

function cerrarCrossSell() { 
    document.getElementById('modal-cross-sell').style.display = 'none'; 
}

function actualizarCartCount() { 
    let totalItems = 0; 
    for(let key in appState.carrito) {
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
        appState.carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad, codigo: i.codigo || '' }; 
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
            <div class="empty-cart-container">
                <i class="fa-solid fa-cart-shopping empty-cart-icon"></i>
                <h3 class="empty-cart-title">Tu carrito está vacío</h3>
                <p class="empty-cart-text">Agrega unas botellas para empezar.</p>
                <button onclick="cerrarModal('modal-cart', 'nav-home')" class="btn-enviar empty-cart-button">Ir a la tienda</button>
            </div>`; 
        document.getElementById('checkout-sections').style.display = 'none'; 
        return; 
    }
    
    document.getElementById('checkout-sections').style.display = 'block'; 
        
    let renderHTML = '';
    for (let nombre in appState.carrito) { 
        let nombreB64 = codificarNombre(nombre); 
        let item = appState.carrito[nombre]; 
        let subTotalItem = item.precio * item.cantidad; 
        appState.totalCarrito += subTotalItem; 
        
        let imgHTML = item.codigo 
            ? `<img src="assets/img/${item.codigo}/1.webp" data-codigo="${item.codigo}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)" class="cart-item-img">` 
            : `<div class="cart-item-img-placeholder"><i class="fa-solid fa-wine-bottle"></i></div>`;
            
        let btnMinus = item.cantidad > 1 ? '-' : '<i class="fa-solid fa-trash-can cart-btn-trash-icon"></i>';
        
        renderHTML += `
            <div class="cart-item">
                ${imgHTML}
                <div class="cart-item-info cart-item-info-container">
                    <p class="cart-item-title">${nombre}</p>
                    <p class="cart-item-price">$${item.precio.toFixed(2)} <span class="cart-item-price-bs">/ ${(item.precio * appState.tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs</span></p>
                </div>
                <div class="cart-controls"><button class="cart-btn" onclick="cambiarCantB64('${nombreB64}', -1)">${btnMinus}</button><span style="font-size:13px; font-weight:bold; width:15px; text-align:center;">${item.cantidad}</span><button class="cart-btn" onclick="cambiarCantB64('${nombreB64}', 1)">+</button></div>
            </div>`; 
    }
    
    // Insertamos todo el HTML generado de una sola vez para mejorar el rendimiento (Performance)
    lista.innerHTML = renderHTML;
    
    document.getElementById('totalUsdModal').innerText = `$${appState.totalCarrito.toFixed(2)}`; 
    document.getElementById('totalBsModal').innerText = `${(appState.totalCarrito * appState.tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; 
    calcularVuelto();
}

function cambiarCant(n, delta) { 
    appState.carrito[n].cantidad += delta; 
    if(appState.carrito[n].cantidad <= 0) {
        delete appState.carrito[n]; 
    }
    guardarCarritoLS(); 
    actualizarCartCount(); 
    renderizarCarrito(); 
}

function toggleDireccion() { 
    let met = document.querySelector('input[name="metodoEntrega"]:checked').value; 
    let dirInput = document.getElementById('direccionDelivery');
    let btnMap = document.getElementById('btnMap'); 
    
    if (met === 'Delivery') { 
        dirInput.style.display = 'block'; 
        btnMap.style.display = 'none'; 
        if (localStorage.getItem('gc_direccion') && !dirInput.value) {
            dirInput.value = localStorage.getItem('gc_direccion'); 
        }
    } else { 
        dirInput.style.display = 'none'; 
        btnMap.style.display = 'block'; 
    } 
}

function abrirMapa() { 
    window.open('https://maps.app.goo.gl/8w6P5j9K7hQ3mN2R9', '_blank'); 
} 

function actualizarMetodoPago() { 
    let val = document.getElementById('metodoPagoSelect').value; 
    document.getElementById('box-efectivo').style.display = (val === 'Efectivo') ? 'block' : 'none'; 
    
    let boxPm = document.getElementById('box-pagomovil'); 
    if(boxPm) boxPm.style.display = (val === 'Pago Movil') ? 'block' : 'none'; 
    
    let boxZ = document.getElementById('box-zelle'); 
    if(boxZ) boxZ.style.display = (val === 'Zelle') ? 'block' : 'none'; 
}

function calcularVuelto() { 
    let pago = parseFloat(document.getElementById('montoPago').value) || 0; 
    let res = document.getElementById('res-vuelto'); 
    
    if(pago > 0 && pago > appState.totalCarrito) { 
        let vUsd = pago - appState.totalCarrito; 
        let vBs = vUsd * appState.tasaOficial; 
        res.style.display = 'block'; 
        res.style.color = 'var(--verde-btn)'; 
        res.innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; 
    } else { 
        res.style.display = 'none'; 
    } 
}

/** Finaliza la compra y procesa el texto hacia WhatsApp */
function enviarPedido() { 
    if (Object.keys(appState.carrito).length === 0) return alert("Tu carrito está vacío."); 
    if (!appState.isTiendaAbierta) return alert("Lo sentimos, Gran Catador está cerrado en este momento."); 
    
    // Generar registro histórico del pedido
    let historial = JSON.parse(localStorage.getItem('gc_historial')) || []; 
    let fechaDate = new Date(); 
    let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'}); 
    
    let nuevoPedido = { 
        fecha: fechaStr, 
        total: appState.totalCarrito, 
        items: Object.keys(appState.carrito).map(k => ({ 
            nombre: k, 
            precio: appState.carrito[k].precio, 
            cantidad: appState.carrito[k].cantidad, 
            codigo: appState.carrito[k].codigo 
        })) 
    }; 
    
    historial.unshift(nuevoPedido); 
    if(historial.length > 5) historial.pop(); // Solo se guardan los últimos 5
    localStorage.setItem('gc_historial', JSON.stringify(historial)); 
    
    // Comienza la construcción del mensaje de WhatsApp
    let nombreUser = localStorage.getItem('gc_nombre') || 'un cliente nuevo'; 
    let msg = `🔥 *NUEVO PEDIDO - GRAN CATADOR* 🔥\n\n👤 *Cliente:* ${nombreUser}\n--------------------------------\n`; 
    
    for(let nombre in appState.carrito) { 
        msg += `▪ ${appState.carrito[nombre].cantidad}x ${nombre}\n`; 
    } 
    msg += `--------------------------------\n`; 
    
    let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value; 
    msg += `📦 *Entrega:* ${entrega}\n`; 
    
    if (entrega === 'Delivery') { 
        let dir = document.getElementById('direccionDelivery').value.trim(); 
        if(!dir) return alert("Por favor, ingresa tu dirección para el delivery."); 
        msg += `📍 *Dirección:* ${dir}\n`; 
        if(!localStorage.getItem('gc_direccion')) localStorage.setItem('gc_direccion', dir); 
    } 
    
    let notas = document.getElementById('notasPedido').value.trim(); 
    if (notas) msg += `📝 *Notas:* ${notas}\n`; 
    
    let metodo = document.getElementById('metodoPagoSelect').value; 
    msg += `💳 *Método de Pago:* ${metodo}\n`; 
    
    if (metodo === 'Efectivo') { 
        let pago = parseFloat(document.getElementById('montoPago').value) || 0; 
        if (pago > appState.totalCarrito) { 
            msg += `💵 _Paga con $${pago.toFixed(2)}_\n🟢 _Requiere vuelto: $${(pago - appState.totalCarrito).toFixed(2)}_\n`; 
        } 
    } else { 
        msg += `📎 _[Capture adjunto en el siguiente mensaje]_\n`; 
    } 
    
    msg += `\n💰 *TOTAL A PAGAR: $${appState.totalCarrito.toFixed(2)}*\n💱 _(Tasa BCV: ${appState.tasaOficial.toFixed(2)} Bs)_`; 
    
    // Limpieza post-compra
    localStorage.removeItem('gc_inv_time_v3'); 
    appState.carrito = {}; 
    guardarCarritoLS(); 
    actualizarCartCount(); 
    cerrarModal('modal-cart', 'nav-home'); 
    
    window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank'); 
}

/** Helpers para base64 que se enlazan desde HTML de forma segura */
function agregarAlCarritoB64(b64, p, btn, c = false, img = '', esCaja = false) { 
    agregarAlCarrito(decodificarNombre(b64), p, btn, c, img, esCaja); 
}

function cambiarCantB64(b64, d) { 
    cambiarCant(decodificarNombre(b64), d); 
}