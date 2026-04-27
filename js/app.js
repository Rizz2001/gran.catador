let inventario = [];
let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || [];
let tasaOficial = 36.25; let tasaEuro = 40.00; let categoriaActual = 'LICORES'; let debounceTimer;
let isTiendaAbierta = true; let codigosRecomendados = []; let siempreDisponibles = [];
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

let appSettings = { useApi: true, apiType: 'smartventas' };

let modoVistaGlobal = 'unidad';
let subcategoriasLicores = {};
let mapaCodToSubcategoria = {};
let subcategoriaActual = null;

if (localStorage.getItem('gc_dark') === 'true') document.body.classList.add('dark-mode');

if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').then(reg => { reg.update(); console.log("PWA Ok"); }).catch(err => console.log("SW Error", err)); }); }

async function loadAppSettings() {
    try {
        const response = await fetch('data/config/settings.json?v=' + new Date().getTime());
        if (response.ok) {
            appSettings = await response.json();
            console.log("⚙️ Configuraciones cargadas:", appSettings.useApi ? "API Activada" : "Usando Archivos Locales");
        }
    } catch (error) {
        console.log("⚠️ No se encontró settings.json, usando valores por defecto.");
    }
}

async function obtenerTasaDolar() {
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares');
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                // Usar la tasa promedio o la oficial
                const tasaPromedio = data[0].promedio || data[0].precio || 36.25;
                tasaOficial = parseFloat(tasaPromedio);
                appState.tasaOficial = tasaOficial;
                console.log(`💵 Tasa actualizada vía API: ${tasaOficial.toFixed(2)} Bs`);
                // Guardar en localStorage para persistencia
                localStorage.setItem('tasaDolar', tasaOficial.toString());
                localStorage.setItem('tasaDolarTime', new Date().getTime().toString());
                return true;
            }
        }
    } catch (error) {
        console.log("⚠️ Error obteniendo tasa de dolarapi:", error.message);
        // Intentar usando tasa.txt como fallback
        try {
            let resTasa = await fetch('data/config/tasa.txt?v=' + new Date().getTime());
            if (resTasa.ok) {
                let texto = await resTasa.text();
                tasaOficial = parseFloat(texto.trim().replace(',', '.'));
                appState.tasaOficial = tasaOficial;
                console.log(`📄 Tasa cargada desde archivo local: ${tasaOficial.toFixed(2)} Bs`);
                localStorage.setItem('tasaDolar', tasaOficial.toString());
                localStorage.setItem('tasaDolarTime', new Date().getTime().toString());
                return true;
            }
        } catch (fallbackError) {
            console.log("⚠️ Error cargando tasa local:", fallbackError.message);
            // Si hay tasa guardada en localStorage, usarla
            const tasaGuardada = localStorage.getItem('tasaDolar');
            if (tasaGuardada) {
                tasaOficial = parseFloat(tasaGuardada);
                appState.tasaOficial = tasaOficial;
                console.log(`💾 Usando tasa en caché: ${tasaOficial.toFixed(2)} Bs`);
                return true;
            }
        }
    }
    return false;
}

async function obtenerTasaEuro() {
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/euros');
        if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data) && data.length > 0) {
                const tasaPromedio = data[0].promedio || data[0].precio || 40.00;
                tasaEuro = parseFloat(tasaPromedio);
                console.log(`💶 Tasa Euro API: ${tasaEuro.toFixed(2)} Bs`);
                localStorage.setItem('tasaEuro', tasaEuro.toString());
                return true;
            }
        }
    } catch (error) {
        console.log("⚠️ Error obteniendo tasa euro:", error.message);
        const tasaGuardada = localStorage.getItem('tasaEuro');
        if (tasaGuardada) tasaEuro = parseFloat(tasaGuardada);
    }
    return false;
}

