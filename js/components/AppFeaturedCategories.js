class AppFeaturedCategories extends HTMLElement {
    constructor() {
        super();
        this.rendered = false;
    }

    connectedCallback() {
        // Chequeo periódico hasta que appState.gruposInventario esté cargado desde la API
        this.checkInterval = setInterval(() => {
            if (window.appState && window.appState.gruposInventario && window.appState.gruposInventario.length > 0) {
                clearInterval(this.checkInterval);
                this.render();
            }
        }, 500);
    }

    disconnectedCallback() {
        if (this.checkInterval) clearInterval(this.checkInterval);
    }

    render() {
        if (this.rendered) return;
        
        let grupos = window.appState.gruposInventario || [];
        
        // Filtrar categorías que no queremos mostrar aquí
        let gruposValidos = grupos.filter(g => {
            let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo;
            if (!nombre) return false;
            let nomLimpio = typeof limpiarCategoria === 'function' ? limpiarCategoria(nombre) : nombre;
            return nomLimpio !== 'Otros' && nomLimpio !== 'Favoritos';
        });

        if (gruposValidos.length === 0) return;

        // Mezclar aleatoriamente el array para que sean distintas cada vez que se actualiza la página
        let mezclados = [...gruposValidos].sort(() => 0.5 - Math.random());
        
        // Tomar hasta 8-10 categorias reales para el carrusel
        let seleccionados = mezclados.slice(0, 10);

        let cardsHtml = '';
        const generateCards = () => {
            let html = '';
            seleccionados.forEach(g => {
                let nombre = g.Nombre || g.nombre || g.Descripcion || g.descripcion || g.NombreGrupo || g.desc_grupo || g.DescGrupo;
                let catIdLimpio = typeof limpiarCategoria === 'function' ? limpiarCategoria(nombre).replace(/[^a-z0-9]/gi, '-').toLowerCase() : nombre.toLowerCase();
                let iconClass = typeof getIconForCategory === 'function' ? getIconForCategory(nombre) : 'fa-box';
                // Capitalizar primera letra
                let displayNombre = nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
                
                // Si el nombre es muy largo, cortarlo un poco
                if (displayNombre.length > 15) {
                    displayNombre = displayNombre.substring(0, 15) + '...';
                }

                html += `
                    <div class="featured-category-card" onclick="if(typeof seleccionarCategoriaDestacada === 'function') seleccionarCategoriaDestacada('${catIdLimpio}')">
                        <div class="fcc-icon"><i class="fa-solid ${iconClass}"></i></div>
                        <span class="fcc-name">${displayNombre}</span>
                    </div>
                `;
            });
            return html;
        };

        let content = generateCards();
        
        this.innerHTML = `
            <div class="featured-categories-container">
                <h3 class="featured-categories-title">Descubre nuestras categorías</h3>
                <div class="featured-categories-scroll infinite-scroll-marquee">
                    <div class="marquee-content">
                        ${content}
                    </div>
                    <!-- Clon exacto para el efecto de scroll infinito -->
                    <div class="marquee-content" aria-hidden="true">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        this.rendered = true;
    }
}

customElements.define('app-featured-categories', AppFeaturedCategories);
