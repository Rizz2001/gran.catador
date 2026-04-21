/**
 * cart.js - Lógica del carrito de compras y checkout
 */

function guardarCarritoLS() { localStorage.setItem('gc_cart', JSON.stringify(appState.carrito)); }

function animarAlCarrito(btnElement, imgSrc) {
    if(!btnElement || !imgSrc) return; const cartIcon = document.getElementById('icono-carrito-flotante'); if(!cartIcon) return;
    const btnRect = btnElement.getBoundingClientRect(); const cartRect = cartIcon.getBoundingClientRect(); const flyingImg = document.createElement('img');
    flyingImg.src = imgSrc; flyingImg.className = 'flying-img'; flyingImg.style.left = `${btnRect.left}px`; flyingImg.style.top = `${btnRect.top}px`; document.body.appendChild(flyingImg);
    setTimeout(() => { flyingImg.style.left = `${cartRect.left + 15}px`; flyingImg.style.top = `${cartRect.top + 15}px`; flyingImg.style.width = '15px'; flyingImg.style.height = '15px'; flyingImg.style.opacity = '0.3'; }, 10);
    setTimeout(() => { flyingImg.remove(); cartIcon.style.transform = 'scale(1.2) rotate(-10deg)'; setTimeout(() => cartIcon.style.transform = 'scale(1) rotate(0)', 200); }, 600);
}

function agregarAlCarrito(nombre, precio, btnElement, isCross = false, imgSrc = '', esCaja = false) {
    let nombreFinal = esCaja ? `${nombre} (CAJA)` : `${nombre} (UNIDAD)`;
    
    // Buscar el código para guardar la imagen en el carrito
    let prodObj = appState.inventario.find(x => x.Nombre === nombre);
    if(appState.carrito[nombreFinal]) appState.carrito[nombreFinal].cantidad++; else appState.carrito[nombreFinal] = { precio: precio, cantidad: 1, codigo: prodObj ? prodObj.codigo : '' }; 
    guardarCarritoLS(); actualizarCartCount(); 
    
    if(btnElement && imgSrc) animarAlCarrito(btnElement, imgSrc);
    if(btnElement) { let iconoOriginal = btnElement.innerHTML; btnElement.innerHTML = '<i class="fa-solid fa-check"></i>'; btnElement.style.background = "#fff"; btnElement.style.color = "var(--verde-btn)"; setTimeout(() => { btnElement.innerHTML = iconoOriginal; btnElement.style.background = esCaja ? "var(--dorado)" : "var(--verde-btn)"; btnElement.style.color = esCaja ? "black" : "#fff"; }, 500); }
    
    if(!isCross && !esCaja) { let prod = appState.inventario.find(x => x.Nombre === nombre); if(prod) { let c = prod.Cat.toUpperCase(); if(c.includes("RON") || c.includes("WHISKY") || c.includes("VODKA") || c.includes("GINEBRA") || c.includes("LICOR") || c.includes("TEQUILA")) { sugerirAcompañante(); } } }
}

function sugerirAcompañante() {
    let sugerencias = [];
    if(appState.codigosRecomendados.length > 0) { sugerencias = appState.inventario.filter(p => appState.codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3); } else { sugerencias = appState.inventario.filter(p => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3); }
    if(sugerencias.length > 0) { let cont = document.getElementById('cross-sell-items'); cont.innerHTML = ''; sugerencias.forEach(p => { let nombreB64 = codificarNombre(p.Nombre); 
        cont.innerHTML += `<div style="min-width:110px; border:1px solid var(--borde-color); border-radius:12px; padding:10px; text-align:center; background:var(--item-bg);"><img src="assets/img/${p.codigo}.webp" onerror="imgFallback(this, '${p.codigo}')" style="height:55px; object-fit:contain; margin-bottom:5px;"><p style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--texto-oscuro);">${p.Nombre}</p><p style="font-size:13px; color:var(--dorado); font-weight:bold;">$${p.PrecioStr}</p><p style="font-size:10px; color:var(--texto-claro); margin-top:-2px;">${p.PrecioBsStr} Bs</p><button onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, 'assets/img/${p.codigo}.webp', false); cerrarCrossSell();" style="background:var(--verde-btn); color:white; border:none; padding:8px; border-radius:8px; font-size:11px; font-weight:bold; width:100%; margin-top:5px; cursor:pointer;"><i class="fa-solid fa-plus"></i> Añadir</button></div>`; }); document.getElementById('modal-cross-sell').style.display = 'flex'; }
}

