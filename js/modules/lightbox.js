// --- LIGHTBOX DE IMAGEN PARA PC ---
window.abrirImagenLightbox = function (imgSrc, codigo) {
    let p = null;
    if (codigo && typeof inventario !== 'undefined') {
        p = inventario.find(x => x.codigo === codigo);
    }
    
    if (!imgSrc && p) {
        imgSrc = p.Img1 || 'assets/img/logo_circle.png';
        if(imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
            const base = (typeof appState !== 'undefined' && appState.apiBaseUrl) ? appState.apiBaseUrl : 'https://api.smartventas.cloud';
            imgSrc = `${base}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
        }
    }

    if (window.history && window.history.pushState && codigo) {
        const url = new URL(window.location.href);
        url.searchParams.set('producto', codigo);
        window.history.pushState({ lightbox: true }, '', url);
    }

    let lightbox = document.getElementById('image-lightbox-gc');
    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'image-lightbox-gc';

        const closeLightbox = function() {
            lightbox.style.opacity = '0';
            setTimeout(() => lightbox.style.display = 'none', 300);
            if (window.history && window.history.pushState) {
                const url = new URL(window.location.href);
                if (url.searchParams.has('producto')) {
                    url.searchParams.delete('producto');
                    window.history.pushState({}, '', url);
                }
            }
        };

        // Cierra el visor al hacer clic en el fondo oscuro
        lightbox.onclick = function (e) {
            if (e.target.closest('#lightbox-card-gc')) return;
            closeLightbox();
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
            closeLightbox();
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

// --- DEEP LINKING ---
window.procesarRutasDeepLinking = function() {
    if (!window.location.search) {
        aplicarFiltros();
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('categoria');
    const prod = urlParams.get('producto');

    if (cat) {
        // Encontrar el checkbox correspondiente
        const catId = limpiarCategoria(cat).replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const cb = document.getElementById('cat-' + catId);
        filtrarCategoria(cat, cb);
    } else {
        aplicarFiltros();
    }

    if (prod) {
        setTimeout(() => {
            abrirImagenLightbox(null, prod);
        }, 500);
    }
};

window.addEventListener('popstate', function(e) {
    if (e.state && e.state.lightbox) {
        // Estaba en un producto, pero ya cerramos o retrocedimos
    } else {
        // Cerrar lightbox si esta abierto
        const lightbox = document.getElementById('image-lightbox-gc');
        if (lightbox && lightbox.style.display !== 'none') {
            lightbox.style.opacity = '0';
            setTimeout(() => lightbox.style.display = 'none', 300);
        }
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const cat = urlParams.get('categoria');
    const prod = urlParams.get('producto');

    if (cat) {
        const catId = limpiarCategoria(cat).replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const cb = document.getElementById('cat-' + catId);
        if (typeof categoriaActual !== 'undefined' && categoriaActual !== cat) {
            filtrarCategoria(cat, cb);
        }
    } else if (typeof categoriaActual !== 'undefined' && categoriaActual !== 'Todos') {
        irInicio();
    }
    
    if (prod) {
        abrirImagenLightbox(null, prod);
    }
});
