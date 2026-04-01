let inventario = []; 
let carrito = JSON.parse(localStorage.getItem('gc_cart')) || {}; 
let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || []; 
let tasaOficial = 36.25; let totalCarrito = 0; let categoriaActual = 'LICORES'; let debounceTimer; 
let isTiendaAbierta = true; let codigosRecomendados = []; let siempreDisponibles = []; 
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

// NUEVO: Estado global para saber qué está viendo el cliente
let modoVistaGlobal = 'unidad'; 

// NUEVO: Inyectar el diseño del interruptor sin tocar el HTML
const styleT = document.createElement('style');
styleT.innerHTML = `
    .toggle-modo-container { display: flex; justify-content: center; margin: 15px 0 10px 0; background: var(--item-bg); border-radius: 12px; padding: 5px; border: 1px solid var(--borde-color); }
    .btn-modo { flex: 1; padding: 10px 0; text-align: center; font-size: 13px; font-weight: bold; color: var(--texto-claro); border-radius: 8px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 5px;}
    .btn-modo.active { background: var(--dorado); color: black; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
`;
document.head.appendChild(styleT);

if(localStorage.getItem('gc_dark') === 'true') document.body.classList.add('dark-mode');

let promptInstalacion;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalacion = e; document.getElementById('pwa-banner').style.display = 'block'; });
function instalarApp() { if(promptInstalacion) { promptInstalacion.prompt(); promptInstalacion.userChoice.then(() => { document.getElementById('pwa-banner').style.display = 'none'; promptInstalacion = null; }); } }
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').then(reg => { console.log("PWA Ok"); }).catch(err => console.log("SW Error", err)); }); }

if (localStorage.getItem('ageVerified') === 'true') { let ag = document.getElementById('age-gate'); if(ag) ag.style.display = 'none'; }
function verificarEdad() {
    let d = document.getElementById('age-d').value, m = document.getElementById('age-m').value, y = document.getElementById('age-y').value, err = document.getElementById('age-error');
    if(!d || !m || !y || d>31 || m>12 || y<1900) { err.innerText = "Ingresa una fecha válida."; err.style.display = "block"; return; }
    let birth = new Date(y, m - 1, d), today = new Date(); let age = today.getFullYear() - birth.getFullYear(), mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    if(age >= 18) { localStorage.setItem('ageVerified', 'true'); document.getElementById('age-gate').style.display = 'none'; } else { err.innerText = "Lo sentimos, debes ser mayor de 18 años."; err.style.display = "block"; }
}

function checkHorario() {
    try {
        let d = new Date(); let formatter = new Intl.DateTimeFormat('es-VE', { hour: 'numeric', hour12: false, timeZone: 'America/Caracas' }); let horaCaracas = parseInt(formatter.format(d));
        let badge = document.getElementById('store-status'), btnWs = document.getElementById('btn-whatsapp'), msgCerrado = document.getElementById('msg-cerrado');
        if(!badge) return;
        if(horaCaracas >= 8 && horaCaracas < 21) { isTiendaAbierta = true; badge.innerHTML = "🟢 ABIERTO"; badge.style.background = "rgba(37, 211, 102, 0.2)"; badge.style.color = "#25D366"; badge.style.borderColor = "rgba(37, 211, 102, 0.4)"; if(btnWs) btnWs.classList.remove('disabled'); if(msgCerrado) msgCerrado.style.display = "none"; } 
        else { isTiendaAbierta = false; badge.innerHTML = "🔴 CERRADO"; badge.style.background = "rgba(234, 67, 53, 0.2)"; badge.style.color = "#ea4335"; badge.style.borderColor = "rgba(234, 67, 53, 0.4)"; if(btnWs) btnWs.classList.add('disabled'); if(msgCerrado) msgCerrado.style.display = "block"; }
    } catch(e) { console.log("Error en horario"); }
}
checkHorario(); setInterval(checkHorario, 60000);

