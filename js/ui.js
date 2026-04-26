/**
 * ui.js - Manejo de la Interfaz de Usuario (DOM) y Eventos Visuales
 */

// --- VERIFICACIÓN DE EDAD Y HORARIO ---
if (localStorage.getItem('ageVerified') === 'true') { 
    let ag = document.getElementById('age-gate'); 
    if (ag) ag.style.display = 'none'; 
}

/** Valida si el usuario cumple con la edad mínima (18 años) */
function verificarEdad() {
    let d = document.getElementById('age-d').value;
    let m = document.getElementById('age-m').value;
    let y = document.getElementById('age-y').value;
    let err = document.getElementById('age-error');
    
    let dia = Number(d), mes = Number(m), ano = Number(y);
    
    if (!dia || !mes || !ano || dia > 31 || mes > 12 || ano < 1900) { 
        err.innerText = "Ingresa una fecha válida."; 
        err.style.display = "block"; 
        return; 
    }
    
    let birth = new Date(ano, mes - 1, dia);
    if (birth.getFullYear() !== ano || birth.getMonth() !== mes - 1 || birth.getDate() !== dia) { 
        err.innerText = "Ingresa una fecha válida."; 
        err.style.display = "block"; 
        return; 
    }
    
    let today = new Date(); 
    let age = today.getFullYear() - birth.getFullYear();
    let mDiff = today.getMonth() - birth.getMonth();
    
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    
    if (age >= 18) { 
        localStorage.setItem('ageVerified', 'true'); 
        document.getElementById('age-gate').style.display = 'none'; 
    } else { 
        err.innerText = "Lo sentimos, debes ser mayor de 18 años."; 
        err.style.display = "block"; 
    }
}

/** Verifica si la tienda se encuentra en horario laboral */
function checkHorario() {
    try {
        let d = new Date();
        let formatter = new Intl.DateTimeFormat('es-VE', { hour: 'numeric', hour12: false, timeZone: 'America/Caracas' });
        let horaCaracas = parseInt(formatter.format(d));
        let badge = document.getElementById('store-status');
        let btnWs = document.getElementById('btn-whatsapp');
        let msgCerrado = document.getElementById('msg-cerrado');
        
        if (!badge) return;
        
        if (horaCaracas >= 8 && horaCaracas < 21) {
            isTiendaAbierta = true;
            appState.isTiendaAbierta = true;
            badge.innerHTML = "🟢 ABIERTO";
            badge.style.background = "rgba(37, 211, 102, 0.2)";
            badge.style.color = "#25D366";
            badge.style.borderColor = "rgba(37, 211, 102, 0.4)";
            if (btnWs) btnWs.classList.remove('disabled');
            if (msgCerrado) msgCerrado.style.display = "none";
        } else {
            isTiendaAbierta = false;
            appState.isTiendaAbierta = false;
            badge.innerHTML = "🔴 CERRADO";
            badge.style.background = "rgba(234, 67, 53, 0.2)";
            badge.style.color = "#ea4335";
            badge.style.borderColor = "rgba(234, 67, 53, 0.4)";
            if (btnWs) btnWs.classList.add('disabled');
            if (msgCerrado) msgCerrado.style.display = "block";
        }
    } catch(e) { console.log("Error en horario"); }
}

checkHorario(); 
setInterval(checkHorario, 60000);

// --- NAVEGACIÓN Y MODALES ---
/** Marca como activo el ícono correspondiente en la barra de navegación inferior */
function setActiveNav(id) { 
    document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active')); 
    const el = document.getElementById(id); 
    if(el) el.classList.add('active'); 
}

/** Restablece la vista al menú principal (Inicio) */
function irInicio() { 
    cerrarModal('all'); 
    setActiveNav('nav-home'); 
    window.scrollTo({top: 0, behavior: 'smooth'}); 
    
    document.getElementById('buscador').value = ''; 
    document.getElementById('chkAgotados').checked = false; 
    cerrarSugerencias(); 
    subcategoriaActual = null; 
    
    let subcatSection = document.getElementById('subcategoria-section-main'); 
    if(subcatSection) subcatSection.style.display = 'none'; 
    
    let btnInicio = Array.from(document.querySelectorAll('.cat-btn')).find(b => b.innerText.includes('Inicio')); 
    if(btnInicio) filtrarCategoria('Todos', btnInicio); 
    else filtrarCategoria('Todos', document.querySelectorAll('.cat-btn')[0]); 
    
    let mTitle = document.getElementById('mobile-header-title');
    if(mTitle) mTitle.innerText = 'Inicio';
}

