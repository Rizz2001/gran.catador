let inventario = []; let carrito = {}; let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || []; 
let tasaOficial = 36.25; let totalCarrito = 0; let categoriaActual = 'LICORES'; let debounceTimer; 
let isTiendaAbierta = true; let codigosRecomendados = []; 
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

if(localStorage.getItem('gc_dark') === 'true') document.body.classList.add('dark-mode');

let promptInstalacion;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); promptInstalacion = e;
    document.getElementById('pwa-banner').style.display = 'block';
});
function instalarApp() {
    if(promptInstalacion) { promptInstalacion.prompt(); promptInstalacion.userChoice.then(() => { document.getElementById('pwa-banner').style.display = 'none'; promptInstalacion = null; }); }
}
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); }); }

if (localStorage.getItem('ageVerified') === 'true') document.getElementById('age-gate').style.display = 'none';
function verificarEdad() {
    let d = document.getElementById('age-d').value, m = document.getElementById('age-m').value, y = document.getElementById('age-y').value, err = document.getElementById('age-error');
    if(!d || !m || !y || d>31 || m>12 || y<1900) { err.innerText = "Ingresa una fecha válida."; err.style.display = "block"; return; }
    let birth = new Date(y, m - 1, d), today = new Date();
    let age = today.getFullYear() - birth.getFullYear(), mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    if(age >= 18) { localStorage.setItem('ageVerified', 'true'); document.getElementById('age-gate').style.display = 'none'; } 
    else { err.innerText = "Lo sentimos, debes ser mayor de 18 años."; err.style.display = "block"; }
}

function checkHorario() {
    let d = new Date();
    let formatter = new Intl.DateTimeFormat('es-VE', { hour: 'numeric', hour12: false, timeZone: 'America/Caracas' });
    let horaCaracas = parseInt(formatter.format(d));
    let badge = document.getElementById('store-status'), btnWs = document.getElementById('btn-whatsapp'), msgCerrado = document.getElementById('msg-cerrado');
    if(horaCaracas >= 8 && horaCaracas < 21) {
        isTiendaAbierta = true; badge.innerHTML = "🟢 ABIERTO"; badge.style.background = "rgba(37, 211, 102, 0.2)"; badge.style.color = "#25D366"; badge.style.borderColor = "rgba(37, 211, 102, 0.4)";
        btnWs.classList.remove('disabled'); msgCerrado.style.display = "none";
    } else {
        isTiendaAbierta = false; badge.innerHTML = "🔴 CERRADO"; badge.style.background = "rgba(234, 67, 53, 0.2)"; badge.style.color = "#ea4335"; badge.style.borderColor = "rgba(234, 67, 53, 0.4)";
        btnWs.classList.add('disabled'); msgCerrado.style.display = "block";
    }
}
checkHorario(); setInterval(checkHorario, 60000);

// NUEVA FUNCIÓN: Ahora lee la Tasa y los Recomendados al mismo tiempo
async function obtenerArchivosExternos() {
    try {
        let resTasa = await fetch('tasa.txt?v=' + new Date().getTime());
        if (resTasa.ok) { let texto = await resTasa.text(); tasaOficial = parseFloat(texto.replace(',', '.')); }
    } catch (error) { console.log("Usando tasa predeterminada."); }
    document.getElementById('tasaValor').innerText = tasaOficial.toFixed(2) + " Bs";

    try {
        let resRec = await fetch('recomendados.txt?v=' + new Date().getTime());
        if (resRec.ok) { 
            let textoRec = await resRec.text(); 
            codigosRecomendados = textoRec.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); 
        }
    } catch (error) { console.log("No se encontró recomendados.txt"); }
}

function imgFallback(imgElement, codigoProducto) {
    let attempts = imgElement.dataset.attempts ? parseInt(imgElement.dataset.attempts) : 0;
    const formatos = ['jpg', 'png', 'jpeg', 'webp', 'gif']; 
    attempts++;
    if (attempts < formatos.length) { imgElement.dataset.attempts = attempts; imgElement.src = `img/${codigoProducto}.${formatos[attempts]}`; } 
    else { imgElement.src = 'logo.png'; imgElement.onerror = null; }
}

