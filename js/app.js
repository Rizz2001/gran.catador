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
    
    // Obtener tasa de euros
    await obtenerTasaEuro();
    let tasaEuroEl = document.getElementById('tasaEuroValor'); if(tasaEuroEl) tasaEuroEl.innerText = tasaEuro.toFixed(2) + " Bs";
    
    try { let resRec = await fetch('data/config/recomendados.txt?v=' + new Date().getTime()); if (resRec.ok) { let textoRec = await resRec.text(); codigosRecomendados = textoRec.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); } } catch (error) {}
    try { let resDisp = await fetch('data/config/disponibles.txt?v=' + new Date().getTime()); if (resDisp.ok) { let textoDisp = await resDisp.text(); siempreDisponibles = textoDisp.split(/[\n,]+/).map(c => c.trim()).filter(c => c !== ""); } } catch (error) {}
    
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

function cambiarModoVista(modo) {
    modoVistaGlobal = modo;
    document.getElementById('btn-modo-unidad').classList.remove('active');
    document.getElementById('btn-modo-caja').classList.remove('active');
    document.getElementById('btn-modo-' + modo).classList.add('active');
    aplicarFiltros(); 
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
    console.log("🔄 Iniciando carga de inventario...");
    await obtenerArchivosExternos(); 
    console.log("✓ Archivos externos cargados. Subcategorías:", Object.keys(subcategoriasLicores).length);
    
    toggleDireccion(); 
    inyectarInterruptor();
    
    localStorage.removeItem('gc_inv_time_v3'); // Forzar limpieza de versión anterior
    
    let ahora = new Date().getTime();
    let cacheTime = localStorage.getItem('gc_inv_time_v4');
    let cacheData = localStorage.getItem('gc_inv_data');
    
    if (cacheTime && cacheData && (ahora - parseInt(cacheTime)) < 3600000) {
        inventario = JSON.parse(cacheData);
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

function mostrarSugerencias(q) {
    let qLimpio = quitarAcentos(q);
    let terminos = qLimpio.split(' ').filter(t => t.length > 0).map(procesarTermino);
    
    let coincidencias = inventario.filter(p => {
        if(p.StockNum <= 0) return false;
        let textoCompleto = p.TextoBusquedaLimpio; 
        let words = textoCompleto.split(' ');
        let coincide = terminos.every(term => {
            if (textoCompleto.includes(term)) return true;
            if (term.length >= 4) return words.some(w => levenshtein(term, w) <= (term.length >= 6 ? 2 : 1));
            return false;
        });
        if(coincide) {
            let nLimpio = quitarAcentos(p.Nombre); let wNombre = nLimpio.split(' '); p.TempScore = 0;
            terminos.forEach(t => { if(wNombre.includes(t)) p.TempScore += 50; else if(nLimpio.includes(t)) p.TempScore += 25; else p.TempScore += 10; });
        }
        return coincide;
    });
    coincidencias.sort((a,b) => b.TempScore - a.TempScore);
    coincidencias = coincidencias.slice(0, 5);
    
    const cont = document.getElementById('search-suggestions');
    if(coincidencias.length === 0) { cerrarSugerencias(); aplicarFiltros(); return; }
    cont.innerHTML = '';
    coincidencias.forEach(p => { const div = document.createElement('div'); div.className = 'suggestion-item'; div.innerHTML = `<img src="assets/img/${p.codigo}/1.webp" data-codigo="${p.codigo}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)"><span>${p.Nombre}</span>`; div.onclick = () => { document.getElementById('buscador').value = p.Nombre; cerrarSugerencias(); aplicarFiltros(); }; cont.appendChild(div); });
    cont.style.display = 'block';
    aplicarFiltros();
}

function cerrarSugerencias() { document.getElementById('search-suggestions').style.display = 'none'; }
document.addEventListener('click', (e) => { if(!e.target.closest('.search-container')) cerrarSugerencias(); });

function filtrarCategoria(cat, btn) {
    console.log("🔄 Filtrando categoría:", cat);
    categoriaActual = cat;
    subcategoriaActual = null;
    
    // Limpiar subcategorías si no es LICORES
    let subcatSection = document.getElementById('subcategoria-section-main');
    if (cat !== 'LICORES' && subcatSection) { 
        subcatSection.style.display = 'none';
    }
    
    // Desactivar todos los botones
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    
    // Actualizar título de la versión móvil
    let mTitle = document.getElementById('mobile-header-title');
    if(mTitle) mTitle.innerText = (cat === 'Todos') ? 'Inicio' : (cat === 'LICORES' ? 'Licores' : cat);
    
    // Generar subcategorías si es LICORES
    if (cat === 'LICORES') { 
        console.log("🥃 Generando subcategorías reales para LICORES...");
        generarSubcategoriasLicores(); 
        aplicarFiltros();
        // No cerramos el menú para permitir al usuario elegir una subcategoría
    } else {
        aplicarFiltros();
        closeCategorias();
    }
}
function toggleCategorias() { const panel = document.getElementById('categoria-panel'); const overlay = document.getElementById('categoria-overlay'); if(!panel || !overlay) return; const isOpen = panel.classList.toggle('open'); overlay.style.display = isOpen ? 'block' : 'none'; }
function closeCategorias() { const panel = document.getElementById('categoria-panel'); const overlay = document.getElementById('categoria-overlay'); if(panel) panel.classList.remove('open'); if(overlay) overlay.style.display = 'none'; }
function toggleFav(codigo) { let index = favoritos.indexOf(codigo); if(index === -1) { favoritos.push(codigo); mostrarToast("Agregado a favoritos ❤️"); } else { favoritos.splice(index, 1); } localStorage.setItem('gc_favs', JSON.stringify(favoritos)); aplicarFiltros(); }
function compartirProducto(nombre, precio) {
    const text = `¡Mira esta bebida! ${nombre} a solo $${precio}. ${window.location.href}`;
    if (navigator.share) {
        navigator.share({ title: 'Gran Catador', text, url: window.location.href }).catch(e => console.log(e));
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => mostrarToast("Texto copiado al portapapeles."), () => fallbackCopyText(text));
        return;
    }
    fallbackCopyText(text);
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try { document.execCommand('copy'); mostrarToast("Texto copiado al portapapeles."); } catch (e) { mostrarToast("No se pudo copiar al portapapeles."); }
    document.body.removeChild(textarea);
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

function renderizarPagina() {
    const cont = document.getElementById('lista-productos'); 
    
    if (paginaActual === 1) cont.innerHTML = ''; 
    
    let inicio = (paginaActual - 1) * itemsPorPagina, fin = paginaActual * itemsPorPagina; 
    let pedazo = productosFiltradosGlobal.slice(inicio, fin);
    
    if(productosFiltradosGlobal.length === 0) { 
        if(paginaActual === 1) {
            cont.innerHTML = `<div style="grid-column: span 2; text-align: center; padding: 40px 20px; color: var(--texto-claro);"><i class="fa-solid fa-wine-bottle" style="font-size: 60px; opacity: 0.3; margin-bottom: 15px;"></i><h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">¿Aún no tienes sed?</h3><p style="font-size: 13px; margin-top: 5px;">No encontramos botellas con esa descripción.</p><button onclick="irInicio()" class="cat-btn active" style="margin: 20px auto 0 auto; padding: 10px 20px;">Ver todo el catálogo</button></div>`; 
            document.getElementById('btn-cargar-mas').style.display = 'none'; 
        }
        return; 
    }
    
    const html = pedazo.map(p => {
        const isFav = favoritos.includes(p.codigo); 
        const isAgotado = p.StockNum <= 0; 
        const nombreB64 = codificarNombre(p.Nombre);
        const esModoCaja = (modoVistaGlobal === 'caja');
        const precioUsdDin = esModoCaja ? p.PrecioCajaUsd : p.PrecioStr;
        const precioBsDin = esModoCaja ? p.PrecioCajaBsStr : p.PrecioBsStr;
        const precioNum = esModoCaja ? p.PrecioCajaNum : p.PrecioNum;
        
        let badgeHTML = '';
        if (isAgotado) { badgeHTML = `<div class="product-badge badge-agotado">AGOTADO</div>`; }
        else if (p.StockNum > 0 && p.StockNum <= 15) { badgeHTML = `<div class="product-badge badge-orange">STOCK BAJO</div>`; }
        else if (p.PrecioNum < 5) { badgeHTML = `<div class="product-badge badge-green">OFERTA</div>`; }

        return `
            <div class="producto-card ${isAgotado ? 'agotado' : ''}">
                ${badgeHTML}
                <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFav('${p.codigo}')" aria-label="Favorito">
                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                </button>
                
                <div class="product-img-container" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;">
                    <img loading="lazy" src="assets/img/${p.codigo}/1.webp" data-codigo="${p.codigo}" data-index="1" data-attempts="0" onerror="imgFallbackFolder(this)" alt="${p.Nombre}" style="scroll-snap-align: start; flex-shrink: 0; width: 100%; object-fit: contain;">
                    <img loading="lazy" src="assets/img/${p.codigo}/2.webp" data-codigo="${p.codigo}" data-index="2" data-attempts="0" onerror="imgFallbackFolder(this)" alt="${p.Nombre}" style="scroll-snap-align: start; flex-shrink: 0; width: 100%; object-fit: contain;">
                </div>
                
                <h3 class="producto-titulo" title="${p.Nombre}">${p.Nombre}</h3>
                <p class="producto-stock">Disp: ${p.StockStr}</p>
                
                <div class="product-bottom">
                    <div class="product-price-container">
                        <span class="product-price">$${precioUsdDin}</span>
                        <span class="product-price-bs">${precioBsDin} Bs</span>
                    </div>
                    <button class="btn-add-cart ${isAgotado ? 'disabled' : ''}" title="Agregar al carrito" ${isAgotado ? 'disabled' : `onclick="agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, 'assets/img/${p.codigo}/1.webp', ${esModoCaja})"`}>
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    cont.insertAdjacentHTML('beforeend', html);
    
    if (fin < productosFiltradosGlobal.length) document.getElementById('btn-cargar-mas').style.display = 'block'; 
    else document.getElementById('btn-cargar-mas').style.display = 'none';
}

function cargarMasProductos() { paginaActual++; renderizarPagina(); }

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
    let categorias = [...new Set(inventario.map(p => p.Cat))].sort(); 
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
    
    // Resto de categorías
    categorias.forEach(c => {
        let b = document.createElement('button'); 
        b.className = (c === categoriaActual) ? "cat-btn active" : "cat-btn"; 
        let nombreMostrar = (c === 'LICORES') ? "Licores" : c;
        b.innerHTML = `<i class="fa-solid ${getIconForCategory(c)}"></i><span>${nombreMostrar}</span>`; 
        b.onclick = function() { filtrarCategoria(c, this); }; 
        cont.appendChild(b);
    });
    
    // Mostrar/ocultar subcategorías
    if (categoriaActual === 'LICORES') { 
        generarSubcategoriasLicores(); 
    } else {
        let subcatSection = document.getElementById('subcategoria-section-main');
        if(subcatSection) subcatSection.style.display = 'none';
    }
    
    setTimeout(() => { let activeBtn = cont.querySelector('.active'); if(activeBtn) activeBtn.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"}); }, 150);
}

function generarSubcategoriasLicores() {
    let subcatSection = document.getElementById('subcategoria-section-main');
    let subcatContainer = document.getElementById('contenedorSubcategorias');
    
    if (!subcatSection) {
        console.warn("⚠️ No existe elemento: subcategoria-section-main");
        return;
    }
    if (!subcatContainer) {
        console.warn("⚠️ No existe elemento: contenedorSubcategorias");
        return;
    }
    
    // Extraer subcategorías REALES (Ron, Vodka, Anís) que tenemos en inventario
    const subcategoriasDisponibles = new Set();
    inventario.forEach(p => {
        if(p.Cat === 'LICORES' && p.SubCat) {
            subcategoriasDisponibles.add(p.SubCat);
        }
    });
    
    if (subcategoriasDisponibles.size === 0) {
        subcatSection.style.display = 'none';
        return;
    }
    
    subcatSection.style.display = 'block';
    subcatContainer.innerHTML = '';
    
    // Botón "Todos los Licores"
    let btnLimpiar = document.createElement('button');
    btnLimpiar.className = (!subcategoriaActual) ? "cat-btn active" : "cat-btn";
    btnLimpiar.innerHTML = `<i class="fa-solid fa-list"></i><span>Todos</span>`;
    btnLimpiar.onclick = function() { subcategoriaActual = null; aplicarFiltros(); closeCategorias(); };
    subcatContainer.appendChild(btnLimpiar);
    
    // Crear botones para cada subcategoría (Ron, Vodka...)
    Array.from(subcategoriasDisponibles).sort().forEach(subcat => {
        let btn = document.createElement('button');
        btn.className = (subcat === subcategoriaActual) ? "cat-btn active" : "cat-btn";
        btn.innerHTML = `<i class="fa-solid ${getIconForCategory(subcat)}"></i><span>${subcat}</span>`;
        btn.onclick = function() { subcategoriaActual = subcat; aplicarFiltros(); closeCategorias(); };
        subcatContainer.appendChild(btn);
    });
}

function setActiveNav(id) { document.querySelectorAll('.bottom-nav a').forEach(a => a.classList.remove('active')); const el = document.getElementById(id); if(el) el.classList.add('active'); }
function irInicio() { 
    cerrarModal('all'); 
    setActiveNav('nav-home'); 
    window.scrollTo({top: 0, behavior: 'smooth'}); 
    document.getElementById('buscador').value = ''; 
    document.getElementById('chkAgotados').checked = false; 
    cerrarSugerencias(); 
    subcategoriaActual = null; 
    
    // Ocultar subcategorías
    let subcatSection = document.getElementById('subcategoria-section-main');
    if(subcatSection) subcatSection.style.display = 'none';
    
    // Click en botón Inicio
    let btnInicio = Array.from(document.querySelectorAll('.cat-btn')).find(b => b.innerText.includes('Inicio')); 
    if(btnInicio) filtrarCategoria('Todos', btnInicio); 
    else filtrarCategoria('Todos', document.querySelectorAll('.cat-btn')[0]); 
    
    // Restablecer el título móvil
    let mTitle = document.getElementById('mobile-header-title');
    if(mTitle) mTitle.innerText = 'Inicio';
}
function abrirLegales() { document.getElementById('modal-legales').style.display = 'flex'; }
function abrirSoporteWhatsApp() { let msg = "Hola, necesito ayuda con la plataforma de Gran Catador."; window.open(`https://wa.me/584245496366?text=${encodeURIComponent(msg)}`, '_blank'); }

function abrirPerfil() { 
    cerrarModal('all'); setActiveNav('nav-user'); document.getElementById('modal-perfil').style.display = 'flex'; document.getElementById('perfilNombre').value = localStorage.getItem('gc_nombre') || ''; document.getElementById('perfilDireccion').value = localStorage.getItem('gc_direccion') || ''; 
    let hist = JSON.parse(localStorage.getItem('gc_historial')) || []; let listCont = document.getElementById('historial-lista');
    if(hist.length === 0) { listCont.innerHTML = '<p style="font-size:12px; color:gray; text-align:center;">Aún no tienes pedidos registrados.</p>'; } 
    else { listCont.innerHTML = ''; hist.forEach((ped, index) => { let itemsT = ped.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', '); listCont.innerHTML += `<div style="border:1px solid var(--color-border); background:var(--color-card); box-shadow:var(--shadow-sm); padding:15px; border-radius:var(--radius-md); margin-bottom:12px;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;"><span style="font-size:12px; font-weight:600; color:var(--color-primary);">${ped.fecha}</span><span style="font-size:15px; font-weight:700; color:var(--color-text); font-family:'Inter',sans-serif;">$${ped.total.toFixed(2)}</span></div><p style="font-size:12px; color:var(--color-text-muted); margin-bottom:15px; line-height:1.4;">${itemsT}</p><button onclick="repetirPedido(${index})" style="background:rgba(30,58,138,0.1); color:var(--color-primary); border:none; padding:10px; width:100%; border-radius:var(--radius-full); font-size:13px; font-weight:700; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-rotate-right"></i> Repetir pedido</button></div>`; }); }
}
function guardarPerfil() { localStorage.setItem('gc_nombre', document.getElementById('perfilNombre').value); localStorage.setItem('gc_direccion', document.getElementById('perfilDireccion').value); mostrarToast("Datos guardados ✅"); cerrarModal('modal-perfil', 'nav-home'); }
function abrirAjustes() { cerrarModal('all'); setActiveNav('nav-settings'); document.getElementById('modal-ajustes').style.display = 'flex'; document.getElementById('toggleDarkMode').checked = document.body.classList.contains('dark-mode'); }

function toggleDark() { document.body.classList.toggle('dark-mode'); localStorage.setItem('gc_dark', document.body.classList.contains('dark-mode')); }
function cerrarModal(modalId, navAnterior = 'nav-home') { if(modalId === 'all') { document.querySelectorAll('.modal-fullscreen').forEach(m => m.style.display = 'none'); return; } const m = document.getElementById(modalId); if(m) m.style.display = 'none'; if(navAnterior === 'modal-ajustes') { abrirAjustes(); } else { setActiveNav(navAnterior); } }
function mostrarToast(msg) { const cont = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; cont.appendChild(t); setTimeout(() => t.remove(), 2500); }
function compartirProductoB64(b64, p) { compartirProducto(decodificarNombre(b64), p); }

window.limpiarCacheAdmin = function() { localStorage.clear(); sessionStorage.clear(); if ('caches' in window) { caches.keys().then(n => n.forEach(c => caches.delete(c))); } if ('serviceWorker' in navigator) { navigator.serviceWorker.getRegistrations().then(r => r.forEach(s => s.unregister())); } alert('Toda la memoria y caché eliminados.'); window.location.href = window.location.pathname + '?v=' + new Date().getTime(); }

window.onload = cargarInventario;