/** Limpia instantáneamente la barra de búsqueda y refresca los productos */
window.limpiarBuscador = function() {
    let input = document.getElementById('buscador');
    if (input) input.value = '';
    document.getElementById('clear-search').style.display = 'none';
    cerrarSugerencias();
    aplicarFiltros();
}

function abrirLegales() { 
    document.getElementById('modal-legales').style.display = 'flex'; 
}

function abrirSoporteWhatsApp() { 
    let msg = "Hola, necesito ayuda con la plataforma de Gran Catador."; 
    window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank'); 
}

/** Abre la vista de perfil y dibuja el historial de pedidos */
function abrirPerfil() { 
    cerrarModal('all'); 
    setActiveNav('nav-user'); 
    document.getElementById('modal-perfil').style.display = 'flex'; 
    document.getElementById('perfilNombre').value = localStorage.getItem('gc_nombre') || ''; 
    document.getElementById('perfilDireccion').value = localStorage.getItem('gc_direccion') || ''; 
    
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || []; 
    let listCont = document.getElementById('historial-lista'); 
    
    if (hist.length === 0) { 
        listCont.innerHTML = '<p style="font-size:12px; color:gray; text-align:center;">Aún no tienes pedidos registrados.</p>'; 
    } else { 
        let htmlHistorial = '';
        hist.forEach((ped, index) => { 
            let itemsT = ped.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', '); 
            htmlHistorial += `
                <div class="historial-item" style="border:1px solid var(--color-border); background:var(--color-card); box-shadow:var(--shadow-sm); padding:15px; border-radius:var(--radius-md); margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:12px; font-weight:600; color:var(--color-primary);">${ped.fecha}</span>
                        <span style="font-size:15px; font-weight:700; color:var(--color-text); font-family:'Inter',sans-serif;">$${ped.total.toFixed(2)}</span>
                    </div>
                    <p style="font-size:12px; color:var(--color-text-muted); margin-bottom:15px; line-height:1.4;">${itemsT}</p>
                    <button onclick="repetirPedido(${index})" style="background:rgba(30,58,138,0.1); color:var(--color-primary); border:none; padding:10px; width:100%; border-radius:var(--radius-full); font-size:13px; font-weight:700; cursor:pointer; transition:0.2s;">
                        <i class="fa-solid fa-rotate-right"></i> Repetir pedido
                    </button>
                </div>`; 
        }); 
        listCont.innerHTML = htmlHistorial;
    } 
}

/** Guarda las preferencias del perfil del usuario */
function guardarPerfil() { 
    localStorage.setItem('gc_nombre', document.getElementById('perfilNombre').value); 
    localStorage.setItem('gc_direccion', document.getElementById('perfilDireccion').value); 
    mostrarToast("Datos guardados ✅"); 
    cerrarModal('modal-perfil', 'nav-home'); 
}

function abrirAjustes() { 
    cerrarModal('all'); 
    setActiveNav('nav-settings'); 
    document.getElementById('modal-ajustes').style.display = 'flex'; 
    document.getElementById('toggleDarkMode').checked = document.body.classList.contains('dark-mode'); 
}

function toggleDark() { 
    document.body.classList.toggle('dark-mode'); 
    localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode')); 
}
function mostrarToast(msg) { const cont = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }

// --- VISTAS Y CATEGORÍAS ---
function cambiarModoVista(modo) { modoVistaGlobal = modo; document.getElementById('btn-modo-unidad').classList.remove('active'); document.getElementById('btn-modo-caja').classList.remove('active'); document.getElementById('btn-modo-' + modo).classList.add('active'); aplicarFiltros(); }
function inyectarInterruptor() { let cont = document.querySelector('.tools-container'); if(cont && !document.getElementById('toggle-modo-global')) { let div = document.createElement('div'); div.id = 'toggle-modo-global'; div.className = 'toggle-modo-container'; div.innerHTML = `<div class="btn-modo active" id="btn-modo-unidad" onclick="cambiarModoVista('unidad')">🍾 Por Unidad</div><div class="btn-modo" id="btn-modo-caja" onclick="cambiarModoVista('caja')">📦 Por Caja</div>`; cont.insertBefore(div, cont.children[1]); } }

