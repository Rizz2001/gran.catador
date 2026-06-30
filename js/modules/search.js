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
            if (typeof debounceTimer !== 'undefined') clearTimeout(debounceTimer);
            input.value = producto.Nombre || '';
            cont.style.display = 'none';
            input.blur();
            
            if (typeof irADetalle === 'function') {
                irADetalle(producto.codigo);
            } else {
                window.location.href = 'producto.html?id=' + encodeURIComponent(producto.codigo);
            }
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
        
        // Aplicar resaltado también en la lista de sugerencias
        const qNorm = quitarAcentos(query).toLowerCase();
        const words = qNorm.split(/\\s+/).filter(w => w.length > 1);
        if (words.length > 0) {
            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
            const regexStr = words.map(w => escapeRegExp(w)).join('|');
            const regex = new RegExp(`(${regexStr})`, 'gi');
            titulo.innerHTML = (producto.Nombre || 'Producto').replace(regex, '<strong>$1</strong>');
        }

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
        input.blur();
        const listado = document.getElementById('lista-productos');
        if (listado) {
            const offset = listado.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' });
        }
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
