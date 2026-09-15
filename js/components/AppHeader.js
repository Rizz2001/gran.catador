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

                    <!-- Derecha: Tasa BCV, WhatsApp, Carrito -->
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

            <!-- BARRA SECUNDARIA: Accesos rápidos a categorías principales (Dinamizados desde la API) -->
            <nav class="header-quick-categories-bar" aria-label="Categorías principales">
                <div class="container quick-categories-container">
                    <button class="quick-cat-btn active" data-cat="Todos">
                        <i class="fa-solid fa-border-all"></i> Todos
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
            
            // Re-vincular event listeners estáticos
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

            // Renderizar botones de categorías dinámicamente con los grupos reales existentes
            this.renderQuickCategories();

            // Intervalo periódico hasta que appState descargue la lista de grupos reales desde la API
            this.checkGroupsInterval = setInterval(() => {
                if (window.appState && ((window.appState.gruposInventario && window.appState.gruposInventario.length > 0) || (window.appState.inventario && window.appState.inventario.length > 0))) {
                    this.renderQuickCategories();
                    if (window.appState.gruposInventario && window.appState.gruposInventario.length > 0) {
                        clearInterval(this.checkGroupsInterval);
                    }
                }
            }, 800);
        }
    }

    disconnectedCallback() {
        if (this.checkGroupsInterval) clearInterval(this.checkGroupsInterval);
    }

    renderQuickCategories() {
        const container = this.querySelector('.quick-categories-container');
        if (!container) return;

        let grupos = [];

        // 1. Obtener grupos reales desde appState.gruposInventario
        if (window.appState && Array.isArray(window.appState.gruposInventario) && window.appState.gruposInventario.length > 0) {
            grupos = window.appState.gruposInventario.map(g => {
                return g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo || g.grupo || g.Grupo || '';
            }).filter(Boolean);
        }

        // 2. O extraer de los productos cargados en inventario
        if (grupos.length === 0 && window.appState && Array.isArray(window.appState.inventario) && window.appState.inventario.length > 0) {
            const catSet = new Set();
            window.appState.inventario.forEach(p => {
                if (p.Cat && p.Cat.toUpperCase() !== 'OTROS') catSet.add(p.Cat);
            });
            grupos = Array.from(catSet);
        }

        // Si aún no han cargado los datos, no vaciar el contenedor
        if (grupos.length === 0) return;

        // Filtrar duplicados y nombres especiales
        const gruposUnicos = [];
        const vistos = new Set();

        grupos.forEach(rawNom => {
            let nomLimpio = typeof limpiarCategoria === 'function' ? limpiarCategoria(rawNom) : rawNom.toUpperCase().trim();
            if (nomLimpio && nomLimpio !== 'OTROS' && nomLimpio !== 'FAVORITOS' && !vistos.has(nomLimpio)) {
                vistos.add(nomLimpio);
                gruposUnicos.push({ raw: rawNom, limpio: nomLimpio });
            }
        });

        const activeCat = (window.categoriaActual || 'Todos').toUpperCase();

        let html = `
            <button class="quick-cat-btn ${activeCat === 'TODOS' ? 'active' : ''}" data-cat="Todos">
                <i class="fa-solid fa-border-all"></i> Todos
            </button>
        `;

        gruposUnicos.forEach(g => {
            const iconClass = typeof getIconForCategory === 'function' ? getIconForCategory(g.limpio) : 'fa-tags';
            const displayNombre = typeof formatCategoryName === 'function' ? formatCategoryName(g.raw) : (g.raw.charAt(0).toUpperCase() + g.raw.slice(1).toLowerCase());
            const isActive = (activeCat === g.limpio || activeCat === g.raw.toUpperCase() || (typeof limpiarCategoria === 'function' && limpiarCategoria(activeCat) === g.limpio));

            html += `
                <button class="quick-cat-btn ${isActive ? 'active' : ''}" data-cat="${g.raw}">
                    <i class="fa-solid ${iconClass}"></i> ${displayNombre}
                </button>
            `;
        });

        container.innerHTML = html;

        // Re-vincular event listeners para cada botón generado
        container.querySelectorAll('.quick-cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetCat = btn.getAttribute('data-cat') || 'Todos';
                if (typeof window.seleccionarCategoria === 'function') {
                    window.seleccionarCategoria(targetCat);
                }
            });
        });
    }
}
customElements.define('app-header', AppHeader);
