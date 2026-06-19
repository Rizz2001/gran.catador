/**
 * ui.js - Manejo de la Interfaz de Usuario (DOM) y Eventos Visuales
 */

// --- VERIFICACI�N DE EDAD Y HORARIO ---
// Detectar bots de motores de b�squeda (Googlebot, Bingbot, Yandex, etc.) para SEO
const isBot = /bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|spider|crawler|robot/i.test(navigator.userAgent);

try {
    if (localStorage.getItem('ageVerified') === 'true' || isBot) {
        let ag = document.getElementById('age-gate');
        if (ag) ag.style.display = 'none';
    }
} catch (e) {
    console.warn("localStorage no disponible", e);
    if (isBot) {
        let ag = document.getElementById('age-gate');
        if (ag) ag.style.display = 'none';
    }
}

/** Valida si el usuario cumple con la edad m�nima (18 a�os) */
window.verificarEdad = function() {
    let d = document.getElementById('age-d').value;
    let m = document.getElementById('age-m').value;
    let y = document.getElementById('age-y').value;
    let err = document.getElementById('age-error');

    let dia = Number(d), mes = Number(m), ano = Number(y);

    if (!dia || !mes || !ano || dia > 31 || mes > 12 || ano < 1900) {
        err.innerText = "Ingresa una fecha v�lida.";
        err.style.display = "block";
        return;
    }

    let birth = new Date(ano, mes - 1, dia);
    if (birth.getFullYear() !== ano || birth.getMonth() !== mes - 1 || birth.getDate() !== dia) {
        err.innerText = "Ingresa una fecha v�lida.";
        err.style.display = "block";
        return;
    }

    let today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    let mDiff = today.getMonth() - birth.getMonth();

    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;

    if (age >= 18) {
        try { localStorage.setItem('ageVerified', 'true'); } catch(e) {}
        document.getElementById('age-gate').style.display = 'none';
    } else {
        err.innerText = "Lo sentimos, debes ser mayor de 18 a�os.";
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
            try { isTiendaAbierta = true; } catch (e) { window.isTiendaAbierta = true; }
            if (typeof appState !== 'undefined') appState.isTiendaAbierta = true;
            badge.innerHTML = "🟢 ABIERTO";
            badge.style.background = "rgba(37, 211, 102, 0.2)";
            badge.style.color = "#25D366";
            badge.style.borderColor = "rgba(37, 211, 102, 0.4)";
            if (btnWs) btnWs.classList.remove('disabled');
            if (msgCerrado) msgCerrado.style.display = "none";
        } else {
            try { isTiendaAbierta = false; } catch (e) { window.isTiendaAbierta = false; }
            if (typeof appState !== 'undefined') appState.isTiendaAbierta = false;
            badge.innerHTML = "🔴 CERRADO";
            badge.style.background = "rgba(234, 67, 53, 0.2)";
            badge.style.color = "#ea4335";
            badge.style.borderColor = "rgba(234, 67, 53, 0.4)";
            if (btnWs) btnWs.classList.add('disabled');
            if (msgCerrado) msgCerrado.style.display = "block";
        }
    } catch (e) { }
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
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath.includes('/carrito') || currentPath.includes('/carrito/')) {
        window.location.href = '../index.html';
        return;
    }
    if (currentPath.includes('producto.html') || currentPath.includes('carrito.html')) {
        window.location.href = 'index.html';
        return;
    }
    if (window.history && window.history.pushState) {
        const url = new URL(window.location.href);
        if (url.searchParams.has('categoria') || url.searchParams.has('producto')) {
            url.searchParams.delete('categoria');
            url.searchParams.delete('producto');
            window.history.pushState({}, '', url);
        }
    }
    cerrarModal('all');
    if (typeof closeSidebar === 'function') closeSidebar();
    setActiveNav('nav-home');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let inputBuscador = document.getElementById('buscador');
    if (inputBuscador) inputBuscador.value = '';

    let inputBuscadorDesktop = document.getElementById('buscador-desktop');
    if (inputBuscadorDesktop) inputBuscadorDesktop.value = '';

    let chk = document.getElementById('chkAgotados');
    if (chk) chk.checked = false;

    let sortSelect = document.getElementById('ordenarSelect');
    if (sortSelect) sortSelect.value = 'relevancia';

    cerrarSugerencias();
    try { subcategoriaActual = null; window.subcategoriaNombreActual = null; } catch (e) { window.subcategoriaActual = null; window.subcategoriaNombreActual = null; }

    if (typeof mostrarPanelGrupos === 'function') mostrarPanelGrupos();

    let cbInicio = document.getElementById('cat-todos');
    if (cbInicio) {
        filtrarCategoria('Todos', cbInicio);
    } else {
        filtrarCategoria('Todos', document.querySelector('#contenedorCategorias input[type="checkbox"]'));
    }

    let mTitle = document.getElementById('mobile-header-title');
    if (mTitle) mTitle.innerText = 'Inicio';
}