async function obtenerArchivosExternos() {
    try { let resTasa = await fetch('tasa.txt?v=' + new Date().getTime()); if (resTasa.ok) { let texto = await resTasa.text(); tasaOficial = parseFloat(texto.trim().replace(',', '.')); } } catch (error) { console.log("Tasa no encontrada"); }
    let tasaEl = document.getElementById('tasaValor'); if(tasaEl) tasaEl.innerText = tasaOficial.toFixed(2) + " Bs";
    
    try { let resRec = await fetch('recomendados.txt?v=' + new Date().getTime()); if (resRec.ok) { let textoRec = await resRec.text(); codigosRecomendados = textoRec.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); } } catch (error) {}
    try { let resDisp = await fetch('disponibles.txt?v=' + new Date().getTime()); if (resDisp.ok) { let textoDisp = await resDisp.text(); siempreDisponibles = textoDisp.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); } } catch (error) {}
    
    try { 
        let resBan = await fetch('banners.txt?v=' + new Date().getTime()); 
        if (resBan.ok) { 
            let textoBan = await resBan.text(); let listaBanners = textoBan.split(/[\n,]+/).map(b => b.trim()).filter(b => b !== ""); 
            let contBanners = document.getElementById('contenedorBanners');
            if(listaBanners.length > 0 && contBanners) {
                contBanners.innerHTML = ''; 
                listaBanners.forEach(img => { contBanners.innerHTML += `<div class="promo-banner"><img src="banners/${img}" alt="Promo" onerror="this.parentElement.style.display='none'"></div>`; });
            }
        } 
    } catch (error) { console.log("Sin banners.txt"); }
}

function imgFallback(imgElement, codigoProducto) {
    let attempts = imgElement.dataset.attempts ? parseInt(imgElement.dataset.attempts) : 0; const formatos = ['webp', 'jpg', 'png', 'jpeg']; attempts++;
    if (attempts < formatos.length) { imgElement.dataset.attempts = attempts; imgElement.src = `img/${codigoProducto}.${formatos[attempts]}`; } else { imgElement.src = 'logo.png'; imgElement.onerror = null; }
}

const fetchCSV = (u) => new Promise((resolve, reject) => { Papa.parse(u, { download: true, encoding: "latin-1", complete: (r) => resolve(r.data), error: (err) => reject(err) }) });
function limpiarCategoria(texto) { if(!texto) return "Otros"; return texto.trim().replace(/\s+/g, ' ').toUpperCase(); }

function obtenerCantCaja(categoria, nombre) {
    let cat = categoria.toUpperCase(); let nom = nombre.toUpperCase();
    if (nom.includes("COMBO") || nom.includes("VASO") || nom.includes("HIELO") || nom.includes("BOTELLA")) return 1;
    if (cat.includes("CERVEZA") || nom.includes("POLAR") || nom.includes("ZULIA")) return 36;
    if (cat.includes("VINO")) return 6;
    if (cat.includes("AGUA") || cat.includes("REFRESCO")) { if (nom.includes("1.5") || nom.includes("2 L") || nom.includes("1.50") || nom.includes("2L")) return 6; return 24; }
    return 12; 
}

// NUEVO: Función para cambiar el interruptor
function cambiarModoVista(modo) {
    modoVistaGlobal = modo;
    document.getElementById('btn-modo-unidad').classList.remove('active');
    document.getElementById('btn-modo-caja').classList.remove('active');
    document.getElementById('btn-modo-' + modo).classList.add('active');
    renderizarPagina(); // Recarga los precios en tiempo real
}

function inyectarInterruptor() {
    let cont = document.querySelector('.tools-container');
    if(cont && !document.getElementById('toggle-modo-global')) {
        let div = document.createElement('div');
        div.id = 'toggle-modo-global';
        div.className = 'toggle-modo-container';
        div.innerHTML = `
            <div class="btn-modo active" id="btn-modo-unidad" onclick="cambiarModoVista('unidad')">🍾 Por Unidad</div>
            <div class="btn-modo" id="btn-modo-caja" onclick="cambiarModoVista('caja')">📦 Por Caja</div>
        `;
        cont.insertBefore(div, cont.children[1]);
    }
}

