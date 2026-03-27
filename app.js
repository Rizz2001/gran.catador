// --- VARIABLES GLOBALES ---
let inventario = []; 
// Carrito Persistente: Lee de localStorage o inicia vacío
let carrito = JSON.parse(localStorage.getItem('gc_cart')) || {}; 
let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || []; 
let tasaOficial = 36.25; let totalCarrito = 0; let categoriaActual = 'LICORES'; let debounceTimer; 
let isTiendaAbierta = true; let codigosRecomendados = []; let siempreDisponibles = []; 
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

// Aplicar Modo Oscuro al inicio si está activado
if(localStorage.getItem('gc_dark') === 'true') document.body.classList.add('dark-mode');

// --- PWA (INSTALACIÓN) ---
let promptInstalacion;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); promptInstalacion = e;
    document.getElementById('pwa-banner').style.display = 'block';
});
function instalarApp() {
    if(promptInstalacion) { promptInstalacion.prompt(); promptInstalacion.userChoice.then(() => { document.getElementById('pwa-banner').style.display = 'none'; promptInstalacion = null; }); }
}
if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js'); }); }

// --- AGE GATE (CONTROL DE EDAD) ---
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

// --- CHECK HORARIO DE TIENDA ---
function checkHorario() {
    let d = new Date();
    let formatter = new Intl.DateTimeFormat('es-VE', { hour: 'numeric', hour12: false, timeZone: 'America/Caracas' });
    let horaCaracas = parseInt(formatter.format(d));
    let badge = document.getElementById('store-status'), btnWs = document.getElementById('btn-whatsapp'), msgCerrado = document.getElementById('msg-cerrado');
    // Horario: 8:00 AM a 8:59 PM
    if(horaCaracas >= 8 && horaCaracas < 21) {
        isTiendaAbierta = true; badge.innerHTML = "🟢 ABIERTO"; badge.style.background = "rgba(37, 211, 102, 0.2)"; badge.style.color = "#25D366"; badge.style.borderColor = "rgba(37, 211, 102, 0.4)";
        if(btnWs) btnWs.classList.remove('disabled'); if(msgCerrado) msgCerrado.style.display = "none";
    } else {
        isTiendaAbierta = false; badge.innerHTML = "🔴 CERRADO"; badge.style.background = "rgba(234, 67, 53, 0.2)"; badge.style.color = "#ea4335"; badge.style.borderColor = "rgba(234, 67, 53, 0.4)";
        if(btnWs) btnWs.classList.add('disabled'); if(msgCerrado) msgCerrado.style.display = "block";
    }
}
checkHorario(); setInterval(checkHorario, 60000);

// --- CARGA DE DATOS EXTERNOS (PANEL DE CONTROL PROFESIONAL) ---
async function obtenerArchivosExternos() {
    // 1. Tasa BCV (tasa.txt)
    try {
        let resTasa = await fetch('tasa.txt?v=' + new Date().getTime());
        if (resTasa.ok) { let texto = await resTasa.text(); tasaOficial = parseFloat(texto.replace(',', '.')); }
    } catch (error) { console.log("Error leyendo tasa.txt, usando respaldo."); }
    document.getElementById('tasaValor').innerText = tasaOficial.toFixed(2) + " Bs";

    // 2. Códigos Recomendados (recomendados.txt) - Ventas Cruzadas
    try {
        let resRec = await fetch('recomendados.txt?v=' + new Date().getTime());
        if (resRec.ok) { 
            let textoRec = await resRec.text(); 
            codigosRecomendados = textoRec.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); 
        }
    } catch (error) { console.log("No se encontró recomendados.txt o está vacío."); }

    // 3. Productos Forzados Disponibles (disponibles.txt) - Aunque no haya stock en CSV
    try {
        let resDisp = await fetch('disponibles.txt?v=' + new Date().getTime());
        if (resDisp.ok) { 
            let textoDisp = await resDisp.text(); 
            siempreDisponibles = textoDisp.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); 
        }
    } catch (error) { console.log("No se encontró disponibles.txt o está vacío."); }
}