/** Limpia instantáneamente la barra de búsqueda y refresca los productos */
window.limpiarBuscador = function (skipFilters = false) {
    let input = document.getElementById('buscador');
    if (input) input.value = '';
    let inputDesktop = document.getElementById('buscador-desktop');
    if (inputDesktop) inputDesktop.value = '';
    let clearBtn = document.getElementById('clear-search');
    if (clearBtn) clearBtn.style.display = 'none';
    if (typeof cerrarSugerencias === 'function') cerrarSugerencias();
    if (!skipFilters && typeof aplicarFiltros === 'function') aplicarFiltros();
}

function abrirLegales() {
    abrirAjustes();
    
    // Buscar la pesta�a de Soporte Legal en el panel de ajustes y activarla
    const tabBtn = document.querySelector('.settings-tab-btn[onclick*="config-legales"]');
    if (tabBtn) {
        cambiarPestanaConfig('config-legales', tabBtn);
    } else {
        cambiarPestanaConfig('config-legales', null);
    }
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

    let inputCedula = document.getElementById('perfilCedula');
    if (inputCedula) inputCedula.value = localStorage.getItem('gc_cedula') || '';

    let inputTelefono = document.getElementById('perfilTelefono');
    if (inputTelefono) inputTelefono.value = localStorage.getItem('gc_telefono') || '';

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

    let inputCedula = document.getElementById('perfilCedula');
    if (inputCedula) localStorage.setItem('gc_cedula', inputCedula.value);

    let inputTelefono = document.getElementById('perfilTelefono');
    if (inputTelefono) localStorage.setItem('gc_telefono', inputTelefono.value);

    mostrarToast("Datos guardados ✅");
    cerrarModal('modal-perfil', 'nav-home');
}

window.formatearCedula = function (input) {
    let val = input.value.toUpperCase().replace(/[^VEJGP0-9\-]/g, '').replace(/-+/g, '-');
    if (val.length > 0) {
        let letra = val.charAt(0);
        if (/[VEJGP]/.test(letra)) {
            let numeros = val.slice(1).replace(/[^0-9\-]/g, '');
            input.value = (numeros.length > 0 && !numeros.startsWith('-')) ? letra + '-' + numeros : letra + numeros;
        } else {
            input.value = val.replace(/[^0-9\-]/g, '');
        }
    } else {
        input.value = '';
    }
}

window.formatearTelefono = function (input) {
    input.value = input.value.replace(/[^0-9+\-\s]/g, '');
}