function getIconForCategory(cat) {
    if (!cat) return 'fa-box-open';
    let c = cat.toUpperCase();
    if (c.includes('INICIO') || c === 'TODOS') return 'fa-shop';
    if (c.includes('FAVORITOS')) return 'fa-heart';
    if (c.includes('LICOR')) return 'fa-martini-glass-citrus';
    if (c.includes('CERVEZA')) return 'fa-beer-mug-empty';
    if (c.includes('VINO')) return 'fa-wine-glass';
    if (c.includes('RON')) return 'fa-bottle-droplet';
    if (c.includes('WHISKY')) return 'fa-glass-water';
    if (c.includes('VODKA') || c.includes('GINEBRA') || c.includes('ANIS') || c.includes('TEQUILA') || c.includes('COCUY')) return 'fa-wine-bottle';
    if (c.includes('SNACK') || c.includes('CHUCHERIA')) return 'fa-cookie-bite';
    if (c.includes('AGUA') || c.includes('BEBIDA') || c.includes('REFRESCO') || c.includes('JUGO')) return 'fa-bottle-water';
    if (c.includes('HIELO')) return 'fa-cubes';
    if (c.includes('CIGARRO') || c.includes('TABACO')) return 'fa-smoking';
    return 'fa-box-open';
}

function generarCategorias() {
    const cont = document.getElementById('contenedorCategorias'); 
    if (!cont) return;
    
    cont.innerHTML = '';
    
    // Botón Inicio
    let btnInicio = document.createElement('button'); 
    btnInicio.className = (categoriaActual === 'Todos') ? "cat-btn active" : "cat-btn"; 
    btnInicio.innerHTML = `<i class="fa-solid fa-shop"></i><span>Inicio</span>`; 
    btnInicio.onclick = function() { irInicio(); }; 
    cont.appendChild(btnInicio);
    
    // Botón Favoritos
    let btnFav = document.createElement('button'); 
    btnFav.className = (categoriaActual === 'Favoritos') ? "cat-btn active" : "cat-btn"; 
    btnFav.innerHTML = `<i class="fa-solid fa-heart" style="${categoriaActual !== 'Favoritos' ? 'color: #ff4757;' : ''}"></i><span>Favoritos</span>`; 
    btnFav.onclick = function() { filtrarCategoria('Favoritos', this); }; 
    cont.appendChild(btnFav);
    
    console.log("🛠️ Generando Grupos. Grupos API:", appState.gruposInventario?.length);

    // Categorías de la API SmartVentas
    if (appState.gruposInventario && appState.gruposInventario.length > 0) {
        appState.gruposInventario.forEach(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo;
            if (nombre) {
                let b = document.createElement('button');
                b.className = (nombre === categoriaActual) ? "cat-btn active" : "cat-btn";
                b.innerHTML = `<i class="fa-solid ${getIconForCategory(nombre)}"></i><span>${nombre}</span>`;
                b.onclick = function() { filtrarCategoria(nombre, this); };
                cont.appendChild(b);
            }
        });
    } else {
        // Si no hay grupos, mostrar un mensaje de ayuda
        let p = document.createElement('p');
        p.style.fontSize = '11px'; p.style.color = 'gray'; p.style.padding = '10px';
        p.innerText = 'No se encontraron grupos en la API.';
        cont.appendChild(p);
    }

    // Manejo de subcategorías y scroll
    if (categoriaActual === 'LICORES') { 
        generarSubcategoriasLicores(); 
    } else { 
        let subcatSection = document.getElementById('subcategoria-section-main'); 
        if(subcatSection) subcatSection.style.display = 'none'; 
    }
    
    setTimeout(() => { 
        let activeBtn = cont.querySelector('.active'); 
        if(activeBtn) activeBtn.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"}); 
    }, 150);
}

function generarSubcategoriasLicores() {
    let subcatSection = document.getElementById('subcategoria-section-main'), subcatContainer = document.getElementById('contenedorSubcategorias');
    if (!subcatSection || !subcatContainer) return;
    const subcategoriasDisponibles = new Set(); inventario.forEach(p => { if(p.Cat === 'LICORES' && p.SubCat) { subcategoriasDisponibles.add(p.SubCat); } });
    if (subcategoriasDisponibles.size === 0) { subcatSection.style.display = 'none'; return; }
    subcatSection.style.display = 'block'; subcatContainer.innerHTML = '';
    let btnLimpiar = document.createElement('button'); btnLimpiar.className = (!subcategoriaActual) ? "cat-btn active" : "cat-btn"; btnLimpiar.innerHTML = `<i class="fa-solid fa-list"></i><span>Todos</span>`; btnLimpiar.onclick = function() { subcategoriaActual = null; aplicarFiltros(); closeCategorias(); }; subcatContainer.appendChild(btnLimpiar);
    Array.from(subcategoriasDisponibles).sort().forEach(subcat => {
        let btn = document.createElement('button'); btn.className = (subcat === subcategoriaActual) ? "cat-btn active" : "cat-btn"; btn.innerHTML = `<i class="fa-solid ${getIconForCategory(subcat)}"></i><span>${subcat}</span>`; btn.onclick = function() { subcategoriaActual = subcat; aplicarFiltros(); closeCategorias(); }; subcatContainer.appendChild(btn);
    });
}

