let inventario = [];
let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || [];
let tasaOficial = 36.25; let tasaEuro = 40.00; let categoriaActual = 'Todos'; let debounceTimer;
let isTiendaAbierta = true; let codigosRecomendados = []; let siempreDisponibles = [];
let masVendidosCodigos = []; let masVendidosProductos = [];
let marcasAliadasArchivos = [];
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

let appSettings = { useApi: true, apiType: 'smartventas' };

let modoVistaGlobal = 'unidad';
let subcategoriaActual = null;

// Asegurar que appState exista y tenga su estructura base
window.appState = window.appState || { inventario: [], filtros: {}, carrito: {} };
window.appState.isTiendaAbierta = isTiendaAbierta; // Corrección: Exponer variable al appState para que cart.js pueda leerla

// Barra de progreso superior (API)
function updateApiProgress(percent, isError = false) {
    let bar = document.getElementById('api-loading-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'api-loading-bar';
        Object.assign(bar.style, {
            position: 'fixed', top: '0', left: '0', height: '3px',
            backgroundColor: '#25D366', width: '0%', zIndex: '9999',
            transition: 'width 0.3s ease, opacity 0.3s ease', opacity: '0',
            boxShadow: '0 0 5px #25D366'
        });
        document.body.appendChild(bar);
    }

    if (isError) {
        bar.style.backgroundColor = '#ea4335'; // Rojo error
        bar.style.boxShadow = '0 0 5px #ea4335';
        percent = 100;
    } else {
        bar.style.backgroundColor = '#25D366'; // Verde éxito
        bar.style.boxShadow = '0 0 5px #25D366';
    }

    bar.style.opacity = '1';
    bar.style.width = percent + '%';
    if (percent >= 100) {
        setTimeout(() => { bar.style.opacity = '0'; setTimeout(() => { bar.style.width = '0%'; }, 300); }, 500);
    }
}

// Función para comparar IDs de manera inteligente ("01" == "1")
function compararIDs(id1, id2) {
    if (id1 === id2) return true;
    if (id1 == null || id2 == null) return false;
    let s1 = String(id1).trim();
    let s2 = String(id2).trim();
    if (s1.toLowerCase() === s2.toLowerCase()) return true;
    if (!isNaN(s1) && !isNaN(s2) && s1 !== "" && s2 !== "") {
        return Number(s1) === Number(s2);
    }
    return false;
}

// Función universal y a prueba de errores para parsear números de Foxdata
function parseFoxdataNumber(val) {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    let s = String(val).trim();
    // Detecta inteligentemente si usa formato "1.200,50" o "1,200.50"
    if (s.includes(',') && s.includes('.')) {
        let lastComma = s.lastIndexOf(',');
        let lastDot = s.lastIndexOf('.');
        if (lastComma > lastDot) {
            s = s.replace(/\./g, '').replace(',', '.'); // 1.200,50 -> 1200.50
        } else {
            s = s.replace(/,/g, ''); // 1,200.50 -> 1200.50
        }
    }
    else if (s.includes(',')) { s = s.replace(',', '.'); }
    let n = parseFloat(s.replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
}
function normalizarCodigo(codigo) {
    if (codigo == null) return '';
    let valor = String(codigo).trim();
    if (valor === '') return '';
    const soloDigitos = valor.replace(/[^0-9]/g, '');
    if (soloDigitos.length > 0) {
        return soloDigitos.replace(/^0+(?=\d)/, '');
    }
    return valor.toLowerCase();
}
if (localStorage.getItem('gc_dark') === 'true') document.body.classList.add('dark-mode');

if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').then(reg => { reg.update(); }).catch(() => { }); }); }

async function loadAppSettings() {
    try {
        const response = await fetch('data/config/settings.json?v=' + new Date().getTime());
        if (response.ok) {
            appSettings = await response.json();
        }
    } catch (error) { }
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
                // Guardar en localStorage para persistencia
                localStorage.setItem('tasaDolar', tasaOficial.toString());
                localStorage.setItem('tasaDolarTime', new Date().getTime().toString());
                return true;
            }
        }
    } catch (error) {
        // Intentar usando tasa.txt como fallback
        try {
            let resTasa = await fetch('data/config/tasa.txt?v=' + new Date().getTime());
            if (resTasa.ok) {
                let texto = await resTasa.text();
                tasaOficial = parseFloat(texto.trim().replace(',', '.'));
                appState.tasaOficial = tasaOficial;
                localStorage.setItem('tasaDolar', tasaOficial.toString());
                localStorage.setItem('tasaDolarTime', new Date().getTime().toString());
                return true;
            }
        } catch (fallbackError) {
            // Si hay tasa guardada en localStorage, usarla
            const tasaGuardada = localStorage.getItem('tasaDolar');
            if (tasaGuardada) {
                tasaOficial = parseFloat(tasaGuardada);
                appState.tasaOficial = tasaOficial;
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
                localStorage.setItem('tasaEuro', tasaEuro.toString());
                return true;
            }
        }
    } catch (error) {
        const tasaGuardada = localStorage.getItem('tasaEuro');
        if (tasaGuardada) tasaEuro = parseFloat(tasaGuardada);
    }
    return false;
}