// --- OPTIMIZACIÓN DE IMÁGENES (WebP ready) Y FALLBACK ---
function imgFallback(imgElement, codigoProducto) {
    let attempts = imgElement.dataset.attempts ? parseInt(imgElement.dataset.attempts) : 0;
    // Formatos a probar en orden: webp (más rápido), jpg, png
    const formatos = ['webp', 'jpg', 'png', 'jpeg']; 
    attempts++;
    if (attempts < formatos.length) { 
        imgElement.dataset.attempts = attempts; 
        imgElement.src = `img/${codigoProducto}.${formatos[attempts]}`; 
    } else { 
        imgElement.src = 'logo.png'; // Imagen por defecto final
        imgElement.onerror = null; 
    }
}

// --- LECTURA DE INVENTARIO CSV (FoxData) ---
const fetchCSV = (u) => new Promise((resolve, reject) => { Papa.parse(u, { download: true, encoding: "latin-1", complete: (r) => resolve(r.data), error: (err) => reject(err) }) });
function limpiarCategoria(texto) { if(!texto) return "Otros"; return texto.trim().replace(/\s+/g, ' ').toUpperCase(); }

async function cargarInventario() {
    await obtenerArchivosExternos(); toggleDireccion(); // Carga tasa y configuraciones
    
    try {
        const [pRaw, sRaw] = await Promise.all([ fetchCSV("Inventario Fisico general precio por unidad.csv"), fetchCSV("inventario por existencia.csv") ]);
        let mapa = {};
        
        // Procesar Precios y Nombres
        pRaw.forEach(r => {
            if (r.length >= 5) {
                let cod = r[r.length-4]?.trim(), usd = r[r.length-1]?.trim();
                let catLimpia = limpiarCategoria(r[r.length-5]);
                // Excluir categorías de prueba
                if (catLimpia === "CHARCUTERIA" || catLimpia === "FRUTERIA") return; 
                if (cod && !isNaN(cod) && usd?.includes(',')) {
                    mapa[cod] = { codigo: cod, Nombre: r[r.length-3]?.trim(), Cat: catLimpia, PrecioStr: usd, PrecioNum: parseFloat(usd.replace('.','').replace(',','.')), StockNum: 0, StockStr: "0,00" };
                }
            }
        });

        // Procesar Existencias
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

        // TRUCO DE DISPONIBILIDAD FORZADA (disponibles.txt)
        Object.values(mapa).forEach(prod => {
            if (siempreDisponibles.includes(prod.codigo)) { 
                prod.StockNum = 999; prod.StockStr = "Disponible"; // Engañamos al sistema
            }
        });

        inventario = Object.values(mapa).filter(p => p.Nombre);
        actualizarCartCount(); // Actualiza contador si había carrito guardado
        generarCategorias(); aplicarFiltros(); 
    
    } catch(e) { 
        document.getElementById('lista-productos').innerHTML = '<p style="text-align:center; grid-column:span 2; color: red; margin-top: 50px; font-weight:800;">Error al leer inventario. Intenta recargar.</p>'; 
    }
}

