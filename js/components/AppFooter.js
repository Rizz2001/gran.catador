const footerTemplate = document.createElement('template');
footerTemplate.innerHTML = `
    <footer class="main-footer-new" role="contentinfo">
        <div class="container footer-container">
            
            <!-- Columna 1: Sobre Gran Catador -->
            <div class="footer-col brand-col">
                <div class="footer-brand-header">
                    <img src="assets/img/logo-32x32.webp" alt="Logo Gran Catador" class="footer-logo" width="36" height="36" loading="lazy">
                    <span class="footer-brand-name">Gran Catador</span>
                </div>
                <p class="footer-desc">Bodegón y Supermercado de confianza en Barinas, Venezuela. Gran variedad de licores, víveres, charcutería y snacks con delivery directo a tu hogar por WhatsApp.</p>
                <div class="footer-social-new">
                    <a href="https://wa.me/584245496366" target="_blank" rel="noopener" aria-label="WhatsApp" class="social-btn whatsapp-btn"><i class="fa-brands fa-whatsapp"></i></a>
                    <a href="https://www.instagram.com/elcatador.bnas/" target="_blank" rel="noopener" aria-label="Instagram" class="social-btn instagram-btn"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>

            <!-- Columna 2: Contacto y Horario -->
            <div class="footer-col contact-col">
                <h3>Contacto y Horario</h3>
                <ul class="footer-contact-list">
                    <li><i class="fa-solid fa-location-dot"></i> <span>Av. 23 de Enero, Barinas, Venezuela.</span></li>
                    <li><i class="fa-brands fa-whatsapp"></i> <span>WhatsApp: +58 424-5496366</span></li>
                    <li><i class="fa-regular fa-clock"></i> <span>Lun - Dom: 8:00 AM - 9:00 PM</span></li>
                    <li><i class="fa-solid fa-credit-card"></i> <span>Efectivo, Pago Móvil y Zelle</span></li>
                </ul>
            </div>

            <!-- Columna 3: Información y Servicios -->
            <div class="footer-col links-col">
                <h3>Servicios y Ayuda</h3>
                <ul>
                    <li><a href="#" class="footer-link-inicio"><i class="fa-solid fa-angle-right"></i> Inicio</a></li>
                    <li><a href="#" class="footer-link-carrito"><i class="fa-solid fa-angle-right"></i> Mi Pedido / Carrito</a></li>
                    <li><a href="#" class="footer-link-soporte"><i class="fa-solid fa-angle-right"></i> Pedidos por WhatsApp</a></li>
                    <li><a href="#" class="footer-link-legales"><i class="fa-solid fa-angle-right"></i> Políticas y Términos</a></li>
                </ul>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="container footer-bottom-container">
                <p>© <span id="footer-year">2026</span> Gran Catador C.A. Todos los derechos reservados.</p>
                <p class="footer-legal-tag">Supermercado & Bodegón en Barinas | Delivery WhatsApp</p>
            </div>
        </div>
    </footer>
`;

class AppFooter extends HTMLElement {
    connectedCallback() {
        if (!this.hasChildNodes()) {
            this.appendChild(footerTemplate.content.cloneNode(true));
            
            // Año dinámico
            const yearSpan = this.querySelector('#footer-year');
            if (yearSpan) yearSpan.innerText = new Date().getFullYear();

            // Event Listeners
            const linkInicio = this.querySelector('.footer-link-inicio');
            if (linkInicio) linkInicio.addEventListener('click', (e) => { e.preventDefault(); if(typeof irInicio === 'function') irInicio(); else window.location.href='index.html'; });

            const linkCart = this.querySelector('.footer-link-carrito');
            if (linkCart) linkCart.addEventListener('click', (e) => { e.preventDefault(); if(typeof abrirCarrito === 'function') abrirCarrito(); else window.location.href='carrito/'; });

            const linkLegales = this.querySelector('.footer-link-legales');
            if (linkLegales) linkLegales.addEventListener('click', (e) => { e.preventDefault(); if(typeof abrirLegales === 'function') abrirLegales(); });

            const linkSoporte = this.querySelector('.footer-link-soporte');
            if (linkSoporte) linkSoporte.addEventListener('click', (e) => { e.preventDefault(); if(typeof abrirSoporteWhatsApp === 'function') abrirSoporteWhatsApp(); });
        }
    }
}
customElements.define('app-footer', AppFooter);
