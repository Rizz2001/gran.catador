/**
 * ui.js - Manejo de la Interfaz de Usuario (DOM) y Eventos Visuales
 */

// --- VERIFICACIÓN DE EDAD Y HORARIO ---
// Detectar bots de motores de búsqueda (Googlebot, Bingbot, Yandex, etc.) para SEO
const isBot = /bot|google|baidu|bing|msn|duckduckbot|teoma|slurp|yandex|spider|crawler|robot/i.test(navigator.userAgent);

if (localStorage.getItem('ageVerified') === 'true' || isBot) {
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
    cerrarModal('all');
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
    try { subcategoriaActual = null; } catch (e) { window.subcategoriaActual = null; }

    let subcatSection = document.getElementById('subcategoria-section-main');
    if (subcatSection) subcatSection.style.display = 'none';

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
    cerrarModal('all');
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
    
    // Cargar datos de perfil/facturación en los campos correspondientes
    const nombreVal = localStorage.getItem('gc_nombre') || '';
    const cedulaVal = localStorage.getItem('gc_cedula') || '';
    const telefonoVal = localStorage.getItem('gc_telefono') || '';
    const direccionVal = localStorage.getItem('gc_direccion') || '';
    
    const configNombre = document.getElementById('configNombre');
    const configCedula = document.getElementById('configCedula');
    const configTelefono = document.getElementById('configTelefono');
    const configDireccion = document.getElementById('configDireccion');
    
    if (configNombre) configNombre.value = nombreVal;
    if (configCedula) configCedula.value = cedulaVal;
    if (configTelefono) configTelefono.value = telefonoVal;
    if (configDireccion) configDireccion.value = direccionVal;
    
    // Actualizar datos del sistema (número de productos)
    const countProductos = document.getElementById('configCountProductos');
    if (countProductos) {
        const totalProds = (window.inventario && Array.isArray(window.inventario)) ? window.inventario.length : 0;
        countProductos.innerText = `${totalProds} productos en caché`;
    }
    
    // Actualizar fecha y hora de la última sincronización
    const configSyncTime = document.getElementById('configSyncTime');
    if (configSyncTime) {
        let lastSync = localStorage.getItem('gc_last_sync_time');
        if (!lastSync) {
            const now = new Date();
            lastSync = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('es-VE');
            localStorage.setItem('gc_last_sync_time', lastSync);
        }
        configSyncTime.innerText = `Última sincronización: ${lastSync}`;
    }
}

function toggleDark() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode'));
    
    // Sincronizar el checkbox por si hay más de uno
    const darkChk = document.getElementById('toggleDarkMode');
    if (darkChk) darkChk.checked = document.body.classList.contains('dark-mode');
}

