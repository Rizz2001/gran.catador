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
    } catch (e) { console.log("Error en horario"); }
}

checkHorario();
setInterval(checkHorario, 60000);

// --- NAVEGACIÓN Y MODALES ---
/** Marca como activo el ícono correspondiente en la barra de navegación inferior */
function setActiveNav(id) {
    document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

/** Cierra uno o todos los modales y actualiza la navegación */
function cerrarModal(modalId, navId) {
    if (modalId === 'all') {
        document.querySelectorAll('.modal-fullscreen').forEach(m => m.style.display = 'none');
    } else {
        let modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    }
    if (navId) setActiveNav(navId);
}

/** Restablece la vista al menú principal (Inicio) */
function irInicio() {
    cerrarModal('all');
    setActiveNav('nav-home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let inputBuscador = document.getElementById('buscador');
    if (inputBuscador) inputBuscador.value = '';

    let chk = document.getElementById('chkAgotados');
    if (chk) chk.checked = false;

    let sortSelect = document.getElementById('ordenarSelect');
    if (sortSelect) sortSelect.value = 'relevancia';

    cerrarSugerencias();
    subcategoriaActual = null;

    let subcatSection = document.getElementById('subcategoria-section-main');
    if (subcatSection) subcatSection.style.display = 'none';

    let btnInicio = Array.from(document.querySelectorAll('.cat-btn')).find(b => b.innerText.includes('Inicio'));
    if (btnInicio) filtrarCategoria('Todos', btnInicio);
    else filtrarCategoria('Todos', document.querySelectorAll('.cat-btn')[0]);

    let mTitle = document.getElementById('mobile-header-title');
    if (mTitle) mTitle.innerText = 'Inicio';
}

/** Limpia instantáneamente la barra de búsqueda y refresca los productos */
window.limpiarBuscador = function () {
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
} // <-- ¡AQUÍ! Cierre correcto de la función abrirAjustes()

function toggleDark() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode'));
}

/** Limpia la caché y recarga la página (Usado en el modal de Ajustes) */
function limpiarCacheAdmin() {
    localStorage.clear();
    mostrarToast("Caché limpiada. Recargando...");
    setTimeout(() => location.reload(), 1500);
}

function mostrarToast(msg) { const cont = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }

// --- VISTAS Y CATEGORÍAS ---
function cambiarModoVista(modo) { modoVistaGlobal = modo; document.getElementById('btn-modo-unidad').classList.remove('active'); document.getElementById('btn-modo-caja').classList.remove('active'); document.getElementById('btn-modo-' + modo).classList.add('active'); aplicarFiltros(); }
function inyectarInterruptor() { let cont = document.querySelector('.tools-container'); if (cont && !document.getElementById('toggle-modo-global')) { let div = document.createElement('div'); div.id = 'toggle-modo-global'; div.className = 'toggle-modo-container'; div.innerHTML = `<div class="btn-modo active" id="btn-modo-unidad" onclick="cambiarModoVista('unidad')">🍾 Por Unidad</div><div class="btn-modo" id="btn-modo-caja" onclick="cambiarModoVista('caja')">📦 Por Caja</div>`; cont.insertBefore(div, cont.firstChild); } }

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

window.mostrarSkeletonCategorias = function () {
    const cont = document.getElementById('contenedorCategorias');
    if (!cont) return;
    cont.innerHTML = '';
    // Anchos aleatorios para simular nombres de grupos de distintos tamaños
    const widths = ['110px', '140px', '95px', '130px', '105px', '150px'];
    for (let i = 0; i < 6; i++) {
        let div = document.createElement('div');
        div.className = 'skeleton-chip';
        div.style.width = widths[i];
        cont.appendChild(div);
    }
}

window.mostrarSkeletonProductos = function () {
    const cont = document.getElementById('lista-productos');
    if (!cont) return;
    cont.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        cont.innerHTML += `
            <div class="producto-card" style="pointer-events:none; border: 1px solid var(--color-border); box-shadow: none;">
                <div class="skeleton-box" style="width: 100%; height: 160px; border-radius: var(--radius-sm); margin-bottom: 12px;"></div>
                <div class="skeleton-box" style="width: 85%; height: 16px; border-radius: 4px; margin-bottom: 8px;"></div>
                <div class="skeleton-box" style="width: 60%; height: 12px; border-radius: 4px; margin-bottom: 15px;"></div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto;">
                    <div class="skeleton-box" style="width: 45%; height: 24px; border-radius: 4px;"></div>
                    <div class="skeleton-box" style="width: 36px; height: 36px; border-radius: 50%;"></div>
                </div>
            </div>`;
    }
}