function abrirAjustes() {
    cerrarModal('all');
    setActiveNav('nav-settings');
    document.getElementById('modal-ajustes').style.display = 'flex';
    
    // Sincronizar interruptor de Modo Oscuro
    const darkChk = document.getElementById('toggleDarkMode');
    if (darkChk) darkChk.checked = document.body.classList.contains('dark-mode');
    
    // Sincronizar interruptor de Ver Agotados
    const agotadosChk = document.getElementById('chkAgotados');
    const settingsAgotadosChk = document.getElementById('settingsAgotados');
    if (agotadosChk && settingsAgotadosChk) {
        settingsAgotadosChk.checked = agotadosChk.checked;
    }
    
    // Sincronizar selector de vista favorita (unidad/caja)
    const modoVistaSelect = document.getElementById('settingsModoVista');
    if (modoVistaSelect) {
        modoVistaSelect.value = window.modoVistaGlobal || 'unidad';
    }
    


}

function toggleDark() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode'));
    
    // Sincronizar el checkbox por si hay más de uno
    const darkChk = document.getElementById('toggleDarkMode');
    if (darkChk) darkChk.checked = document.body.classList.contains('dark-mode');
}

/** Cambia las pesta�as en el panel de Ajustes */
function cambiarPestanaConfig(tabId, btn) {
    // Quitar active de todas las pesta�as y ocultar paneles
    document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
    
    // Activar pesta�a y panel seleccionado
    if (btn) btn.classList.add('active');
    const pane = document.getElementById(tabId);
    if (pane) pane.classList.add('active');
}

/** Maneja el switch de Ver Agotados de Ajustes */
function toggleAgotadosConfig(switchEl) {
    const chkAgotados = document.getElementById('chkAgotados');
    if (chkAgotados) {
        chkAgotados.checked = switchEl.checked;
        if (typeof aplicarFiltros === 'function') aplicarFiltros();
    }
}

/** Cambia el modo de vista global desde Ajustes */
function cambiarModoVistaConfig(selectEl) {
    if (typeof cambiarModoVista === 'function') {
        cambiarModoVista(selectEl.value);
    }
}


/** Control del Acordeón interactivo */
function toggleAccordion(headerEl) {
    const item = headerEl.parentElement;
    const isActive = item.classList.contains('active');
    
    // Cerrar todos los acordeones
    document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('active');
        const content = i.querySelector('.accordion-content');
        if (content) content.style.maxHeight = null;
    });
    
    // Si no estaba activo, abrirlo
    if (!isActive) {
        item.classList.add('active');
        const content = item.querySelector('.accordion-content');
        if (content) content.style.maxHeight = content.scrollHeight + "px";
    }
}



function mostrarToast(msg) { const cont = document.getElementById('toast-container'); if (!cont) return; const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }

// --- VISTAS Y CATEGORÍAS ---
function cambiarModoVista(modo) {
    try { modoVistaGlobal = modo; } catch (e) { window.modoVistaGlobal = modo; }
    document.getElementById('btn-modo-unidad').classList.remove('active');
    document.getElementById('btn-modo-caja').classList.remove('active');
    document.getElementById('btn-modo-' + modo).classList.add('active');
    aplicarFiltros();
}