async function cargarInventario() {
    await obtenerArchivosExternos(); toggleDireccion(); inyectarInterruptor();
    try {
        const [pRaw, sRaw] = await Promise.all([ fetchCSV("listadepreciosporgrupo.csv"), fetchCSV("inventario por existencia.csv") ]); let mapa = {};
        
        pRaw.forEach(r => { 
            if (r.length >= 4) { 
                let catBruto = r[r.length-4]; let cod = r[r.length-3]?.trim(); let nombreBruto = r[r.length-2]?.trim(); let bsStr = r[r.length-1]?.trim(); 
                if (!cod || !bsStr || cod === "Código" || !bsStr.includes(',')) return;

                let catLimpia = limpiarCategoria(catBruto); 
                if (catLimpia === "CHARCUTERIA" || catLimpia === "FRUTERIA") return; 
                
                let bsCajaNum = parseFloat(bsStr.replace(/\./g,'').replace(',','.'));
                let usdCajaNum = bsCajaNum / tasaOficial;

                let cantCaja = obtenerCantCaja(catLimpia, nombreBruto);
                let usdUnidadNum = usdCajaNum / cantCaja;
                let bsUnidadNum = bsCajaNum / cantCaja;

                mapa[cod] = { 
                    codigo: cod, Nombre: nombreBruto, Cat: catLimpia, 
                    PrecioStr: usdUnidadNum.toFixed(2), 
                    PrecioNum: usdUnidadNum, 
                    PrecioBsStr: bsUnidadNum.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2}), 
                    PrecioCajaUsd: usdCajaNum.toFixed(2), 
                    PrecioCajaNum: usdCajaNum,
                    PrecioCajaBsStr: bsCajaNum.toLocaleString('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2}), // Guardamos el Bs de la caja
                    StockNum: 0, StockStr: "0,00" 
                }; 
            } 
        });
        
        sRaw.forEach(r => { let i = r.indexOf("Existencia"); if (i !== -1 && r.length > i + 8) { let cod = r[i+2]?.trim(); if (mapa[cod]) { mapa[cod].StockStr = r[i+8]?.trim(); mapa[cod].StockNum = parseFloat(mapa[cod].StockStr.replace('.','').replace(',','.')); } } });
        Object.values(mapa).forEach(prod => { if (siempreDisponibles.includes(prod.codigo)) { prod.StockNum = 999; prod.StockStr = "Disponible"; } });
        inventario = Object.values(mapa).filter(p => p.Nombre);
        
        if(inventario.length === 0) throw new Error("Inventario vacío");
        
        actualizarCartCount(); generarCategorias(); aplicarFiltros(); 
    } catch(e) { 
        document.getElementById('lista-productos').innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 30px; border: 1px solid red; border-radius: 10px;"><h3 style="color:red;">Error de Conexión</h3><p style="font-size:12px; margin-top:10px;">Asegúrate de que el archivo listadepreciosporgrupo.csv esté subido a GitHub.</p></div>'; 
    }
}

function levenshtein(a,b){const m=[];for(let i=0;i<=b.length;i++)m[i]=[i];for(let j=0;j<=a.length;j++)m[0][j]=j;for(let i=1;i<=b.length;i++){for(let j=1;j<=a.length;j++){if(b.charAt(i-1)===a.charAt(j-1)){m[i][j]=m[i-1][j-1];}else{m[i][j]=Math.min(m[i-1][j-1]+1,Math.min(m[i][j-1]+1,m[i-1][j]+1));}}}return m[b.length][a.length];}
function quitarAcentos(texto) { return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function debounceBusqueda(event) { clearTimeout(debounceTimer); const query = event.target.value.trim(); if(query.length < 2) { cerrarSugerencias(); aplicarFiltros(); return; } debounceTimer = setTimeout(() => mostrarSugerencias(query), 300); }

function mostrarSugerencias(q) {
    let queryLimpia = quitarAcentos(q); let coincidencias = inventario.filter(p => p.StockNum > 0 && quitarAcentos(p.Nombre).includes(queryLimpia)).slice(0, 5); const cont = document.getElementById('search-suggestions');
    if(coincidencias.length === 0) { cerrarSugerencias(); aplicarFiltros(); return; } cont.innerHTML = '';
    coincidencias.forEach(p => { const div = document.createElement('div'); div.className = 'suggestion-item'; div.innerHTML = `<img src="img/${p.codigo}.webp" onerror="imgFallback(this, '${p.codigo}')"><span>${p.Nombre}</span>`; div.onclick = () => { document.getElementById('buscador').value = p.Nombre; cerrarSugerencias(); aplicarFiltros(); }; cont.appendChild(div); });
    cont.style.display = 'block';
}
function cerrarSugerencias() { document.getElementById('search-suggestions').style.display = 'none'; }
document.addEventListener('click', (e) => { if(!e.target.closest('.search-container')) cerrarSugerencias(); });

function filtrarCategoria(cat, btn) { categoriaActual = cat; document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); if(btn) btn.classList.add('active'); aplicarFiltros(); }
function toggleFav(codigo) { let index = favoritos.indexOf(codigo); if(index === -1) { favoritos.push(codigo); mostrarToast("Agregado a favoritos ❤️"); } else { favoritos.splice(index, 1); } localStorage.setItem('gc_favs', JSON.stringify(favoritos)); aplicarFiltros(); }
function compartirProducto(nombre, precio) { if (navigator.share) { navigator.share({ title: 'Gran Catador', text: `¡Mira esta bebida! ${nombre} a solo $${precio}.`, url: window.location.href }).catch(e=>console.log(e)); } else { mostrarToast("Copiado al portapapeles."); } }

