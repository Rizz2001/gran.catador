class AppBottomNav extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <!-- Bottom Navigation (Mobile Only) -->
    <nav class="bottom-nav">
        <a href="#" onclick="event.preventDefault(); window.location.href='index.html';" class="nav-item">
            <i class="fa-solid fa-house"></i>
            <span>Inicio</span>
        </a>
        <a href="#" onclick="event.preventDefault(); document.getElementById('buscador').focus();" class="nav-item">
            <i class="fa-solid fa-magnifying-glass"></i>
            <span>Buscar</span>
        </a>
        <a href="#" onclick="event.preventDefault(); window.location.href='carrito/';" class="nav-item" id="nav-cart-bottom">
            <div class="nav-icon-badge">
                <i class="fa-solid fa-cart-shopping"></i>
                <span class="cart-badge" id="bottom-cart-count">0</span>
            </div>
            <span>Carrito</span>
        </a>
        <a href="#" onclick="event.preventDefault(); abrirPerfil();" class="nav-item">
            <i class="fa-regular fa-user"></i>
            <span>Perfil</span>
        </a>
    </nav>

    <!-- Botón Flotante: Volver Arriba -->
    <button id="btn-scroll-top" class="btn-scroll-top" onclick="scrollToTop()" aria-label="Volver arriba">
        <i class="fa-solid fa-chevron-up"></i>
    </button>
        `;

        // Lógica simple para marcar 'active' según la ruta
        setTimeout(() => {
            const path = window.location.pathname.toLowerCase();
            const items = this.querySelectorAll('.nav-item');
            if (path.includes('/carrito')) {
                if(items[2]) items[2].classList.add('active');
            } else if (path.includes('producto.html')) {
                // Ninguno activo o mantener Inicio activo, lo dejamos sin active
            } else {
                if(items[0]) items[0].classList.add('active');
            }
        }, 50);
    }
}
customElements.define('app-bottom-nav', AppBottomNav);