const fetchCSV = (u) => new Promise((resolve, reject) => { Papa.parse(u, { download: true, encoding: "latin-1", complete: (r) => resolve(r.data), error: (err) => reject(err) }) });
function limpiarCategoria(texto) { if(!texto) return "Otros"; return texto.trim().replace(/\s+/g, ' ').toUpperCase(); }

async function cargarInventario() {
    await obtenerArchivosExternos(); toggleDireccion();
    try {
        const [pRaw, sRaw] = await Promise.all([ fetchCSV("Inventario Fisico general precio por unidad.csv"), fetchCSV("inventario por existencia.csv") ]);
        let mapa = {};
        pRaw.forEach(r => {
            if (r.length >= 5) {
                let cod = r[r.length-4]?.trim(), usd = r[r.length-1]?.trim();
                let catLimpia = limpiarCategoria(r[r.length-5]);
                if (catLimpia === "CHARCUTERIA" || catLimpia === "FRUTERIA") return; 
                if (cod && !isNaN(cod) && usd?.includes(',')) {
                    mapa[cod] = { codigo: cod, Nombre: r[r.length-3]?.trim(), Cat: catLimpia, PrecioStr: usd, PrecioNum: parseFloat(usd.replace('.','').replace(',','.')), StockNum: 0, StockStr: "0,00" };
                }
            }
        });

        sRaw.forEach(r => {
            let i = r.indexOf("Existencia");
            if (i !== -1 && r.length > i + 8) {
                let cod = r[i+2]?.trim();
                if (mapa[cod]) {
                    mapa[cod].StockStr = r[i+8]?.trim();
                    mapa[cod].StockNum = parseFloat(mapa[cod].StockStr.replace('.','').replace(',','.'));
                }
            }
        });

        let siempreDisponibles = ["000233", "7591031001959"]; 
        Object.values(mapa).forEach(prod => {
            if (siempreDisponibles.includes(prod.codigo)) { prod.StockNum = 999; prod.StockStr = "Disponible"; }
        });

        inventario = Object.values(mapa).filter(p => p.Nombre);
        generarCategorias(); aplicarFiltros(); 
    } catch(e) { document.getElementById('lista-productos').innerHTML = '<p style="text-align:center; grid-column:span 2; color: red; margin-top: 20px;">Error al leer archivos.</p>'; }
}

function levenshtein(a,b){const m=[];for(let i=0;i<=b.length;i++)m[i]=[i];for(let j=0;j<=a.length;j++)m[0][j]=j;for(let i=1;i<=b.length;i++){for(let j=1;j<=a.length;j++){if(b.charAt(i-1)===a.charAt(j-1)){m[i][j]=m[i-1][j-1];}else{m[i][j]=Math.min(m[i-1][j-1]+1,Math.min(m[i][j-1]+1,m[i-1][j]+1));}}}return m[b.length][a.length];}
function quitarAcentos(texto) { return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function debounceFiltros() { clearTimeout(debounceTimer); debounceTimer = setTimeout(aplicarFiltros, 300); }
function filtrarCategoria(cat, btn) { categoriaActual = cat; document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); if(btn) btn.classList.add('active'); aplicarFiltros(); }
function toggleFav(codigo) { let index = favoritos.indexOf(codigo); if(index === -1) { favoritos.push(codigo); mostrarToast("Agregado a favoritos ❤️"); } else { favoritos.splice(index, 1); } localStorage.setItem('gc_favs', JSON.stringify(favoritos)); aplicarFiltros(); }
function compartirProducto(nombre, precio) { if (navigator.share) { navigator.share({ title: 'Gran Catador', text: `¡Mira esta bebida! ${nombre} a solo $${precio}.`, url: window.location.href }); } else { mostrarToast("Tu navegador no soporta esta función."); } }