function generarCategorias() {
    const cont = document.getElementById('contenedorCategorias');
    if (!cont) return;

    cont.innerHTML = '';

    // Botón Inicio
    let btnInicio = document.createElement('button');
    btnInicio.className = (categoriaActual === 'Todos') ? "cat-btn active" : "cat-btn";
    btnInicio.innerHTML = `<i class="fa-solid fa-shop"></i><span>Inicio</span>`;
    btnInicio.onclick = function () { irInicio(); };
    cont.appendChild(btnInicio);

    console.log("🛠️ Generando Grupos. Grupos API:", appState.gruposInventario?.length);

    // Categorías de la API SmartVentas
    if (appState.gruposInventario && appState.gruposInventario.length > 0) {
        appState.gruposInventario.forEach(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo;
            if (nombre) {
                let b = document.createElement('button');
                b.className = (limpiarCategoria(nombre) === limpiarCategoria(categoriaActual)) ? "cat-btn active" : "cat-btn";
                b.innerHTML = `<i class="fa-solid ${getIconForCategory(nombre)}"></i><span>${nombre}</span>`;
                b.onclick = function () { filtrarCategoria(nombre, this); };
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
    if (categoriaActual !== 'Todos' && categoriaActual !== 'Favoritos') {
        cargarSubcategoriasAPI(categoriaActual);
    } else {
        let subcatSection = document.getElementById('subcategoria-section-main');
        let subcatContainer = document.getElementById('contenedorSubcategorias');
        if (subcatSection) subcatSection.style.display = 'none';
        if (subcatContainer) subcatContainer.innerHTML = '';
    }

    setTimeout(() => {
        let activeBtn = cont.querySelector('.active');
        if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        if (typeof actualizarFlechasScroll === 'function') actualizarFlechasScroll('contenedorCategorias');
    }, 150);

    // Añadir listener para el scroll interactivo de las flechas
    if (!cont.hasAttribute('data-scroll-listener')) {
        cont.addEventListener('scroll', () => { if (typeof actualizarFlechasScroll === 'function') actualizarFlechasScroll('contenedorCategorias'); });
        window.addEventListener('resize', () => { if (typeof actualizarFlechasScroll === 'function') actualizarFlechasScroll('contenedorCategorias'); });
        cont.setAttribute('data-scroll-listener', 'true');
    }
}

async function cargarSubcategoriasAPI(nombreCategoria) {
    let subcatSection = document.getElementById('subcategoria-section-main');
    let subcatContainer = document.getElementById('contenedorSubcategorias');
    if (!subcatSection || !subcatContainer) return;

    // Mostrar visualmente que está cargando
    subcatSection.style.display = 'block';
    subcatContainer.innerHTML = '<div style="padding: 10px 5px; font-size: 13px; color: var(--color-primary); font-weight: 600; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando subgrupos...</div>';

    // Buscar el código del grupo de forma segura
    let grupo = null;
    if (appState.gruposInventario) {
        grupo = appState.gruposInventario.find(g => {
            let nom = g.Nombre || g.nombre || g.descripcion || g.Descripcion || g.NombreGrupo || g.DescGrupo || g.desc_grupo || "";
            return limpiarCategoria(nom) === limpiarCategoria(nombreCategoria);
        });
    }

    let codGrupo = grupo ? (grupo.CodGrupo || grupo.codigo || grupo.id || grupo.Codigo || grupo.Id || grupo.grupo || grupo.Grupo || grupo.id_grupo || "").toString().trim() : "";
    let subcategorias = [];

    // 1. Intentar obtener de la API de Foxdata
    if (codGrupo) {
        try {
            console.log(`📡 Consultando API para subgrupos del grupo: ${nombreCategoria} (ID: ${codGrupo})`);
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
                : (isLocalhost || window.location.hostname.includes('github.io')) ? 'https://gran-catador.pages.dev/api/proxy'
                    : 'functions/api/proxy.php';
            const res = await fetch(`${proxyBaseUrl}?endpoint=gruposinvsub/grupo/${encodeURIComponent(codGrupo)}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`✔️ Respuesta API Subgrupos:`, data);
                subcategorias = Array.isArray(data) ? data : (data.data || data.result || []);
            }
        } catch (e) {
            console.warn("⚠️ Falló la API de subgrupos, usando analizador local.", e);
        }
    }

    // 2. ANALIZADOR DE RESPALDO: Analizar el inventario local si la API no devuelve nada
    if (subcategorias.length === 0) {
        console.log(`🪄 Analizando productos locales para extraer subgrupos de: ${nombreCategoria}`);
        let productosDelGrupo = inventario.filter(p => p.Cat === limpiarCategoria(nombreCategoria) || (codGrupo !== "" && p.CatId === codGrupo));

        let mapaSubcats = new Map();
        productosDelGrupo.forEach(p => {
            let nomSub = (p.SubCat || "").trim();
            if (nomSub && nomSub.toUpperCase() !== 'OTROS') {
                let idSub = (p.SubCatId || nomSub).toString().trim();
                mapaSubcats.set(idSub, nomSub); // Guardar usando el ID para no duplicar
            }
        });

        mapaSubcats.forEach((nombreSub, idSub) => {
            subcategorias.push({ codigo: idSub, nombre: nombreSub });
        });

        console.log("🔍 Subgrupos detectados por el analizador:", subcategorias);
    }

    // 3. Renderizar en la pantalla
    if (subcategorias.length > 0) {
        // --- LÓGICA DE RESCATE AUTOMÁTICO ---
        // Si SmartVentas devolvió 0 productos para el grupo principal, los extraemos forzosamente de los subgrupos.
        let prodsGrupo = inventario.filter(p => p.CatId === codGrupo || p.Cat === limpiarCategoria(nombreCategoria));
        if (prodsGrupo.length === 0) {
            console.log(`⚠️ Grupo vacío. Rescatando productos automáticamente a través de sus ${subcategorias.length} subgrupos...`);
            let promesas = subcategorias.map(sub => {
                let nombreSub = sub.nombre || sub.descripcion || sub.Nombre || sub.desc_subgrupo || "Subgrupo";
                let codSub = (sub.CodSubgrupo || sub.codsubgrupo || sub.Codsubgrupo || sub.cod_subgrupo || sub.cod_sub_grupo || sub.id_subgrupo || sub.id_sub_grupo || sub.Cod_subgrupo || sub.codigo || sub.id || sub.subgrupo || sub.Subgrupo || limpiarCategoria(nombreSub)).toString().trim();
                if (codSub) return cargarProductosPorSubgrupo(codGrupo, codSub, nombreCategoria, nombreSub);
            });

            Promise.all(promesas).then(() => {
                if (codGrupo && !appState.gruposCargados.includes(codGrupo)) appState.gruposCargados.push(codGrupo);
                if (!subcategoriaActual && categoriaActual === nombreCategoria) aplicarFiltros(); // Refresca "Todos" mágicamente
            });
        }

        subcatContainer.innerHTML = '';

        let btnLimpiar = document.createElement('button');
        btnLimpiar.className = (!subcategoriaActual) ? "subcat-btn active" : "subcat-btn";
        btnLimpiar.innerHTML = '<i class="fa-solid fa-list"></i><span>Todos</span>';
        btnLimpiar.onclick = function () {
            subcategoriaActual = null;
            Array.from(subcatContainer.children).forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Si el usuario presiona "Todos" mientras ocurre el rescate, le mostramos el esqueleto de carga
            let prods = inventario.filter(p => p.CatId === codGrupo || p.Cat === limpiarCategoria(nombreCategoria));
            if (prods.length === 0) {
                if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
            }

            aplicarFiltros();
        };
        subcatContainer.appendChild(btnLimpiar);

        subcategorias.forEach(sub => {
            let nombreSub = sub.nombre || sub.descripcion || sub.Nombre || sub.desc_subgrupo || "Subgrupo";
            let codSub = (sub.CodSubgrupo || sub.codsubgrupo || sub.Codsubgrupo || sub.cod_subgrupo || sub.cod_sub_grupo || sub.id_subgrupo || sub.id_sub_grupo || sub.Cod_subgrupo || sub.codigo || sub.id || sub.subgrupo || sub.Subgrupo || limpiarCategoria(nombreSub)).toString().trim();

            // Formatear Nombre (Capitalizar primera letra: "Whisky" en vez de "WHISKY")
            let nombreMostrado = nombreSub.charAt(0).toUpperCase() + nombreSub.slice(1).toLowerCase();

            let btn = document.createElement('button');
            btn.className = (codSub === subcategoriaActual || limpiarCategoria(nombreSub) === subcategoriaActual) ? "subcat-btn active" : "subcat-btn";
            btn.innerHTML = `<span>${nombreMostrado}</span>`;
            btn.onclick = async function () {
                subcategoriaActual = codSub;
                Array.from(subcatContainer.children).forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Siempre llamamos a la API con ?codSubgrupo= para que los productos
                // queden etiquetados con su SubCatId correcto antes de filtrar.
                if (codGrupo && codSub) {
                    if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
                    if (typeof cargarProductosPorSubgrupo === 'function') {
                        await cargarProductosPorSubgrupo(codGrupo, codSub, nombreCategoria, nombreSub);
                    }
                }

                aplicarFiltros();
            };
            subcatContainer.appendChild(btn);
        });

        subcatSection.style.display = 'block';
        subcatContainer.scrollLeft = 0;

        setTimeout(() => {
            if (typeof actualizarFlechasScroll === 'function') actualizarFlechasScroll('contenedorSubcategorias');
        }, 150);

        if (!subcatContainer.hasAttribute('data-scroll-listener')) {
            subcatContainer.addEventListener('scroll', () => { if (typeof actualizarFlechasScroll === 'function') actualizarFlechasScroll('contenedorSubcategorias'); });
            window.addEventListener('resize', () => { if (typeof actualizarFlechasScroll === 'function') actualizarFlechasScroll('contenedorSubcategorias'); });
            subcatContainer.setAttribute('data-scroll-listener', 'true');
        }
    } else {
        subcatSection.style.display = 'none';
        subcatContainer.innerHTML = '';
        console.warn(`❌ El grupo "${nombreCategoria}" no tiene subgrupos asignados en la base de datos.`);
    }
}

async function filtrarCategoria(cat, btn) {
    categoriaActual = cat; subcategoriaActual = null;
    let subcatSection = document.getElementById('subcategoria-section-main');
    let subcatContainer = document.getElementById('contenedorSubcategorias');
    if (subcatSection) subcatSection.style.display = 'none';
    if (subcatContainer) subcatContainer.innerHTML = '';

    document.querySelectorAll('#contenedorCategorias .cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    let mTitle = document.getElementById('mobile-header-title');
    if (mTitle) mTitle.innerText = (cat === 'Todos') ? 'Inicio' : cat;

    // --- LAZY LOADING: Asegurarnos de que el grupo seleccionado ya esté descargado ---
    if (cat !== 'Todos' && cat !== 'Favoritos' && appState.gruposInventario) {
        let grupoMatch = appState.gruposInventario.find(g => {
            let nom = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo || "Grupo";
            return limpiarCategoria(nom) === limpiarCategoria(cat);
        });
        if (grupoMatch) {
            let codGrupo = (grupoMatch.CodGrupo || grupoMatch.codigo || grupoMatch.id || grupoMatch.Codigo || grupoMatch.Id || grupoMatch.id_grupo || grupoMatch.cod_grupo || grupoMatch.grupo || grupoMatch.Grupo || "").toString().trim();
            let nombreGrupo = grupoMatch.Nombre || grupoMatch.nombre || grupoMatch.Descripcion || grupoMatch.descripcion || grupoMatch.NombreGrupo || grupoMatch.desc_grupo || grupoMatch.DescGrupo || "Grupo";

            if (appState.gruposCargados && !appState.gruposCargados.includes(codGrupo)) {
                if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
                // Forzamos la descarga en este momento si no se había descargado en segundo plano aún
                await cargarProductosPorGrupo(codGrupo, nombreGrupo);
            }
        }
    }

    aplicarFiltros();

    if (cat !== 'Todos' && cat !== 'Favoritos') {
        cargarSubcategoriasAPI(cat);
    }
}
function toggleCategorias() { const panel = document.getElementById('categoria-panel'); const overlay = document.getElementById('categoria-overlay'); if (!panel || !overlay) return; const isOpen = panel.classList.toggle('open'); overlay.style.display = isOpen ? 'block' : 'none'; }
function closeCategorias() { const panel = document.getElementById('categoria-panel'); const overlay = document.getElementById('categoria-overlay'); if (panel) panel.classList.remove('open'); if (overlay) overlay.style.display = 'none'; }

// --- SUGERENCIAS E INTERACCIONES ---
/**
 * Muestra el panel de sugerencias usando resultados ya calculados por aplicarFiltros.
 * No hace una segunda pasada al inventario.
 * @param {string} q - Query normalizado
 * @param {Array} resultados - Productos ya filtrados y ordenados por score
 */
function mostrarSugerencias(q, resultados) {
    // Función deshabilitada: Ya no se muestra la lista flotante (sugerencias). 
    // El catálogo principal se actualiza en vivo al escribir.
    cerrarSugerencias();
}
function cerrarSugerencias() { const cont = document.getElementById('search-suggestions'); if (cont) cont.style.display = 'none'; }
document.addEventListener('click', (e) => { if (!e.target.closest('.search-pill') && !e.target.closest('.search-container')) cerrarSugerencias(); });
function compartirProducto(nombre, precio) { const text = `¡Mira esta bebida! ${nombre} a solo $${precio}. ${window.location.href}`; if (navigator.share) { navigator.share({ title: 'Gran Catador', text, url: window.location.href }).catch(e => console.log(e)); return; } if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => mostrarToast("Texto copiado al portapapeles."), () => fallbackCopyText(text)); return; } fallbackCopyText(text); }
function fallbackCopyText(text) { const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.focus(); textarea.select(); try { document.execCommand('copy'); mostrarToast("Texto copiado al portapapeles."); } catch (e) { mostrarToast("No se pudo copiar al portapapeles."); } document.body.removeChild(textarea); }
function compartirProductoB64(b64, p) { compartirProducto(decodificarNombre(b64), p); }

// --- RENDERIZADO DE PRODUCTOS (Fase 5: Mejora de Rendimiento) ---
function crearHTMLProducto(p) {
    const esModoCaja = (modoVistaGlobal === 'caja');
    const cantCaja = p.CantidadGrup || 12;
    const isAgotado = esModoCaja ? (p.StockNum < cantCaja && p.StockNum < 999) : p.StockNum <= 0;
    const nombreB64 = codificarNombre(p.Nombre);

    const precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
    const precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
    const precioNum = esModoCaja ? p.PrecioCajaNum : p.PrecioNum;

    // --- LÓGICA DINÁMICA DE TEXTO DE UNIDAD ---
    let textoUnidad = '';
    if (esModoCaja) {
        let undGrup = p.UnidadGrup ? p.UnidadGrup.toUpperCase() : 'CAJA';
        let cant = p.CantidadGrup || 12;
        textoUnidad = `POR ${undGrup} (x${cant})`;
    } else {
        let undSimp = p.UnidadSimple ? p.UnidadSimple.toUpperCase() : 'UNIDAD';
        textoUnidad = `POR ${undSimp}`;
    }

    let textoStock = '';
    if ((p.StockStr || '').toString().toLowerCase() === 'disponible' || p.StockNum >= 999) {
        textoStock = '<b>Stock Disponible</b>';
    } else if (isAgotado && p.StockNum > 0) {
        textoStock = `<b style="color: #ea4335;">Solo ${p.StockNum} und (No alcanza p/ caja)</b>`;
    } else {
        textoStock = `<b style="${p.StockNum > 0 && p.StockNum <= 5 ? 'color: #ea4335;' : ''}">${p.StockNum} und disponibles</b>`;
    }

    let badgeHTML = '';
    if (isAgotado) {
        badgeHTML = `<div class="product-badge badge-agotado">AGOTADO</div>`;
    }

    let imgSrc = p.ImagenUrl ? p.ImagenUrl : 'logo.webp';
    let galeriasHTML = `<img loading="lazy" src="${imgSrc}" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)" alt="${p.Nombre}" style="scroll-snap-align: start; flex-shrink: 0; width: 100%; height: 100%; object-fit: contain;" onload="this.parentElement.classList.remove('skeleton-box');">`;

    return `
        <div class="producto-card ${isAgotado ? 'agotado' : ''}">
            
            ${badgeHTML}
            
            <div onclick="abrirDetalleProducto('${p.codigo}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetalleProducto('${p.codigo}'); }" style="cursor: pointer; display: flex; flex-direction: column; flex-grow: 1;" role="button" tabindex="0" aria-label="Ver detalles de ${p.Nombre}">
                <div class="product-img-container skeleton-box" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; border-radius: 8px;">
                    <style>.product-img-container::-webkit-scrollbar { display: none; }</style>
                    ${galeriasHTML}
                </div>
                
                <h3 class="producto-titulo" title="${p.Nombre}">${p.Nombre}</h3>
            </div>
            <p class="producto-stock" style="font-size: 12.5px; margin-top: 4px; margin-bottom: 8px; color: var(--color-text);">
                ${textoStock}
            </p>
            
            <div class="product-bottom">
                <div class="product-price-container">
                    <span style="font-size: 10px; color: var(--color-primary); font-weight: 800; letter-spacing: 0.5px; margin-bottom: -2px; display: block;">${textoUnidad}</span>
                    <span class="product-price" style="font-size: 22px; font-weight: 900; line-height: 1.1;">$${precioUsdDin}</span>
                    <span class="product-price-bs" style="font-size: 13px;">${precioBsDin} Bs</span>
                </div>
                
            <button class="btn-add-cart ${isAgotado ? 'disabled' : ''}" aria-label="Agregar ${p.Nombre} al carrito" title="Agregar al carrito" ${isAgotado ? 'disabled' : `onclick="agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imgSrc}', ${esModoCaja})"`}>
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
    `;
}

async function abrirDetalleProducto(codigo) {
    let p = inventario.find(x => x.codigo === codigo);
    if (!p) return;

    const esModoCaja = (modoVistaGlobal === 'caja');
    const cantCaja = p.CantidadGrup || 12;
    const isAgotado = esModoCaja ? (p.StockNum < cantCaja && p.StockNum < 999) : p.StockNum <= 0;
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
    if (isAgotado) {
        if (p.StockNum <= 0) {
            stockBadge.innerText = "AGOTADO";
        } else {
            stockBadge.innerText = `Solo ${p.StockNum} und (Insuficiente p/ caja)`;
        }
        stockBadge.style.background = "rgba(234, 67, 53, 0.1)"; stockBadge.style.color = "#ea4335";
    } else {
        let stockText = (p.StockStr || '').toString().toLowerCase() === 'disponible' || p.StockNum >= 999 ? 'Stock Disponible' : `${p.StockNum} und disponibles`;
        stockBadge.innerText = stockText;
        if (p.StockNum > 0 && p.StockNum <= 5 && (p.StockStr || '').toString().toLowerCase() !== 'disponible' && p.StockNum < 999) {
            stockBadge.style.background = "rgba(234, 67, 53, 0.1)"; stockBadge.style.color = "#ea4335";
        } else {
            stockBadge.style.background = "rgba(37, 211, 102, 0.1)"; stockBadge.style.color = "#25D366";
        }
    }

    let imgContainer = document.getElementById('detalle-img-container');
    imgContainer.classList.add('skeleton-box');
    let imgUrl = p.ImagenUrl ? p.ImagenUrl : 'logo.webp';
    let galeriasHTML = `<img loading="lazy" src="${imgUrl}" class="zoomable-img" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)" alt="Vista 1" style="scroll-snap-align: start; flex-shrink: 0; width: 100%; height: 100%; object-fit: contain;" onload="this.style.display='block'; this.parentElement.classList.remove('skeleton-box');" onmousemove="if(typeof handleZoom==='function') handleZoom(event, this)" onmouseleave="if(typeof resetZoom==='function') resetZoom(this)">`;
    imgContainer.innerHTML = galeriasHTML;

    let btnContainer = document.getElementById('detalle-btn-add');
    let imgSrc = p.ImagenUrl ? p.ImagenUrl : 'logo.webp';
    if (isAgotado) {
        let txtBtn = p.StockNum <= 0 ? 'Agotado' : 'Stock Insuficiente';
        btnContainer.innerHTML = `<button class="btn-enviar" style="background: var(--color-border); color: var(--color-text-muted); cursor: not-allowed;" disabled>${txtBtn}</button>`;
    } else {
        btnContainer.innerHTML = `<button class="btn-enviar" onclick="agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imgSrc}', ${esModoCaja}); document.getElementById('modal-producto').style.display='none';" style="background: var(--color-primary);"><i class="fa-solid fa-cart-shopping"></i> Agregar al carrito</button>`;
    }

    let descContainer = document.getElementById('detalle-descripcion');
    document.getElementById('modal-producto').style.display = 'flex';

    if (p.DescAdicional && p.DescAdicional.trim() !== '') {
        descContainer.innerText = p.DescAdicional;
    } else {
        descContainer.innerText = "Sin descripción adicional.";
    }
}

function renderizarPagina() {
    const cont = document.getElementById('lista-productos');
    if (paginaActual === 1) cont.innerHTML = '';

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = paginaActual * itemsPorPagina;
    const pedazo = productosFiltradosGlobal.slice(inicio, fin);

    if (productosFiltradosGlobal.length === 0) {
        if (paginaActual === 1) {
            const queryRaw = (document.getElementById('buscador')?.value || '').trim();
            let msjExtra = '';
            if (queryRaw.length > 0 && categoriaActual !== 'Todos') {
                msjExtra = `<br><span style="color: var(--color-primary); font-weight: 600; display: inline-block; margin-top: 10px; background: rgba(30,58,138,0.1); padding: 6px 12px; border-radius: 8px;"><i class="fa-solid fa-globe"></i> Se buscó en todo el catálogo</span>`;
            }

            cont.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--texto-claro);">
                    <i class="fa-solid fa-wine-bottle" style="font-size: 60px; opacity: 0.3; margin-bottom: 15px;"></i>
                    <h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">¿Aún no tienes sed?</h3>
                    <p style="font-size: 13px; margin-top: 5px;">No encontramos botellas con esa descripción.${msjExtra}</p>
                    <button onclick="irInicio()" class="cat-btn active" style="margin: 20px auto 0 auto; padding: 10px 20px;">Ver todo el catálogo</button>
                </div>`;
            document.getElementById('btn-cargar-mas').style.display = 'none';
        }
        return;
    }

    // Usar DocumentFragment para evitar reflows intermedios
    const fragment = document.createDocumentFragment();

    // --- INYECTAR AVISO VISUAL DE BÚSQUEDA GLOBAL ---
    if (paginaActual === 1) {
        const queryRaw = (document.getElementById('buscador')?.value || '').trim();
        if (queryRaw.length > 0 && categoriaActual !== 'Todos' && categoriaActual !== 'Favoritos') {
            const aviso = document.createElement('div');
            aviso.style.gridColumn = '1 / -1'; // Ocupa todas las columnas del grid (Responsive)
            aviso.style.padding = '10px 15px';
            aviso.style.marginBottom = '15px';
            aviso.style.backgroundColor = 'rgba(30, 58, 138, 0.08)';
            aviso.style.color = 'var(--color-primary, #1E3A8A)';
            aviso.style.borderRadius = 'var(--radius-md, 8px)';
            aviso.style.fontSize = '12.5px';
            aviso.style.fontWeight = '600';
            aviso.innerHTML = `<i class="fa-solid fa-magnifying-glass-location" style="margin-right:6px;"></i> Mostrando resultados de todo el catálogo`;
            fragment.appendChild(aviso);
        }
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = pedazo.map(crearHTMLProducto).join('');
    while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
    cont.appendChild(fragment);

    document.getElementById('btn-cargar-mas').style.display =
        fin < productosFiltradosGlobal.length ? 'block' : 'none';
}

function cargarMasProductos() {
    paginaActual++;
    renderizarPagina();
}

// --- FUNCIÓN PARA FLECHAS DE SCROLL EN PC ---
window.scrollHorizontal = function (containerId, amount) {
    const container = document.getElementById(containerId);
    if (container) {
        container.scrollBy({ left: amount, behavior: 'smooth' });
    }
};

window.actualizarFlechasScroll = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const wrapper = container.closest('.scroll-container-wrapper');
    if (!wrapper) return;

    // Efecto visual de desvanecimiento (Fade Gradient) en los bordes
    const scrollWrapper = wrapper.querySelector('.horizontal-scroll-wrapper');
    const hasOverflow = container.scrollWidth > container.clientWidth + 5;

    if (scrollWrapper) {
        const isAtStart = container.scrollLeft <= 5;
        const maxScroll = container.scrollWidth - container.clientWidth;
        const isAtEnd = container.scrollLeft >= maxScroll - 5;

        if (hasOverflow) {
            scrollWrapper.classList.toggle('is-scrollable-left', !isAtStart);
            scrollWrapper.classList.toggle('is-scrollable-right', !isAtEnd);
        } else {
            scrollWrapper.classList.remove('is-scrollable-left', 'is-scrollable-right');
        }
    }

    const leftArrow = wrapper.querySelector('.left-arrow');
    const rightArrow = wrapper.querySelector('.right-arrow');

    if (!leftArrow || !rightArrow) return;

    // Solo operamos en pantallas donde se muestren las flechas (>1024px)
    if (window.innerWidth <= 1024) return;

    // Tolerancia de 5px para redondeos del navegador
    if (!hasOverflow) {
        leftArrow.style.display = 'none';
        rightArrow.style.display = 'none';
    } else {
        leftArrow.style.display = 'flex';
        rightArrow.style.display = 'flex';

        // Difuminar y deshabilitar flechas cuando se llega al límite
        leftArrow.style.opacity = container.scrollLeft <= 5 ? '0.3' : '1';
        leftArrow.style.pointerEvents = container.scrollLeft <= 5 ? 'none' : 'auto';

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        rightArrow.style.opacity = container.scrollLeft >= maxScrollLeft - 5 ? '0.3' : '1';
        rightArrow.style.pointerEvents = container.scrollLeft >= maxScrollLeft - 5 ? 'none' : 'auto';
    }
};

// --- BOTÓN SCROLL TO TOP ---
window.addEventListener('scroll', () => {
    const btnScrollTop = document.getElementById('btn-scroll-top');
    if (btnScrollTop) {
        if (window.scrollY > 300) {
            btnScrollTop.classList.add('visible');
        } else {
            btnScrollTop.classList.remove('visible');
        }
    }
});

window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- EFECTO ZOOM EN IMAGEN DE PRODUCTO (SOLO PC) ---
window.handleZoom = function (e, img) {
    if (window.innerWidth < 1024) return; // Solo aplicar en pantallas grandes

    const container = img.parentElement;
    const rect = container.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;

    img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
};

window.resetZoom = function (img) {
    if (window.innerWidth < 1024) return;
    img.style.transformOrigin = 'center center';
};