function inyectarInterruptor() {
    let cont = document.querySelector('.tools-container');
    if (cont && !document.getElementById('toggle-modo-global')) {
        let div = document.createElement('div');
        div.id = 'toggle-modo-global';
        div.className = 'toggle-modo-container';
        div.innerHTML = `<div class="btn-modo active" id="btn-modo-unidad" onclick="cambiarModoVista('unidad')">🍷 Por Unidad</div><div class="btn-modo" id="btn-modo-caja" onclick="cambiarModoVista('caja')">📦 Por Caja</div>`;
        cont.insertBefore(div, cont.firstChild);
    }

    // Inyectar Tooltip e Icono a la opción de Ver Agotados
    let chkAgotados = document.querySelector('.chk-agotados');
    if (chkAgotados && !document.getElementById('info-agotados-icon')) {
        chkAgotados.setAttribute('data-tooltip', 'Muestra también los productos temporalmente sin stock');
        chkAgotados.insertAdjacentHTML('beforeend', `<i id="info-agotados-icon" class="fa-solid fa-circle-info" style="color: var(--color-text-muted); font-size: 12px; margin-left: 2px;"></i>`);
    }
}

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
    if (c.includes('SNACK') || c.includes('CHUCHERIA') || c.includes('ALIMENTO') || c.includes('VIVERES') || c.includes('COMIDA') || c.includes('GALLETA') || c.includes('CHOCOLATE') || c.includes('DULCE') || c.includes('PASAPALO')) return 'fa-cookie-bite';
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
    let divInicio = document.createElement('div');
    divInicio.className = 'category-group';
    divInicio.innerHTML = `
        <div class="checkbox-item">
            <input type="checkbox" id="cat-todos" ${categoriaActual === 'Todos' ? 'checked' : ''} onchange="irInicio()">
            <label for="cat-todos">
                <i class="fa-solid ${getIconForCategory('Todos')}"></i>
                <span style="flex:1;">Todos los Departamentos</span>
            </label>
        </div>
    `;
    cont.appendChild(divInicio);


    // Categorías de la API SmartVentas
    if (appState.gruposInventario && appState.gruposInventario.length > 0) {
        appState.gruposInventario.forEach(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo;
            if (nombre) {
                let catIdLimpio = limpiarCategoria(nombre).replace(/[^a-z0-9]/gi, '-').toLowerCase();
                let iconClass = getIconForCategory(nombre);
                let div = document.createElement('div');
                div.className = 'category-group';
                div.innerHTML = `
                    <div class="checkbox-item">
                        <input type="checkbox" id="cat-${catIdLimpio}" ${limpiarCategoria(nombre) === limpiarCategoria(categoriaActual) ? 'checked' : ''} onchange="filtrarCategoria('${nombre}', this)">
                        <label for="cat-${catIdLimpio}">
                            <i class="fa-solid ${iconClass}"></i>
                            <span style="flex:1;">${nombre}</span>
                            <i class="fa-solid fa-xmark close-cat-icon" style="display:none; opacity: 0.8; font-size: 14px;"></i>
                        </label>
                    </div>
                `;
                cont.appendChild(div);
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
        if (typeof mostrarPanelGrupos === 'function') mostrarPanelGrupos();
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

window.generarMarquesinaGrupos = function () {
    let contBanners = document.getElementById('contenedorBanners');
    if (!contBanners) return;

    // Remover si ya existe para evitar duplicados al recargar
    let existing = document.getElementById('marquesina-grupos-container');
    if (existing) existing.remove();

    // Detener la animación anterior si existe
    if (window.marquesinaAnimId) cancelAnimationFrame(window.marquesinaAnimId);

    if (!appState.gruposInventario || appState.gruposInventario.length === 0) return;

    let wrap = document.createElement('div');
    wrap.id = 'marquesina-grupos-container';
    wrap.className = 'marquesina-grupos-section';

    try {
        const queryRaw = (document.getElementById('buscador')?.value || '').trim();
        wrap.style.display = (categoriaActual === 'Todos' && queryRaw.length === 0) ? 'block' : 'none';
    } catch (e) {
        wrap.style.display = 'none';
    }

    let track = document.createElement('div');
    track.className = 'marquesina-track';

    let createPills = () => {
        let html = '';
        appState.gruposInventario.forEach(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo;
            if (nombre) {
                let safeName = nombre.replace(/'/g, "\\'").replace(/"/g, "&quot;");
                let displayNombre = nombre.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                let catIdLimpio = limpiarCategoria(nombre).replace(/[^a-z0-9]/gi, '-').toLowerCase();
                html += `<div class="marquesina-pill" onclick="const cb = document.getElementById('cat-${catIdLimpio}'); if(cb) { cb.checked = true; } filtrarCategoria('${safeName}', cb)">
                            <i class="fa-solid ${getIconForCategory(nombre)}"></i> <span>${displayNombre}</span>
                         </div>`;
            }
        });
        return html;
    };

    let pillsHTML = createPills();
    // Se agrupa y duplica para asegurar una rotación infinita interactiva
    track.innerHTML = `<div class="marquesina-group">${pillsHTML}</div><div class="marquesina-group">${pillsHTML}</div>`;

    wrap.appendChild(track);

    let dotsContainer = document.getElementById('banners-dots');
    let parentWrapper = contBanners.closest('.banners-wrapper-relative') || contBanners;
    parentWrapper.parentNode.insertBefore(wrap, parentWrapper.nextSibling);

    // Lógica de Scroll Infinito e Interactivo
    let isHoveredOrTouched = false;
    let scrollSpeed = 0.2; // Velocidad de auto-scroll (más sutil y elegante)
    let scrollPos = 0;

    // Ajustamos eventos para detener la animación al interactuar
    wrap.addEventListener('mouseenter', () => isHoveredOrTouched = true);
    wrap.addEventListener('mouseleave', () => isHoveredOrTouched = false);
    wrap.addEventListener('touchstart', () => isHoveredOrTouched = true, { passive: true });
    wrap.addEventListener('touchend', () => {
        setTimeout(() => isHoveredOrTouched = false, 1200); // Pequeña pausa antes de reanudar
    });

    // Si el usuario hace scroll manual, permitimos el desplazamiento
    wrap.addEventListener('scroll', () => {
        let firstGroup = track.querySelector('.marquesina-group');
        if (!firstGroup) return;

        let maxScroll = firstGroup.offsetWidth;

        // Efecto infinito imperceptible
        if (wrap.scrollLeft >= maxScroll) { // Bucle hacia la derecha
            wrap.scrollLeft -= maxScroll;
        } else if (isHoveredOrTouched && wrap.scrollLeft <= 0) { // Bucle hacia la izquierda (solo con interacción del usuario)
            // Al llegar al inicio, saltamos al inicio del segundo grupo para un bucle sin fin
            wrap.scrollLeft += maxScroll;
        }

        // Sincronizamos la variable de JS con el scroll real del usuario
        if (isHoveredOrTouched) {
            scrollPos = wrap.scrollLeft;
        }
    }, { passive: true });

    const autoScroll = () => {
        // Si el contenedor está oculto, no hacemos cálculos para ahorrar CPU
        if (wrap.style.display !== 'none' && !isHoveredOrTouched) {
            let firstGroup = track.querySelector('.marquesina-group');
            if (firstGroup) {
                let maxScroll = firstGroup.offsetWidth;
                scrollPos += scrollSpeed;

                if (scrollPos >= maxScroll) {
                    scrollPos -= maxScroll;
                }

                wrap.scrollLeft = scrollPos;
            }
        }
        window.marquesinaAnimId = requestAnimationFrame(autoScroll);
    };

    window.marquesinaAnimId = requestAnimationFrame(autoScroll);
}

async function cargarSubcategoriasAPI(nombreCategoria) {
    let catIdLimpio = limpiarCategoria(nombreCategoria).replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Obtenemos el contenedor de subcategorías
    let subcatContainer = document.getElementById('contenedorSubcategoriasSidebar');
    if (!subcatContainer) return;

    // Actualizar el título del subgrupo
    let parentTitle = document.getElementById('submenu-parent-title');
    if (parentTitle) {
        parentTitle.innerText = `Subgrupos de ${nombreCategoria}`;
    }

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
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
                : (isLocalhost || window.location.hostname.includes('github.io')) ? 'https://gran-catador.pages.dev/api/proxy'
                    : 'functions/api/proxy.php';
            const res = await fetch(`${proxyBaseUrl}?endpoint=gruposinvsub/grupo/${encodeURIComponent(codGrupo)}`);
            if (res.ok) {
                const data = await res.json();
                subcategorias = Array.isArray(data) ? data : (data.data || data.result || []);
            }
        } catch (e) { }
    }

    // 2. ANALIZADOR DE RESPALDO: Analizar el inventario local si la API no devuelve nada
    if (subcategorias.length === 0) {
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
    }

    // 3. Renderizar en la pantalla
    if (subcategorias.length > 0) {
        // Ejecutar animación drill-down aquí ya que sabemos que hay subgrupos
        let panelGrupos = document.getElementById('categoria-section-main');
        let panelSubgrupos = document.getElementById('subcategoria-section-main');
        if (panelGrupos && panelSubgrupos) {
            panelGrupos.classList.remove('active-panel');
            panelGrupos.classList.add('hidden-panel');
            panelSubgrupos.classList.remove('hidden-panel');
            panelSubgrupos.classList.add('active-panel');
        }

        // --- LÓGICA DE RESCATE AUTOMÁTICO ---
        let prodsGrupo = inventario.filter(p => p.CatId === codGrupo || p.Cat === limpiarCategoria(nombreCategoria));
        if (prodsGrupo.length === 0) {
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

        let divTodos = document.createElement('div');
        divTodos.className = 'checkbox-item';
        divTodos.innerHTML = `
            <input type="checkbox" id="subcat-todos" ${!subcategoriaActual ? 'checked' : ''}>
            <label for="subcat-todos">
                <i class="fa-solid fa-layer-group"></i> Todos
            </label>
        `;
        let cbTodos = divTodos.querySelector('input');
        cbTodos.onchange = function () {
            if (typeof window.limpiarBuscador === 'function') window.limpiarBuscador(true);
            try { subcategoriaActual = null; window.subcategoriaNombreActual = null; } catch (e) { window.subcategoriaActual = null; window.subcategoriaNombreActual = null; }
            subcatContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
            this.checked = true;

            let prods = inventario.filter(p => p.CatId === codGrupo || p.Cat === limpiarCategoria(nombreCategoria));
            if (prods.length === 0) {
                if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
            }

            aplicarFiltros();
        };
        subcatContainer.appendChild(divTodos);

        subcategorias.forEach(sub => {
            let nombreSub = sub.nombre || sub.descripcion || sub.Nombre || sub.desc_subgrupo || "Subgrupo";
            let codSub = (sub.CodSubgrupo || sub.codsubgrupo || sub.Codsubgrupo || sub.cod_subgrupo || sub.cod_sub_grupo || sub.id_subgrupo || sub.id_sub_grupo || sub.Cod_subgrupo || sub.codigo || sub.id || sub.subgrupo || sub.Subgrupo || limpiarCategoria(nombreSub)).toString().trim();

            let nombreMostrado = nombreSub.charAt(0).toUpperCase() + nombreSub.slice(1).toLowerCase();
            let subIdLimpio = codSub.replace(/[^a-z0-9]/gi, '-').toLowerCase();

            let divSub = document.createElement('div');
            divSub.className = 'checkbox-item';
            divSub.innerHTML = `
                <input type="checkbox" id="subcat-${subIdLimpio}" ${(codSub === subcategoriaActual || limpiarCategoria(nombreSub) === subcategoriaActual) ? 'checked' : ''}>
                <label for="subcat-${subIdLimpio}">
                    <i class="fa-solid fa-angle-right"></i> ${nombreMostrado}
                </label>
            `;
            let cb = divSub.querySelector('input');
            cb.onchange = async function () {
                if (typeof window.limpiarBuscador === 'function') window.limpiarBuscador(true);
                try { subcategoriaActual = codSub; window.subcategoriaNombreActual = nombreSub; } catch (e) { window.subcategoriaActual = codSub; window.subcategoriaNombreActual = nombreSub; }
                subcatContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
                this.checked = true;

                if (codGrupo && codSub) {
                    let yaTengoProductos = inventario.some(p => (p.SubCatId && p.SubCatId.toString() === codSub) || (window.subcategoriaNombreActual && limpiarCategoria(p.SubCat) === limpiarCategoria(window.subcategoriaNombreActual)));
                    
                    if (!yaTengoProductos) {
                        if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
                        if (typeof cargarProductosPorSubgrupo === 'function') {
                            await cargarProductosPorSubgrupo(codGrupo, codSub, nombreCategoria, nombreSub);
                        }
                    } else {
                        // Refresco silencioso en background
                        if (typeof cargarProductosPorSubgrupo === 'function') {
                            cargarProductosPorSubgrupo(codGrupo, codSub, nombreCategoria, nombreSub).then(() => {
                                if (subcategoriaActual === codSub) aplicarFiltros();
                            });
                        }
                    }
                }

                aplicarFiltros();
                
                // Auto-cerrar en móvil al seleccionar subcategoría para una mejor UX
                if (window.innerWidth <= 1024 && typeof closeSidebar === 'function') {
                    closeSidebar();
                }
            };
            subcatContainer.appendChild(divSub);
        });
    } else {
        // Si no hay subgrupos, nos aseguramos de estar en el panel de grupos (por si acaso) y cerramos
        if (typeof mostrarPanelGrupos === 'function') mostrarPanelGrupos();
        subcatContainer.innerHTML = '';
        if (window.innerWidth <= 1024 && typeof closeSidebar === 'function') {
            closeSidebar();
        }
    }
}

async function filtrarCategoria(cat, checkboxElement) {
    if (window.location.pathname.includes('producto.html')) {
        window.location.href = 'index.html?categoria=' + encodeURIComponent(cat);
        return;
    }

    if (categoriaActual === cat && checkboxElement && !checkboxElement.checked) {
        irInicio();
        return;
    }

    if (typeof window.limpiarBuscador === 'function') window.limpiarBuscador(true);

    try { categoriaActual = cat; subcategoriaActual = null; } catch (e) { window.categoriaActual = cat; window.subcategoriaActual = null; }

    document.querySelectorAll('#contenedorCategorias input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (checkboxElement) checkboxElement.checked = true;

    if (window.history && window.history.pushState) {
        const url = new URL(window.location.href);
        if (cat === 'Todos' || cat === 'Favoritos') {
            url.searchParams.delete('categoria');
        } else {
            url.searchParams.set('categoria', cat);
        }
        url.searchParams.delete('producto');
        window.history.pushState({}, '', url);
    }

    // Si seleccionamos "Todos" o "Favoritos", regresar a la vista de grupos
    if (cat === 'Todos' || cat === 'Favoritos') {
        if (typeof mostrarPanelGrupos === 'function') mostrarPanelGrupos();
        // Auto-cerrar en móvil
        if (window.innerWidth <= 1024 && typeof closeSidebar === 'function') {
            closeSidebar();
        }
    }

    let mTitle = document.getElementById('mobile-header-title');
    if (mTitle) mTitle.innerText = (cat === 'Todos') ? 'Inicio' : cat;

    // Actualizar Hero Title dinámicamente
    let heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        if (cat === 'Todos' || cat === 'Favoritos') {
            heroTitle.innerHTML = 'Supermercado y <span class="highlight">Bodegón</span>';
        } else {
            heroTitle.innerHTML = '<span class="highlight">' + cat + '</span>';
        }
    }

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

    // --- EFECTO SOMBRA EN HEADER ---
    const header = document.querySelector('.site-header');
    if (header) {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
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

// --- NAVEGACIÓN A DETALLE DE PRODUCTO ---
window.irADetalle = function(codigo) {
    if (window.appState && window.appState.inventario) {
        // Intentar encontrar el producto en el inventario actual para pasarlo en caché
        let p = window.appState.inventario.find(x => window.compararIDs ? window.compararIDs(x.codigo, codigo) : x.codigo == codigo);
        if (p) {
            try {
                sessionStorage.setItem('gc_producto_actual', JSON.stringify(p));
            } catch(e) {
                console.warn("No se pudo guardar en sessionStorage", e);
            }
        }
    }
    window.location.href = 'producto.html?id=' + encodeURIComponent(codigo);
};
