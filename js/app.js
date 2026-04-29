let inventario = [];
let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || [];
let tasaOficial = 36.25; let tasaEuro = 40.00; let categoriaActual = 'LICORES'; let debounceTimer;
let isTiendaAbierta = true; let codigosRecomendados = []; let siempreDisponibles = [];
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

let appSettings = { useApi: true, apiType: 'smartventas' };

let modoVistaGlobal = 'unidad';
let subcategoriaActual = null;

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

    promesasConfig.push((async () => {
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
                    setInterval(() => { let totalSlides = contBanners.children.length; if (totalSlides > 1) { slideIndex++; if (slideIndex >= totalSlides) slideIndex = 0; contBanners.scrollTo({ left: contBanners.clientWidth * slideIndex, behavior: 'smooth' }); } }, 3000);
                }
            }
        } catch (error) { console.log("Sin banners.txt"); }
    })());

    await Promise.all(promesasConfig);
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

    if (typeof mostrarSkeletonCategorias === 'function') mostrarSkeletonCategorias();
    if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();

    await loadAppSettings();
    await obtenerArchivosExternos();

    if (typeof toggleDireccion === 'function') toggleDireccion();
    if (typeof inyectarInterruptor === 'function') inyectarInterruptor();

    try {
        await cargarInventarioDesdeAPI();
    } catch (e) {
        console.error("Error cargando inventario:", e);
        document.getElementById('lista-productos').innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 30px; border: 1px solid red; border-radius: 10px;"><h3 style="color:red;">Error de Conexión</h3><p style="font-size:12px; margin-top:10px;">${e.message || 'Verifica la configuración de la API.'}</p></div>`;
    }
}

function iniciarAutoActualizacion() {
    // Evitar que se creen múltiples temporizadores paralelos
    if (window.autoSyncTimer) clearInterval(window.autoSyncTimer);

    // Ejecutar silenciosamente cada 10 minutos (600000 ms)
    window.autoSyncTimer = setInterval(async () => {
        console.log("⏱️ Sincronizando con SmartVentas en segundo plano...");
        try {
            await cargarInventarioDesdeAPI();
            localStorage.setItem('gc_inv_time_v4', new Date().getTime().toString());
            aplicarFiltros(); // Refresca la vista automáticamente si detecta un cambio de precio/stock
        } catch (e) { console.log("⚠️ Error en sincronización silenciosa:", e.message); }
    }, 600000);
}

async function cargarInventarioDesdeAPI() {
    // Ruta inteligente: Si estamos en Cloudflare Pages usamos el worker,
    // si estamos en local usamos el proxy subido a Cloudflare,
    // de lo contrario (Laragon, XAMPP, cPanel, Hostinger) usamos el proxy en PHP.
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
        : isLocalhost ? 'https://gran-catador.pages.dev/api/proxy'
            : 'functions/api/proxy.php';

    console.log("📡 Consultando API mediante Proxy Cloudflare...");

    // --- 1. DESCARGAR GRUPOS ---
    const resGrupos = await fetch(`${proxyBaseUrl}?endpoint=gruposinv`);
    if (!resGrupos.ok) throw new Error(`Error servidor grupos: ${resGrupos.status}`);
    const dataGrupos = await resGrupos.json();

    let grupos = Array.isArray(dataGrupos) ? dataGrupos : (dataGrupos.data || dataGrupos.result || []);

    if (grupos.length > 0) {
        appState.gruposInventario = grupos;
        console.log("📂 Grupos procesados correctamente:", grupos.length);
    } else {
        console.warn("⚠️ La API respondió pero no se encontró un listado de grupos válido.", dataGrupos);
        if (typeof mostrarToast === 'function') mostrarToast("⚠️ API conectada, pero no se encontraron grupos.");
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
        // CORRECCIÓN: Actualizamos la categoría actual para que coincida con lo que descargamos y no se oculten
        categoriaActual = grupoInicial.Nombre || grupoInicial.nombre || grupoInicial.Descripcion || grupoInicial.descripcion || grupoInicial.NombreGrupo || grupoInicial.desc_grupo || grupoInicial.DescGrupo || "Todos";
        appState.filtros.categoriaActual = categoriaActual;
    }

    if (grupoInicial) {
        let codGrupo = (grupoInicial.CodGrupo || grupoInicial.codigo || grupoInicial.id || grupoInicial.Codigo || grupoInicial.Id || grupoInicial.id_grupo || grupoInicial.cod_grupo || grupoInicial.grupo || grupoInicial.Grupo || "").toString().trim();
        let nombreGrupo = grupoInicial.Nombre || grupoInicial.nombre || grupoInicial.Descripcion || grupoInicial.descripcion || grupoInicial.NombreGrupo || grupoInicial.desc_grupo || grupoInicial.DescGrupo || "Grupo";
        if (typeof mostrarSkeletonProductos === 'function') mostrarSkeletonProductos();
        await cargarProductosPorGrupo(codGrupo, nombreGrupo);
    }

    if (typeof mostrarToast === 'function') mostrarToast(`✅ API Conectada. Catálogo cargando...`);

    // --- INYECTAR EN PANTALLA ---
    // Renderizar los botones de grupos y los productos del grupo inicial
    if (typeof generarCategorias === 'function') generarCategorias();
    aplicarFiltros();

    // --- 3. INICIAR CARGA DE LOS DEMÁS GRUPOS EN SEGUNDO PLANO ---
    cargarRestoDeGruposEnSegundoPlano(grupos);
}