function filtrarCategoria(cat, btn) {
    categoriaActual = cat; subcategoriaActual = null;
    let subcatSection = document.getElementById('subcategoria-section-main'); if (cat !== 'LICORES' && subcatSection) { subcatSection.style.display = 'none'; }
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); if(btn) btn.classList.add('active');
    
    let mTitle = document.getElementById('mobile-header-title');
    if(mTitle) mTitle.innerText = (cat === 'Todos') ? 'Inicio' : (cat === 'LICORES' ? 'Licores' : cat);
    
    if (cat === 'LICORES') { generarSubcategoriasLicores(); aplicarFiltros(); } else { aplicarFiltros(); closeCategorias(); }
}
function toggleCategorias() { const panel = document.getElementById('categoria-panel'); const overlay = document.getElementById('categoria-overlay'); if(!panel || !overlay) return; const isOpen = panel.classList.toggle('open'); overlay.style.display = isOpen ? 'block' : 'none'; }
function closeCategorias() { const panel = document.getElementById('categoria-panel'); const overlay = document.getElementById('categoria-overlay'); if(panel) panel.classList.remove('open'); if(overlay) overlay.style.display = 'none'; }

// --- SUGERENCIAS E INTERACCIONES ---
function mostrarSugerencias(q) {
    let qLimpio = quitarAcentos(q); let terminos = qLimpio.split(' ').filter(t => t.length > 0).map(procesarTermino);
    let coincidencias = inventario.filter(p => {
        if(p.StockNum <= 0) return false;
        let textoCompleto = p.TextoBusquedaLimpio; let words = textoCompleto.split(' ');
        let coincide = terminos.every(term => { if (textoCompleto.includes(term)) return true; if (term.length >= 4) return words.some(w => levenshtein(term, w) <= (term.length >= 6 ? 2 : 1)); return false; });
        if(coincide) { let nLimpio = quitarAcentos(p.Nombre); let wNombre = nLimpio.split(' '); p.TempScore = 0; terminos.forEach(t => { if(wNombre.includes(t)) p.TempScore += 50; else if(nLimpio.includes(t)) p.TempScore += 25; else p.TempScore += 10; }); } return coincide;
    });
    coincidencias.sort((a,b) => b.TempScore - a.TempScore); coincidencias = coincidencias.slice(0, 5);
    const cont = document.getElementById('search-suggestions');
    if(coincidencias.length === 0) { cerrarSugerencias(); aplicarFiltros(); return; }
    cont.innerHTML = '';
    coincidencias.forEach(p => { let carpeta = getCategoriaFolder(p.Cat); const div = document.createElement('div'); div.className = 'suggestion-item'; div.innerHTML = `<img src="assets/img/${carpeta}/${p.codigo}/1.webp" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)"><span>${p.Nombre}</span>`; div.onclick = () => { document.getElementById('buscador').value = p.Nombre; cerrarSugerencias(); aplicarFiltros(); }; cont.appendChild(div); });
    cont.style.display = 'block'; aplicarFiltros();
}
function cerrarSugerencias() { document.getElementById('search-suggestions').style.display = 'none'; }
document.addEventListener('click', (e) => { if(!e.target.closest('.search-container')) cerrarSugerencias(); });
function toggleFav(codigo) { let index = favoritos.indexOf(codigo); if(index === -1) { favoritos.push(codigo); mostrarToast("Agregado a favoritos ❤️"); } else { favoritos.splice(index, 1); } localStorage.setItem('gc_favs', JSON.stringify(favoritos)); aplicarFiltros(); }
function compartirProducto(nombre, precio) { const text = `¡Mira esta bebida! ${nombre} a solo $${precio}. ${window.location.href}`; if (navigator.share) { navigator.share({ title: 'Gran Catador', text, url: window.location.href }).catch(e => console.log(e)); return; } if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => mostrarToast("Texto copiado al portapapeles."), () => fallbackCopyText(text)); return; } fallbackCopyText(text); }
function fallbackCopyText(text) { const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.focus(); textarea.select(); try { document.execCommand('copy'); mostrarToast("Texto copiado al portapapeles."); } catch (e) { mostrarToast("No se pudo copiar al portapapeles."); } document.body.removeChild(textarea); }
function compartirProductoB64(b64, p) { compartirProducto(decodificarNombre(b64), p); }