async function obtenerArchivosExternos() {
    // Obtener tasa de dólares
    await obtenerTasaDolar();
    let tasaEl = document.getElementById('tasaValor'); if (tasaEl) tasaEl.innerText = tasaOficial.toFixed(2) + " Bs";
    let tasaElMob = document.getElementById('tasaValorMobile'); if (tasaElMob) tasaElMob.innerText = tasaOficial.toFixed(2) + " Bs";

    // Obtener tasa de euros
    await obtenerTasaEuro();
    let tasaEuroEl = document.getElementById('tasaEuroValor'); if (tasaEuroEl) tasaEuroEl.innerText = tasaEuro.toFixed(2) + " Bs";
    let tasaEuroElMob = document.getElementById('tasaEuroValorMobile'); if (tasaEuroElMob) tasaEuroElMob.innerText = tasaEuro.toFixed(2) + " Bs";

    if (appSettings.useApi) {
        if (appSettings.apiType === 'mysql') {
            try {
                await cargarConfiguracionDesdeAPI();
            } catch (e) {
                console.log("⚠️ Error cargando config desde API, usando archivos locales:", e.message);
                await cargarConfiguracionDesdeArchivos();
            }
        } else if (appSettings.apiType === 'smartventas') {
            await cargarConfiguracionDesdeArchivos();
        }
    } else {
        await cargarConfiguracionDesdeArchivos();
    }

    try {
        let resBan = await fetch('data/config/banners.txt?v=' + new Date().getTime());
        if (resBan.ok) {
            let textoBan = await resBan.text(); let listaBanners = textoBan.split(/[\n,]+/).map(b => b.trim()).filter(b => b !== "");
            let contBanners = document.getElementById('contenedorBanners');
            if (listaBanners.length > 0 && contBanners) {
                contBanners.innerHTML = '';
                contBanners.style.display = 'flex';
                contBanners.style.overflowX = 'hidden';
                contBanners.style.scrollBehavior = 'smooth';

                listaBanners.forEach((img, idx) => {
                    let loadingAttr = idx === 0 ? '' : 'loading="lazy"';
                    contBanners.innerHTML += `<div class="promo-banner" style="min-width: 100%; flex-shrink: 0;"><img src="assets/banners/${img}" alt="Promo" style="width: 100%; border-radius: 12px; display: block;" ${loadingAttr} onerror="this.parentElement.style.display='none'"></div>`;
                });

                let slideIndex = 0;
                setInterval(() => {
                    let totalSlides = contBanners.children.length;
                    if (totalSlides > 1) {
                        slideIndex++;
                        if (slideIndex >= totalSlides) slideIndex = 0;
                        contBanners.scrollTo({ left: contBanners.clientWidth * slideIndex, behavior: 'smooth' });
                    }
                }, 3000);
            }
        }
    } catch (error) { console.log("Sin banners.txt"); }
}