async function cargarBannersLocales() {
    try {
        let resBan = await fetch('data/config/banners.txt?v=' + new Date().getTime());
        if (resBan.ok) {
            let textoBan = await resBan.text(); let listaBanners = textoBan.split(/[\n,]+/).map(b => b.trim()).filter(b => b !== "");
            let contBanners = document.getElementById('contenedorBanners');
            if (listaBanners.length > 0 && contBanners) {
                contBanners.innerHTML = '';
                const queryRaw = (document.getElementById('buscador')?.value || '').trim();
                contBanners.style.display = (categoriaActual === 'Todos' && queryRaw.length === 0) ? 'flex' : 'none';
                contBanners.style.overflowX = 'hidden';
                contBanners.style.scrollBehavior = 'smooth';
                listaBanners.forEach((img, idx) => {
                    let loadingAttr = idx === 0 ? '' : 'loading="lazy"';
                    let activeClass = idx === 0 ? 'active-banner' : '';
                    contBanners.innerHTML += `<div class="promo-banner ${activeClass}"><img src="assets/banners/${img}" alt="Promo" style="border-radius: 12px; display: block;" ${loadingAttr} onerror="this.parentElement.style.display='none'"></div>`;
                });

                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('active-banner');
                        } else {
                            entry.target.classList.remove('active-banner');
                        }
                    });
                }, { root: contBanners, threshold: 0.55 });
                Array.from(contBanners.children).forEach(banner => observer.observe(banner));

                let slideIndex = 0;
                const totalSlides = contBanners.children.length;

                const startAutoScroll = () => {
                    if (window.bannersTimer) clearInterval(window.bannersTimer);
                    window.bannersTimer = setInterval(() => {
                        if (contBanners.scrollWidth > contBanners.clientWidth + 10) {
                            // Calculamos el índice basado en la posición actual por si el usuario movió el scroll manualmente
                            let bannerWidth = contBanners.children[0].offsetWidth;
                            let gap = parseInt(window.getComputedStyle(contBanners).gap) || 0;
                            slideIndex = Math.round(contBanners.scrollLeft / (bannerWidth + gap)) + 1;
                            
                            if (slideIndex >= totalSlides) slideIndex = 0;
                            contBanners.scrollTo({ left: (bannerWidth + gap) * slideIndex, behavior: 'smooth' });
                        }
                    }, 4000); // 4 segundos es más amigable para lectura
                };

                // Detener el auto-scroll cuando el usuario interactúa
                const handleUserInteraction = () => {
                    clearInterval(window.bannersTimer);
                    // Reiniciar el auto-scroll después de 10 segundos de inactividad
                    clearTimeout(window.resumeBannerTimer);
                    window.resumeBannerTimer = setTimeout(startAutoScroll, 10000);
                };

                contBanners.addEventListener('touchstart', handleUserInteraction, { passive: true });
                contBanners.addEventListener('mousedown', handleUserInteraction);

                startAutoScroll();
            }
        }
    } catch (error) { }
}

async function cargarSiempreDisponiblesLocal() {
    try {
        let resDisp = await fetch('data/config/siempre_disponibles.txt?v=' + new Date().getTime());
        if (resDisp.ok) {
            let textoDisp = await resDisp.text();
            let listaDisp = textoDisp.split(/[\n,]+/).map(b => b.trim()).filter(b => b !== "" && !b.startsWith("#"));
            siempreDisponibles = [...new Set([...siempreDisponibles, ...listaDisp])];
            appState.siempreDisponibles = siempreDisponibles;
        }
    } catch (error) { }
}

