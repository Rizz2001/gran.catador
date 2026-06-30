class AppFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <footer class="main-footer-new" role="contentinfo">
        <div class="container footer-container">
            
            <!-- Columna 1: Marca y Redes -->
            <div class="footer-col brand-col">
                <img src="logo.webp" alt="Logo Gran Catador" class="footer-logo" width="65" height="65" onerror="this.style.display='none'" loading="lazy">
                <p class="footer-desc">Gran Catador Supermercado y Bodegón. Para pedidos especiales, eventos o dudas, escríbenos directamente.</p>
                <div class="footer-social-new">
                    <a href="https://wa.me/584245496366" target="_blank" aria-label="WhatsApp" class="social-btn whatsapp-btn"><i class="fa-brands fa-whatsapp"></i></a>
                    <a href="https://www.instagram.com/elcatador.bnas/" target="_blank" aria-label="Instagram" class="social-btn instagram-btn"><i class="fa-brands fa-instagram"></i></a>
                </div>
            </div>

            <div class="footer-links-row">
                <!-- Columna 2: Accesos Rápidos y Soporte -->
                <div class="footer-col">
                    <h3>Accesos Rápidos</h3>
                    <ul>
                        <li><a href="#" onclick="event.preventDefault(); window.location.href='index.html';"><i class="fa-solid fa-angle-right"></i> Inicio</a></li>
                        <li><a href="#" onclick="event.preventDefault(); window.location.href='carrito/';"><i class="fa-solid fa-angle-right"></i> Mi Pedido</a></li>
                        <li><a href="#" onclick="event.preventDefault(); abrirPerfil();"><i class="fa-solid fa-angle-right"></i> Mi Perfil / Ajustes</a></li>
                        <li><a href="#" onclick="event.preventDefault(); abrirLegales();"><i class="fa-solid fa-angle-right"></i> Políticas y Privacidad</a></li>
                        <li><a href="#" onclick="event.preventDefault(); abrirSoporteWhatsApp();"><i class="fa-solid fa-angle-right"></i> Soporte Técnico</a></li>
                    </ul>
                </div>

                <!-- Columna 3: Contacto -->
                <div class="footer-col">
                    <h3>Contacto</h3>
                    <ul class="footer-contact-list">
                        <li><i class="fa-solid fa-location-dot"></i> <span>Barinas, Venezuela.</span></li>
                        <li><i class="fa-brands fa-whatsapp"></i> <span>+58 424-5496366</span></li>
                        <li><i class="fa-regular fa-clock"></i> <span>Lun-Dom: 8:00 AM - 9:00 PM</span></li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>© 2026 Gran Catador C.A. Todos los derechos reservados.</p>
        </div>
    </footer>
        `;
    }
}
customElements.define('app-footer', AppFooter);
