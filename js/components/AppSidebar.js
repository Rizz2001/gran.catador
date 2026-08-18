const sidebarTemplate = document.createElement('template');
sidebarTemplate.innerHTML = `
    <!-- Overlay para Menú Lateral -->
    <div id="sidebar-overlay" class="sidebar-overlay"></div>

    <!-- Botón Flotante (Icono suspendido en el aire para PC y Móvil) -->
    <button id="floating-sidebar-btn" class="floating-sidebar-btn" aria-label="Explorar Grupos">
        <i class="fa-solid fa-shapes"></i>
        <span class="floating-sidebar-text">Explorar Grupos</span>
    </button>

    <!-- Menú Lateral (Sidebar) de Categorías -->
    <aside id="sidebar-menu" class="sidebar-menu" aria-label="Filtros y Categorías">
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <img src="logo.webp" alt="Logo Gran Catador">
                <h3 class="sidebar-title">Gran Catador</h3>
            </div>
            <button class="sidebar-close-btn" aria-label="Cerrar menú">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="sidebar-content" style="position: relative; overflow-x: hidden; height: 100%;">
            
            <!-- Panel Principal: Grupos -->
            <div id="categoria-section-main" class="sidebar-section drilldown-panel active-panel">
                <h4 class="sidebar-section-title">Explorar Grupos</h4>
                <div class="sidebar-filters" id="contenedorCategorias"></div>
            </div>

            <!-- Panel Secundario: Subgrupos -->
            <div id="subcategoria-section-main" class="sidebar-section drilldown-panel hidden-panel">
                <button class="sidebar-back-btn inner-back-btn" aria-label="Volver a Grupos">
                    <i class="fa-solid fa-chevron-left"></i> Volver a Grupos
                </button>
                <h4 class="sidebar-section-title" id="submenu-parent-title" style="margin-top: 15px;">Subgrupos</h4>
                <div class="sidebar-subfilters" id="contenedorSubcategoriasSidebar"></div>
            </div>
            
        </div>
        
        <div class="sidebar-footer">
            <a href="https://wa.me/584245496366" target="_blank" class="sidebar-footer-link">
                <i class="fa-brands fa-whatsapp" style="font-size: 18px; color: #25D366;"></i> Asistencia por WhatsApp
            </a>
            <a href="https://www.instagram.com/elcatador.bnas/" target="_blank" class="sidebar-footer-link">
                <i class="fa-brands fa-instagram" style="font-size: 18px; color: #E1306C;"></i> Síguenos en Instagram
            </a>
        </div>
    </aside>
`;

class AppSidebar extends HTMLElement {
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.appendChild(sidebarTemplate.content.cloneNode(true));
            
            // Attach event listeners
            this.querySelector('#sidebar-overlay').addEventListener('click', () => { if(typeof closeSidebar === 'function') closeSidebar(); });
            this.querySelector('.sidebar-close-btn').addEventListener('click', () => { if(typeof closeSidebar === 'function') closeSidebar(); });
            this.querySelector('.sidebar-back-btn').addEventListener('click', () => { if(typeof volverAGrupos === 'function') volverAGrupos(); });

            const floatBtn = this.querySelector('#floating-sidebar-btn');
            if (floatBtn) {
                floatBtn.addEventListener('click', () => { if(typeof toggleSidebar === 'function') toggleSidebar(); });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && typeof closeSidebar === 'function') {
                    closeSidebar();
                }
            });
        }
    }
}
customElements.define('app-sidebar', AppSidebar);