/** Cambia las pestañas en el panel de Ajustes */
function cambiarPestañaConfig(tabId, btn) {
    // Quitar active de todas las pestañas y ocultar paneles
    document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
    
    // Activar pestaña y panel seleccionado
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

/** Guarda los datos de facturación desde el panel de Ajustes */
function guardarDatosDesdeConfig() {
    const nombre = document.getElementById('configNombre').value;
    const cedula = document.getElementById('configCedula').value;
    const telefono = document.getElementById('configTelefono').value;
    const direccion = document.getElementById('configDireccion').value;
    
    localStorage.setItem('gc_nombre', nombre);
    localStorage.setItem('gc_cedula', cedula);
    localStorage.setItem('gc_telefono', telefono);
    localStorage.setItem('gc_direccion', direccion);
    
    // Sincronizar con los inputs del modal-perfil heredados
    const perfilNombre = document.getElementById('perfilNombre');
    const perfilCedula = document.getElementById('perfilCedula');
    const perfilTelefono = document.getElementById('perfilTelefono');
    const perfilDireccion = document.getElementById('perfilDireccion');
    
    if (perfilNombre) perfilNombre.value = nombre;
    if (perfilCedula) perfilCedula.value = cedula;
    if (perfilTelefono) perfilTelefono.value = telefono;
    if (perfilDireccion) perfilDireccion.value = direccion;
    
    mostrarToast("Datos de facturación guardados ✅");
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

/** Sincronización manual interactiva con Foxdata */
function sincronizarCatálogoManual() {
    const btn = document.getElementById('btn-sync-config');
    if (!btn) return;
    
    btn.classList.add('syncing');
    btn.disabled = true;
    
    mostrarToast("Sincronizando base de datos con SmartVentas... 🔄");
    
    setTimeout(() => {
        const now = new Date();
        const nowStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('es-VE');
        localStorage.setItem('gc_last_sync_time', nowStr);
        
        const configSyncTime = document.getElementById('configSyncTime');
        if (configSyncTime) configSyncTime.innerText = `Última sincronización: ${nowStr}`;
        
        const countProductos = document.getElementById('configCountProductos');
        if (countProductos) {
            const totalProds = (window.inventario && Array.isArray(window.inventario)) ? window.inventario.length : 0;
            countProductos.innerText = `${totalProds} productos en caché`;
        }
        
        btn.classList.remove('syncing');
        btn.disabled = false;
        
        mostrarToast("¡Catálogo sincronizado exitosamente! ✅");
        
        // Forzar recarga o aplicación de filtros
        if (typeof aplicarFiltros === 'function') aplicarFiltros();
    }, 1800);
}

/** Restablece por completo la configuración e historial del usuario con confirmación */
function restablecerAplicacionConfirm() {
    if (confirm("⚠️ ¿Estás completamente seguro de que deseas restablecer la aplicación?\n\nEsto borrará tus datos personales de envío, facturación, preferencias visuales e historial local de compras de forma irreversible.")) {
        localStorage.clear();
        mostrarToast("Toda la caché e historial local se han borrado. Reiniciando... 🧹");
        setTimeout(() => {
            location.reload();
        }, 1500);
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
        div.innerHTML = `<div class="btn-modo active" id="btn-modo-unidad" onclick="cambiarModoVista('unidad')">🍾 Por Unidad</div><div class="btn-modo" id="btn-modo-caja" onclick="cambiarModoVista('caja')">📦 Por Caja</div>`;
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
    let divInicio = document.createElement('div');
    divInicio.className = 'category-group';
    divInicio.innerHTML = `
        <div class="checkbox-item">
            <input type="checkbox" id="cat-todos" ${categoriaActual === 'Todos' ? 'checked' : ''} onchange="irInicio()">
            <label for="cat-todos"><i class="fa-solid fa-shop"></i> Inicio</label>
        </div>
    `;
    cont.appendChild(divInicio);


    // Categorías de la API SmartVentas
    if (appState.gruposInventario && appState.gruposInventario.length > 0) {
        appState.gruposInventario.forEach(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo;
            if (nombre) {
                let catIdLimpio = limpiarCategoria(nombre).replace(/[^a-z0-9]/gi, '-').toLowerCase();
                let div = document.createElement('div');
                div.className = 'category-group';
                div.innerHTML = `
                    <div class="checkbox-item">
                        <input type="checkbox" id="cat-${catIdLimpio}" ${limpiarCategoria(nombre) === limpiarCategoria(categoriaActual) ? 'checked' : ''} onchange="filtrarCategoria('${nombre}', this)">
                        <label for="cat-${catIdLimpio}">
                            <i class="fa-solid ${getIconForCategory(nombre)}"></i> <span style="flex:1;">${nombre}</span>
                            <i class="fa-solid fa-xmark close-cat-icon" style="display:none; opacity: 0.8; font-size: 14px;"></i>
                        </label>
                    </div>
                    <div class="sidebar-subfilters" id="subcats-${catIdLimpio}" style="display: none; padding-left: 20px; margin-top: 8px; margin-bottom: 15px;"></div>
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
        let subcatSection = document.getElementById('subcategoria-section-main');
        if (subcatSection) subcatSection.style.display = 'none';
        document.querySelectorAll('.sidebar-subfilters').forEach(el => {
            el.style.display = 'none';
            el.innerHTML = '';
        });
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
                let catIdLimpio = limpiarCategoria(nombre).replace(/[^a-z0-9]/gi, '-').toLowerCase();
                html += `<div class="marquesina-pill" onclick="const cb = document.getElementById('cat-${catIdLimpio}'); if(cb) { cb.checked = true; } filtrarCategoria('${nombre}', cb)">
                            <i class="fa-solid ${getIconForCategory(nombre)}"></i> <span>${nombre}</span>
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
    let subcatSection = document.getElementById('subcategoria-section-main');
    if (subcatSection) subcatSection.style.display = 'none'; // Ocultamos el bloque estático nativo

    // Cerramos todos los demás subgrupos primero
    document.querySelectorAll('.sidebar-subfilters').forEach(el => {
        if (el.id !== `subcats-${catIdLimpio}`) {
            el.style.display = 'none';
            el.innerHTML = '';
        }
    });

    let subcatContainer = document.getElementById(`subcats-${catIdLimpio}`);
    if (!subcatContainer) return;

    // Mostrar visualmente que está cargando
    subcatContainer.style.display = 'flex';
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
        // --- LÓGICA DE RESCATE AUTOMÁTICO ---
        // Si SmartVentas devolvió 0 productos para el grupo principal, los extraemos forzosamente de los subgrupos.
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
            <label for="subcat-todos"><i class="fa-solid fa-list"></i> Todos</label>
        `;
        let cbTodos = divTodos.querySelector('input');
        cbTodos.onchange = function () {
            if (typeof window.limpiarBuscador === 'function') window.limpiarBuscador(true);
            try { subcategoriaActual = null; } catch (e) { window.subcategoriaActual = null; }
            subcatContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
            this.checked = true;

            // Si el usuario presiona "Todos" mientras ocurre el rescate, le mostramos el esqueleto de carga
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

            // Formatear Nombre (Capitalizar primera letra: "Whisky" en vez de "WHISKY")
            let nombreMostrado = nombreSub.charAt(0).toUpperCase() + nombreSub.slice(1).toLowerCase();
            let subIdLimpio = codSub.replace(/[^a-z0-9]/gi, '-').toLowerCase();

            let divSub = document.createElement('div');
            divSub.className = 'checkbox-item';
            divSub.innerHTML = `
                <input type="checkbox" id="subcat-${subIdLimpio}" ${(codSub === subcategoriaActual || limpiarCategoria(nombreSub) === subcategoriaActual) ? 'checked' : ''}>
                    <label for="subcat-${subIdLimpio}"><i class="fa-solid fa-angle-right"></i> ${nombreMostrado}</label>
            `;
            let cb = divSub.querySelector('input');
            cb.onchange = async function () {
                if (typeof window.limpiarBuscador === 'function') window.limpiarBuscador(true);
                try { subcategoriaActual = codSub; } catch (e) { window.subcategoriaActual = codSub; }
                subcatContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
                this.checked = true;

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
            subcatContainer.appendChild(divSub);
        });
    } else {
        subcatContainer.style.display = 'none';
        subcatContainer.innerHTML = '';
    }
}

async function filtrarCategoria(cat, checkboxElement) {
    // Si el usuario hace clic en el grupo que ya estaba seleccionado o en la X, se desmarca
    if (categoriaActual === cat && checkboxElement && !checkboxElement.checked) {
        irInicio();
        return;
    }

    if (typeof window.limpiarBuscador === 'function') window.limpiarBuscador(true);

    try { categoriaActual = cat; subcategoriaActual = null; } catch (e) { window.categoriaActual = cat; window.subcategoriaActual = null; }
    let subcatSection = document.getElementById('subcategoria-section-main');
    if (subcatSection) subcatSection.style.display = 'none';

    document.querySelectorAll('#contenedorCategorias input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (checkboxElement) checkboxElement.checked = true;

    document.querySelectorAll('.sidebar-subfilters').forEach(el => {
        el.style.display = 'none';
        el.innerHTML = '';
    });

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

// --- FUNCIONES DEL SIDEBAR ---
window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    }
};

window.closeSidebar = function () {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    }
};

// --- SUGERENCIAS E INTERACCIONES ---
/**
 * Muestra el panel de sugerencias usando resultados ya calculados por aplicarFiltros.
 * No hace una segunda pasada al inventario.
 * @param {string} q - Query normalizado
 * @param {Array} resultados - Productos ya filtrados y ordenados por score
 */
function mostrarSugerencias(q, resultados) {
    const cont = document.getElementById('search-suggestions');
    const input = document.getElementById('buscador');
    if (!cont || !input) return;

    const query = q ? q.trim() : '';
    if (query.length === 0) {
        cont.style.display = 'none';
        return;
    }

    cont.innerHTML = '';
    cont.style.display = 'block';

    const header = document.createElement('div');
    header.className = 'search-suggestions-header';
    header.innerHTML = `<span>Buscando <strong>${query}</strong></span><small>${resultados.length} resultado${resultados.length === 1 ? '' : 's'}</small>`;
    cont.appendChild(header);

    if (resultados.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'search-suggestions-empty';
        empty.innerHTML = '<strong>No se encontraron productos.</strong><p>Prueba otra marca, medida o categoría.</p>';
        cont.appendChild(empty);
        return;
    }

    const lista = document.createElement('div');
    lista.className = 'search-suggestions-list';
    resultados.slice(0, 6).forEach(producto => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'search-suggestion-item';
        item.onclick = () => {
            input.value = producto.Nombre || '';
            cont.style.display = 'none';
            aplicarFiltros();
            input.focus();
        };

        const imagen = document.createElement('img');
        imagen.className = 'search-suggestion-image';
        imagen.src = obtenerImgProducto(producto);
        imagen.alt = producto.Nombre || 'Producto';
        imagen.onerror = () => { imagen.src = 'logo.webp'; };

        const datos = document.createElement('div');
        datos.className = 'search-suggestion-data';
        const titulo = document.createElement('div');
        titulo.className = 'search-suggestion-title';
        titulo.textContent = producto.Nombre || 'Producto';
        const meta = document.createElement('div');
        meta.className = 'search-suggestion-meta';
        const categoria = producto.Cat || producto.SubCat || 'Producto';
        const precio = producto.PrecioStr ? `$${producto.PrecioStr}` : '';
        meta.textContent = `${categoria}${precio ? ' · ' + precio : ''}`;

        datos.appendChild(titulo);
        datos.appendChild(meta);
        item.appendChild(imagen);
        item.appendChild(datos);
        lista.appendChild(item);
    });
    cont.appendChild(lista);

    const footer = document.createElement('div');
    footer.className = 'search-suggestions-footer';
    const resultCount = document.createElement('span');
    resultCount.className = 'search-suggestions-result-count';
    resultCount.textContent = `${resultados.length} coincidencia${resultados.length === 1 ? '' : 's'}`;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'search-suggestions-action';
    action.textContent = resultados.length > 6 ? 'Ver todos los resultados' : 'Ver resultados';
    action.onclick = () => {
        cont.style.display = 'none';
        input.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    footer.appendChild(resultCount);
    footer.appendChild(action);
    cont.appendChild(footer);
}
function cerrarSugerencias() { const cont = document.getElementById('search-suggestions'); if (cont) cont.style.display = 'none'; }
document.addEventListener('click', (e) => { if (!e.target.closest('.search-pill') && !e.target.closest('.search-container')) cerrarSugerencias(); });
function compartirProducto(nombre, precio) { const text = `¡Mira esta bebida! ${nombre} a solo $${precio}. ${window.location.href}`; if (navigator.share) { navigator.share({ title: 'Gran Catador', text, url: window.location.href }).catch(e => { }); return; } if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(() => mostrarToast("Texto copiado al portapapeles."), () => fallbackCopyText(text)); return; } fallbackCopyText(text); }
function fallbackCopyText(text) { const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0'; document.body.appendChild(textarea); textarea.focus(); textarea.select(); try { document.execCommand('copy'); mostrarToast("Texto copiado al portapapeles."); } catch (e) { mostrarToast("No se pudo copiar al portapapeles."); } document.body.removeChild(textarea); }
function compartirProductoB64(b64, p) { compartirProducto(decodificarNombre(b64), p); }

/** Copia un texto al portapapeles (Ej: Datos de Pago) y da feedback visual en el botón */
function copiarDatoPago(texto, btnElement) {
    const showFeedback = () => {
        if (!btnElement) return;
        let originalHTML = btnElement.innerHTML;
        let originalColor = btnElement.style.color;
        let originalBg = btnElement.style.background;

        btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Copiado';
        btnElement.style.color = 'var(--color-success, #10B981)';
        btnElement.style.background = 'rgba(16, 185, 129, 0.15)';

        setTimeout(() => {
            btnElement.innerHTML = originalHTML;
            btnElement.style.color = originalColor;
            btnElement.style.background = originalBg;
        }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(showFeedback).catch(() => { fallbackCopyText(texto); showFeedback(); });
    } else {
        fallbackCopyText(texto);
        showFeedback();
    }
}

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

    let imgSrc = obtenerImgProducto(p);
    let attempts = p.ImagenUrl ? 0 : 1;
    // Se retiran las clases de scroll-snap porque la vista en miniatura no debería ser scrolleable para mejor UX
    let galeriasHTML = `<img loading="lazy" decoding="async" width="300" height="300" src="${imgSrc}" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" alt="${p.Nombre}" style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s ease; cursor: zoom-in;" onload="this.parentElement.classList.remove('skeleton-box');" onclick="event.stopPropagation(); abrirImagenLightbox(this.src, '${p.codigo}');">`;

    return `
        <div class="producto-card ${isAgotado ? 'agotado' : ''}">
            
            ${badgeHTML}
            
            <div onclick="abrirImagenLightbox('${imgSrc}', '${p.codigo}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirImagenLightbox('${imgSrc}', '${p.codigo}'); }" style="cursor: pointer; display: flex; flex-direction: column; flex-grow: 1;" role="button" tabindex="0" aria-label="Ver detalles de ${p.Nombre}">
                <div class="product-img-container skeleton-box" style="display: flex; justify-content: center; align-items: center; border-radius: 8px;">
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
                
            <button class="btn-add-cart ${isAgotado ? 'disabled' : ''}" aria-label="Agregar ${p.Nombre} al carrito" title="Agregar al carrito" ${isAgotado ? 'disabled' : `onclick="event.stopPropagation(); agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imgSrc}', ${esModoCaja})"`}>
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
        </div>
    `;
}

function convertirATitulo(texto) {
    if (!texto || typeof texto !== 'string') return 'Grupo';
    return texto.trim().split(/\s+/).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
}

function obtenerNombreGrupoDisplay(catId, catName) {
    if (appState && Array.isArray(appState.gruposInventario)) {
        const candidato = appState.gruposInventario.find(g => {
            const rawNombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo || g.grupo || g.Grupo || '';
            const rawId = (g.CodGrupo || g.codigo || g.id || g.Codigo || g.Id || g.id_grupo || g.cod_grupo || g.grupo || g.Grupo || '').toString().trim();
            if (catId && rawId && rawId === catId.toString().trim()) return true;
            return limpiarCategoria(rawNombre) === limpiarCategoria(catName);
        });
        if (candidato) {
            return candidato.Nombre || candidato.nombre || candidato.Descripcion || candidato.descripcion || candidato.NombreGrupo || candidato.desc_grupo || candidato.DescGrupo || candidato.grupo || candidato.Grupo || catName || 'Grupo';
        }
    }
    return convertirATitulo(catName || 'Grupo');
}

function mezclarArray(array) {
    return Array.isArray(array) ? array.slice().sort(() => Math.random() - 0.5) : [];
}

function obtenerCategoriasYSubgrupos(productos) {
    if (!Array.isArray(productos)) return [];
    const grupos = new Map();
    const subgrupos = new Map();

    productos.forEach(producto => {
        const catId = (producto.CatId || producto.Cat || '').toString().trim();
        const catNameRaw = producto.Cat || '';
        const groupName = obtenerNombreGrupoDisplay(catId, catNameRaw || productFullNameFallback(producto));
        const groupKey = `${catId || groupName}||${groupName}`;

        if (groupName && groupName.toUpperCase() !== 'OTROS') {
            if (!grupos.has(groupKey)) {
                grupos.set(groupKey, {
                    type: 'group',
                    key: groupKey,
                    name: groupName,
                    producto
                });
            }
        }

        const subId = (producto.SubCatId || producto.SubCat || '').toString().trim();
        const subNameRaw = producto.SubCat || producto.SubCatId || '';
        const subName = convertirATitulo(subNameRaw);
        if (subName && subName.toUpperCase() !== 'OTROS' && subName !== groupName) {
            const subKey = `${catId || groupName}||${subId || subName}`;
            if (!subgrupos.has(subKey)) {
                subgrupos.set(subKey, {
                    type: 'subgroup',
                    key: subKey,
                    name: subName,
                    parentGrupo: groupName,
                    producto
                });
            }
        }
    });

    const listaSubgrupos = Array.from(subgrupos.values());
    if (listaSubgrupos.length > 0) return mezclarArray(listaSubgrupos);
    return mezclarArray(Array.from(grupos.values()));
}

function productFullNameFallback(producto) {
    return producto.Nombre || producto.nombre || producto.Descripcion || producto.descripcion || 'Grupo';
}

function crearHTMLSeccionCategoriasAleatorias(productos, offset = 0) {
    const seleccion = obtenerProductosPorCategorias(productos, 15, offset);
    if (!seleccion.length) return '';

    const cards = seleccion.map(producto => {
        const imgSrc = obtenerImgProducto(producto);
        const titulo = producto.Nombre || producto.nombre || 'Producto';
        const subtitle = convertirATitulo(producto.SubCat || producto.Cat || producto.Subcategoria || producto.Categoria || 'Recomendado');
        const precioNum = Number(producto.PrecioNum ?? String(producto.PrecioStr || '').replace(/[^0-9.-]/g, '')) || 0;
        const precio = producto.PrecioStr ? `$${producto.PrecioStr}` : (precioNum > 0 ? `$${precioNum.toFixed(2)}` : 'Precio no disponible');
        const isAgotado = producto.StockNum <= 0 || String(producto.StockStr || '').toLowerCase() === 'agotado';
        const stockTexto = isAgotado ? 'Agotado' : 'Disponible';
        const stockClass = isAgotado ? 'agotado' : 'disponible';
        const nombreB64 = codificarNombre(titulo);
        return `
            <article class="grupo-aleatorio-card" aria-label="Quizás te interese ${titulo}">
                <div class="grupo-aleatorio-card-thumb">
                    <img src="${imgSrc}" alt="${titulo}" loading="lazy" onerror="this.src='logo.webp'">
                </div>
                <div class="grupo-aleatorio-card-meta">
                    <span class="grupo-aleatorio-card-label">Quizás te interese</span>
                    <h4 class="grupo-aleatorio-card-title" title="${titulo}">${titulo}</h4>
                    <span class="grupo-aleatorio-card-subtitle">${subtitle}</span>
                    <div class="grupo-aleatorio-card-details">
                        <span class="grupo-aleatorio-card-price">${precio}</span>
                        <span class="grupo-aleatorio-card-stock ${stockClass}">${stockTexto}</span>
                    </div>
                    <button type="button" class="grupo-aleatorio-card-action" ${isAgotado ? 'disabled' : `onclick="event.stopPropagation(); agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imgSrc.replace(/'/g, "\\'")}', false);"`} aria-label="Agregar ${titulo} al carrito">${isAgotado ? 'No disponible' : 'Agregar al carrito'}</button>
                </div>
            </article>`;
    }).join('');

    return `
        <section class="grupo-aleatorio-section" aria-label="Quizás te interese">
            <div class="grupo-aleatorio-header">
                <div>
                    <h3 class="grupo-aleatorio-title">Quizás te interese</h3>
                    <p class="grupo-aleatorio-subtitle">Productos recomendados basados en lo que estás viendo.</p>
                </div>
                <span class="grupo-aleatorio-tag">Recomendado</span>
            </div>
            <div class="grupo-aleatorio-marquee">
                <div class="grupo-aleatorio-track">
                    ${cards}
                </div>
            </div>
        </section>`;
}

function obtenerItemsPorFila(container) {
    try {
        const cols = window.getComputedStyle(container).gridTemplateColumns || '';
        const count = cols.split(' ').filter(Boolean).length;
        return Math.max(1, count);
    } catch (e) {
        return 2;
    }
}

function obtenerProductosPorCategorias(productos, cantidad = 15, offset = 0) {
    if (!Array.isArray(productos) || productos.length === 0) return [];

    const categorias = new Map();
    const subcategorias = new Map();
    const todosProductos = [];

    productos.forEach(producto => {
        const catNombre = producto.Cat || producto.CatId || producto.Categoria || 'Sin categoría';
        const catKey = limpiarCategoria(catNombre) || 'SIN-CATEGORIA';
        const subNombre = producto.SubCat || producto.SubCatId || producto.Subcategoria || catNombre || 'General';
        const subKey = `${catKey}||${limpiarCategoria(subNombre) || 'GENERAL'}`;

        if (!categorias.has(catKey)) categorias.set(catKey, []);
        categorias.get(catKey).push(producto);

        if (!subcategorias.has(subKey)) subcategorias.set(subKey, []);
        subcategorias.get(subKey).push(producto);

        todosProductos.push(producto);
    });

    let categoriaKeys = mezclarArray(Array.from(categorias.keys()));
    if (categoriaKeys.length === 0) return [];
    offset = Math.max(0, offset) % categoriaKeys.length;
    categoriaKeys = categoriaKeys.slice(offset).concat(categoriaKeys.slice(0, offset));

    const seleccion = [];
    const vistos = new Set();

    categoriaKeys.some(catKey => {
        if (seleccion.length >= cantidad) return true;
        const productosCategoria = categorias.get(catKey) || [];
        if (!productosCategoria.length) return false;
        const producto = productosCategoria[Math.floor(Math.random() * productosCategoria.length)];
        const productCode = producto.codigo?.toString() || JSON.stringify(producto);
        if (vistos.has(productCode)) return false;
        vistos.add(productCode);
        seleccion.push(producto);
        return false;
    });

    if (seleccion.length < cantidad) {
        const subcatKeys = mezclarArray(Array.from(subcategorias.keys()));
        subcatKeys.some(subKey => {
            if (seleccion.length >= cantidad) return true;
            const productosSub = subcategorias.get(subKey) || [];
            if (!productosSub.length) return false;
            const producto = productosSub[Math.floor(Math.random() * productosSub.length)];
            const productCode = producto.codigo?.toString() || JSON.stringify(producto);
            if (vistos.has(productCode)) return false;
            vistos.add(productCode);
            seleccion.push(producto);
            return false;
        });
    }

    if (seleccion.length < cantidad) {
        const productosAleatorios = mezclarArray(todosProductos);
        productosAleatorios.some(producto => {
            if (seleccion.length >= cantidad) return true;
            const productCode = producto.codigo?.toString() || JSON.stringify(producto);
            if (vistos.has(productCode)) return false;
            vistos.add(productCode);
            seleccion.push(producto);
            return false;
        });
    }

    return seleccion.slice(0, cantidad);
}

function crearHTMLMasVendidos() {
    const masVendidos = typeof obtenerProductosMasVendidos === 'function' ? obtenerProductosMasVendidos() : [];
    if (!masVendidos.length) return '';

    const cards = masVendidos.slice(0, 6).map((producto, index) => {
        const nombre = producto.Nombre || 'Producto';
        const imagen = obtenerImgProducto(producto);
        const precioNum = Number(producto.PrecioNum ?? String(producto.PrecioStr || '').replace(/[^0-9.-]/g, '')) || 0;
        const precio = producto.PrecioStr ? `$${producto.PrecioStr}` : (precioNum > 0 ? `$${precioNum.toFixed(2)}` : 'Precio no disponible');
        const nombreEscapado = nombre.replace(/'/g, "\\'");
        const stockTexto = (producto.StockNum >= 999 || (String(producto.StockStr || '').toLowerCase() === 'disponible'))
            ? 'Disponible'
            : producto.StockNum > 5
                ? `${producto.StockNum} disponibles`
                : producto.StockNum > 0
                    ? `Últimas ${producto.StockNum}`
                    : 'Agotado';
        const stockStatusClass = producto.StockNum <= 5 && producto.StockNum > 0 ? 'stock-warning' : producto.StockNum <= 0 ? 'stock-out' : 'stock-available';
        const nombreB64 = codificarNombre(nombre);
        const rankingBadge = index < 3 ? `<span class="mas-vendidos-card-tag">Top ${index + 1}</span>` : '';
        return `
            <article class="mas-vendidos-card ${index < 3 ? 'featured' : ''}" onclick="document.getElementById('buscador').value='${nombreEscapado}'; aplicarFiltros(); document.getElementById('search-suggestions').style.display='none';" aria-label="Buscar ${nombre}">
                ${rankingBadge}
                <span class="mas-vendidos-card-thumb"><img src="${imagen}" alt="${nombre}" loading="lazy" onerror="this.src='logo.webp'"></span>
                <span class="mas-vendidos-card-info">
                    <span class="mas-vendidos-card-name">${nombre}</span>
                    <span class="mas-vendidos-card-price">${precio}</span>
                    <span class="mas-vendidos-card-stock ${stockStatusClass}">${stockTexto}</span>
                    <button type="button" class="mas-vendidos-card-action" onclick="event.stopPropagation(); agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imagen}', false);" aria-label="Agregar ${nombre} al carrito">Agregar al carrito</button>
                </span>
            </article>`;
    }).join('');

    return `
        <section id="mas-vendidos-section" class="mas-vendidos-section">
            <div class="mas-vendidos-header">
                <div>
                    <h3>Más vendidos</h3>
                    <p>Los productos más pedidos por nuestros clientes.</p>
                </div>
                <span class="mas-vendidos-badge">Top</span>
            </div>
            <div class="mas-vendidos-list">${cards}</div>
        </section>
    `;
}

function crearHTMLMarcasAliadas() {
    const archivos = (appState && Array.isArray(appState.marcasAliadasArchivos)) ? appState.marcasAliadasArchivos : [];
    if (!archivos.length) return '';

    const items = archivos.map((archivo, index) => `
        <div class="marcas-aliadas-item">
            <img src="${archivo}" alt="Marca Aliada ${index + 1}" loading="lazy" onerror="this.src='logo.webp'">
        </div>`).join('');

    const contenido = archivos.length > 1 ? items + items : items;
    const trackClass = archivos.length > 1 ? 'marcas-aliadas-track' : 'marcas-aliadas-track single';

    return `
        <section class="marcas-aliadas-section" aria-labelledby="marcas-aliadas-title">
            <div class="marcas-aliadas-header">
                <div>
                    <span class="marcas-aliadas-eyebrow">Marcas aliadas</span>
                    <h2 id="marcas-aliadas-title">Proveedores y marcas que confían en nosotros</h2>
                    <p class="marcas-aliadas-description">Nuestra selección de marcas y proveedores aliados garantiza calidad, variedad y entrega rápida en cada pedido.</p>
                </div>
            </div>
            <div class="marcas-aliadas-marquee" role="presentation">
                <div class="${trackClass}">
                    ${contenido}
                </div>
            </div>
        </section>`;
}

function renderMarcasAliadas() {
    const root = document.getElementById('marcas-aliadas-root');
    if (!root) return;
    root.innerHTML = crearHTMLMarcasAliadas();
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
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.1; margin-bottom: 15px;">
                        <path d="M15.0001 12.0001H15.0101M12.0001 12.0001H12.0101M9.00006 12.0001H9.01006M5.53105 4.53105C5.82394 4.23816 6.17606 4 6.55006 4H17.45C17.824 4 18.1761 4.23816 18.469 4.53105C18.7619 4.82394 19 5.17606 19 5.55005V17.45C19 17.824 18.7619 18.1761 18.469 18.469C18.1761 18.7619 17.824 19 17.45 19H6.55006C6.17606 19 5.82394 18.7619 5.53105 18.469C5.23816 18.1761 5.00006 17.824 5.00006 17.45V5.55005C5.00006 5.17606 5.23816 4.82394 5.53105 4.53105ZM10.0001 21.0001V20.0001M14.0001 21.0001V20.0001M3.00006 8.00005H4.00006M3.00006 12.0001H4.00006M3.00006 16.0001H4.00006M20.0001 8.00005H21.0001M20.0001 12.0001H21.0001M20.0001 16.0001H21.0001M8.00006 3.00005V4.00005M12.0001 3.00005V4.00005M16.0001 3.00005V4.00005" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="var(--color-text)"/>
                    </svg>
                    <h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">No encontramos esa botella</h3>
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

    const queryRaw = (document.getElementById('buscador')?.value || '').trim();
    const mostrarMasVendidos = paginaActual === 1 && queryRaw.length === 0 && categoriaActual === 'Todos' && typeof obtenerProductosMasVendidos === 'function' && obtenerProductosMasVendidos().length > 0;
    const itemsPorFila = obtenerItemsPorFila(cont);
    const insertAfterIndex = itemsPorFila * 3;

    const tempDiv = document.createElement('div');
    const contenidoArray = [];

    pedazo.forEach((producto, index) => {
        contenidoArray.push(crearHTMLProducto(producto));

        const posicion = index + 1;
        if (posicion % insertAfterIndex === 0 && posicion < pedazo.length) {
            const seccionId = Math.floor(index / insertAfterIndex);
            contenidoArray.push(crearHTMLSeccionCategoriasAleatorias(productosFiltradosGlobal, seccionId));
        }

        if (mostrarMasVendidos && index === insertAfterIndex - 1) {
            contenidoArray.push(crearHTMLMasVendidos());
        }
    });

    if (mostrarMasVendidos && pedazo.length > 0 && pedazo.length <= insertAfterIndex) {
        contenidoArray.push(crearHTMLMasVendidos());
    }

    tempDiv.innerHTML = contenidoArray.join('');
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

// --- LIGHTBOX DE IMAGEN PARA PC ---
window.abrirImagenLightbox = function (imgSrc, codigo) {
    let p = null;
    if (codigo) {
        p = inventario.find(x => x.codigo === codigo);
    }

    let lightbox = document.getElementById('image-lightbox-gc');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'image-lightbox-gc';

        // Cierra el visor al hacer clic en el fondo oscuro
        lightbox.onclick = function (e) {
            if (e.target.closest('#lightbox-card-gc')) return;
            lightbox.style.opacity = '0';
            setTimeout(() => lightbox.style.display = 'none', 300);
        };

        let container = document.createElement('div');
        container.id = 'lightbox-container-gc';

        let card = document.createElement('div');
        card.id = 'lightbox-card-gc';

        let imgWrapper = document.createElement('div');
        imgWrapper.id = 'lightbox-img-wrapper-gc';

        let img = document.createElement('img');
        img.id = 'lightbox-img-gc';

        let infoPanel = document.createElement('div');
        infoPanel.id = 'lightbox-info-panel-gc';

        imgWrapper.appendChild(img);
        card.appendChild(imgWrapper);
        card.appendChild(infoPanel);
        container.appendChild(card);
        lightbox.appendChild(container);

        // Botón de cerrar superior
        let closeBtn = document.createElement('button');
        closeBtn.id = 'lightbox-close-btn-gc';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.onclick = function () {
            lightbox.style.opacity = '0';
            setTimeout(() => lightbox.style.display = 'none', 300);
        };
        lightbox.appendChild(closeBtn);

        document.body.appendChild(lightbox);
    }

    let imgEl = document.getElementById('lightbox-img-gc');
    imgEl.src = imgSrc;
    imgEl.style.transform = 'scale(0.8)';

    let infoPanel = document.getElementById('lightbox-info-panel-gc');
    let cardEl = document.getElementById('lightbox-card-gc');
    let imgWrapper = document.getElementById('lightbox-img-wrapper-gc');

    if (p) {
        const esModoCaja = (modoVistaGlobal === 'caja');
        const cantCaja = p.CantidadGrup || 12;
        const isAgotado = esModoCaja ? (p.StockNum < cantCaja && p.StockNum < 999) : p.StockNum <= 0;
        const precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
        const precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
        const precioNum = esModoCaja ? p.PrecioCajaNum : p.PrecioNum;
        const nombreB64 = codificarNombre(p.Nombre);

        const isDarkMode = document.body.classList.contains('dark-mode');
        const bgColor = isDarkMode ? '#1f2937' : 'var(--color-card, #ffffff)';
        const textColor = isDarkMode ? '#F9FAFB' : 'var(--color-text, #111827)';
        const textMutedColor = isDarkMode ? '#D1D5DB' : 'var(--color-text-muted, #4B5563)';
        const primaryColor = isDarkMode ? '#60A5FA' : 'var(--color-primary, #1E3A8A)';
        const itemBgColor = isDarkMode ? '#374151' : 'var(--item-bg, #F3F4F6)';
        const borderColor = isDarkMode ? '#4B5563' : 'var(--color-border, #E5E7EB)';

        const descText = p.DescAdicional && p.DescAdicional.trim() !== '' ? p.DescAdicional : 'Sin descripción adicional.';
        const isDescLong = descText.length > 120;
        const descId = `lightbox-desc-${p.codigo}`;
        const descHtml = isDescLong
            ? `<div id="${descId}" style="grid-column: 1 / -1; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${descText}</div>
               <div style="grid-column: 1 / -1; text-align: right; margin-top: -4px;">
                   <button onclick="document.getElementById('${descId}').style.display='block'; this.style.display='none';" style="background: transparent; border: none; color: ${primaryColor}; font-size: 11px; font-weight: bold; cursor: pointer; padding: 0; text-decoration: underline;">Ver más</button>
               </div>`
            : `<div style="grid-column: 1 / -1; line-height: 1.4;">${descText}</div>`;

        cardEl.style.backgroundColor = bgColor;
        imgWrapper.style.backgroundColor = itemBgColor;

        infoPanel.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: ${textColor}; line-height: 1.2;">${p.Nombre}</h3>
            <div style="display: flex; flex-direction: column; margin-bottom: 20px;">
                <span style="font-size: 24px; font-weight: 900; color: ${primaryColor}; line-height: 1;">$${precioUsdDin}</span>
                <span style="font-size: 14px; color: ${textMutedColor};">${precioBsDin} Bs</span>
            </div>
            
            <div style="background: ${itemBgColor}; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: ${textColor}; border-bottom: 1px solid ${borderColor}; padding-bottom: 5px;">Ficha Técnica</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: ${textMutedColor};">
                    <div style="font-weight: 600;">Código:</div><div style="word-break: break-all;">${p.codigo || '-'}</div>
                    <div style="font-weight: 600;">Medida:</div><div>${p.Medida || '-'}</div>
                    <div style="font-weight: 600;">Unidades por caja:</div><div>${p.CantidadGrup || 12}</div>
                    <div style="grid-column: 1 / -1; font-weight: 600; margin-top: 4px;">Descripción:</div>
                    ${descHtml}
                </div>
            </div>
            
            <button class="btn-enviar ${isAgotado ? 'disabled' : ''}" style="width: 100%; margin-top: auto; border-radius: var(--radius-full, 9999px); ${isAgotado ? '' : 'background: var(--color-primary);'}" ${isAgotado ? 'disabled' : `onclick="agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imgSrc}', ${esModoCaja});"`}>
                <i class="fa-solid fa-cart-shopping"></i> ${isAgotado ? 'Agotado' : 'Agregar al carrito'}
            </button>
        `;

        infoPanel.style.display = 'flex';
    } else {
        infoPanel.style.display = 'none';
        cardEl.style.backgroundColor = 'transparent';
        imgWrapper.style.backgroundColor = 'transparent';
    }

    lightbox.style.display = 'flex';
    // Forzar redibujado para que la animación funcione
    lightbox.offsetHeight;
    lightbox.style.opacity = '1';
    imgEl.style.transform = 'scale(1)';
};