// --- RENDERIZADO DE PRODUCTOS (Fase 5: Mejora de Rendimiento) ---
function crearHTMLProducto(p) {
    const isFav = favoritos.includes(p.codigo); 
    const isAgotado = p.StockNum <= 0; 
    const nombreB64 = codificarNombre(p.Nombre);
    
    const esModoCaja = (modoVistaGlobal === 'caja');
    const precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
    const precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
    const precioNum = esModoCaja ? p.PrecioCajaNum : p.PrecioNum;
    const carpeta = getCategoriaFolder(p.Cat);
    
    let badgeHTML = '';
    if (isAgotado) {
        badgeHTML = `<div class="product-badge badge-agotado">AGOTADO</div>`;
    }

    // OPTIMIZACIÓN DE RENDIMIENTO: Solo cargamos la foto 1 en la cuadrícula.
    // Las otras 5 fotos se buscarán automáticamente solo cuando el cliente abra los detalles.
    let galeriasHTML = `<img loading="lazy" src="assets/img/${carpeta}/${p.codigo}/1.webp" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)" alt="${p.Nombre}" style="scroll-snap-align: start; flex-shrink: 0; width: 100%; object-fit: contain;">`;

    return `
        <div class="producto-card ${isAgotado ? 'agotado' : ''}">
            
            ${badgeHTML}
            <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFav('${p.codigo}')" aria-label="Favorito">
                <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
            </button>
            
            <div onclick="abrirDetalleProducto('${p.codigo}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetalleProducto('${p.codigo}'); }" style="cursor: pointer; display: flex; flex-direction: column; flex-grow: 1;" role="button" tabindex="0" aria-label="Ver detalles de ${p.Nombre}">
                <div class="product-img-container" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 8px;">
                    <style>.product-img-container::-webkit-scrollbar { display: none; }</style>
                    ${galeriasHTML}
                </div>
                
                <h3 class="producto-titulo" title="${p.Nombre}">${p.Nombre}</h3>
            </div>
            <p class="producto-stock" style="font-size: 12.5px; margin-top: 4px; margin-bottom: 8px; color: var(--color-text);">
                ${(p.StockStr || '').toString().toLowerCase() === 'disponible' ? '<b>Stock Disponible</b>' : `<b style="${p.StockNum > 0 && p.StockNum <= 5 ? 'color: #ea4335;' : ''}">${p.StockNum} und disponibles</b>`}
            </p>
            
            <div class="product-bottom">
                <div class="product-price-container">
                    <span class="product-price" style="font-size: 22px; font-weight: 900; line-height: 1.1;">$${precioUsdDin}</span>
                    <span class="product-price-bs" style="font-size: 13px;">${precioBsDin} Bs</span>
                </div>
                
            <button class="btn-add-cart ${isAgotado ? 'disabled' : ''}" aria-label="Agregar ${p.Nombre} al carrito" title="Agregar al carrito" ${isAgotado ? 'disabled' : `onclick="agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, 'assets/img/${carpeta}/${p.codigo}/1.webp', ${esModoCaja})"`}>
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
    `;
}