async function cargarProductosPorGrupo(codGrupo, nombreGrupo) {
    if (appState.gruposCargados && appState.gruposCargados.includes(codGrupo)) return false; // Ya fue cargado

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
        : isLocalhost ? 'https://gran-catador.pages.dev/api/proxy'
            : 'functions/api/proxy.php';
    console.log(`📡 Consultando productos del grupo: ${nombreGrupo} (ID: ${codGrupo})`);

    try {
        const endpointUrl = `articulos/grupo/${encodeURIComponent(codGrupo)}`;
        const res = await fetch(`${proxyBaseUrl}?endpoint=${encodeURIComponent(endpointUrl)}`);

        let data = [];
        if (res.ok) {
            data = await res.json();
        }

        let articulos = Array.isArray(data) ? data : (data.data || data.articulos || data.result || []);

        if (articulos.length > 0) {
            let nuevosProductos = articulos.map(item => {
                // Mapeo ultra-seguro de Precios (cubre variaciones de la API SmartVentas)
                let precioRaw = item.precio ?? item.Precio ?? item.precio1 ?? item.Precio1 ?? item.precio_1 ?? item.precio_detal ?? item.monto ?? 0;
                let precioUsd = parseFloat(precioRaw);

                // Mapeo ultra-seguro del Stock (asumimos 10 si la API no manda la propiedad para que no se oculten)
                let stockRaw = item.existencia ?? item.Existencia ?? item.stock ?? item.Stock ?? item.cantidad ?? item.Cantidad;
                let stock = parseFloat(stockRaw !== undefined && stockRaw !== null ? stockRaw : 10);

                let nombre = item.nombre || item.Nombre || item.descripcion || item.Descripcion || "Producto sin nombre";
                let codigo = item.codigo || item.Codigo || item.id || item.Id || "";

                let codSubgrupo = (item.CodSubgrupo || item.codsubgrupo || item.Codsubgrupo || item.cod_subgrupo || item.cod_sub_grupo || item.id_subgrupo || item.id_sub_grupo || item.Cod_subgrupo || item.subgrupo || item.Subgrupo || item.subcategoria || item.Subcategoria || item.sub_grupo || "").toString().trim();
                let nombreSubgrupo = item.desc_subgrupo || item.Desc_subgrupo || item.nombre_subgrupo || item.desc_sub_grupo || codSubgrupo;

                if (appState.siempreDisponibles && appState.siempreDisponibles.includes(codigo)) stock = 999;

                return {
                    codigo: codigo,
                    Nombre: nombre,
                    CatId: codGrupo,
                    Cat: limpiarCategoria(nombreGrupo),
                    SubCatId: codSubgrupo,
                    SubCat: limpiarCategoria(nombreSubgrupo),
                    PrecioStr: precioUsd.toFixed(2),
                    PrecioNum: precioUsd,
                    PrecioBsStr: (precioUsd * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
                    PrecioCajaUsd: (precioUsd * 12).toFixed(2),
                    PrecioCajaNum: precioUsd * 12,
                    PrecioCajaBsStr: ((precioUsd * 12) * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
                    StockNum: stock,
                    StockStr: stock > 0 ? stock.toString() : "0",
                    TextoBusquedaLimpio: quitarAcentos(nombre) + " " + quitarAcentos(nombreGrupo) + " " + quitarAcentos(nombreSubgrupo)
                };
            }).filter(p => p.PrecioNum >= 0); // Permitimos precio 0 temporalmente para evitar que se oculten por fallos

            // Evitar duplicados si se recargan grupos/subgrupos
            let codigosNuevos = nuevosProductos.map(p => p.codigo);
            inventario = inventario.filter(p => !codigosNuevos.includes(p.codigo));
            inventario = [...inventario, ...nuevosProductos];

            appState.inventario = inventario;
            appState.gruposCargados.push(codGrupo);

            console.log(`✅ ${nuevosProductos.length} productos agregados de ${nombreGrupo}`);
            return true;
        } else {
            // --- LÓGICA DE RESCATE PROFUNDO EN SEGUNDO PLANO ---
            console.log(`⚠️ Grupo ${nombreGrupo} vacío en la raíz. Rescatando a través de sus subgrupos...`);
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
    } catch (e) { console.error(`⚠️ Error cargando grupo ${codGrupo}:`, e); }

    return false;
}

async function cargarProductosPorSubgrupo(codGrupo, codSubgrupo, nombreGrupo, nombreSubgrupo) {
    appState.subgruposCargados = appState.subgruposCargados || [];
    let cacheKey = `${codGrupo}-${codSubgrupo}`;

    // NO cortamos por cache aquí: siempre consultamos la API por subgrupo para que
    // los productos queden etiquetados correctamente con su SubCatId.
    // Si ya estaba cacheado pero sin SubCatId (cargado a nivel de grupo), lo sobreescribimos.

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const proxyBaseUrl = window.location.hostname.includes('pages.dev') ? '/api/proxy'
        : isLocalhost ? 'https://gran-catador.pages.dev/api/proxy'
            : 'functions/api/proxy.php';

    // ─── CONSTRUCCIÓN CORRECTA DE LA URL ────────────────────────────────────────
    // El codSubgrupo va DENTRO del endpoint para que ambos proxys (PHP y Cloudflare)
    // lo pasen como query-param a la API de SmartVentas:
    //   → GET /api/v1/syn/articulos/grupo/{codGrupo}?codSubgrupo=01
    const endpointUrl = `articulos/grupo/${encodeURIComponent(codGrupo)}?codSubgrupo=${encodeURIComponent(codSubgrupo)}`;
    console.log(`📡 Cargando subgrupo "${nombreSubgrupo}" → endpoint: ${endpointUrl}`);

    try {
        const res = await fetch(`${proxyBaseUrl}?endpoint=${encodeURIComponent(endpointUrl)}`);
        if (!res.ok) return false;

        const data = await res.json();
        let articulos = Array.isArray(data) ? data : (data.data || data.articulos || data.result || []);

        if (articulos.length > 0) {
            let nuevosProductos = articulos.map(item => {
                let precioRaw = item.precio ?? item.Precio ?? item.precio1 ?? item.Precio1 ?? item.precio_1 ?? item.precio_detal ?? item.monto ?? 0;
                let precioUsd = parseFloat(precioRaw);
                let stockRaw = item.existencia ?? item.Existencia ?? item.stock ?? item.Stock ?? item.cantidad ?? item.Cantidad;
                let stock = parseFloat(stockRaw !== undefined && stockRaw !== null ? stockRaw : 10);
                let nombre = item.nombre || item.Nombre || item.descripcion || item.Descripcion || "Producto sin nombre";
                let codigo = item.codigo || item.Codigo || item.id || item.Id || "";

                // SubCatId siempre = codSubgrupo del parámetro (la API puede no devolverlo por artículo)
                let codSubApi = (item.CodSubgrupo || item.codsubgrupo || item.Codsubgrupo || item.cod_subgrupo ||
                    item.cod_sub_grupo || item.id_subgrupo || item.Cod_subgrupo || "").toString().trim();
                let subCatIdFinal = codSubApi || codSubgrupo;
                let nombreSubFinal = item.desc_subgrupo || item.Desc_subgrupo || item.nombre_subgrupo || nombreSubgrupo;

                if (appState.siempreDisponibles && appState.siempreDisponibles.includes(codigo)) stock = 999;

                return {
                    codigo, Nombre: nombre,
                    CatId: codGrupo, Cat: limpiarCategoria(nombreGrupo),
                    SubCatId: subCatIdFinal,
                    SubCat: limpiarCategoria(nombreSubFinal),
                    PrecioStr: precioUsd.toFixed(2), PrecioNum: precioUsd,
                    PrecioBsStr: (precioUsd * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
                    PrecioCajaUsd: (precioUsd * 12).toFixed(2), PrecioCajaNum: precioUsd * 12,
                    PrecioCajaBsStr: ((precioUsd * 12) * appState.tasaOficial).toLocaleString('es-VE', { minimumFractionDigits: 2 }),
                    StockNum: stock, StockStr: stock > 0 ? stock.toString() : "0",
                    TextoBusquedaLimpio: quitarAcentos(nombre) + " " + quitarAcentos(nombreGrupo) + " " + quitarAcentos(nombreSubFinal)
                };
            }).filter(p => p.PrecioNum >= 0);

            // Reemplazar en inventario los productos de este subgrupo
            // (elimina tanto por código como por SubCatId para limpiar entradas previas sin etiqueta)
            let codigosNuevos = new Set(nuevosProductos.map(p => p.codigo));
            inventario = inventario.filter(p => !codigosNuevos.has(p.codigo));
            inventario = [...inventario, ...nuevosProductos];

            appState.inventario = inventario;
            if (!appState.subgruposCargados.includes(cacheKey)) appState.subgruposCargados.push(cacheKey);

            console.log(`✅ ${nuevosProductos.length} productos del subgrupo "${nombreSubgrupo}" (ID: ${codSubgrupo}) cargados con SubCatId correcto.`);
            return true;
        } else {
            console.warn(`⚠️ La API devolvió 0 artículos para subgrupo ${codSubgrupo} del grupo ${codGrupo}.`);
        }
    } catch (e) { console.error(`⚠️ Error cargando subgrupo ${codSubgrupo}:`, e); }

    return false;
}

async function cargarRestoDeGruposEnSegundoPlano(grupos) {
    console.log("🔄 Iniciando sincronización en segundo plano de todos los grupos para el buscador...");
    let qInput = document.getElementById('buscador');

    for (let grupo of grupos) {
        let codGrupo = (grupo.CodGrupo || grupo.codigo || grupo.id || grupo.Codigo || grupo.Id || grupo.id_grupo || grupo.cod_grupo || grupo.grupo || grupo.Grupo || "").toString().trim();
        let nombreGrupo = grupo.Nombre || grupo.nombre || grupo.Descripcion || grupo.descripcion || grupo.NombreGrupo || grupo.desc_grupo || grupo.DescGrupo || "Grupo";

        if (codGrupo && (!appState.gruposCargados || !appState.gruposCargados.includes(codGrupo))) {
            let fueCargado = await cargarProductosPorGrupo(codGrupo, nombreGrupo);

            // Si el usuario está viendo "Todos", la categoría recién cargada, o está escribiendo, refrescamos la vista
            if (fueCargado && (categoriaActual === 'Todos' || limpiarCategoria(nombreGrupo) === limpiarCategoria(categoriaActual) || (qInput && qInput.value.trim() !== ''))) {
                aplicarFiltros();
            }

            await new Promise(resolve => setTimeout(resolve, 300)); // Pequeña pausa para no saturar la API
        }
    }
    console.log("✅ Todos los grupos han sido cargados en memoria.");
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
        resultado = resultado.filter(p => p.Cat === limpiarCategoria(categoriaActual) || compararIDs(p.CatId, categoriaActual));
        console.log(`🔍 Filtro ${categoriaActual}: ${resultado.length} productos`);
    }

    // Filtrar POR SUBCATEGORÍA si está activa
    if (subcategoriaActual && categoriaActual !== 'Todos' && categoriaActual !== 'Favoritos') {
        const antes = resultado.length;
        // Comparar tanto por ID (SubCatId) como por nombre limpio (SubCat)
        // subcategoriaActual puede ser el código numérico ("5") o el nombre limpio ("whisky")
        resultado = resultado.filter(p =>
            compararIDs(p.SubCatId, subcategoriaActual) ||
            p.SubCat === limpiarCategoria(subcategoriaActual) ||
            limpiarCategoria(p.SubCat) === limpiarCategoria(subcategoriaActual)
        );
        console.log(`📦 Filtro de subcategoría aplicado. Buscando por: "${subcategoriaActual}"`);
        console.log(`   - Productos antes del filtro: ${antes}`);
        console.log(`   - Productos después del filtro: ${resultado.length}`);
        if (resultado.length === 0) {
            console.warn(`⚠️ 0 productos para subcategoría "${subcategoriaActual}". Revisa que SubCatId esté llegando bien desde la API.`);
        }
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
