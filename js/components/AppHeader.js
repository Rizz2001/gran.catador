class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <div class="header-top-bar marquee-container">
        <div class="marquee-text">
            <span style="font-weight: 600; letter-spacing: 0.5px;">
                🕒 Horarios: Lunes a Domingos de 8:00 AM a 9:00 PM &nbsp;|&nbsp; Gran Catador Supermercado y Bodegón
            </span>
        </div>
    </div>

    <header class="site-header" role="banner">
        <div class="sticky-header-content">
            <div class="header-main-bar">
                <div class="container header-main-container">

                    <div class="header-left">
                        <button onclick="toggleSidebar()" class="btn-menu-sidebar" aria-label="Abrir Menú">
                            <i class="fa-solid fa-bars"></i> <span>Menú</span>
                        </button>
                        <div class="header-brand" onclick="window.location.href='index.html'" style="cursor: pointer;">
                            <img src="logo.webp" alt="Logo Gran Catador" width="1000" height="750" loading="eager"
                                style="height: 32px; width: 32px; border-radius: 4px; object-fit: contain;">
                            <span class="brand-text">Gran Catador</span>
                        </div>
                        <button class="desktop-only header-btn-inicio" onclick="window.location.href='index.html'">
                            <i class="fa-solid fa-house"></i> Inicio
                        </button>
                    </div>

                    <div class="header-center">
                        <div class="search-pill">
                            <i class="fa-solid fa-magnifying-glass search-icon"></i>
                            <input type="text" id="buscador" placeholder="Buscar productos..." aria-label="Buscar productos"
                                onkeyup="debounceBusqueda(event)" autocomplete="off">
                            <i class="fa-solid fa-circle-xmark clear-search-icon" id="clear-search"
                                onclick="limpiarBuscador()" aria-label="Limpiar búsqueda"></i>
                            <div id="search-suggestions"></div>
                        </div>
                    </div>

                    <div class="header-right">
                        <div class="desktop-only header-tasa-badge" title="Tasas Oficiales BCV">
                            <span class="tasa-value"><i class="fa-solid fa-dollar-sign"></i> <span id="tasaValor">...</span></span>
                            <span class="tasa-separator">|</span>
                            <span class="tasa-value"><i class="fa-solid fa-euro-sign"></i> <span id="tasaEuroValor">...</span></span>
                        </div>
                        <button class="icon-btn desktop-only" onclick="abrirSoporteWhatsApp()"
                            aria-label="Soporte WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </button>

                        <button class="icon-btn desktop-only" aria-label="Notificaciones">
                            <i class="fa-regular fa-bell"></i>
                        </button>
                        <button class="icon-btn desktop-only" onclick="window.location.href='carrito/'" aria-label="Carrito">
                            <i class="fa-solid fa-cart-shopping"></i>
                            <span class="badge" id="cart-count">0</span>
                        </button>
                        <button class="icon-btn desktop-only" onclick="abrirPerfil()" aria-label="Mi Perfil">
                            <i class="fa-regular fa-user"></i>
                        </button>
                        <button class="icon-btn" onclick="abrirAjustes()" aria-label="Ajustes">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="mobile-only header-tasa-mobile">
                <div class="tasa-inner">
                    <span class="tasa-value"><i class="fa-solid fa-dollar-sign"></i>
                        <span id="tasaValorMobile">...</span></span>
                    <span class="tasa-separator">|</span>
                    <span class="tasa-value"><i class="fa-solid fa-euro-sign"></i> <span
                            id="tasaEuroValorMobile">...</span></span>
                </div>
            </div>

            <span id="store-status" style="display:none;"></span>
        </div>
    </header>
        `;
    }
}
customElements.define('app-header', AppHeader);