function aplicarFiltros() {
    let q = quitarAcentos(document.getElementById('buscador').value.trim()); let sortOption = document.getElementById('ordenarSelect').value; let verAgotados = document.getElementById('chkAgotados').checked; let resultado = inventario;
    if (!verAgotados) resultado = resultado.filter(p => p.StockNum > 0); if (categoriaActual === 'Favoritos') resultado = resultado.filter(p => favoritos.includes(p.codigo)); else if (categoriaActual !== 'Todos') resultado = resultado.filter(p => p.Cat === categoriaActual);
    if (q !== '') { let terms = q.split(' ').filter(t => t.length > 0); resultado = resultado.filter(p => { let nom = quitarAcentos(p.Nombre); let words = nom.split(' '); return terms.every(term => { if (nom.includes(term)) return true; return words.some(w => levenshtein(term, w) <= (term.length > 4 ? 2 : 1)); }); }); }
    if(sortOption === 'menor') resultado.sort((a,b) => a.PrecioNum - b.PrecioNum); else if(sortOption === 'mayor') resultado.sort((a,b) => b.PrecioNum - a.PrecioNum); else if(sortOption === 'az') resultado.sort((a,b) => a.Nombre.localeCompare(b.Nombre));
    productosFiltradosGlobal = resultado; paginaActual = 1; document.getElementById('lista-productos').innerHTML = ''; renderizarPagina();
}

function codificarNombre(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch(e) { return btoa(str); } }
function decodificarNombre(b64) { try { return decodeURIComponent(escape(atob(b64))); } catch(e) { return atob(b64); } }

