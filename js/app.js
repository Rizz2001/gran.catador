let inventario = []; 
let favoritos = JSON.parse(localStorage.getItem('gc_favs')) || []; 
let tasaOficial = 36.25; let tasaEuro = 40.00; let categoriaActual = 'LICORES'; let debounceTimer; 
let isTiendaAbierta = true; let codigosRecomendados = []; let siempreDisponibles = []; 
let productosFiltradosGlobal = []; let itemsPorPagina = 30; let paginaActual = 1;

let modoVistaGlobal = 'unidad'; 
let subcategoriasLicores = {};
let mapaCodToSubcategoria = {};
let subcategoriaActual = null;

if(localStorage.getItem('gc_dark') === 'true') document.body.classList.add('dark-mode');

if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').then(reg => { reg.update(); console.log("PWA Ok"); }).catch(err => console.log("SW Error", err)); }); }

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
    let tasaEl = document.getElementById('tasaValor'); if(tasaEl) tasaEl.innerText = tasaOficial.toFixed(2) + " Bs";
    let tasaElMob = document.getElementById('tasaValorMobile'); if(tasaElMob) tasaElMob.innerText = tasaOficial.toFixed(2) + " Bs";
    
    // Obtener tasa de euros
    await obtenerTasaEuro();
    let tasaEuroEl = document.getElementById('tasaEuroValor'); if(tasaEuroEl) tasaEuroEl.innerText = tasaEuro.toFixed(2) + " Bs";
    let tasaEuroElMob = document.getElementById('tasaEuroValorMobile'); if(tasaEuroElMob) tasaEuroElMob.innerText = tasaEuro.toFixed(2) + " Bs";
    
    try { let resRec = await fetch('data/config/recomendados.txt?v=' + new Date().getTime()); if (resRec.ok) { let textoRec = await resRec.text(); codigosRecomendados = textoRec.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); appState.codigosRecomendados = codigosRecomendados; } } catch (error) {}
    try { let resDisp = await fetch('data/config/disponibles.txt?v=' + new Date().getTime()); if (resDisp.ok) { let textoDisp = await resDisp.text(); siempreDisponibles = textoDisp.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); appState.siempreDisponibles = siempreDisponibles; } } catch (error) {}
    
    // Cargar subcategorías de licores
    try {
        const categoriasArchivos = ['AGUARDIENTE.csv', 'ANIS.csv', 'BEBIDA_SECA.csv', 'BRANDY.csv', 'CERVEZA.csv', 'COCTELERIA_ADICIONAL.csv', 'COCUY.csv', 'COÑAC.csv', 'GINEBRA.csv', 'JARABE_GOMA.csv', 'LICOR SECO.csv', 'LICOR_DULCE.csv', 'RON.csv', 'SANGRIA.csv', 'TEQUILA.csv', 'VINO_ESPUMANTE.csv', 'VINO_IMPORTADO.csv', 'VINO_NACIONAL.csv', 'VODKA.csv', 'WHISKY_IMPORTADO.csv', 'WHISKY_NACIONAL.csv'];
        
        await Promise.all(categoriasArchivos.map(async (archivo) => {
            try {
                const nombre = archivo.replace('.csv', '').replace(/_/g, ' ');
                const response = await fetch(`data/inventario/CATEGORIA_LICORES/${archivo}?v=${new Date().getTime()}`);
                const text = await response.text();
                
                const matches = text.match(/\d{13}/g);
                if (matches) {
                    const codigosSet = new Set();
                    matches.forEach(cod => codigosSet.add(cod.trim()));
                    
                    const codigos = Array.from(codigosSet);
                    if (codigos.length > 0) {
                        subcategoriasLicores[nombre] = codigos;
                        codigos.forEach(cod => mapaCodToSubcategoria[cod] = nombre);
                        console.log(`✓ Cargados ${codigos.length} códigos para ${nombre}`);
                    }
                }
            } catch (e) { console.log(`Error cargando ${archivo}:`, e.message); }
        }));
        console.log("✓ Subcategorías de licores cargadas:", Object.keys(subcategoriasLicores).length);
    } catch (error) { console.log("Error crítico en subcategorías:", error); }
    
    try { 
        let resBan = await fetch('data/config/banners.txt?v=' + new Date().getTime()); 
        if (resBan.ok) { 
            let textoBan = await resBan.text(); let listaBanners = textoBan.split(/[\n,]+/).map(b => b.trim()).filter(b => b !== ""); 
            let contBanners = document.getElementById('contenedorBanners');
            if(listaBanners.length > 0 && contBanners) {
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
                    if(totalSlides > 1) {
                        slideIndex++;
                        if(slideIndex >= totalSlides) slideIndex = 0;
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
        let resHead = await fetch("data/inventario/Inventario Fisico general precio por unidad.csv", { method: 'HEAD', cache: 'no-cache' });
        let lastMod = resHead.headers.get('Last-Modified');
        if (lastMod) {
            let d = new Date(lastMod);
            dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } else {
            let d = new Date();
            dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    } catch(e) {
        let d = new Date();
        dateStr = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    let alertEl = document.getElementById('alert-actualizacion');
    if (alertEl) { alertEl.innerHTML = `<i class="fa-solid fa-circle-info" style="color: var(--dorado); margin-right: 5px;"></i> Precios y Productos actualizados el día <b>${dateStr}</b>.<br>Antes de cancelar preguntar si hay disponibilidad.`; alertEl.style.display = 'block'; }
}

async function cargarInventario() {
    console.log("🔄 Iniciando carga de inventario...");
    await obtenerArchivosExternos(); 
    console.log("✓ Archivos externos cargados. Subcategorías:", Object.keys(subcategoriasLicores).length);
    
    mostrarFechaActualizacion();

    toggleDireccion(); 
    inyectarInterruptor();
    
    localStorage.removeItem('gc_inv_time_v3'); // Forzar limpieza de versión anterior
    
    let ahora = new Date().getTime();
    let cacheTime = localStorage.getItem('gc_inv_time_v4');
    let cacheData = localStorage.getItem('gc_inv_data');
    
    if (cacheTime && cacheData && (ahora - parseInt(cacheTime)) < 3600000) {
        inventario = JSON.parse(cacheData);
        appState.inventario = inventario;
        // Re-asignar subcategorías en caso de que los mapas se hayan actualizado
        inventario.forEach(p => {
            if (p.Cat === 'LICORES') p.SubCat = mapaCodToSubcategoria[p.codigo] || 'OTROS LICORES';
        });

        actualizarCartCount(); 
        generarCategorias(); 
        aplicarFiltros(); 
        console.log("⚡ Inventario desde caché. LICORES en inventario:", inventario.filter(p => p.Cat === 'LICORES').length);
        return;
    }

    try {
        // LEYENDO LOS 3 ARCHIVOS SIMULTÁNEAMENTE (SIN INVENTAR PRECIOS)
        const [pUnidadRaw, pCajaRaw, sRaw] = await Promise.all([ 
            fetchCSV("data/inventario/Inventario Fisico general precio por unidad.csv"),
            fetchCSV("data/inventario/listadepreciosporgrupo.csv"), 
            fetchCSV("data/inventario/inventario por existencia.csv") 
        ]); 
        let mapa = {};
        
        // 1. CARGAR PRECIOS EXACTOS POR UNIDAD (Respeta tus Divisas y Bs del Excel)
        pUnidadRaw.forEach(r => { 
            if (r.length >= 5) { 
                let catBruto = r[r.length-5]; let cod = r[r.length-4]?.trim(); let nombreBruto = r[r.length-3]?.trim(); let bsStr = r[r.length-2]?.trim(); let usdStr = r[r.length-1]?.trim();
                
                if (!cod || cod === "Código" || !usdStr || !usdStr.includes(',')) return;

                let catLimpia = limpiarCategoria(catBruto); 
                let catValidacion = quitarAcentos(catLimpia).toUpperCase();
                if (["CHARCUTERIA", "FRUTERIA", "MATERIALES DE OFICINA", "MATERIAL DE OFICINA", "UNICO", "VIVERES"].includes(catValidacion)) return; 
                
                let usdNum = parseFloat(usdStr.replace(/\./g,'').replace(',','.'));
                
                mapa[cod] = { 
                    codigo: cod, Nombre: nombreBruto, Cat: catLimpia, 
                    PrecioStr: usdNum.toFixed(2), 
                    PrecioNum: usdNum, 
                    PrecioBsStr: bsStr, 
                    // Inicializamos los valores de caja en cero (Se llenan con el 2do archivo)
                    PrecioCajaUsd: "0.00", 
                    PrecioCajaNum: 0,
                    PrecioCajaBsStr: "0,00", 
                    StockNum: 0, StockStr: "0,00",
                    TextoBusquedaLimpio: quitarAcentos(nombreBruto) + " " + quitarAcentos(catLimpia)
                }; 
            } 
        });

        // 2. CARGAR PRECIOS EXACTOS POR CAJA (Respeta los 0 si existen)
        pCajaRaw.forEach(r => { 
            if (r.length >= 4) { 
                let catBruto = r[r.length-4]; let cod = r[r.length-3]?.trim(); let nombreBruto = r[r.length-2]?.trim(); let bsStr = r[r.length-1]?.trim(); 
                if (!cod || cod === "Código" || !bsStr.includes(',')) return;
                
                let bsCajaNum = parseFloat(bsStr.replace(/\./g,'').replace(',','.'));
                let usdCajaNum = bsCajaNum / tasaOficial;

                if (mapa[cod]) {
                    mapa[cod].PrecioCajaUsd = usdCajaNum.toFixed(2);
                    mapa[cod].PrecioCajaNum = usdCajaNum;
                    mapa[cod].PrecioCajaBsStr = bsStr; 
                } else {
                    let catLimpia = limpiarCategoria(catBruto); 
                    let catValidacion = quitarAcentos(catLimpia).toUpperCase();
                    if (["CHARCUTERIA", "FRUTERIA", "MATERIALES DE OFICINA", "MATERIAL DE OFICINA", "UNICO", "VIVERES"].includes(catValidacion)) return; 

                    mapa[cod] = { 
                        codigo: cod, Nombre: nombreBruto, Cat: catLimpia, 
                        PrecioStr: "0.00", 
                        PrecioNum: 0, 
                        PrecioBsStr: "0,00", 
                        PrecioCajaUsd: usdCajaNum.toFixed(2), 
                        PrecioCajaNum: usdCajaNum,
                        PrecioCajaBsStr: bsStr, 
                        StockNum: 0, StockStr: "0,00",
                        TextoBusquedaLimpio: quitarAcentos(nombreBruto) + " " + quitarAcentos(catLimpia)
                    }; 
                }
            } 
        });
        
        // 3. CARGAR EXISTENCIAS
        sRaw.forEach(r => {
            let cod = r.find(cell => typeof cell === 'string' && /^\s*'?\d{6,}'?\s*$/.test(cell) && cell.trim().length > 0);
            if (!cod) return;
            cod = cod.trim().replace(/^'+|'+$/g, '');
            if (!mapa[cod]) return;

            let stock = '';
            let codeIndex = r.findIndex(cell => typeof cell === 'string' && cell.trim().replace(/^'+|'+$/g, '') === cod);
            if (codeIndex !== -1 && codeIndex + 4 < r.length && /^[\d\-\.,]+$/.test((r[codeIndex + 4] || '').trim())) {
                stock = r[codeIndex + 4].trim();
            }
            if (!stock && codeIndex !== -1 && codeIndex + 6 < r.length && /^[\d\-\.,]+$/.test((r[codeIndex + 6] || '').trim())) {
                stock = r[codeIndex + 6].trim();
            }
            if (!stock) {
                const candidate = r.slice(codeIndex + 2).find(cell => typeof cell === 'string' && /^[\d\-\.,]+$/.test(cell.trim()));
                if (candidate) stock = candidate.trim();
            }
            if (stock) {
                mapa[cod].StockStr = stock;
                mapa[cod].StockNum = parseNumber(stock);
            }
        });
        
        Object.values(mapa).forEach(prod => { if (siempreDisponibles.includes(prod.codigo)) { prod.StockNum = 999; prod.StockStr = "Disponible"; } });
        inventario = Object.values(mapa).filter(p => p.Nombre && !["CHARCUTERIA", "FRUTERIA", "MATERIALES DE OFICINA", "MATERIAL DE OFICINA", "UNICO", "VIVERES"].includes(quitarAcentos(p.Cat).toUpperCase()));
        
        inventario.forEach(p => {
            if (p.Cat === 'LICORES') p.SubCat = mapaCodToSubcategoria[p.codigo] || 'OTROS LICORES';
        });
        appState.inventario = inventario;

        if(inventario.length === 0) throw new Error("Inventario vacío");
        
        localStorage.setItem('gc_inv_data', JSON.stringify(inventario));
        localStorage.setItem('gc_inv_time_v4', ahora.toString());
        
        actualizarCartCount(); generarCategorias(); aplicarFiltros(); 
    } catch(e) { 
        document.getElementById('lista-productos').innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 30px; border: 1px solid red; border-radius: 10px;"><h3 style="color:red;">Error de Conexión</h3><p style="font-size:12px; margin-top:10px;">Asegúrate de haber subido los 3 archivos CSV a GitHub.</p></div>'; 
    }
}

function debounceBusqueda(event) { 
    clearTimeout(debounceTimer); 
    const query = event.target.value; 
    if (event.target.id === 'buscador') { let dSearch = document.getElementById('buscador-desktop'); if(dSearch) dSearch.value = query; }
    else if (event.target.id === 'buscador-desktop') { let mSearch = document.getElementById('buscador'); if(mSearch) mSearch.value = query; }
    
    if(query.trim().length < 2) { cerrarSugerencias(); aplicarFiltros(); return; } 
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
    
    if(sortOption === 'menor') resultado.sort((a,b) => a.PrecioNum - b.PrecioNum); 
    else if(sortOption === 'mayor') resultado.sort((a,b) => b.PrecioNum - a.PrecioNum); 
    else if(sortOption === 'az') resultado.sort((a,b) => a.Nombre.localeCompare(b.Nombre));
    else if(q !== '') resultado.sort((a,b) => (b.ScoreBusqueda || 0) - (a.ScoreBusqueda || 0));
    
    productosFiltradosGlobal = resultado; 
    paginaActual = 1; 
    renderizarPagina();
}
function cerrarModal(modalId, navAnterior = 'nav-home') { if(modalId === 'all') { document.querySelectorAll('.modal-fullscreen').forEach(m => m.style.display = 'none'); return; } const m = document.getElementById(modalId); if(m) m.style.display = 'none'; if(navAnterior === 'modal-ajustes') { abrirAjustes(); } else { setActiveNav(navAnterior); } }

window.limpiarCacheAdmin = function() { localStorage.clear(); sessionStorage.clear(); if ('caches' in window) { caches.keys().then(n => n.forEach(c => caches.delete(c))); } if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(r => r.forEach(s => s.unregister())); } alert('Toda la memoria y caché eliminados.'); window.location.href = window.location.pathname + '?v=' + new Date().getTime(); }

window.onload = cargarInventario;