async function cargarMasVendidosLocal() {
    try {
        const res = await fetch('data/config/mas_vendidos.txt?v=' + new Date().getTime());
        if (res.ok) {
            const texto = await res.text();
            masVendidosCodigos = texto
                .split(/[\n,]+/)
                .map(line => line.trim())
                .filter(line => line !== '' && !line.startsWith('#'))
                .map(line => line.replace(/["']/g, ''))
                .map(line => line.trim());
            masVendidosCodigos = [...new Set(masVendidosCodigos)];
            appState.masVendidosCodigos = masVendidosCodigos;
        }
    } catch (error) { }
}

function normalizarNombreArchivo(nombre) {
    return String(nombre || '').trim().replace(/^\/+/, '').replace(/\\/g, '/');
}

async function listarMarcasAliadasDesdeCarpeta() {
    if (window.location.protocol === 'file:') return [];
    try {
        const response = await fetch('assets/img/marcas-aliadas/');
        if (!response.ok) return [];
        const text = await response.text();
        const matches = [...text.matchAll(/href="([^"']+\.(?:jpg|jpeg))"/gi)];
        if (!matches.length) {
            const srcMatches = [...text.matchAll(/src="([^"']+\.(?:jpg|jpeg))"/gi)];
            matches.push(...srcMatches);
        }
        return [...new Set(matches.map(m => normalizarNombreArchivo(m[1]).startsWith('http') ? m[1] : 'assets/img/marcas-aliadas/' + normalizarNombreArchivo(m[1].replace(/^.*\/(.+)$/, '$1'))))];
    } catch (error) {
        return [];
    }
}

async function cargarMarcasAliadasLocal() {
    let archivos = await listarMarcasAliadasDesdeCarpeta();
    if (!archivos.length) {
        try {
            const res = await fetch('data/config/marcas_aliadas.txt?v=' + new Date().getTime());
            if (res.ok) {
                const texto = await res.text();
                archivos = texto
                    .split(/[\n,]+/)
                    .map(line => line.trim())
                    .filter(line => line !== '' && !line.startsWith('#'))
                    .map(line => line.replace(/['"]/g, ''))
                    .map(line => normalizarNombreArchivo(line))
                    .filter(line => /\.(jpe?g|png|webp|svg)$/i.test(line))
                    .map(line => line.startsWith('http') ? line : `assets/img/marcas-aliadas/${line.replace(/^.*\/(.+)$/, '$1')}`);
                archivos = [...new Set(archivos)];
            }
        } catch (error) { }
    }

    marcasAliadasArchivos = archivos;
    appState.marcasAliadasArchivos = archivos;
}

function obtenerProductosMasVendidos() {
    if (!masVendidosCodigos.length || !inventario.length) return [];
    const mapa = new Map(inventario.map(p => [normalizarCodigo(p.codigo), p]));
    const productos = [];

    masVendidosCodigos.forEach(codigo => {
        const clave = normalizarCodigo(codigo);
        if (!clave) return;

        let producto = mapa.get(clave);
        if (!producto) {
            producto = inventario.find(p => normalizarCodigo(p.codigo) === clave || compararIDs(p.codigo, codigo));
        }

        if (producto && !productos.some(p => normalizarCodigo(p.codigo) === normalizarCodigo(producto.codigo))) {
            productos.push(producto);
        }
    });

    return productos;
}

async function obtenerArchivosExternos() {
    // 1. OPTIMIZACIÓN: Ejecutar peticiones de tasas en paralelo
    const promesasTasas = [
        obtenerTasaDolar().then(() => {
            let tasaEl = document.getElementById('tasaValor'); if (tasaEl) tasaEl.innerText = tasaOficial.toFixed(2) + " Bs";
            let tasaElMob = document.getElementById('tasaValorMobile'); if (tasaElMob) tasaElMob.innerText = tasaOficial.toFixed(2) + " Bs";
        }),
        obtenerTasaEuro().then(() => {
            let tasaEuroEl = document.getElementById('tasaEuroValor'); if (tasaEuroEl) tasaEuroEl.innerText = tasaEuro.toFixed(2) + " Bs";
            let tasaEuroElMob = document.getElementById('tasaEuroValorMobile'); if (tasaEuroElMob) tasaEuroElMob.innerText = tasaEuro.toFixed(2) + " Bs";
        })
    ];
    await Promise.all(promesasTasas);

    // 2. OPTIMIZACIÓN: Ejecutar descarga de config y banners en paralelo
    let promesasConfig = [];

    if (appSettings.useApi && appSettings.apiType === 'mysql') {
        promesasConfig.push(cargarConfiguracionDesdeAPI().catch(() => { }));
    }

    promesasConfig.push(cargarBannersLocales());
    promesasConfig.push(cargarSiempreDisponiblesLocal());
    promesasConfig.push(cargarMasVendidosLocal());
    promesasConfig.push(cargarMarcasAliadasLocal());

    await Promise.all(promesasConfig);
}


async function cargarConfiguracionDesdeAPI() {
    const { apiUrl, apiToken } = appSettings;

    if (!apiUrl) return; // Evitar petición fallida a "undefined?task=config"

    try {
        const response = await fetch(apiUrl + '?task=config', {
            headers: { 'Authorization': `Bearer ${apiToken || ''}` }
        });
        if (response.ok) {
            const configs = await response.json();
            if (Array.isArray(configs)) {
                configs.forEach(c => {
                    if (c.clave === 'recomendados') codigosRecomendados = c.valor.split(/[\n,]+/).map(x => x.trim());
                    if (c.clave === 'disponibles') siempreDisponibles = c.valor.split(/[\n,]+/).map(x => x.trim());
                    if (c.clave === 'tasa') { tasaOficial = parseFloat(c.valor); appState.tasaOficial = tasaOficial; }
                });
            }
            appState.codigosRecomendados = codigosRecomendados;
            appState.siempreDisponibles = siempreDisponibles;
        }
    } catch (e) { }
}

async function cargarInventario() {

    if (typeof mostrarSkeletonCategorias === 'function') mostrarSkeletonCategorias();
    if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();

    await loadAppSettings();
    await obtenerArchivosExternos();
    if (typeof renderMarcasAliadas === 'function') renderMarcasAliadas();

    if (typeof toggleDireccion === 'function') toggleDireccion();
    if (typeof inyectarInterruptor === 'function') inyectarInterruptor();

    try {
        await cargarInventarioDesdeAPI();

        // --- AUTO-SCROLL A LOS PRODUCTOS (IGNORANDO EL BANNER) ---
        setTimeout(() => {
            // Buscamos el inicio del catálogo (los filtros o la lista de productos)
            const target = document.querySelector('.tools-container') || document.getElementById('lista-productos');
            if (target) {
                const header = document.querySelector('.site-header');
                const headerOffset = header ? header.offsetHeight : 80;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - headerOffset - 10;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        }, 800); // Retraso de 800ms para asegurar que las imágenes y la estructura se hayan pintado

    } catch (e) {
        updateApiProgress(100, true);
        document.getElementById('lista-productos').innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 30px; border: 1px solid red; border-radius: 10px;"><h3 style="color:red;">Error de Conexión</h3><p style="font-size:12px; margin-top:10px;">${e.message || 'Verifica la configuración de la API.'}</p></div>`;
    }
}

function iniciarAutoActualizacion() {
    // Evitar que se creen múltiples temporizadores paralelos
    if (window.autoSyncTimer) clearInterval(window.autoSyncTimer);

    // Ejecutar silenciosamente cada 1 minuto (60000 ms)
    window.autoSyncTimer = setInterval(async () => {
        try {
            await cargarInventarioDesdeAPI();
            localStorage.setItem('gc_inv_time_v4', new Date().getTime().toString());
            aplicarFiltros(); // Refresca la vista automáticamente si detecta un cambio de precio/stock
        } catch (e) {
            updateApiProgress(100, true);
        }
    }, 60000);
}

async function cargarExistenciasGlobales(proxyBaseUrl) {
    try {
        const [res01, res03] = await Promise.all([
            fetch(`${proxyBaseUrl}?endpoint=${encodeURIComponent('existencias/deposito/01')}`),
            fetch(`${proxyBaseUrl}?endpoint=${encodeURIComponent('existencias/deposito/03')}`)
        ]);

        let stockMap = new Map();

        const procesarData = (data) => {
            let items = Array.isArray(data) ? data : (data.data || data.result || []);
            items.forEach(item => {
                let cod = (item.codArticulo ?? item.codigo ?? item.id ?? item.CodArticulo ?? item.Codigo ?? "").toString().trim();
                let cant = parseFloat(item.cantidad ?? item.existencia ?? item.stock ?? item.Cantidad ?? item.Existencia ?? item.Stock ?? 0);
                if (cod) {
                    stockMap.set(cod, (stockMap.get(cod) || 0) + cant);
                }
            });
        };

        if (res01.ok) procesarData(await res01.json());
        if (res03.ok) procesarData(await res03.json());

        appState.stockMap = stockMap;
    } catch (e) { }
}

async function cargarInventarioDesdeAPI() {
    // Ruta inteligente: Si estamos en Cloudflare Pages usamos el worker,
    // si estamos en local usamos el proxy subido a Cloudflare,
    // de lo contrario (Laragon, XAMPP, cPanel, Hostinger) usamos el proxy en PHP.
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
    const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
        : (isLocalhost || window.location.hostname.includes('github.io')) ? 'https://gran-catador.pages.dev/api/proxy'
            : 'functions/api/proxy.php';

    updateApiProgress(10);

    // --- 0 Y 1. DESCARGAR EXISTENCIAS Y GRUPOS EN PARALELO ---
    // Esto mejora el performance evitando que una petición bloquee a la otra
    const existenciasPromise = cargarExistenciasGlobales(proxyBaseUrl);
    let gruposPromise = fetch(`${proxyBaseUrl}?endpoint=gruposinv`).then(async res => {
        if (!res.ok && res.status >= 500) {
            return fetch(`${proxyBaseUrl}?endpoint=grupos`);
        }
        return res;
    }).then(async res => {
        if (!res.ok) {
            let errorMsg = `Error servidor grupos: ${res.status}`;
            try {
                const errorData = await res.json();
                if (errorData.error) errorMsg += ` - ${errorData.error}`;
            } catch (e) { }
            throw new Error(errorMsg);
        }
        return res.json();
    });

    const [_, dataGrupos] = await Promise.all([existenciasPromise, gruposPromise]);
    updateApiProgress(50);

    // --- BÚSQUEDA ROBUSTA DEL LISTADO DE GRUPOS ---
    let grupos = [];
    if (Array.isArray(dataGrupos)) {
        grupos = dataGrupos;
    } else if (dataGrupos && typeof dataGrupos === 'object') {
        // Intentar nombres comunes
        grupos = dataGrupos.data || dataGrupos.result || dataGrupos.grupos || dataGrupos.items || [];
        // Si sigue vacío, buscar cualquier propiedad dentro del objeto que sea un Array
        if (grupos.length === 0) {
            for (let key in dataGrupos) {
                if (Array.isArray(dataGrupos[key])) {
                    grupos = dataGrupos[key];
                    break;
                }
            }
        }
    }

    if (grupos.length > 0) {
        // Excluir grupos no deseados en la tienda online
        grupos = grupos.filter(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo || "";
            let nombreLimpio = quitarAcentos(nombre).toUpperCase();
            const excluidos = ["FRUTERIA", "PAPELERIA", "MATERIAL DE OFICINA", "UNICO", "SERVICIO"];
            return !excluidos.some(excluido => nombreLimpio.includes(excluido));
        });

        appState.gruposInventario = grupos;
    } else {
        // Si la API devolvió un objeto con mensaje de error, detener todo y mostrarlo en pantalla
        if (dataGrupos && !Array.isArray(dataGrupos) && Object.keys(dataGrupos).length > 0) {
            throw new Error(`SmartVentas devolvió un error: ${JSON.stringify(dataGrupos)}`);
        } else {
            throw new Error("La base de datos respondió, pero la lista de grupos está vacía.");
        }
    }

    // --- 2. DESCARGAR PRODUCTOS (ARTÍCULOS) ---
    appState.gruposCargados = appState.gruposCargados || [];
    inventario = []; // Reiniciamos si estamos refrescando

    let grupoInicial = null;

    // Identificar el grupo actual de la interfaz para cargarlo primero
    if (categoriaActual !== 'Todos' && categoriaActual !== 'Favoritos') {
        grupoInicial = grupos.find(g => {
            let nom = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo || "Grupo";
            return limpiarCategoria(nom) === limpiarCategoria(categoriaActual);
        });
    }

    // Fallback: Si no hay categoría actual o estamos en "Todos", cargamos el primero disponible
    if (!grupoInicial && grupos.length > 0) {
        grupoInicial = grupos[0];
    }

    if (grupoInicial) {
        let codGrupo = (grupoInicial.CodGrupo || grupoInicial.codigo || grupoInicial.id || grupoInicial.Codigo || grupoInicial.Id || grupoInicial.id_grupo || grupoInicial.cod_grupo || grupoInicial.grupo || grupoInicial.Grupo || "").toString().trim();
        let nombreGrupo = grupoInicial.Nombre || grupoInicial.nombre || grupoInicial.Descripcion || grupoInicial.descripcion || grupoInicial.NombreGrupo || grupoInicial.desc_grupo || grupoInicial.DescGrupo || "Grupo";
        if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
        await cargarProductosPorGrupo(codGrupo, nombreGrupo);
        updateApiProgress(90);
    }

    // --- INYECTAR EN PANTALLA ---
    // Renderizar los botones de grupos y los productos del grupo inicial
    if (typeof generarCategorias === 'function') generarCategorias();
    aplicarFiltros();
    updateApiProgress(100);

    // --- 3. INICIAR CARGA DE LOS DEMÁS GRUPOS EN SEGUNDO PLANO ---
    cargarRestoDeGruposEnSegundoPlano(grupos);
}

// --- FUNCIONES DE MAPEO DE DATOS ---
function formatearProductoApi(item, codGrupo, nombreGrupo, codSubgrupoFallback, nombreSubgrupoFallback, proxyBaseUrl) {
    let precioRaw = item.precioVentDiv5 ?? item.precioVentDiv ?? item.PrecioVentDiv ?? 0;
    let precioUsd = parseFoxdataNumber(precioRaw);

    let cantidadGrupRaw = item.cantidadGrup ?? item.CantidadGrup ?? item.cant_caja ?? 12;
    let cantidadGrup = parseFoxdataNumber(cantidadGrupRaw);
    if (cantidadGrup <= 0) cantidadGrup = 12;

    let precioGrupRaw = item.precioVentGrupDiv5 ?? item.precioVentGrupDiv ?? item.PrecioVentGrupDiv ?? (precioUsd * cantidadGrup);
    let precioCajaNum = parseFoxdataNumber(precioGrupRaw);
    if (precioCajaNum <= 0) precioCajaNum = precioUsd * cantidadGrup;

    let codigo = item.codArticulo ?? item.codigo ?? item.Codigo ?? item.CodArticulo ?? item.cod_articulo ?? item.id ?? item.Id ?? "";

    let stock = 0;
    if (appState.stockMap && appState.stockMap.has(codigo)) {
        stock = appState.stockMap.get(codigo);
    } else {
        let stockRaw = item.existencia ?? item.Existencia ?? item.stock ?? item.Stock ?? item.cantidad ?? item.Cantidad;
        stock = parseFloat(stockRaw !== undefined && stockRaw !== null ? stockRaw : 10);
    }

    if (appState.siempreDisponibles && appState.siempreDisponibles.includes(codigo)) stock = 999;

    let nombre = item.nombre ?? item.Nombre ?? item.descripcion ?? item.Descripcion ?? "Producto sin nombre";

    let imagenUrl = item.imagenUrl ?? item.ImagenUrl ?? null;
    if (imagenUrl && imagenUrl.startsWith('/')) {
        imagenUrl = proxyBaseUrl + '?imagePath=' + encodeURIComponent(imagenUrl);
    }

    let codSubApi = (item.codSubgrupo ?? item.CodSubgrupo ?? item.codsubgrupo ?? item.cod_subgrupo ?? item.id_subgrupo ?? item.subgrupo ?? item.subcategoria ?? "").toString().trim();
    let subCatIdFinal = codSubApi || codSubgrupoFallback || "";
    let nombreSubFinal = item.desc_subgrupo ?? item.Desc_subgrupo ?? item.nombre_subgrupo ?? nombreSubgrupoFallback ?? subCatIdFinal;

    return {
        codigo: codigo, Nombre: nombre,
        CatId: codGrupo, Cat: limpiarCategoria(nombreGrupo),
        SubCatId: subCatIdFinal, SubCat: limpiarCategoria(nombreSubFinal),
        PrecioStr: precioUsd.toFixed(2), PrecioNum: precioUsd,
        PrecioBsStr: (precioUsd * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
        PrecioCajaUsd: precioCajaNum.toFixed(2), PrecioCajaNum: precioCajaNum,
        PrecioCajaBsStr: (precioCajaNum * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
        StockNum: stock, StockStr: stock >= 999 ? "Disponible" : (stock > 0 ? stock.toString() : "0"),
        TextoBusquedaLimpio: quitarAcentos(nombre) + " " + quitarAcentos(nombreGrupo) + " " + quitarAcentos(nombreSubFinal),
        CantidadGrup: cantidadGrup, Medida: item.medida ?? item.Medida ?? "",
        UnidadGrup: item.unidadGrup ?? item.UnidadGrup ?? "CAJA", UnidadSimple: item.unidadSimple ?? item.UnidadSimple ?? "UNIDAD",
        ImagenUrl: imagenUrl, DescAdicional: item.descExtensa ?? item.DescExtensa ?? item.comentario ?? item.Comentario ?? item.notas ?? item.Notas ?? ""
    };
}

async function cargarProductosPorGrupo(codGrupo, nombreGrupo) {
    if (appState.gruposCargados && appState.gruposCargados.includes(codGrupo)) return false; // Ya fue cargado

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
    const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
        : (isLocalhost || window.location.hostname.includes('github.io')) ? 'https://gran-catador.pages.dev/api/proxy'
            : 'functions/api/proxy.php';

    try {
        const endpointUrl = `articulos/grupo/${encodeURIComponent(codGrupo)}`;
        const res = await fetch(`${proxyBaseUrl}?endpoint=${encodeURIComponent(endpointUrl)}`);

        let data = [];
        if (res.ok) {
            data = await res.json();
        }

        let articulos = Array.isArray(data) ? data : (data.data || data.articulos || data.result || []);

        if (articulos.length > 0) {
            let nuevosProductos = articulos.map(item => formatearProductoApi(item, codGrupo, nombreGrupo, "", "", proxyBaseUrl)).filter(p => p.PrecioNum >= 0);

            // Evitar duplicados eliminando también los vacíos previos (previene memory leak de array)
            let codigosNuevos = new Set(nuevosProductos.filter(p => p.codigo !== "").map(p => p.codigo));
            inventario = inventario.filter(p => p.codigo !== "" && !codigosNuevos.has(p.codigo));
            inventario = [...inventario, ...nuevosProductos];

            appState.inventario = inventario;
            appState.gruposCargados.push(codGrupo);

            // Actualizar el índice de búsqueda con los nuevos productos
            if (typeof buildSearchIndex === 'function') buildSearchIndex(inventario);

            return true;
        } else {
            // --- LÓGICA DE RESCATE PROFUNDO EN SEGUNDO PLANO ---
            const resSub = await fetch(`${proxyBaseUrl}?endpoint=gruposinvsub/grupo/${encodeURIComponent(codGrupo)}`);
            if (resSub.ok) {
                const dataSub = await resSub.json();
                let subcats = Array.isArray(dataSub) ? dataSub : (dataSub.data || dataSub.result || []);
                if (subcats.length > 0) {
                    let promesas = subcats.map(sub => {
                        let nombreSub = sub.nombre || sub.descripcion || sub.Nombre || sub.desc_subgrupo || "Subgrupo";
                        let codSub = (sub.CodSubgrupo || sub.codsubgrupo || sub.Codsubgrupo || sub.cod_subgrupo || sub.cod_sub_grupo || sub.id_subgrupo || sub.id_sub_grupo || sub.Cod_subgrupo || sub.codigo || sub.id || sub.subgrupo || sub.Subgrupo || "").toString().trim();
                        // Disparamos la consulta con el parámetro ?codSubgrupo incluido
                        if (codSub) return cargarProductosPorSubgrupo(codGrupo, codSub, nombreGrupo, nombreSub);
                    });
                    await Promise.all(promesas);
                    appState.gruposCargados.push(codGrupo); // Lo marcamos como cargado para no repetir
                    return true;
                }
            }
        }
    } catch (e) { }

    return false;
}

async function cargarProductosPorSubgrupo(codGrupo, codSubgrupo, nombreGrupo, nombreSubgrupo) {
    appState.subgruposCargados = appState.subgruposCargados || [];
    let cacheKey = `${codGrupo}-${codSubgrupo}`;

    // NO cortamos por cache aquí: siempre consultamos la API por subgrupo para que
    // los productos queden etiquetados correctamente con su SubCatId.
    // Si ya estaba cacheado pero sin SubCatId (cargado a nivel de grupo), lo sobreescribimos.

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
    const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
        : isLocalhost ? 'https://gran-catador.pages.dev/api/proxy'
            : 'functions/api/proxy.php';

    // ─── CONSTRUCCIÓN CORRECTA DE LA URL ────────────────────────────────────────
    // El codSubgrupo va DENTRO del endpoint para que ambos proxys (PHP y Cloudflare)
    // lo pasen como query-param a la API de SmartVentas:
    //   → GET /api/v1/syn/articulos/grupo/{codGrupo}?codSubgrupo=01
    const endpointUrl = `articulos/grupo/${encodeURIComponent(codGrupo)}?codSubgrupo=${encodeURIComponent(codSubgrupo)}`;

    try {
        const res = await fetch(`${proxyBaseUrl}?endpoint=${encodeURIComponent(endpointUrl)}`);
        if (!res.ok) return false;

        const data = await res.json();
        let articulos = Array.isArray(data) ? data : (data.data || data.articulos || data.result || []);

        if (articulos.length > 0) {
            let nuevosProductos = articulos.map(item => formatearProductoApi(item, codGrupo, nombreGrupo, codSubgrupo, nombreSubgrupo, proxyBaseUrl)).filter(p => p.PrecioNum >= 0);

            // Reemplazar en inventario los productos de este subgrupo
            // (elimina tanto por código como por SubCatId para limpiar entradas previas sin etiqueta)
            let codigosNuevos = new Set(nuevosProductos.filter(p => p.codigo !== "").map(p => p.codigo));
            inventario = inventario.filter(p => p.codigo !== "" && !codigosNuevos.has(p.codigo));
            inventario = [...inventario, ...nuevosProductos];

            appState.inventario = inventario;
            if (!appState.subgruposCargados.includes(cacheKey)) appState.subgruposCargados.push(cacheKey);

            // Actualizar el índice de búsqueda con los nuevos productos
            if (typeof buildSearchIndex === 'function') buildSearchIndex(inventario);

            return true;
        }
    } catch (e) { }

    return false;
}

async function cargarRestoDeGruposEnSegundoPlano(grupos) {
    let qInput = document.getElementById('buscador');
    let needsRefresh = false;

    for (let grupo of grupos) {
        let codGrupo = (grupo.CodGrupo || grupo.codigo || grupo.id || grupo.Codigo || grupo.Id || grupo.id_grupo || grupo.cod_grupo || grupo.grupo || grupo.Grupo || "").toString().trim();
        let nombreGrupo = grupo.Nombre || grupo.nombre || grupo.Descripcion || grupo.descripcion || grupo.NombreGrupo || grupo.desc_grupo || grupo.DescGrupo || "Grupo";

        if (codGrupo && (!appState.gruposCargados || !appState.gruposCargados.includes(codGrupo))) {
            let fueCargado = await cargarProductosPorGrupo(codGrupo, nombreGrupo);

            // Si el usuario está viendo "Todos", la categoría recién cargada, o está escribiendo, refrescamos la vista
            if (fueCargado && (categoriaActual === 'Todos' || limpiarCategoria(nombreGrupo) === limpiarCategoria(categoriaActual) || (qInput && qInput.value.trim() !== ''))) {
                needsRefresh = true;
            }

            await new Promise(resolve => setTimeout(resolve, 300)); // Pequeña pausa para no saturar la API
        }
    }

    if (needsRefresh) {
        aplicarFiltros();
    }
}

function debounceBusqueda(event) {
    const teclaPresionada = event.key; // Capturamos síncronamente antes de que el objeto event se destruya
    clearTimeout(debounceTimer);
    const query = event.target.value;

    // Sincronizar buscadores desktop/mobile si existen ambos
    if (event.target.id === 'buscador') { let dSearch = document.getElementById('buscador-desktop'); if (dSearch) dSearch.value = query; }
    else if (event.target.id === 'buscador-desktop') { let mSearch = document.getElementById('buscador'); if (mSearch) mSearch.value = query; }

    // Mostrar/ocultar ícono de limpiar
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) clearBtn.style.display = query.length > 0 ? 'flex' : 'none';

    if (query.trim().length === 0) {
        cerrarSugerencias();
        // Debounce corto para limpiar rápido
        debounceTimer = setTimeout(() => aplicarFiltros(), 150);
        return;
    }

    // Un solo timer: aplicarFiltros calcula y pasa resultados a mostrarSugerencias
    debounceTimer = setTimeout(() => {
        aplicarFiltros();
        // Lógica para Escáner de Códigos de Barras: Si se presiona Enter y hay 1 solo resultado, abrirlo.
        if (teclaPresionada === 'Enter' && productosFiltradosGlobal && productosFiltradosGlobal.length === 1) {
            cerrarSugerencias();
            if (typeof abrirImagenLightbox === 'function') {
                let p = productosFiltradosGlobal[0];
                let imgSrc = obtenerImgProducto(p);
                abrirImagenLightbox(imgSrc, p.codigo);
            }
        }
    }, 280);
}

function aplicarFiltros() {
    const queryRaw = (document.getElementById('buscador')?.value || '').trim();
    const q = quitarAcentos(queryRaw);
    const sortOption = document.getElementById('ordenarSelect')?.value || 'relevancia';
    const verAgotados = document.getElementById('chkAgotados')?.checked || false;

    // Controlar visibilidad de los banners: Solo en "Inicio" (Todos) y sin búsqueda activa
    let contBanners = document.getElementById('contenedorBanners');
    if (contBanners) {
        contBanners.style.display = (categoriaActual === 'Todos' && q.length === 0) ? 'flex' : 'none';
    }

    // ── 1. Filtro de stock ────────────────────────────────────────────────────
    let inventarioStock = verAgotados ? inventario.slice() : inventario.filter(p => p.StockNum > 0);
    let resultado = inventarioStock.slice();

    // Solo aplicamos filtros de categoría si NO hay una búsqueda activa.
    if (q.length === 0) {
        // ── 2. Filtro de categoría ────────────────────────────────────────────────
        if (categoriaActual !== 'Todos') {
            resultado = resultado.filter(p =>
                p.Cat === limpiarCategoria(categoriaActual) ||
                compararIDs(p.CatId, categoriaActual)
            );
        }

        // ── 3. Filtro de subcategoría ─────────────────────────────────────────────
        if (subcategoriaActual && categoriaActual !== 'Todos') {
            resultado = resultado.filter(p =>
                compararIDs(p.SubCatId, subcategoriaActual) ||
                p.SubCat === limpiarCategoria(subcategoriaActual) ||
                limpiarCategoria(p.SubCat) === limpiarCategoria(subcategoriaActual)
            );
        }
    }

    // ── 4. Búsqueda de texto — usa el índice invertido para mayor velocidad ───
    let resultadosFiltrados = resultado; // por si no hay query

    if (q.length > 0) {
        // Hacemos que la búsqueda sea GLOBAL en el inventario que cumpla con el stock
        const codigosStock = new Set(inventarioStock.map(p => p.codigo));
        const porIndice = searchWithIndex(q, inventario);

        resultadosFiltrados = [];
        porIndice.forEach(({ producto, score }) => {
            if (codigosStock.has(producto.codigo)) {
                producto.ScoreBusqueda = score;
                resultadosFiltrados.push(producto);
            }
        });

        if (typeof mostrarSugerencias === 'function') mostrarSugerencias(q, resultadosFiltrados);
    } else {
        cerrarSugerencias();
    }

    // ── 5. Ordenamiento ───────────────────────────────────────────────────────
    if (q.length === 0 || sortOption !== 'relevancia') {
        // Si hay query activo y sort=relevancia, ya vienen ordenados por score
        if (sortOption === 'menor') resultadosFiltrados.sort((a, b) => a.PrecioNum - b.PrecioNum);
        else if (sortOption === 'mayor') resultadosFiltrados.sort((a, b) => b.PrecioNum - a.PrecioNum);
        else if (sortOption === 'az') resultadosFiltrados.sort((a, b) => a.Nombre.localeCompare(b.Nombre));
        else if (sortOption === 'relevancia' && categoriaActual === 'Todos' && q.length === 0) {
            // Mezclar aleatoriamente el catálogo principal de forma estable (evita parpadeos y saltos)
            resultadosFiltrados.sort((a, b) => a.RandomOrder - b.RandomOrder);
        }
    }

    productosFiltradosGlobal = resultadosFiltrados;
    paginaActual = 1;
    renderizarPagina();
}

// --- INICIO DE LA APLICACIÓN ---
cargarInventario();