function renderizarPagina() {
    const cont = document.getElementById('lista-productos'); let inicio = (paginaActual - 1) * itemsPorPagina, fin = paginaActual * itemsPorPagina; let pedazo = productosFiltradosGlobal.slice(inicio, fin);
    if(productosFiltradosGlobal.length === 0) { cont.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 40px 20px; color: var(--texto-claro);"><i class="fa-solid fa-wine-bottle" style="font-size: 60px; opacity: 0.3; margin-bottom: 15px;"></i><h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">¿Aún no tienes sed?</h3><p style="font-size: 13px; margin-top: 5px;">No encontramos botellas en esta sección.</p><button onclick="irInicio()" class="cat-btn active" style="margin: 20px auto 0 auto; padding: 10px 20px;">Ver todo el catálogo</button></div>`; document.getElementById('btn-cargar-mas').style.display = 'none'; return; }
    const fragmento = document.createDocumentFragment();
    pedazo.forEach(p => {
        const isFav = favoritos.includes(p.codigo); const isAgotado = p.StockNum <= 0; const d = document.createElement('div'); d.className = `producto-card ${isAgotado ? 'agotado' : ''}`; let nombreB64 = codificarNombre(p.Nombre);
        
        // NUEVO: Variables dinámicas según el interruptor
        let esModoCaja = (modoVistaGlobal === 'caja');
        let precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
        let precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
        let iconoBtn = esModoCaja ? '📦' : '🍾';
        let colorBtn = esModoCaja ? 'var(--dorado)' : 'var(--verde-btn)';
        let colorTexto = esModoCaja ? 'black' : 'white';
        let etiquetaModo = esModoCaja ? 'Precio por Caja' : 'Precio por Unidad';

        d.innerHTML = `
            ${isAgotado ? '<div class="badge-agotado">AGOTADO</div>' : ''}
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart btn-fav ${isFav ? 'active' : ''}" onclick="toggleFav('${p.codigo}')"></i>
            <img loading="lazy" src="img/${p.codigo}.webp" data-attempts="0" onerror="imgFallback(this, '${p.codigo}')" alt="${p.Nombre}">
            <h3 class="producto-titulo">${p.Nombre}</h3>
            <p class="producto-stock" style="margin-bottom:2px;">Disp: ${p.StockStr}</p>
            
            <p class="producto-precio">$${precioUsdDin} <span style="font-size:11px; color:var(--texto-claro); display:inline-block; font-weight:500;">/ ${precioBsDin} Bs</span></p>
            <p style="font-size:10px; color:var(--texto-claro); font-weight:bold; margin-top:2px; margin-bottom: 30px;">${etiquetaModo}</p>
            
            <button class="btn-share" style="bottom: 12px; right: 50px;" onclick="compartirProductoB64('${nombreB64}', '${precioUsdDin}')"><i class="fa-solid fa-share-nodes"></i></button>
            
            <button class="btn-add ${isAgotado ? 'disabled' : ''}" style="width: 32px; border-radius: 8px; right: 12px; background: ${colorBtn}; color: ${colorTexto}; font-size: 13px;" title="Agregar" ${isAgotado ? 'disabled' : `onclick="agregarAlCarritoB64('${nombreB64}', ${esModoCaja ? p.PrecioCajaNum : p.PrecioNum}, this, false, 'img/${p.codigo}.webp', ${esModoCaja})"`}>${iconoBtn}</button>
        `;
        fragmento.appendChild(d);
    });
    cont.appendChild(fragmento); if (fin < productosFiltradosGlobal.length) document.getElementById('btn-cargar-mas').style.display = 'block'; else document.getElementById('btn-cargar-mas').style.display = 'none';
}

function cargarMasProductos() { paginaActual++; renderizarPagina(); }
function generarCategorias() {
    const cont = document.getElementById('contenedorCategorias'); let categorias = [...new Set(inventario.map(p => p.Cat))].sort(); cont.innerHTML = '';
    let btnTodos = document.createElement('button'); btnTodos.className = (categoriaActual === 'Todos') ? "cat-btn active" : "cat-btn"; btnTodos.innerText = "Todos"; btnTodos.onclick = function() { filtrarCategoria('Todos', this); }; cont.appendChild(btnTodos);
    let btnFav = document.createElement('button'); btnFav.className = (categoriaActual === 'Favoritos') ? "cat-btn active" : "cat-btn"; btnFav.innerHTML = "❤️ Mis Favoritos"; btnFav.style.borderColor = "#ff4757"; btnFav.style.color = "#ff4757"; btnFav.onclick = function() { filtrarCategoria('Favoritos', this); }; cont.appendChild(btnFav);
    categorias.forEach(c => { let b = document.createElement('button'); b.className = (c === categoriaActual) ? "cat-btn active" : "cat-btn"; b.innerText = c; b.onclick = function() { filtrarCategoria(c, this); }; cont.appendChild(b); });
    setTimeout(() => { let activeBtn = cont.querySelector('.active'); if(activeBtn) activeBtn.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"}); }, 150);
}

function setActiveNav(id) { document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active')); const el = document.getElementById(id); if(el) el.classList.add('active'); }
function irInicio() { cerrarModal('all'); setActiveNav('nav-home'); window.scrollTo({top: 0, behavior: 'smooth'}); document.getElementById('buscador').value = ''; document.getElementById('chkAgotados').checked = false; cerrarSugerencias(); const btnLicores = Array.from(document.querySelectorAll('.cat-btn')).find(b => b.innerText === 'LICORES'); if(btnLicores) filtrarCategoria('LICORES', btnLicores); else filtrarCategoria('Todos', document.querySelectorAll('.cat-btn')[0]); }
function abrirLegales() { document.getElementById('modal-legales').style.display = 'flex'; }
function abrirSoporteWhatsApp() { let msg = "Hola, necesito ayuda con la plataforma de Gran Catador."; window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank'); }

function abrirPerfil() { 
    cerrarModal('all'); setActiveNav('nav-user'); document.getElementById('modal-perfil').style.display = 'flex'; document.getElementById('perfilNombre').value = localStorage.getItem('gc_nombre') || ''; document.getElementById('perfilDireccion').value = localStorage.getItem('gc_direccion') || ''; 
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || []; let listCont = document.getElementById('historial-lista');
    if(hist.length === 0) { listCont.innerHTML = '<p style="font-size:12px; color:gray; text-align:center;">Aún no tienes pedidos registrados.</p>'; } 
    else { listCont.innerHTML = ''; hist.forEach((ped, index) => { let itemsT = ped.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', '); listCont.innerHTML += `<div style="border:1px solid var(--borde-color); padding:10px; border-radius:12px; margin-bottom:10px;"><div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span style="font-size:11px; font-weight:bold; color:var(--dorado);">${ped.fecha}</span><span style="font-size:13px; font-weight:bold;">$${ped.total.toFixed(2)}</span></div><p style="font-size:11px; color:var(--texto-claro); margin-bottom:10px;">${itemsT}</p><button onclick="repetirPedido(${index})" style="background:var(--azul-rey); color:white; border:none; padding:8px; width:100%; border-radius:8px; font-size:11px; font-weight:bold; cursor:pointer;"><i class="fa-solid fa-rotate-right"></i> Repetir este pedido</button></div>`; }); }
}
function guardarPerfil() { localStorage.setItem('gc_nombre', document.getElementById('perfilNombre').value); localStorage.setItem('gc_direccion', document.getElementById('perfilDireccion').value); mostrarToast("Datos guardados ✅"); cerrarModal('modal-perfil', 'nav-home'); }
function abrirAjustes() { cerrarModal('all'); setActiveNav('nav-settings'); document.getElementById('modal-ajustes').style.display = 'flex'; document.getElementById('toggleDarkMode').checked = document.body.classList.contains('dark-mode'); }
function toggleDark() { document.body.classList.toggle('dark-mode'); localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode')); }
function cerrarModal(modalId, navAnterior = 'nav-home') { if(modalId === 'all') { document.querySelectorAll('.modal-fullscreen').forEach(m => m.style.display = 'none'); return; } const m = document.getElementById(modalId); if(m) m.style.display = 'none'; if(navAnterior === 'modal-ajustes') { abrirAjustes(); } else { setActiveNav(navAnterior); } }
function guardarCarritoLS() { localStorage.setItem('gc_cart', JSON.stringify(carrito)); }

function animarAlCarrito(btnElement, imgSrc) {
    if(!btnElement || !imgSrc) return; const cartIcon = document.getElementById('icono-carrito-flotante'); if(!cartIcon) return;
    const btnRect = btnElement.getBoundingClientRect(); const cartRect = cartIcon.getBoundingClientRect(); const flyingImg = document.createElement('img');
    flyingImg.src = imgSrc; flyingImg.className = 'flying-img'; flyingImg.style.left = `${btnRect.left}px`; flyingImg.style.top = `${btnRect.top}px`; document.body.appendChild(flyingImg);
    setTimeout(() => { flyingImg.style.left = `${cartRect.left + 15}px`; flyingImg.style.top = `${cartRect.top + 15}px`; flyingImg.style.width = '15px'; flyingImg.style.height = '15px'; flyingImg.style.opacity = '0.3'; }, 10);
    setTimeout(() => { flyingImg.remove(); cartIcon.style.transform = 'scale(1.2) rotate(-10deg)'; setTimeout(() => cartIcon.style.transform = 'scale(1) rotate(0)', 200); }, 600);
}

function agregarAlCarrito(nombre, precio, btnElement, isCross = false, imgSrc = '', esCaja = false) {
    let nombreFinal = esCaja ? `${nombre} (CAJA)` : `${nombre} (UNIDAD)`;
    
    if(carrito[nombreFinal]) carrito[nombreFinal].cantidad++; else carrito[nombreFinal] = { precio: precio, cantidad: 1 }; 
    guardarCarritoLS(); actualizarCartCount(); 
    
    if(btnElement && imgSrc) animarAlCarrito(btnElement, imgSrc);
    if(btnElement) { let iconoOriginal = btnElement.innerHTML; btnElement.innerHTML = '<i class="fa-solid fa-check"></i>'; btnElement.style.background = "#fff"; btnElement.style.color = "var(--verde-btn)"; setTimeout(() => { btnElement.innerHTML = iconoOriginal; btnElement.style.background = esCaja ? "var(--dorado)" : "var(--verde-btn)"; btnElement.style.color = esCaja ? "black" : "#fff"; }, 500); }
    
    if(!isCross && !esCaja) { let prod = inventario.find(x => x.Nombre === nombre); if(prod) { let c = prod.Cat.toUpperCase(); if(c.includes("RON") || c.includes("WHISKY") || c.includes("VODKA") || c.includes("GINEBRA") || c.includes("LICOR") || c.includes("TEQUILA")) { sugerirAcompañante(); } } }
}

function sugerirAcompañante() {
    let sugerencias = [];
    if(codigosRecomendados.length > 0) { sugerencias = inventario.filter(p => codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3); } else { sugerencias = inventario.filter(p => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3); }
    if(sugerencias.length > 0) { let cont = document.getElementById('cross-sell-items'); cont.innerHTML = ''; sugerencias.forEach(p => { let nombreB64 = codificarNombre(p.Nombre); 
        cont.innerHTML += `<div style="min-width:110px; border:1px solid var(--borde-color); border-radius:12px; padding:10px; text-align:center; background:var(--item-bg);"><img src="img/${p.codigo}.webp" onerror="imgFallback(this, '${p.codigo}')" style="height:55px; object-fit:contain; margin-bottom:5px;"><p style="font-size:10px; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--texto-oscuro);">${p.Nombre}</p><p style="font-size:13px; color:var(--dorado); font-weight:bold;">$${p.PrecioStr}</p><p style="font-size:10px; color:var(--texto-claro); margin-top:-2px;">${p.PrecioBsStr} Bs</p><button onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, 'img/${p.codigo}.webp', false); cerrarCrossSell();" style="background:var(--verde-btn); color:white; border:none; padding:8px; border-radius:8px; font-size:11px; font-weight:bold; width:100%; margin-top:5px; cursor:pointer;"><i class="fa-solid fa-plus"></i> Añadir</button></div>`; }); document.getElementById('modal-cross-sell').style.display = 'flex'; }
}