function aplicarFiltros() {
    let q = quitarAcentos(document.getElementById('buscador').value.trim());
    let sortOption = document.getElementById('ordenarSelect').value;
    let verAgotados = document.getElementById('chkAgotados').checked; 
    let resultado = inventario;

    if (!verAgotados) resultado = resultado.filter(p => p.StockNum > 0);
    if (categoriaActual === 'Favoritos') resultado = resultado.filter(p => favoritos.includes(p.codigo));
    else if (categoriaActual !== 'Todos') resultado = resultado.filter(p => p.Cat === categoriaActual);

    if (q !== '') {
        let terms = q.split(' ').filter(t => t.length > 0);
        resultado = resultado.filter(p => {
            let nom = quitarAcentos(p.Nombre); let words = nom.split(' ');
            return terms.every(term => {
                if (nom.includes(term)) return true;
                return words.some(w => { return levenshtein(term, w) <= (term.length > 4 ? 2 : 1); });
            });
        });
    }

    if(sortOption === 'menor') resultado.sort((a,b) => a.PrecioNum - b.PrecioNum);
    else if(sortOption === 'mayor') resultado.sort((a,b) => b.PrecioNum - a.PrecioNum);
    else if(sortOption === 'az') resultado.sort((a,b) => a.Nombre.localeCompare(b.Nombre));
    
    productosFiltradosGlobal = resultado; paginaActual = 1; document.getElementById('lista-productos').innerHTML = '';
    renderizarPagina();
}

function renderizarPagina() {
    const cont = document.getElementById('lista-productos');
    let inicio = (paginaActual - 1) * itemsPorPagina, fin = paginaActual * itemsPorPagina;
    let pedazo = productosFiltradosGlobal.slice(inicio, fin);

    if(productosFiltradosGlobal.length === 0) { 
        cont.innerHTML = `
            <div style="grid-column: span 2; text-align: center; padding: 50px 20px; color: var(--texto-claro);">
                <i class="fa-solid fa-wine-glass-empty" style="font-size: 70px; opacity: 0.3; margin-bottom: 20px;"></i>
                <h3 style="color: var(--texto-oscuro); font-size: 18px; font-weight: 800;">¿Aún no tienes sed?</h3>
                <p style="font-size: 13px; margin-top: 5px;">No encontramos botellas en esta sección.</p>
            </div>`; 
        document.getElementById('btn-cargar-mas').style.display = 'none'; return; 
    }

    const fragmento = document.createDocumentFragment();
    pedazo.forEach(p => {
        const isFav = favoritos.includes(p.codigo); const isAgotado = p.StockNum <= 0; 
        const d = document.createElement('div'); d.className = `producto-card ${isAgotado ? 'agotado' : ''}`;
        d.innerHTML = `
            ${isAgotado ? '<div class="badge-agotado">AGOTADO</div>' : ''}
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart btn-fav ${isFav ? 'active' : ''}" onclick="toggleFav('${p.codigo}')"></i>
            <img loading="lazy" src="img/${p.codigo}.jpg" data-attempts="0" onerror="imgFallback(this, '${p.codigo}')" alt="${p.Nombre}">
            <h3 class="producto-titulo">${p.Nombre}</h3><p class="producto-stock">Disp: ${p.StockStr}</p><p class="producto-precio">$${p.PrecioStr}</p>
            <button class="btn-share" onclick="compartirProducto('${p.Nombre}', '${p.PrecioStr}')"><i class="fa-solid fa-share-nodes"></i></button>
            <button class="btn-add ${isAgotado ? 'disabled' : ''}" ${isAgotado ? 'disabled' : `onclick="agregarAlCarrito('${p.Nombre}', ${p.PrecioNum}, this)"`}><i class="fa-solid fa-plus"></i></button>
        `;
        fragmento.appendChild(d);
    });
    cont.appendChild(fragmento);
    if (fin < productosFiltradosGlobal.length) document.getElementById('btn-cargar-mas').style.display = 'block'; else document.getElementById('btn-cargar-mas').style.display = 'none';
}

function cargarMasProductos() { paginaActual++; renderizarPagina(); }

function generarCategorias() {
    const cont = document.getElementById('contenedorCategorias');
    let categorias = [...new Set(inventario.map(p => p.Cat))].sort(); 
    
    let btnTodos = document.createElement('button'); 
    btnTodos.className = (categoriaActual === 'Todos') ? "cat-btn active" : "cat-btn"; 
    btnTodos.innerText = "Todos"; 
    btnTodos.onclick = function() { filtrarCategoria('Todos', this); };
    
    let btnFav = document.createElement('button'); 
    btnFav.className = (categoriaActual === 'Favoritos') ? "cat-btn active" : "cat-btn"; 
    btnFav.innerHTML = "❤️ Favoritos"; btnFav.style.borderColor = "#ff4757"; btnFav.style.color = "#ff4757"; 
    btnFav.onclick = function() { filtrarCategoria('Favoritos', this); };
    
    cont.innerHTML = ''; cont.appendChild(btnTodos); cont.appendChild(btnFav);
    
    categorias.forEach(c => { 
        let b = document.createElement('button'); 
        b.className = (c === categoriaActual) ? "cat-btn active" : "cat-btn"; 
        b.innerText = c; 
        b.onclick = function() { filtrarCategoria(c, this); }; 
        cont.appendChild(b); 
    });

    setTimeout(() => {
        let activeBtn = cont.querySelector('.active');
        if(activeBtn) activeBtn.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"});
    }, 100);
}