async function abrirDetalleProducto(codigo) {
    let p = inventario.find(x => x.codigo === codigo);
    if (!p) return;
    
    const carpeta = getCategoriaFolder(p.Cat);
    const esModoCaja = (modoVistaGlobal === 'caja');
    const precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
    const precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
    const precioNum = esModoCaja ? p.PrecioCajaNum : p.PrecioNum;
    const nombreB64 = codificarNombre(p.Nombre);
    
    document.getElementById('detalle-titulo').innerText = p.Nombre;
    document.getElementById('detalle-precio-usd').innerText = `$${precioUsdDin}`;
    document.getElementById('detalle-precio-bs').innerText = `${precioBsDin} Bs`;
    
    let btnShare = document.getElementById('detalle-btn-share');
    if (btnShare) btnShare.onclick = () => compartirProducto(p.Nombre, precioUsdDin);

    let stockBadge = document.getElementById('detalle-stock');
    if (p.StockNum <= 0) {
        stockBadge.innerText = "AGOTADO"; stockBadge.style.background = "rgba(234, 67, 53, 0.1)"; stockBadge.style.color = "#ea4335";
    } else {
        let stockText = (p.StockStr || '').toString().toLowerCase() === 'disponible' ? 'Stock Disponible' : `${p.StockNum} und disponibles`;
        stockBadge.innerText = stockText;
        if (p.StockNum > 0 && p.StockNum <= 5 && (p.StockStr || '').toString().toLowerCase() !== 'disponible') {
            stockBadge.style.background = "rgba(234, 67, 53, 0.1)"; stockBadge.style.color = "#ea4335";
        } else {
            stockBadge.style.background = "rgba(37, 211, 102, 0.1)"; stockBadge.style.color = "#25D366";
        }
    }
    
    let imgContainer = document.getElementById('detalle-img-container');
    let galeriasHTML = '';
    for (let i = 1; i <= 6; i++) {
        galeriasHTML += `<img loading="lazy" src="assets/img/${carpeta}/${p.codigo}/${i}.webp" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="${i}" data-attempts="0" onerror="imgFallbackFolder(this)" alt="Vista ${i}" style="scroll-snap-align: start; flex-shrink: 0; width: 100%; height: 100%; object-fit: contain; ${i > 1 ? 'display: none;' : ''}" onload="this.style.display='block'">`;
    }
    imgContainer.innerHTML = galeriasHTML;
    
    let btnContainer = document.getElementById('detalle-btn-add');
    if (p.StockNum <= 0) {
        btnContainer.innerHTML = `<button class="btn-enviar" style="background: var(--color-border); color: var(--color-text-muted); cursor: not-allowed;" disabled>Agotado</button>`;
    } else {
        btnContainer.innerHTML = `<button class="btn-enviar" onclick="agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, 'assets/img/${carpeta}/${p.codigo}/1.webp', ${esModoCaja}); document.getElementById('modal-producto').style.display='none';" style="background: var(--color-primary);"><i class="fa-solid fa-cart-shopping"></i> Agregar al carrito</button>`;
    }
    
    let descContainer = document.getElementById('detalle-descripcion');
    descContainer.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando información...';
    document.getElementById('modal-producto').style.display = 'flex';
    
    try {
        let res = await fetch(`assets/img/${carpeta}/${p.codigo}/desc.txt`);
        if (res.ok) { let text = await res.text(); descContainer.innerText = text; } else { descContainer.innerText = "Sin descripción adicional."; }
    } catch (e) { descContainer.innerText = "Sin descripción adicional."; }
}

function renderizarPagina() {
    const cont = document.getElementById('lista-productos'); 
    if (paginaActual === 1) cont.innerHTML = ''; 
    
    let inicio = (paginaActual - 1) * itemsPorPagina, fin = paginaActual * itemsPorPagina; 
    let pedazo = productosFiltradosGlobal.slice(inicio, fin);
    
    if (productosFiltradosGlobal.length === 0) { 
        if (paginaActual === 1) {
            cont.innerHTML = `
                <div style="grid-column: span 2; text-align: center; padding: 40px 20px; color: var(--texto-claro);">
                    <i class="fa-solid fa-wine-bottle" style="font-size: 60px; opacity: 0.3; margin-bottom: 15px;"></i>
                    <h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">¿Aún no tienes sed?</h3>
                    <p style="font-size: 13px; margin-top: 5px;">No encontramos botellas con esa descripción.</p>
                    <button onclick="irInicio()" class="cat-btn active" style="margin: 20px auto 0 auto; padding: 10px 20px;">Ver todo el catálogo</button>
                </div>`; 
            document.getElementById('btn-cargar-mas').style.display = 'none'; 
        }
        return; 
    }
    
    const html = pedazo.map(crearHTMLProducto).join('');
    cont.insertAdjacentHTML('beforeend', html);
    
    if (fin < productosFiltradosGlobal.length) {
        document.getElementById('btn-cargar-mas').style.display = 'block'; 
    } else {
        document.getElementById('btn-cargar-mas').style.display = 'none';
    }
}

function cargarMasProductos() { 
    paginaActual++; 
    renderizarPagina(); 
}