class AppSidebar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <!-- Overlay para Menú Lateral -->
    <div id="sidebar-overlay" class="sidebar-overlay" onclick="closeSidebar()"></div>

    <!-- Menú Lateral (Sidebar) de Categorías -->
    <aside id="sidebar-menu" class="sidebar-menu" aria-label="Filtros y Categorías">
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <img src="logo.webp" alt="Logo Gran Catador">
                <h3 class="sidebar-title">Gran Catador</h3>
            </div>
            <button onclick="closeSidebar()" class="sidebar-close-btn" aria-label="Cerrar menú">
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
                <button onclick="volverAGrupos()" class="sidebar-back-btn inner-back-btn" aria-label="Volver a Grupos">
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
    }
}
customElements.define('app-sidebar', AppSidebar);