function setActiveNav(id) { document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active')); document.getElementById(id).classList.add('active'); }

function irInicio() { 
    setActiveNav('nav-home'); 
    window.scrollTo({top: 0, behavior: 'smooth'}); 
    document.getElementById('buscador').value = ''; 
    document.getElementById('chkAgotados').checked = false; 
    let botones = document.querySelectorAll('.cat-btn');
    let btnLicores = Array.from(botones).find(b => b.innerText === 'LICORES') || botones[0];
    filtrarCategoria('LICORES', btnLicores); 
}

function abrirPerfil() { 
    setActiveNav('nav-user'); document.getElementById('modal-perfil').style.display = 'flex'; 
    document.getElementById('perfilNombre').value = localStorage.getItem('gc_nombre') || ''; 
    document.getElementById('perfilDireccion').value = localStorage.getItem('gc_direccion') || ''; 
    
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || [];
    let listCont = document.getElementById('historial-lista');
    if(hist.length === 0) { listCont.innerHTML = '<p style="font-size:12px; color:gray;">Aún no tienes pedidos registrados.</p>'; } 
    else {
        listCont.innerHTML = '';
        hist.forEach((ped, index) => {
            let itemsT = ped.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ');
            listCont.innerHTML += `
                <div style="border:1px solid var(--borde-color); padding:12px; border-radius:15px; margin-bottom:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-size:11px; font-weight:bold; color:var(--dorado);">${ped.fecha}</span>
                        <span style="font-size:13px; font-weight:800;">$${ped.total.toFixed(2)}</span>
                    </div>
                    <p style="font-size:11px; color:var(--texto-claro); margin-bottom:10px;">${itemsT}</p>
                    <button onclick="repetirPedido(${index})" style="background:var(--azul-rey); color:white; border:none; padding:10px; width:100%; border-radius:10px; font-size:12px; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-rotate-right"></i> Repetir este pedido</button>
                </div>
            `;
        });
    }
}

function guardarPerfil() { localStorage.setItem('gc_nombre', document.getElementById('perfilNombre').value); localStorage.setItem('gc_direccion', document.getElementById('perfilDireccion').value); mostrarToast("Datos guardados"); cerrarModal('modal-perfil', 'nav-home'); }
function abrirAjustes() { setActiveNav('nav-settings'); document.getElementById('modal-ajustes').style.display = 'flex'; document.getElementById('toggleDarkMode').checked = document.body.classList.contains('dark-mode'); }
function toggleDark() { document.body.classList.toggle('dark-mode'); localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode')); }
function cerrarModal(modalId, lastNavId) { document.getElementById(modalId).style.display = 'none'; setActiveNav('nav-home'); }

function agregarAlCarrito(nombre, precio, btnElement, isCross = false) {
    if(carrito[nombre]) carrito[nombre].cantidad++; else carrito[nombre] = { precio: precio, cantidad: 1 };
    actualizarCartCount(); 
    if(btnElement) {
        let iconoOriginal = btnElement.innerHTML; btnElement.innerHTML = '<i class="fa-solid fa-check"></i>'; btnElement.style.background = "#fff"; btnElement.style.color = "var(--verde-btn)"; 
        setTimeout(() => { btnElement.innerHTML = iconoOriginal; btnElement.style.background = "var(--verde-btn)"; btnElement.style.color = "#fff"; }, 500);
    } else { mostrarToast("Añadido al carrito"); }

    if(!isCross) {
        let prod = inventario.find(x => x.Nombre === nombre);
        if(prod) {
            let c = prod.Cat.toUpperCase();
            if(c.includes("RON") || c.includes("WHISKY") || c.includes("VODKA") || c.includes("GINEBRA") || c.includes("LICOR") || c.includes("TEQUILA")) { sugerirAcompañante(); }
        }
    }
}

// NUEVA LÓGICA: Ahora lee los códigos del archivo recomendados.txt
function sugerirAcompañante() {
    let sugerencias = [];
    
    // Si el archivo tiene códigos, los busca. Si está vacío, busca Hielo y Refresco por defecto.
    if(codigosRecomendados.length > 0) {
        sugerencias = inventario.filter(p => codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3);
    } else {
        sugerencias = inventario.filter(p => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3);
    }

    if(sugerencias.length > 0) {
        let cont = document.getElementById('cross-sell-items'); cont.innerHTML = '';
        sugerencias.forEach(p => {
            cont.innerHTML += `
                <div style="min-width:110px; border:1px solid var(--borde-color); border-radius:15px; padding:10px; text-align:center;">
                    <img src="img/${p.codigo}.jpg" style="height:55px; object-fit:contain; margin-bottom:5px;" onerror="this.src='logo.png'">
                    <p style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--texto-oscuro);">${p.Nombre}</p>
                    <p style="font-size:13px; color:var(--dorado); font-weight:800;">$${p.PrecioStr}</p>
                    <button onclick="agregarAlCarrito('${p.Nombre}', ${p.PrecioNum}, null, true); cerrarCrossSell();" style="background:var(--verde-btn); color:white; border:none; padding:8px; border-radius:10px; font-size:11px; font-weight:bold; width:100%; margin-top:5px; cursor:pointer;"><i class="fa-solid fa-plus"></i> Añadir</button>
                </div>
            `;
        });
        document.getElementById('modal-cross-sell').style.display = 'flex';
    }
}
function cerrarCrossSell() { document.getElementById('modal-cross-sell').style.display = 'none'; }

function actualizarCartCount() { let t = 0; for(let k in carrito) t += carrito[k].cantidad; document.getElementById('cart-count').innerText = t; }
function vaciarCarrito() { if(confirm("¿Estás seguro de vaciar el carrito?")) { carrito = {}; actualizarCartCount(); cerrarModal('modal-cart', 'nav-cart'); mostrarToast("Carrito vacío"); } }

function abrirCarrito() { 
    setActiveNav('nav-cart'); document.getElementById('modal-cart').style.display = 'flex'; renderizarCarrito(); 
}

function repetirPedido(index) {
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || [];
    let ped = hist[index]; if(!ped) return;
    carrito = {}; ped.items.forEach(i => { carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad }; });
    actualizarCartCount(); cerrarModal('modal-perfil', 'nav-home'); abrirCarrito(); mostrarToast("Pedido cargado con éxito");
}

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito'); lista.innerHTML = ''; totalCarrito = 0;
    
    if(Object.keys(carrito).length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--texto-claro);">
                <i class="fa-solid fa-cart-arrow-down" style="font-size: 70px; opacity: 0.3; margin-bottom: 20px;"></i>
                <h3 style="color: var(--texto-oscuro); font-size: 18px; font-weight: 800;">Tu carrito está vacío</h3>
                <p style="font-size: 13px; margin-top: 5px;">Agrega unas bebidas para empezar la fiesta.</p>
                <button onclick="cerrarModal('modal-cart', 'nav-home')" class="btn-enviar" style="width: auto; padding: 12px 30px; margin-top: 25px; display: inline-block;">Ir a comprar</button>
            </div>`;
        document.getElementById('checkout-sections').style.display = 'none'; 
        return;
    }
    
    document.getElementById('checkout-sections').style.display = 'block'; 
    
    for(let nombre in carrito) {
        let item = carrito[nombre]; let sub = item.precio * item.cantidad; totalCarrito += sub;
        lista.innerHTML += `<div class="cart-item"><div class="cart-item-info"><p class="cart-item-title">${nombre}</p><p class="cart-item-price">$${item.precio.toFixed(2)}</p></div><div class="cart-controls"><button class="cart-btn" onclick="cambiarCant('${nombre}', -1)">-</button><span style="font-size:14px; font-weight:bold;">${item.cantidad}</span><button class="cart-btn" onclick="cambiarCant('${nombre}', 1)">+</button></div></div>`;
    }
    document.getElementById('totalUsdModal').innerText = `$${totalCarrito.toFixed(2)}`; document.getElementById('totalBsModal').innerText = `${(totalCarrito * tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; calcularVuelto();
}
function cambiarCant(n, delta) { carrito[n].cantidad += delta; if(carrito[n].cantidad <= 0) delete carrito[n]; actualizarCartCount(); renderizarCarrito(); }

function toggleDireccion() { let met = document.querySelector('input[name="metodoEntrega"]:checked').value; let dirInput = document.getElementById('direccionDelivery'); let btnMap = document.getElementById('btnMap'); if(met === 'Delivery') { dirInput.style.display = 'block'; btnMap.style.display = 'none'; if(localStorage.getItem('gc_direccion') && !dirInput.value) dirInput.value = localStorage.getItem('gc_direccion'); } else { dirInput.style.display = 'none'; btnMap.style.display = 'block'; } }
function abrirMapa() { window.open('http://googleusercontent.com/maps.google.com/2', '_blank'); }
function actualizarMetodoPago() { let val = document.getElementById('metodoPagoSelect').value; document.getElementById('box-efectivo').style.display = (val === 'Efectivo') ? 'block' : 'none'; }
function calcularVuelto() { let pago = parseFloat(document.getElementById('montoPago').value) || 0; let res = document.getElementById('res-vuelto'); if(pago > totalCarrito) { let vUsd = pago - totalCarrito; let vBs = vUsd * tasaOficial; res.style.display = 'block'; res.style.color = 'var(--verde-btn)'; res.innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; } else { res.style.display = 'none'; } }
function mostrarToast(msg) { const cont = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }

function enviarPedido() {
    if(Object.keys(carrito).length === 0) return alert("Tu carrito está vacío.");
    if(!isTiendaAbierta) return alert("Lo sentimos, la tienda se encuentra cerrada en este momento.");
    
    let historial = JSON.parse(localStorage.getItem('gc_historial')) || []; let fechaDate = new Date(); let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'});
    let nuevoPedido = { fecha: fechaStr, total: totalCarrito, items: Object.keys(carrito).map(k => ({ nombre: k, precio: carrito[k].precio, cantidad: carrito[k].cantidad })) };
    historial.unshift(nuevoPedido); if(historial.length > 5) historial.pop(); localStorage.setItem('gc_historial', JSON.stringify(historial));

    let nombreUser = localStorage.getItem('gc_nombre') || 'un cliente'; let msg = `Hola Gran Catador, soy ${nombreUser}. Quiero hacer el siguiente pedido:%0A%0A`;
    for(let nombre in carrito) { msg += `▪ ${carrito[nombre].cantidad}x ${nombre} - $${(carrito[nombre].precio * carrito[nombre].cantidad).toFixed(2)}%0A`; }
    let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value; msg += `%0A📦 *Entrega:* ${entrega}`;
    if(entrega === 'Delivery') { let dir = document.getElementById('direccionDelivery').value.trim(); if(!dir) return alert("Ingresa tu dirección para el delivery."); msg += `%0A📍 *Dirección:* ${dir}`; if(!localStorage.getItem('gc_direccion')) localStorage.setItem('gc_direccion', dir); }
    let notas = document.getElementById('notasPedido').value.trim(); if(notas) msg += `%0A📝 *Notas:* ${notas}`;
    let metodo = document.getElementById('metodoPagoSelect').value; msg += `%0A💳 *Método de Pago:* ${metodo}`;
    if(metodo === 'Efectivo') { let pago = parseFloat(document.getElementById('montoPago').value) || 0; if(pago > totalCarrito) { msg += `%0A💵 _Pagaré con $${pago}_%0A🟢 _Requiero vuelto de: $${(pago - totalCarrito).toFixed(2)}_`; } } else { msg += `%0A📎 _[Te adjunto el capture]_`; }
    msg += `%0A%0A*TOTAL:* $${totalCarrito.toFixed(2)} (Tasa BCV: ${tasaOficial.toFixed(2)})`; 
    carrito = {}; actualizarCartCount(); cerrarModal('modal-cart', 'nav-cart');
    window.open(`https://wa.me/584245496366?text=${msg}`, '_blank');
}

window.onload = cargarInventario;