// --- BÚSQUEDA INTELIGENTE CON AUTOCUMPLETADO (NUEVO PROFESIONAL) ---
function levenshtein(a,b){const m=[];for(let i=0;i<=b.length;i++)m[i]=[i];for(let j=0;j<=a.length;j++)m[0][j]=j;for(let i=1;i<=b.length;i++){for(let j=1;j<=a.length;j++){if(b.charAt(i-1)===a.charAt(j-1)){m[i][j]=m[i-1][j-1];}else{m[i][j]=Math.min(m[i-1][j-1]+1,Math.min(m[i][j-1]+1,m[i-1][j]+1));}}}return m[b.length][a.length];}
function quitarAcentos(texto) { return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

function debounceBusqueda(event) {
    clearTimeout(debounceTimer);
    const query = event.target.value.trim();
    if(query.length < 2) { cerrarSugerencias(); aplicarFiltros(); return; }
    debounceTimer = setTimeout(() => mostrarSugerencias(query), 300);
}

function mostrarSugerencias(q) {
    let queryLimpia = quitarAcentos(q);
    // Filtrar inventario con stock para sugerencias
    let coincidencias = inventario.filter(p => p.StockNum > 0 && quitarAcentos(p.Nombre).includes(queryLimpia)).slice(0, 5);
    
    const cont = document.getElementById('search-suggestions');
    if(coincidencias.length === 0) { cerrarSugerencias(); aplicarFiltros(); return; }
    
    cont.innerHTML = '';
    coincidencias.forEach(p => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `<img src="img/${p.codigo}.webp" onerror="imgFallback(this, '${p.codigo}')" alt="${p.Nombre}"><span>${p.Nombre}</span>`;
        div.onclick = () => {
            document.getElementById('buscador').value = p.Nombre;
            cerrarSugerencias();
            aplicarFiltros(); // Filtra para mostrar solo ese producto
        };
        cont.appendChild(div);
    });
    cont.style.display = 'block';
}
function cerrarSugerencias() { document.getElementById('search-suggestions').style.display = 'none'; }
// Cerrar sugerencias si se hace clic afuera
document.addEventListener('click', (e) => { if(!e.target.closest('.search-container')) cerrarSugerencias(); });


function filtrarCategoria(cat, btn) { categoriaActual = cat; document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); if(btn) btn.classList.add('active'); aplicarFiltros(); }
function toggleFav(codigo) { let index = favoritos.indexOf(codigo); if(index === -1) { favoritos.push(codigo); mostrarToast("Agregado a favoritos ❤️"); } else { favoritos.splice(index, 1); } localStorage.setItem('gc_favs', JSON.stringify(favoritos)); aplicarFiltros(); }
function compartirProducto(nombre, precio) { if (navigator.share) { navigator.share({ title: 'Gran Catador', text: `¡Mira esta bebida! ${nombre} a solo $${precio}.`, url: window.location.href }); } else { mostrarToast("Tu navegador no soporta esta función."); } }