async function mostrarFechaActualizacion() {
    let dateStr = "recientemente";
    try {
        if (appSettings.useApi) {
            let d = new Date();
            dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else {
            let resHead = await fetch("data/inventario/Inventario Fisico general precio por unidad.csv", { method: 'HEAD', cache: 'no-cache' });
            let lastMod = resHead.headers.get('Last-Modified');
            if (lastMod) {
                let d = new Date(lastMod);
                dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            } else {
                let d = new Date();
                dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
        }
    } catch (e) {
        let d = new Date();
        dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    let alertEl = document.getElementById('alert-actualizacion');
    if (alertEl) { alertEl.innerHTML = `<button onclick="this.parentElement.style.display='none'" aria-label="Cerrar alerta" style="position: absolute; top: 8px; right: 10px; background: transparent; border: none; font-size: 14px; cursor: pointer; color: var(--color-text); opacity: 0.6;"><i class="fa-solid fa-xmark"></i></button><i class="fa-solid fa-circle-info" style="color: var(--dorado); margin-right: 5px;"></i> Precios y Productos actualizados el día <b>${dateStr}</b>.<br>Antes de cancelar preguntar si hay disponibilidad.`; alertEl.style.display = 'block'; }
}

async function cargarConfiguracionDesdeArchivos() {
    try { let resRec = await fetch('data/config/recomendados.txt?v=' + new Date().getTime()); if (resRec.ok) { let textoRec = await resRec.text(); codigosRecomendados = textoRec.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); appState.codigosRecomendados = codigosRecomendados; } } catch (error) { }
    try { let resDisp = await fetch('data/config/disponibles.txt?v=' + new Date().getTime()); if (resDisp.ok) { let textoDisp = await resDisp.text(); siempreDisponibles = textoDisp.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); appState.siempreDisponibles = siempreDisponibles; } } catch (error) { }
}

async function cargarConfiguracionDesdeAPI() {
    const { apiUrl, apiToken } = appSettings;
    // Si tienes un endpoint separado para config, úsalo. Si no, podemos pedirlo por parámetro
    const response = await fetch(apiUrl + '?task=config', {
        headers: { 'Authorization': `Bearer ${apiToken || ''}` }
    });
    if (response.ok) {
        const configs = await response.json();
        configs.forEach(c => {
            if (c.clave === 'recomendados') codigosRecomendados = c.valor.split(/[\n,]+/).map(x => x.trim());
            if (c.clave === 'disponibles') siempreDisponibles = c.valor.split(/[\n,]+/).map(x => x.trim());
            if (c.clave === 'tasa') { tasaOficial = parseFloat(c.valor); appState.tasaOficial = tasaOficial; }
        });
        appState.codigosRecomendados = codigosRecomendados;
        appState.siempreDisponibles = siempreDisponibles;
    }
}

async function cargarInventario() {
    console.log("🚀 Iniciando carga desde API SmartVentas...");
    await loadAppSettings();
    await obtenerArchivosExternos();

    mostrarFechaActualizacion();
    toggleDireccion();
    inyectarInterruptor();

    try {
        await cargarInventarioDesdeAPI();

        actualizarCartCount();
        generarCategorias();
        aplicarFiltros();

        iniciarAutoActualizacion();
    } catch (e) {
        console.error("Error cargando inventario:", e);
        document.getElementById('lista-productos').innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 30px; border: 1px solid red; border-radius: 10px;"><h3 style="color:red;">Error de Conexión</h3><p style="font-size:12px; margin-top:10px;">${e.message || 'Verifica la configuración de la API.'}</p></div>`;
    }
}

function iniciarAutoActualizacion() {
    // Evitar que se creen múltiples temporizadores paralelos
    if (window.autoSyncTimer) clearInterval(window.autoSyncTimer);

    // Ejecutar silenciosamente cada 1 hora (3600000 ms)
    window.autoSyncTimer = setInterval(async () => {
        console.log("⏱️ Sincronizando con SmartVentas en segundo plano...");
        try {
            await cargarInventarioDesdeAPI();
            localStorage.setItem('gc_inv_time_v4', new Date().getTime().toString());
            aplicarFiltros(); // Refresca la vista automáticamente si detecta un cambio de precio/stock
        } catch (e) { console.log("⚠️ Error en sincronización silenciosa:", e.message); }
    }, 3600000);
}

async function cargarInventarioDesdeAPI() {
    // En tu entorno local de Cloudflare (o en la URL de GitHub/Pages), llamamos a la ruta /api/proxy
    const respuesta = await fetch('https://gran-catador.pages.dev/api/proxy');

    if (!respuesta.ok) {
        throw new Error(`Error en el servidor: ${respuesta.status}`);
    }

    const dataRaw = await respuesta.json();
    console.log("¡Datos obtenidos con éxito burlando el CORS!", dataRaw);

    // Intentamos extraer el array de grupos, ya que a veces viene envuelto en .data, .grupos, etc.
    let grupos = [];
    if (Array.isArray(dataRaw)) {
        grupos = dataRaw;
    } else if (dataRaw.data && Array.isArray(dataRaw.data)) {
        grupos = dataRaw.data;
    } else if (dataRaw.grupos && Array.isArray(dataRaw.grupos)) {
        grupos = dataRaw.grupos;
    } else if (dataRaw.result && Array.isArray(dataRaw.result)) {
        grupos = dataRaw.result;
    }

    if (grupos.length > 0) {
        appState.gruposInventario = grupos;
        console.log("📂 Grupos procesados correctamente:", grupos.length);
        if (typeof mostrarToast === 'function') mostrarToast("✅ API SmartVentas: " + grupos.length + " grupos recibidos.");
    } else {
        console.warn("⚠️ La API respondió pero no se encontró un listado de grupos válido.", dataRaw);
        if (typeof mostrarToast === 'function') mostrarToast("⚠️ API conectada, pero no se encontraron grupos.");
    }
}

function debounceBusqueda(event) {
    clearTimeout(debounceTimer);
    const query = event.target.value;
    if (event.target.id === 'buscador') { let dSearch = document.getElementById('buscador-desktop'); if (dSearch) dSearch.value = query; }
    else if (event.target.id === 'buscador-desktop') { let mSearch = document.getElementById('buscador'); if (mSearch) mSearch.value = query; }

    if (query.trim().length < 2) { cerrarSugerencias(); aplicarFiltros(); return; }
    debounceTimer = setTimeout(() => { aplicarFiltros(); mostrarSugerencias(query.trim()); }, 300);
}

function aplicarFiltros() {
    let q = quitarAcentos((document.getElementById('buscador')?.value || '').trim());
    let sortOption = document.getElementById('ordenarSelect').value;
    let verAgotados = document.getElementById('chkAgotados').checked;
    let resultado = inventario;

    if (!verAgotados) resultado = resultado.filter(p => p.StockNum > 0);

    if (categoriaActual === 'Favoritos') {
        resultado = resultado.filter(p => favoritos.includes(p.codigo));
    } else if (categoriaActual !== 'Todos') {
        resultado = resultado.filter(p => p.Cat === categoriaActual);
        console.log(`🔍 Filtro ${categoriaActual}: ${resultado.length} productos`);
    }

    // Filtrar POR SUBCATEGORÍA si está activa
    if (subcategoriaActual && categoriaActual === 'LICORES') {
        const antes = resultado.length;
        resultado = resultado.filter(p => p.SubCat === subcategoriaActual);
        console.log(`📦 Filtro subcategoría ${subcategoriaActual}: ${antes} → ${resultado.length} productos`);
    }

    if (q !== '') {
        let terms = q.split(' ').filter(t => t.length > 0).map(procesarTermino);
        let resultPuntuado = [];
        resultado.forEach(p => {
            let nombreLimpio = quitarAcentos(p.Nombre); let wordsNombre = nombreLimpio.split(' ');
            let textoConSubcat = p.TextoBusquedaLimpio + ' ' + quitarAcentos(p.Cat || '') + ' ' + quitarAcentos(p.SubCat || '');
            let wordsAll = textoConSubcat.split(' ');
            let score = 0;

            let coincide = terms.every(term => {
                if (nombreLimpio.includes(term)) { score += wordsNombre.includes(term) ? 50 : 25; return true; }
                if (textoConSubcat.includes(term)) { score += 10; return true; }
                if (term.length >= 4 && wordsAll.some(w => levenshtein(term, w) <= (term.length >= 6 ? 2 : 1))) { score += 5; return true; }
                return false;
            });
            if (coincide) { p.ScoreBusqueda = score; resultPuntuado.push(p); }
        });
        resultado = resultPuntuado;
    }

    if (sortOption === 'menor') resultado.sort((a, b) => a.PrecioNum - b.PrecioNum);
    else if (sortOption === 'mayor') resultado.sort((a, b) => b.PrecioNum - a.PrecioNum);
    else if (sortOption === 'az') resultado.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
    else if (q !== '') resultado.sort((a, b) => (b.ScoreBusqueda || 0) - (a.ScoreBusqueda || 0));

    productosFiltradosGlobal = resultado;
    paginaActual = 1;
    renderizarPagina();
}
function cerrarModal(modalId, navAnterior = 'nav-home') { if (modalId === 'all') { document.querySelectorAll('.modal-fullscreen').forEach(m => m.style.display = 'none'); return; } const m = document.getElementById(modalId); if (m) m.style.display = 'none'; if (navAnterior === 'modal-ajustes') { abrirAjustes(); } else { setActiveNav(navAnterior); } }

window.limpiarCacheAdmin = function () { localStorage.clear(); sessionStorage.clear(); if ('caches' in window) { caches.keys().then(n => n.forEach(c => caches.delete(c))); } if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(r => r.forEach(s => s.unregister())); } alert('Toda la memoria y caché eliminados.'); window.location.href = window.location.pathname + '?v=' + new Date().getTime(); }

window.onload = cargarInventario;