function cerrarCrossSell() { document.getElementById('modal-cross-sell').style.display = 'none'; }
function actualizarCartCount() { let t = 0; for(let k in appState.carrito) t += appState.carrito[k].cantidad; document.getElementById('cart-count').innerText = t; }
function vaciarCarrito() { if(confirm("¿Estás seguro de vaciar tu pedido?")) { appState.carrito = {}; guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-cart', 'nav-home'); mostrarToast("Pedido vaciado"); } }
function abrirCarrito() { cerrarModal('all'); setActiveNav('nav-cart'); document.getElementById('modal-cart').style.display = 'flex'; renderizarCarrito(); }
function repetirPedido(index) { let hist = JSON.parse(localStorage.getItem('gc_historial')) || []; let ped = hist[index]; if(!ped) return; appState.carrito = {}; ped.items.forEach(i => { appState.carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad, codigo: i.codigo || '' }; }); guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-perfil', 'nav-home'); abrirCarrito(); mostrarToast("Pedido cargado"); }

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito'); lista.innerHTML = ''; appState.totalCarrito = 0;
    if(Object.keys(appState.carrito).length === 0) { lista.innerHTML = `<div style="text-align: center; padding: 50px 20px; color: var(--texto-claro);"><i class="fa-solid fa-cart-shopping" style="font-size: 60px; opacity: 0.2; margin-bottom: 20px;"></i><h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">Tu carrito está vacío</h3><p style="font-size: 13px; margin-top: 5px;">Agrega unas botellas para empezar.</p><button onclick="cerrarModal('modal-cart', 'nav-home')" class="btn-enviar" style="width: auto; padding: 10px 25px; margin-top: 20px; display: inline-block;">Ir a la tienda</button></div>`; document.getElementById('checkout-sections').style.display = 'none'; return; }
    document.getElementById('checkout-sections').style.display = 'block'; 
    for(let nombre in appState.carrito) { 
        let nombreB64 = codificarNombre(nombre); let item = appState.carrito[nombre]; let sub = item.precio * item.cantidad; appState.totalCarrito += sub; 
        
        let imgHTML = item.codigo ? `<img src="assets/img/${item.codigo}.webp" onerror="imgFallback(this, '${item.codigo}')" style="width:45px; height:45px; object-fit:contain; border-radius:8px; background:var(--fondo);">` : `<div style="width:45px; height:45px; background:var(--fondo); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--texto-claro);"><i class="fa-solid fa-wine-bottle"></i></div>`;
        let btnMinus = item.cantidad > 1 ? '-' : '<i class="fa-solid fa-trash-can" style="color:#ea4335; font-size:12px;"></i>';
        
        lista.innerHTML += `<div class="cart-item">${imgHTML}<div class="cart-item-info" style="margin-left:12px;"><p class="cart-item-title">${nombre}</p><p class="cart-item-price">$${item.precio.toFixed(2)} <span style="font-size:11px; color:var(--texto-claro); font-weight:normal;">/ ${(item.precio * appState.tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs</span></p></div><div class="cart-controls"><button class="cart-btn" onclick="cambiarCantB64('${nombreB64}', -1)">${btnMinus}</button><span style="font-size:13px; font-weight:bold; width:15px; text-align:center;">${item.cantidad}</span><button class="cart-btn" onclick="cambiarCantB64('${nombreB64}', 1)">+</button></div></div>`; 
    }
    document.getElementById('totalUsdModal').innerText = `$${appState.totalCarrito.toFixed(2)}`; document.getElementById('totalBsModal').innerText = `${(appState.totalCarrito * appState.tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; calcularVuelto();
}

function cambiarCant(n, delta) { appState.carrito[n].cantidad += delta; if(appState.carrito[n].cantidad <= 0) delete appState.carrito[n]; guardarCarritoLS(); actualizarCartCount(); renderizarCarrito(); }
function toggleDireccion() { let met = document.querySelector('input[name="metodoEntrega"]:checked').value; let dirInput = document.getElementById('direccionDelivery'), btnMap = document.getElementById('btnMap'); if(met === 'Delivery') { dirInput.style.display = 'block'; btnMap.style.display = 'none'; if(localStorage.getItem('gc_direccion') && !dirInput.value) dirInput.value = localStorage.getItem('gc_direccion'); } else { dirInput.style.display = 'none'; btnMap.style.display = 'block'; } }
function abrirMapa() { window.open('https://maps.app.goo.gl/8w6P5j9K7hQ3mN2R9', '_blank'); } 
function actualizarMetodoPago() { let val = document.getElementById('metodoPagoSelect').value; document.getElementById('box-efectivo').style.display = (val === 'Efectivo') ? 'block' : 'none'; let boxPm = document.getElementById('box-pagomovil'); if(boxPm) boxPm.style.display = (val === 'Pago Movil') ? 'block' : 'none'; let boxZ = document.getElementById('box-zelle'); if(boxZ) boxZ.style.display = (val === 'Zelle') ? 'block' : 'none'; }
function calcularVuelto() { let pago = parseFloat(document.getElementById('montoPago').value) || 0; let res = document.getElementById('res-vuelto'); if(pago > 0 && pago > appState.totalCarrito) { let vUsd = pago - appState.totalCarrito; let vBs = vUsd * appState.tasaOficial; res.style.display = 'block'; res.style.color = 'var(--verde-btn)'; res.innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; } else { res.style.display = 'none'; } }

function enviarPedido() { if(Object.keys(appState.carrito).length === 0) return alert("Tu carrito está vacío."); if(!appState.isTiendaAbierta) return alert("Lo sentimos, Gran Catador está cerrado en este momento."); let historial = JSON.parse(localStorage.getItem('gc_historial')) || []; let fechaDate = new Date(); let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'}); let nuevoPedido = { fecha: fechaStr, total: appState.totalCarrito, items: Object.keys(appState.carrito).map(k => ({ nombre: k, precio: appState.carrito[k].precio, cantidad: appState.carrito[k].cantidad, codigo: appState.carrito[k].codigo })) }; historial.unshift(nuevoPedido); if(historial.length > 5) historial.pop(); localStorage.setItem('gc_historial', JSON.stringify(historial)); let nombreUser = localStorage.getItem('gc_nombre') || 'un cliente nuevo'; let msg = `🔥 *NUEVO PEDIDO - GRAN CATADOR* 🔥\n\n👤 *Cliente:* ${nombreUser}\n--------------------------------\n`; for(let nombre in appState.carrito) { msg += `▪ ${appState.carrito[nombre].cantidad}x ${nombre}\n`; } msg += `--------------------------------\n`; let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value; msg += `📦 *Entrega:* ${entrega}\n`; if(entrega === 'Delivery') { let dir = document.getElementById('direccionDelivery').value.trim(); if(!dir) return alert("Por favor, ingresa tu dirección para el delivery."); msg += `📍 *Dirección:* ${dir}\n`; if(!localStorage.getItem('gc_direccion')) localStorage.setItem('gc_direccion', dir); } let notas = document.getElementById('notasPedido').value.trim(); if(notas) msg += `📝 *Notas:* ${notas}\n`; let metodo = document.getElementById('metodoPagoSelect').value; msg += `💳 *Método de Pago:* ${metodo}\n`; if(metodo === 'Efectivo') { let pago = parseFloat(document.getElementById('montoPago').value) || 0; if(pago > appState.totalCarrito) { msg += `💵 _Paga con $${pago.toFixed(2)}_\n🟢 _Requiere vuelto: $${(pago - appState.totalCarrito).toFixed(2)}_\n`; } } else { msg += `📎 _[Capture adjunto en el siguiente mensaje]_\n`; } msg += `\n💰 *TOTAL A PAGAR: $${appState.totalCarrito.toFixed(2)}*\n💱 _(Tasa BCV: ${appState.tasaOficial.toFixed(2)} Bs)_`; localStorage.removeItem('gc_inv_time_v3'); appState.carrito = {}; guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-cart', 'nav-home'); window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank'); }

function agregarAlCarritoB64(b64, p, btn, c = false, img = '', esCaja = false) { agregarAlCarrito(decodificarNombre(b64), p, btn, c, img, esCaja); }
function cambiarCantB64(b64, d) { cambiarCant(decodificarNombre(b64), d); }