// --- FILTROS Y RENDERIZADO (UI PREMIUN) ---
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
                return words.some(w => levenshtein(term, w) <= (term.length > 4 ? 2 : 1));
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

    // ESTADO VACÍO PROFESIONAL
    if(productosFiltradosGlobal.length === 0) { 
        cont.innerHTML = `
            <div style="grid-column: span 2; text-align: center; padding: 60px 20px; color: var(--texto-claro);">
                <i class="fa-solid fa-wine-glass-empty" style="font-size: 80px; opacity: 0.2; margin-bottom: 25px;"></i>
                <h3 style="color: var(--texto-oscuro); font-size: 19px; font-weight: 800; letter-spacing:1px;">¿Aún no tienes sed?</h3>
                <p style="font-size: 13px; margin-top: 8px; font-weight:500;">No encontramos botellas en esta sección.</p>
                <button onclick="irInicio()" class="cat-btn active" style="margin: 25px auto 0 auto; padding: 12px 25px;">Ver todo el catálogo</button>
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
            <img loading="lazy" src="img/${p.codigo}.webp" data-attempts="0" onerror="imgFallback(this, '${p.codigo}')" alt="${p.Nombre}">
            <h3 class="producto-titulo">${p.Nombre}</h3><p class="producto-stock">Disp: ${p.StockStr}</p><p class="producto-precio">$${p.PrecioStr}</p>
            <button class="btn-share" onclick="compartirProducto('${p.Nombre}', '${p.PrecioStr}')"><i class="fa-solid fa-share-nodes"></i></button>
            <button class="btn-add ${isAgotado ? 'disabled' : ''}" ${isAgotado ? 'disabled' : `onclick="agregarAlCarrito('${p.Nombre}', ${p.PrecioNum}, this)"`}><i class="fa-solid fa-cart-plus"></i></button>
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
    cont.innerHTML = '';
    
    // Botón Todos
    let btnTodos = document.createElement('button'); btnTodos.className = (categoriaActual === 'Todos') ? "cat-btn active" : "cat-btn"; btnTodos.innerText = "Todos"; btnTodos.onclick = function() { filtrarCategoria('Todos', this); }; cont.appendChild(btnTodos);
    
    // Botón Favoritos ❤️
    let btnFav = document.createElement('button'); btnFav.className = (categoriaActual === 'Favoritos') ? "cat-btn active" : "cat-btn"; btnFav.innerHTML = "❤️ Mis Favoritos"; btnFav.style.borderColor = "#ff4757"; btnFav.style.color = "#ff4757"; btnFav.onclick = function() { filtrarCategoria('Favoritos', this); }; cont.appendChild(btnFav);
    
    // Categorías del CSV
    categorias.forEach(c => { 
        let b = document.createElement('button'); b.className = (c === categoriaActual) ? "cat-btn active" : "cat-btn"; b.innerText = c; b.onclick = function() { filtrarCategoria(c, this); }; cont.appendChild(b); 
    });

    // Auto-scroll al botón activo
    setTimeout(() => { let activeBtn = cont.querySelector('.active'); if(activeBtn) activeBtn.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"}); }, 150);
}

// --- NAVEGACIÓN ---
function setActiveNav(id) { document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active')); const el = document.getElementById(id); if(el) el.classList.add('active'); }

function irInicio() { 
    cerrarModal('all'); setActiveNav('nav-home'); window.scrollTo({top: 0, behavior: 'smooth'}); 
    document.getElementById('buscador').value = ''; document.getElementById('chkAgotados').checked = false; cerrarSugerencias();
    // Activar LICORES por defecto al inicio
    const btnLicores = Array.from(document.querySelectorAll('.cat-btn')).find(b => b.innerText === 'LICORES');
    filtrarCategoria('LICORES', btnLicores); 
}

// --- PERFIL Y AJUSTES ---
function abrirPerfil() { 
    cerrarModal('all'); setActiveNav('nav-user'); document.getElementById('modal-perfil').style.display = 'flex'; 
    document.getElementById('perfilNombre').value = localStorage.getItem('gc_nombre') || ''; 
    document.getElementById('perfilDireccion').value = localStorage.getItem('gc_direccion') || ''; 
    
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || [];
    let listCont = document.getElementById('historial-lista');
    if(hist.length === 0) { listCont.innerHTML = '<p style="font-size:12px; color:gray; text-align:center; padding:10px;">Aún no tienes pedidos registrados.</p>'; } 
    else {
        listCont.innerHTML = '';
        hist.forEach((ped, index) => {
            let itemsT = ped.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ');
            listCont.innerHTML += `
                <div style="border:1px solid var(--borde-color); padding:15px; border-radius:15px; margin-bottom:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); background: rgba(0,0,0,0.01);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-size:11px; font-weight:700; color:var(--dorado); font-family:var(--fuente-tecnica);">${ped.fecha}</span>
                        <span style="font-size:14px; font-weight:800; font-family:var(--fuente-tecnica);">$${ped.total.toFixed(2)}</span>
                    </div>
                    <p style="font-size:11px; color:var(--texto-claro); margin-bottom:12px; line-height:1.4; font-weight:500;">${itemsT}</p>
                    <button onclick="repetirPedido(${index})" style="background:var(--azul-rey); color:white; border:none; padding:10px; width:100%; border-radius:10px; font-size:12px; font-weight:700; cursor:pointer; text-transform:uppercase; letter-spacing:1px;"><i class="fa-solid fa-rotate-right"></i> Repetir este pedido</button>
                </div>
            `;
        });
    }
}

function guardarPerfil() { localStorage.setItem('gc_nombre', document.getElementById('perfilNombre').value); localStorage.setItem('gc_direccion', document.getElementById('perfilDireccion').value); mostrarToast("Datos guardados ✅"); cerrarModal('modal-perfil', 'nav-home'); }
function abrirAjustes() { cerrarModal('all'); setActiveNav('nav-settings'); document.getElementById('modal-ajustes').style.display = 'flex'; document.getElementById('toggleDarkMode').checked = document.body.classList.contains('dark-mode'); }
function toggleDark() { document.body.classList.toggle('dark-mode'); localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode')); }

function cerrarModal(modalId) { 
    if(modalId === 'all') { document.querySelectorAll('.modal-fullscreen').forEach(m => m.style.display = 'none'); return; }
    const m = document.getElementById(modalId); if(m) m.style.display = 'none'; setActiveNav('nav-home'); 
}

// --- CARRITO PERSISTENTE (localStorage) ---
function guardarCarritoLS() { localStorage.setItem('gc_cart', JSON.stringify(carrito)); }

function agregarAlCarrito(nombre, precio, btnElement, isCross = false) {
    if(carrito[nombre]) carrito[nombre].cantidad++; else carrito[nombre] = { precio: precio, cantidad: 1 };
    guardarCarritoLS(); actualizarCartCount(); 
    // Feedback visual en botón
    if(btnElement) {
        let iconoOriginal = btnElement.innerHTML; btnElement.innerHTML = '<i class="fa-solid fa-check"></i>'; btnElement.style.background = "#fff"; btnElement.style.color = "var(--verde-btn)"; btnElement.style.borderColor = "var(--verde-btn)";
        setTimeout(() => { btnElement.innerHTML = iconoOriginal; btnElement.style.background = "var(--verde-btn)"; btnElement.style.color = "#fff"; btnElement.style.borderColor = "transparent"; }, 600);
    } else { mostrarToast("Añadido ✅"); }

    // Sugerencia Cruzada (si compra licor fuerte)
    if(!isCross) {
        let prod = inventario.find(x => x.Nombre === nombre);
        if(prod) {
            let c = prod.Cat.toUpperCase();
            if(c.includes("RON") || c.includes("WHISKY") || c.includes("VODKA") || c.includes("GINEBRA") || c.includes("LICOR") || c.includes("TEQUILA")) { sugerirAcompañante(); }
        }
    }
}

// VENTAS CRUZADAS INTELIGENTES (Panel de Control)
function sugerirAcompañante() {
    let sugerencias = [];
    // Si hay códigos en recomendados.txt, los usamos
    if(codigosRecomendados.length > 0) {
        sugerencias = inventario.filter(p => codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3);
    } else {
        // Fallback si recomendados.txt está vacío
        sugerencias = inventario.filter(p => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3);
    }

    if(sugerencias.length > 0) {
        let cont = document.getElementById('cross-sell-items'); cont.innerHTML = '';
        sugerencias.forEach(p => {
            cont.innerHTML += `
                <div style="min-width:115px; border:1px solid var(--borde-color); border-radius:18px; padding:12px; text-align:center; background:var(--item-bg);">
                    <img src="img/${p.codigo}.webp" onerror="imgFallback(this, '${p.codigo}')" style="height:55px; object-fit:contain; margin-bottom:5px;">
                    <p style="font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--texto-oscuro);">${p.Nombre}</p>
                    <p style="font-size:14px; color:var(--dorado); font-weight:800; font-family:var(--fuente-tecnica);">$${p.PrecioStr}</p>
                    <button onclick="agregarAlCarrito('${p.Nombre}', ${p.PrecioNum}, null, true); cerrarCrossSell();" style="background:var(--verde-btn); color:white; border:none; padding:8px; border-radius:10px; font-size:11px; font-weight:800; width:100%; margin-top:8px; cursor:pointer; text-transform:uppercase;"><i class="fa-solid fa-plus"></i> Añadir</button>
                </div>
            `;
        });
        document.getElementById('modal-cross-sell').style.display = 'flex';
    }
}
function cerrarCrossSell() { document.getElementById('modal-cross-sell').style.display = 'none'; }

function actualizarCartCount() { let t = 0; for(let k in carrito) t += carrito[k].cantidad; document.getElementById('cart-count').innerText = t; }
function vaciarCarrito() { if(confirm("¿Estás seguro de vaciar tu pedido? 🗑️")) { carrito = {}; guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-cart', 'nav-home'); mostrarToast("Pedido vaciado"); } }

function abrirCarrito() { 
    cerrarModal('all'); setActiveNav('nav-cart'); 
    document.getElementById('modal-cart').style.display = 'flex'; renderizarCarrito(); 
}

function repetirPedido(index) {
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || [];
    let ped = hist[index]; if(!ped) return;
    carrito = {}; ped.items.forEach(i => { carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad }; });
    guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-perfil', 'nav-home'); abrirCarrito(); mostrarToast("Pedido cargado ✅");
}

function renderizarCarrito() {
    const lista = document.getElementById('lista-carrito'); lista.innerHTML = ''; totalCarrito = 0;
    
    // ESTADO VACÍO CARRITO
    if(Object.keys(carrito).length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 70px 20px; color: var(--texto-claro);">
                <i class="fa-solid fa-cart-arrow-down" style="font-size: 80px; opacity: 0.15; margin-bottom: 25px;"></i>
                <h3 style="color: var(--texto-oscuro); font-size: 19px; font-weight: 800; letter-spacing:1px;">Tu carrito está seco</h3>
                <p style="font-size: 13px; margin-top: 8px; font-weight:500;">Agrega unas botellas para empezar la rumba.</p>
                <button onclick="cerrarModal('modal-cart', 'nav-home')" class="btn-enviar" style="width: auto; padding: 12px 30px; margin-top: 30px; display: inline-block;">Ir a la tienda</button>
            </div>`;
        document.getElementById('checkout-sections').style.display = 'none'; return;
    }
    
    document.getElementById('checkout-sections').style.display = 'block'; 
    
    for(let nombre in carrito) {
        let item = carrito[nombre]; let sub = item.precio * item.cantidad; totalCarrito += sub;
        lista.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <p class="cart-item-title">${nombre}</p>
                    <p class="cart-item-price">$${item.precio.toFixed(2)}</p>
                </div>
                <div class="cart-controls">
                    <button class="cart-btn" onclick="cambiarCant('${nombre}', -1)">-</button>
                    <span style="font-size:14px; font-weight:800; font-family:var(--fuente-tecnica); width:20px; text-align:center;">${item.cantidad}</span>
                    <button class="cart-btn" onclick="cambiarCant('${nombre}', 1)">+</button>
                </div>
            </div>`;
    }
    document.getElementById('totalUsdModal').innerText = `$${totalCarrito.toFixed(2)}`; 
    document.getElementById('totalBsModal').innerText = `${(totalCarrito * tasaOficial).toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; 
    calcularVuelto();
}
function cambiarCant(n, delta) { carrito[n].cantidad += delta; if(carrito[n].cantidad <= 0) delete carrito[n]; guardarCarritoLS(); actualizarCartCount(); renderizarCarrito(); }

// --- CHECKOUT Y TRADUCTOR WHATSAPP (CORREGIDO) ---
function toggleDireccion() { 
    let met = document.querySelector('input[name="metodoEntrega"]:checked').value; 
    let dirInput = document.getElementById('direccionDelivery'), btnMap = document.getElementById('btnMap'); 
    if(met === 'Delivery') { 
        dirInput.style.display = 'block'; btnMap.style.display = 'none'; 
        if(localStorage.getItem('gc_direccion') && !dirInput.value) dirInput.value = localStorage.getItem('gc_direccion'); 
    } else { dirInput.style.display = 'none'; btnMap.style.display = 'block'; } 
}
function abrirMapa() { window.open('https://maps.app.goo.gl/3X5v2X5x2X5x2X5x2', '_blank'); } // Reemplaza por tu link real de Google Maps
function actualizarMetodoPago() { let val = document.getElementById('metodoPagoSelect').value; document.getElementById('box-efectivo').style.display = (val === 'Efectivo') ? 'block' : 'none'; }
function calcularVuelto() { 
    let pago = parseFloat(document.getElementById('montoPago').value) || 0; 
    let res = document.getElementById('res-vuelto'); 
    if(pago > totalCarrito) { 
        let vUsd = pago - totalCarrito; let vBs = vUsd * tasaOficial; 
        res.style.display = 'block'; res.style.color = 'var(--verde-btn)'; 
        res.innerHTML = `Vuelto: <b>$${vUsd.toFixed(2)}</b> / ${vBs.toLocaleString('es-VE', {minimumFractionDigits:2})} Bs`; 
    } else { res.style.display = 'none'; } 
}
function mostrarToast(msg) { const cont = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }

// EL ENVÍO PROFESIONAL DEFINITIVO (Sin errores de formato)
function enviarPedido() {
    if(Object.keys(carrito).length === 0) return alert("Tu carrito está vacío.");
    if(!isTiendaAbierta) return alert("Lo sentimos, Gran Catador está cerrado en este momento.");
    
    // 1. Guardar en Historial
    let historial = JSON.parse(localStorage.getItem('gc_historial')) || []; let fechaDate = new Date(); let fechaStr = fechaDate.toLocaleDateString('es-VE') + " - " + fechaDate.toLocaleTimeString('es-VE', {hour:'2-digit', minute:'2-digit'});
    let nuevoPedido = { fecha: fechaStr, total: totalCarrito, items: Object.keys(carrito).map(k => ({ nombre: k, precio: carrito[k].precio, cantidad: carrito[k].cantidad })) };
    historial.unshift(nuevoPedido); if(historial.length > 5) historial.pop(); localStorage.setItem('gc_historial', JSON.stringify(historial));

    // 2. Armar el mensaje con saltos de línea (\n)
    let nombreUser = localStorage.getItem('gc_nombre') || 'un cliente nuevo'; 
    let msg = `🔥 *NUEVO PEDIDO - GRAN CATADOR* 🔥\n\n`;
    msg += `👤 *Cliente:* ${nombreUser}\n`;
    msg += `--------------------------------\n`;
    
    for(let nombre in carrito) { 
        msg += `▪ ${carrito[nombre].cantidad}x ${nombre}\n`; 
    }
    
    msg += `--------------------------------\n`;
    let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value; 
    msg += `📦 *Entrega:* ${entrega}\n`;
    
    if(entrega === 'Delivery') { 
        let dir = document.getElementById('direccionDelivery').value.trim(); 
        if(!dir) return alert("Por favor, ingresa tu dirección exacta para el delivery."); 
        msg += `📍 *Dirección:* ${dir}\n`; 
        if(!localStorage.getItem('gc_direccion')) localStorage.setItem('gc_direccion', dir); 
    }
    
    let notas = document.getElementById('notasPedido').value.trim(); if(notas) msg += `📝 *Notas:* ${notas}\n`;
    
    let metodo = document.getElementById('metodoPagoSelect').value; 
    msg += `💳 *Método de Pago:* ${metodo}\n`;
    
    if(metodo === 'Efectivo') { 
        let pago = parseFloat(document.getElementById('montoPago').value) || 0; 
        if(pago > totalCarrito) { 
            msg += `💵 _Paga con $${pago.toFixed(2)}_\n🟢 _Requiere vuelto: $${(pago - totalCarrito).toFixed(2)}_\n`; 
        } 
    } else { msg += `📎 _[Capture adjunto en el siguiente mensaje]_\n`; }
    
    msg += `\n💰 *TOTAL A PAGAR: $${totalCarrito.toFixed(2)}*\n`; 
    msg += `💱 _(Tasa BCV: ${tasaOficial.toFixed(2)} Bs)_`; 
    
    // 3. Vaciar carrito y guardar
    carrito = {}; guardarCarritoLS(); actualizarCartCount(); cerrarModal('modal-cart', 'nav-home');
    
    // 4. LA MAGIA: encodeURIComponent traduce espacios y símbolos (\n) a formato URL seguro
    let urlSegura = `https://wa.me/584245496366?text=${encodeURIComponent(msg)}`;
    window.open(urlSegura, '_blank');
}

// INICIO DE LA APP
window.onload = cargarInventario;
