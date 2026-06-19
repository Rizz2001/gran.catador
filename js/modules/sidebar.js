// --- FUNCIONES DEL SIDEBAR ---
window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        // Prevent body scroll on mobile
        if (window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
        }
    }
};

window.closeSidebar = function () {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
};

window.mostrarPanelGrupos = function () {
    let panelGrupos = document.getElementById('categoria-section-main');
    let panelSubgrupos = document.getElementById('subcategoria-section-main');
    if (panelGrupos && panelSubgrupos) {
        panelSubgrupos.classList.remove('active-panel');
        panelSubgrupos.classList.add('hidden-panel');
        panelGrupos.classList.remove('hidden-panel');
        panelGrupos.classList.add('active-panel');
    }
};

window.volverAGrupos = function () {
    mostrarPanelGrupos();
    irInicio(); // Reset to "Todos" filter gracefully
};
