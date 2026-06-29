// --- RENDERIZADO DE PRODUCTOS (Fase 5: Mejora de Rendimiento) ---
function crearHTMLProducto(p) {
    let esModoCaja = (modoVistaGlobal === 'caja');
    if (window.soloUnidad && window.soloUnidad.includes(p.Nombre)) esModoCaja = false;
    else if (window.soloCaja && window.soloCaja.includes(p.Nombre)) esModoCaja = true;
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
    } else if (window.productosOferta && window.productosOferta.includes(String(p.codigo || '').trim())) {
        badgeHTML = `<div class="product-badge badge-oferta"><i class="fa-solid fa-tag"></i> OFERTA</div>`;
    } else if (window.productosTop && window.productosTop.includes(String(p.codigo || '').trim())) {
        badgeHTML = `<div class="product-badge badge-top"><i class="fa-solid fa-star"></i> TOP</div>`;
    }

    let imgSrc = obtenerImgProducto(p);
    let attempts = p.ImagenUrl ? 0 : 1;
    // Se retiran las clases de scroll-snap porque la vista en miniatura no debería ser scrolleable para mejor UX
    let galeriasHTML = `<img loading="lazy" decoding="async" width="300" height="300" src="${imgSrc}" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" alt="${p.Nombre}" style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s ease; cursor: pointer;" onload="this.parentElement.classList.remove('skeleton-box');" onclick="event.stopPropagation(); irADetalle('${p.codigo.replace(/'/g, "\\'")}');">`;

    let displayNombre = p.Nombre;
    try {
        const queryRaw = (document.getElementById('buscador')?.value || '').trim();
        if (queryRaw) {
            const qNorm = quitarAcentos(queryRaw).toLowerCase();
            const words = qNorm.split(/\\s+/).filter(w => w.length > 1);
            if (words.length > 0) {
                const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
                const regexStr = words.map(w => escapeRegExp(w)).join('|');
                const regex = new RegExp(`(${regexStr})`, 'gi');
                displayNombre = displayNombre.replace(regex, '<span style="color: var(--color-primary); font-weight: bold; background-color: rgba(30,58,138,0.1); border-radius: 2px;">$1</span>');
            }
        }
    } catch(e){}

    return `
        <div class="producto-card ${isAgotado ? 'agotado' : ''}">
            
            ${badgeHTML}
            
            <div class="product-card-content" onclick="irADetalle('${p.codigo.replace(/'/g, "\\\\'")}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); irADetalle('${p.codigo.replace(/'/g, "\\\\'")}'); }" style="cursor: pointer; display: flex; flex-direction: column; flex-grow: 1;" role="button" tabindex="0" aria-label="Ver detalles de ${p.Nombre}">
                <div class="product-img-container skeleton-box">
                    ${galeriasHTML}
                </div>
                
                <h3 class="producto-titulo" title="${p.Nombre}">${displayNombre}</h3>
                
                <p class="producto-stock">
                    ${textoStock}
                </p>
                
                <div class="product-price-wrapper">
                    <span class="product-unit-label">${textoUnidad}</span>
                    <div class="prices-row">
                        <span class="product-price">$${precioUsdDin}</span>
                        <span class="product-price-bs">${precioBsDin} Bs</span>
                    </div>
                </div>
            </div>
            
            <div class="product-bottom-action">
                <button class="btn-buy-whatsapp ${isAgotado ? 'disabled' : ''}" aria-label="Comprar ${p.Nombre}" title="Comprar" ${isAgotado ? 'disabled' : `onclick="event.stopPropagation(); agregarAlCarritoB64('${nombreB64}', ${precioNum}, this, false, '${imgSrc}', ${esModoCaja})"`}>
                    <i class="fa-brands fa-whatsapp"></i> Comprar
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
            <article class="grupo-aleatorio-card" onclick="irADetalle('${producto.codigo.replace(/'/g, "\\'")}')" style="cursor: pointer;" aria-label="Ver detalles de ${titulo}">
                <div class="grupo-aleatorio-card-thumb">
                    <img src="${imgSrc}" alt="${titulo}" width="150" height="150" loading="lazy" onerror="this.src='logo.webp'">
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
            <article class="mas-vendidos-card ${index < 3 ? 'featured' : ''}" onclick="irADetalle('${producto.codigo.replace(/'/g, "\\'")}')" style="cursor: pointer;" aria-label="Ver detalles de ${nombre}">
                ${rankingBadge}
                <span class="mas-vendidos-card-thumb"><img src="${imagen}" alt="${nombre}" width="84" height="84" loading="lazy" onerror="this.src='logo.webp'"></span>
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
            <img src="${archivo}" alt="Marca Aliada ${index + 1}" width="136" height="76" loading="lazy" onerror="this.src='logo.webp'">
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
    if (!cont) return; // Si no estamos en index.html, salir

    if (paginaActual === 1) cont.innerHTML = '';

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = paginaActual * itemsPorPagina;
    const pedazo = productosFiltradosGlobal.slice(inicio, fin);

    const btnCargarMas = document.getElementById('btn-cargar-mas');

    if (productosFiltradosGlobal.length === 0) {
        if (paginaActual === 1) {
            const queryRaw = (document.getElementById('buscador')?.value || '').trim();
            let msjExtra = '';
            let tituloVacio = 'No encontramos esa botella';
            let descVacia = 'No encontramos botellas con esa descripción.';

            if (queryRaw.length > 0) {
                tituloVacio = `Sin resultados para "${queryRaw}"`;
                descVacia = `No pudimos encontrar "${queryRaw}" en nuestro inventario.`;
                if (categoriaActual !== 'Todos') {
                    msjExtra = `<br><span style="color: var(--color-primary); font-weight: 600; display: inline-block; margin-top: 10px; background: rgba(30,58,138,0.1); padding: 6px 12px; border-radius: 8px;"><i class="fa-solid fa-globe"></i> Se buscó en todo el catálogo</span>`;
                }
            }

            cont.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--texto-claro);">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.1; margin-bottom: 15px;">
                        <path d="M15.0001 12.0001H15.0101M12.0001 12.0001H12.0101M9.00006 12.0001H9.01006M5.53105 4.53105C5.82394 4.23816 6.17606 4 6.55006 4H17.45C17.824 4 18.1761 4.23816 18.469 4.53105C18.7619 4.82394 19 5.17606 19 5.55005V17.45C19 17.824 18.7619 18.1761 18.469 18.469C18.1761 18.7619 17.824 19 17.45 19H6.55006C6.17606 19 5.82394 18.7619 5.53105 18.469C5.23816 18.1761 5.00006 17.824 5.00006 17.45V5.55005C5.00006 5.17606 5.23816 4.82394 5.53105 4.53105ZM10.0001 21.0001V20.0001M14.0001 21.0001V20.0001M3.00006 8.00005H4.00006M3.00006 12.0001H4.00006M3.00006 16.0001H4.00006M20.0001 8.00005H21.0001M20.0001 12.0001H21.0001M20.0001 16.0001H21.0001M8.00006 3.00005V4.00005M12.0001 3.00005V4.00005M16.0001 3.00005V4.00005" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="var(--color-text)"/>
                    </svg>
                    <h3 style="color: var(--texto-oscuro); font-size: 16px; font-weight: bold;">${tituloVacio}</h3>
                    <p style="font-size: 13px; margin-top: 5px;">${descVacia}${msjExtra}</p>
                    <button onclick="document.getElementById('buscador').value=''; aplicarFiltros();" class="cat-btn active" style="margin: 20px auto 0 auto; padding: 10px 20px;">Limpiar búsqueda</button>
                </div>`;
            if (btnCargarMas) btnCargarMas.style.display = 'none';
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

    let bannersActivos = (window.bannersGrid || []).filter(b => b.activo);
    let baseFreq = window.bannersGridFrecuencia || 12;
    // Asegurar que freqBanner sea múltiplo de itemsPorFila para no romper la grilla (evita filas incompletas)
    let freqBanner = Math.max(1, Math.round(baseFreq / itemsPorFila)) * itemsPorFila;

    const tempDiv = document.createElement('div');
    const contenidoArray = [];

    pedazo.forEach((producto, index) => {
        contenidoArray.push(crearHTMLProducto(producto));

        const posicion = index + 1;
        if (posicion % insertAfterIndex === 0 && posicion < pedazo.length) {
            const seccionId = Math.floor(index / insertAfterIndex);
            contenidoArray.push(crearHTMLSeccionCategoriasAleatorias(productosFiltradosGlobal, seccionId));
        }

        // Lógica para inyectar Banner de Publicidad (PC)
        if (posicion % freqBanner === 0 && bannersActivos.length > 0 && posicion < pedazo.length) {
            let idxBanner = (Math.floor(posicion / freqBanner) - 1) % bannersActivos.length;
            let banner = bannersActivos[idxBanner];
            if (banner && banner.imagen) {
                let actionAttr = banner.codigoProducto 
                    ? `href="#" onclick="event.preventDefault(); irADetalle('${banner.codigoProducto}');"` 
                    : `href="${banner.url || '#'}"`;

                contenidoArray.push(`
                    <div class="banner-publicidad-grid">
                        <a ${actionAttr}>
                            <img src="${banner.imagen}" alt="${banner.alt || 'Publicidad'}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'100%\\\' height=\\\'150\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#f1f5f9\\\'/><text x=\\\'50%\\\' y=\\\'50%\\\' font-family=\\\'sans-serif\\\' font-size=\\\'20\\\' fill=\\\'#64748b\\\' text-anchor=\\\'middle\\\' dy=\\\'.3em\\\'>Banner no encontrado</text></svg>'; this.style.border='2px dashed #cbd5e1';">
                        </a>
                    </div>
                `);
            }
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

    if (btnCargarMas) {
        btnCargarMas.style.display = fin < productosFiltradosGlobal.length ? 'block' : 'none';
    }
}

function cargarMasProductos() {
    paginaActual++;
    renderizarPagina();
}
