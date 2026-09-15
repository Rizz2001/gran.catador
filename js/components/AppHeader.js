const headerTemplate = document.createElement('template');
headerTemplate.innerHTML = `
    <!-- NIVEL 1: Barra superior delgada con horario y contacto -->
    <div class="header-top-bar">
        <div class="container header-top-container">
            <div class="top-info-left">
                <span class="top-info-item"><i class="fa-solid fa-clock"></i> Horario: <strong>8:00 AM - 9:00 PM</strong></span>
                <span class="top-info-divider">|</span>
                <span class="top-info-item"><i class="fa-solid fa-truck-fast"></i> Delivery directo en Barinas</span>
            </div>
            <div class="top-info-right">
                <a href="https://wa.me/584245496366" target="_blank" rel="noopener" class="top-whatsapp-link">
                    <i class="fa-brands fa-whatsapp"></i> Pedidos / WhatsApp: <strong>+58 424-5496366</strong>
                </a>
            </div>
        </div>
    </div>

    <!-- NIVEL 2: Barra principal del header -->
    <header class="site-header" role="banner">
        <div class="sticky-header-content">
            <div class="header-main-bar">
                <div class="container header-main-container">

                    <!-- Izquierda: Menú lateral y Marca -->
                    <div class="header-left">
                        <button class="btn-menu-sidebar" aria-label="Abrir Menú">
                            <i class="fa-solid fa-bars"></i> <span class="desktop-only">Menú</span>
                        </button>
                        <div class="header-brand" style="cursor: pointer;">
                            <img src="assets/img/logo-32x32.webp" alt="Logo Gran Catador" width="32" height="32" loading="eager"
                                style="border-radius: 6px; object-fit: contain;">
                            <span class="brand-text">Gran Catador</span>
                        </div>
                    </div>

                    <!-- Centro: Buscador Prominente -->
                    <div class="header-center">
                        <div class="search-pill">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <input type="text" id="buscador" placeholder="Buscar víveres, licores, bebidas..." aria-label="Buscar productos" autocomplete="off">
                            <i class="fa-solid fa-circle-xmark clear-search-icon" id="clear-search" aria-label="Limpiar búsqueda"></i>
                            <div id="search-suggestions"></div>
                        </div>
                    </div>

                    <!-- Derecha: Tasa BCV, WhatsApp, Carrito con Contador + Total -->
                    <div class="header-right">
                        <div class="desktop-only header-tasa-badge" title="Tasas Oficiales BCV">
                            <span class="tasa-value"><i class="fa-solid fa-dollar-sign"></i> <span id="tasaValor">...</span></span>
                            <span class="tasa-separator">|</span>
                            <span class="tasa-value"><i class="fa-solid fa-euro-sign"></i> <span id="tasaEuroValor">...</span></span>
                        </div>
                        
                        <button class="icon-btn desktop-only" id="btn-whatsapp-header" aria-label="Soporte WhatsApp" title="Contactar por WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>

                        <button class="header-cart-btn" id="btn-cart-header" aria-label="Carrito de compras">
                            <div class="cart-btn-icon-wrapper">
                                <i class="fa-solid fa-cart-shopping"></i>
                                <span class="badge" id="cart-count">0</span>
                            </div>
                            <div class="cart-btn-text-wrapper desktop-only">
                                <span class="cart-btn-label">Mi Pedido</span>
                                <span class="cart-btn-total" id="cart-total-header">$0.00</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tasa BCV Móvil -->
            <div class="mobile-only header-tasa-mobile">
                <div class="tasa-inner">
                    <span class="tasa-value"><i class="fa-solid fa-dollar-sign"></i> <span id="tasaValorMobile">...</span></span>
                    <span class="tasa-separator">|</span>
                    <span class="tasa-value"><i class="fa-solid fa-euro-sign"></i> <span id="tasaEuroValorMobile">...</span></span>
                </div>
            </div>

            <!-- BARRA SECUNDARIA: Accesos rápidos a categorías principales -->
            <nav class="header-quick-categories-bar" aria-label="Categorías principales">
                <div class="container quick-categories-container">
                    <button class="quick-cat-btn active" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('Todos')">
                        <i class="fa-solid fa-border-all"></i> Todos
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('LICORES')">
                        <i class="fa-solid fa-wine-bottle"></i> Licores
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('VINOS')">
                        <i class="fa-solid fa-wine-glass-empty"></i> Vinos
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('CERVEZAS')">
                        <i class="fa-solid fa-beer-mug-empty"></i> Cervezas
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('VÍVERES')">
                        <i class="fa-solid fa-basket-shopping"></i> Víveres
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('BEBIDAS')">
                        <i class="fa-solid fa-bottle-water"></i> Bebidas
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('CHARCUTERÍA')">
                        <i class="fa-solid fa-cheese"></i> Charcutería
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('SNACKS')">
                        <i class="fa-solid fa-cookie-bite"></i> Snacks
                    </button>
                    <button class="quick-cat-btn" onclick="if(typeof seleccionarCategoria === 'function') seleccionarCategoria('HIELO')">
                        <i class="fa-solid fa-cube"></i> Hielo
                    </button>
                </div>
            </nav>

            <span id="store-status" style="display:none;"></span>
        </div>
    </header>
`;

class AppHeader extends HTMLElement {
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.appendChild(headerTemplate.content.cloneNode(true));
            
            // Re-vincular event listeners
            const menuBtn = this.querySelector('.btn-menu-sidebar');
            if (menuBtn) menuBtn.addEventListener('click', () => { if(typeof toggleSidebar === 'function') toggleSidebar(); });

            const brand = this.querySelector('.header-brand');
            if (brand) brand.addEventListener('click', () => { if(typeof irInicio === 'function') irInicio(); else window.location.href='index.html'; });

            const buscador = this.querySelector('#buscador');
            if (buscador) buscador.addEventListener('keyup', (e) => { if(typeof debounceBusqueda === 'function') debounceBusqueda(e); });

            const clearSearch = this.querySelector('#clear-search');
            if (clearSearch) clearSearch.addEventListener('click', () => { if(typeof limpiarBuscador === 'function') limpiarBuscador(); });

            const wsBtn = this.querySelector('#btn-whatsapp-header');
            if (wsBtn) wsBtn.addEventListener('click', () => { if(typeof abrirSoporteWhatsApp === 'function') abrirSoporteWhatsApp(); });

            const cartBtn = this.querySelector('#btn-cart-header');
            if (cartBtn) cartBtn.addEventListener('click', () => { if(typeof abrirCarrito === 'function') abrirCarrito(); else window.location.href='carrito/'; });
        }
    }
}
customElements.define('app-header', AppHeader);