function cerrarCrossSell() { document.getElementById('modal-cross-sell').style.display = 'none'; }
function actualizarCartCount() { let t = 0; for(let k in carrito) t += carrito[k].cantidad; document.getElementById('cart-count').innerText = t; }
function vaciarCarrito() { if(confirm("¿Estás seguro de vaciar tu pedido?")) { carrito = {}; guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-cart', 'nav-home'); mostrarToast("Pedido vaciado"); } }
function abrirCarrito() { cerrarModal('all'); setActiveNav('nav-cart'); document.getElementById('modal-cart').style.display = 'flex'; renderizarCarrito(); }
function repetirPedido(index) { let hist = JSON.parse(localStorage.getItem('gc_historial')) || []; let ped = hist[index]; if(!ped) return; carrito = {}; ped.items.forEach(i => { carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad }; }); guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-perfil', 'nav-home'); abrirCarrito(); mostrarToast("Pedido cargado"); }

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito'); lista.innerHTML = ''; totalCarrito = 0;
    if(Object.keys(carrito).length === 0) { lista.innerHTML = `<div style="text-align: center; padding: 50px 20px; color: var(--texto-claro);"><i class="fa-solid fa-cart-shopping" style="font-size: 60px; opacity: 0.2; margin-bottom: 20px;"></i><h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">Tu carrito está vacío</h3><p style="font-size: 13px; margin-top: 5px;">Agrega unas botellas para empezar.</p><button onclick="cerrarModal('modal-cart', 'nav-home')" class="btn-enviar" style="width: auto; padding: 10px 25px; margin-top: 20px; display: inline-block;">Ir a la tienda</button></div>`; document.getElementById('checkout-sections').style.display = 'none'; return; }
    document.getElementById('checkout-sections').style.display = 'block'; 
    for(let nombre in carrito) { 
        let nombreB64 = codificarNombre(nombre); let item = carrito[nombre]; let sub = item.precio * item.cantidad; totalCarrito += sub; 
        lista.innerHTML += `<div class="cart-item"><div class="cart-item-info"><p class="cart-item-title">${nombre}</p><p class="cart-item-price">$${item.precio.toFixed(2)} <span style="font-size:11px; color:var(--texto-claro); font-weight:normal;">/ ${(item.precio * tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs</span></p></div><div class="cart-controls"><button class="cart-btn" onclick="cambiarCantB64('${nombreB64}', -1)">-</button><span style="font-size:13px; font-weight:bold; width:15px; text-align:center;">${item.cantidad}</span><button class="cart-btn" onclick="cambiarCantB64('${nombreB64}', 1)">+</button></div></div>`; 
    }
    document.getElementById('totalUsdModal').innerText = `$${totalCarrito.toFixed(2)}`; document.getElementById('totalBsModal').innerText = `${(totalCarrito * tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; calcularVuelto();
}

function cambiarCant(n, delta) { carrito[n].cantidad += delta; if(carrito[n].cantidad <= 0) delete carrito[n]; guardarCarritoLS(); actualizarCartCount(); renderizarCarrito(); }
function toggleDireccion() { let met = document.querySelector('input[name="metodoEntrega"]:checked').value; let dirInput = document.getElementById('direccionDelivery'), btnMap = document.getElementById('btnMap'); if(met === 'Delivery') { dirInput.style.display = 'block'; btnMap.style.display = 'none'; if(localStorage.getItem('gc_direccion') && !dirInput.value) dirInput.value = localStorage.getItem('gc_direccion'); } else { dirInput.style.display = 'none'; btnMap.style.display = 'block'; } }
function abrirMapa() { window.open('https://maps.app.goo.gl/3X5v2X5x2X5x2X5x2', '_blank'); } 
function actualizarMetodoPago() { 
    let val = document.getElementById('metodoPagoSelect').value; 
    document.getElementById('box-efectivo').style.display = (val === 'Efectivo') ? 'block' : 'none'; 
    let boxPm = document.getElementById('box-pagomovil'); if(boxPm) boxPm.style.display = (val === 'Pago Movil') ? 'block' : 'none';
    let boxZ = document.getElementById('box-zelle'); if(boxZ) boxZ.style.display = (val === 'Zelle') ? 'block' : 'none';
}
function calcularVuelto() { let pago = parseFloat(document.getElementById('montoPago').value) || 0; let res = document.getElementById('res-vuelto'); if(pago > totalCarrito) { let vUsd = pago - totalCarrito; let vBs = vUsd * tasaOficial; res.style.display = 'block'; res.style.color = 'var(--verde-btn)'; res.innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; } else { res.style.display = 'none'; } }
function mostrarToast(msg) { const cont = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }

function enviarPedido() {
    if(Object.keys(carrito).length === 0) return alert("Tu carrito está vacío.");
    if(!isTiendaAbierta) return alert("Lo sentimos, Gran Catador está cerrado en este momento.");
    let historial = JSON.parse(localStorage.getItem('gc_historial')) || []; let fechaDate = new Date(); let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'});
    let nuevoPedido = { fecha: fechaStr, total: totalCarrito, items: Object.keys(carrito).map(k => ({ nombre: k, precio: carrito[k].precio, cantidad: carrito[k].cantidad })) };
    historial.unshift(nuevoPedido); if(historial.length > 5) historial.pop(); localStorage.setItem('gc_historial', JSON.stringify(historial));
    let nombreUser = localStorage.getItem('gc_nombre') || 'un cliente nuevo'; let msg = `🔥 *NUEVO PEDIDO - GRAN CATADOR* 🔥\n\n👤 *Cliente:* ${nombreUser}\n--------------------------------\n`;
    for(let nombre in carrito) { msg += `▪ ${carrito[nombre].cantidad}x ${nombre}\n`; } msg += `--------------------------------\n`;
    let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value; msg += `📦 *Entrega:* ${entrega}\n`;
    if(entrega === 'Delivery') { let dir = document.getElementById('direccionDelivery').value.trim(); if(!dir) return alert("Por favor, ingresa tu dirección para el delivery."); msg += `📍 *Dirección:* ${dir}\n`; if(!localStorage.getItem('gc_direccion')) localStorage.setItem('gc_direccion', dir); }
    let notas = document.getElementById('notasPedido').value.trim(); if(notas) msg += `📝 *Notas:* ${notas}\n`;
    let metodo = document.getElementById('metodoPagoSelect').value; msg += `💳 *Método de Pago:* ${metodo}\n`;
    if(metodo === 'Efectivo') { let pago = parseFloat(document.getElementById('montoPago').value) || 0; if(pago > totalCarrito) { msg += `💵 _Paga con $${pago.toFixed(2)}_\n🟢 _Requiere vuelto: $${(pago - totalCarrito).toFixed(2)}_\n`; } } else { msg += `📎 _[Capture adjunto en el siguiente mensaje]_\n`; }
    msg += `\n💰 *TOTAL A PAGAR: $${totalCarrito.toFixed(2)}*\n💱 _(Tasa BCV: ${tasaOficial.toFixed(2)} Bs)_`; 
    carrito = {}; guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-cart', 'nav-home'); window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank');
}

function agregarAlCarritoB64(b64, p, btn, c = false, img = '', esCaja = false) { agregarAlCarrito(decodificarNombre(b64), p, btn, c, img, esCaja); }
function compartirProductoB64(b64, p) { compartirProducto(decodificarNombre(b64), p); }
function cambiarCantB64(b64, d) { cambiarCant(decodificarNombre(b64), d); }

window.onload = cargarInventario;
