// --- SUGERENCIAS E INTERACCIONES ---
/**
 * Muestra el panel de sugerencias usando resultados ya calculados por aplicarFiltros.
 * No hace una segunda pasada al inventario.
 * @param {string} q - Query normalizado
 * @param {Array} resultados - Productos ya filtrados y ordenados por score
 */
function mostrarSugerencias(q, resultados) {
    // Funcionalidad desactivada: los resultados se actualizan directamente en la página.
    const cont = document.getElementById('search-suggestions');
    if (cont) cont.style.display = 'none';
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
