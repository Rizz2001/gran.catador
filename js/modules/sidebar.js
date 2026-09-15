// --- FUNCIONES DEL SIDEBAR Y CONTROL DE SCROLL MOBIL ---
window.lockBodyScroll = function () {
    document.documentElement.classList.add('no-scroll');
    document.body.classList.add('no-scroll');
};

window.unlockBodyScroll = function () {
    document.documentElement.classList.remove('no-scroll');
    document.body.classList.remove('no-scroll');
};

window.toggleSidebar = function () {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar && overlay) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        window.lockBodyScroll();
    }
};

window.closeSidebar = function () {
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    window.unlockBodyScroll();
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
    if (!window.location.pathname.includes('producto')) {
        irInicio();
    }
};
