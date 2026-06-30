class AppModals extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <div id="toast-container"></div>

    <div id="modal-perfil" class="modal-fullscreen">
        <div class="modal-content-wrapper modal-perfil-wrapper">
            <div class="cart-header modal-perfil-header">
                <h2>Mi Perfil</h2>
                <button onclick="cerrarModal('modal-perfil', 'nav-home')" aria-label="Cerrar perfil" class="modal-close-btn modal-perfil-close">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>
            
            <div class="modal-perfil-body">
                <p class="modal-perfil-desc">Tus datos se guardarán localmente para agilizar tus compras.</p>
                
                <div class="modal-perfil-card">
                    <h3 class="modal-perfil-card-title"><i class="fa-regular fa-id-badge"></i> Datos Personales</h3>
                    
                    <div class="input-group">
                        <input type="text" id="perfilNombre" class="input-text modal-perfil-input" placeholder="Nombre y Apellido">
                    </div>
                    <div class="input-group">
                        <input type="text" id="perfilCedula" class="input-text modal-perfil-input" placeholder="Cédula (Ej: V-12345678)" oninput="formatearCedula(this)">
                    </div>
                    <div class="input-group mb-0">
                        <input type="tel" id="perfilTelefono" class="input-text modal-perfil-input" placeholder="Teléfono (Ej: 0414-1234567)" oninput="formatearTelefono(this)">
                    </div>
                </div>

                <div class="modal-perfil-card mb-25">
                    <h3 class="modal-perfil-card-title"><i class="fa-solid fa-location-dot"></i> Dirección de Delivery</h3>
                    
                    <div class="modal-perfil-geo-row">
                        <input type="text" id="perfilDireccion" class="input-text modal-perfil-input modal-perfil-geo-input" placeholder="Ej: Av. Principal, Casa #10">
                        <button id="btn-geo-perfil" class="modal-perfil-geo-btn" onclick="obtenerUbicacion('perfilDireccion', 'btn-geo-perfil')" title="Usar mi ubicación actual">
                            <i class="fa-solid fa-location-crosshairs"></i>
                        </button>
                    </div>
                </div>

                <button class="btn-enviar modal-perfil-save-btn" onclick="guardarPerfil()">
                    Guardar Cambios
                </button>

                <div>
                    <h3 class="modal-perfil-history-title">Tus Últimos Pedidos</h3>
                    <div id="historial-lista"></div>
                </div>
            </div>
        </div>
    </div>

    <div id="modal-ajustes" class="modal-fullscreen">
        <div class="modal-content-wrapper">
            <div class="cart-header">
                <h2>Panel de Ajustes</h2>
                <button onclick="cerrarModal('modal-ajustes', 'nav-home')" aria-label="Cerrar ajustes"
                    class="modal-close-btn">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>
            
            <div class="settings-dashboard">
                <!-- Barra de Pestañas (Navegación Izquierda en PC, superior en móvil) -->
                <nav class="settings-nav-tabs">
                    <button type="button" class="settings-tab-btn active" onclick="cambiarPestanaConfig('config-general', this)">
                        <i class="fa-solid fa-sliders"></i> General
                    </button>

                    <button type="button" class="settings-tab-btn" onclick="cambiarPestanaConfig('config-legales', this)">
                        <i class="fa-solid fa-scale-balanced"></i> Soporte Legal
                    </button>
                </nav>
                
                <!-- Área de Contenido de Ajustes -->
                <div class="settings-content">
                    
                    <!-- Pestaña 1: General -->
                    <div id="config-general" class="settings-pane active">
                        <div class="settings-card">
                            <h3 class="settings-card-title"><i class="fa-solid fa-palette"></i> Aspecto & Estilo</h3>
                            <div class="settings-row">
                                <div class="settings-info">
                                    <span class="settings-label">Modo Oscuro</span>
                                    <span class="settings-desc">Cambia el contraste visual de la interfaz para entornos de poca luz.</span>
                                </div>
                                <label class="settings-switch-label">
                                    <input type="checkbox" id="toggleDarkMode" onchange="toggleDark()" aria-label="Modo oscuro">
                                    <span class="settings-slider">
                                        <i class="fa-solid fa-sun slider-icon icon-sun"></i>
                                        <i class="fa-solid fa-moon slider-icon icon-moon"></i>
                                    </span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="settings-card">
                            <h3 class="settings-card-title"><i class="fa-solid fa-filter"></i> Filtros de Catálogo</h3>
                            <div class="settings-row">
                                <div class="settings-info">
                                    <span class="settings-label">Ver Productos Agotados</span>
                                    <span class="settings-desc">Muestra los artículos sin inventario temporal en la lista general.</span>
                                </div>
                                <label class="settings-switch-label">
                                    <input type="checkbox" id="settingsAgotados" onchange="toggleAgotadosConfig(this)" aria-label="Ver agotados">
                                    <span class="settings-slider"></span>
                                </label>
                            </div>
                            
                            <div class="settings-row">
                                <div class="settings-info">
                                    <span class="settings-label">Vista de Compra Favorita</span>
                                    <span class="settings-desc">Configura tu visualización preferida para comprar artículos.</span>
                                </div>
                                <select id="settingsModoVista" class="input-select modal-ajustes-select" onchange="cambiarModoVistaConfig(this)" aria-label="Vista favorita">
                                    <option value="unidad">🍾 Por Unidad</option>
                                    <option value="caja">📦 Por Caja</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pestaña 3: Soporte Legal (Acordeones Integrados) -->
                    <div id="config-legales" class="settings-pane">
                        <div class="settings-card">
                            <h3 class="settings-card-title"><i class="fa-solid fa-shield-halved"></i> Políticas & Términos</h3>
                            <div class="settings-accordion modal-ajustes-accordion">
                                
                                <div class="accordion-item">
                                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                                        <span>1. Zonas de Delivery</span>
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                    <div class="accordion-content">
                                        <div class="accordion-body">
                                            Llegamos a gran parte de la ciudad de Barinas. Ciertas zonas periféricas pueden tener un recargo en el costo del reparto por distancia o seguridad. El costo final será indicado por el operador en WhatsApp.
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="accordion-item">
                                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                                        <span>2. Control de Edad Mínima</span>
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                    <div class="accordion-content">
                                        <div class="accordion-body">
                                            <strong>Prohibida la venta de bebidas alcohólicas a menores de 18 años.</strong> Gran Catador promueve el consumo responsable. Nuestro personal de reparto está autorizado y obligado a verificar la cédula de identidad del comprador al momento de la entrega física.
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="accordion-item">
                                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                                        <span>3. Garantías de Producto</span>
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                    <div class="accordion-content">
                                        <div class="accordion-body">
                                            Por favor, verifique el estado e integridad de los artículos al recibirlos. No se aceptan reclamos ni devoluciones sobre botellas abiertas, con sellos fiscales rotos o productos perecederos después de firmar la conformidad del despacho.
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="accordion-item">
                                    <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
                                        <span>4. Privacidad y Datos</span>
                                        <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                    <div class="accordion-content">
                                        <div class="accordion-body">
                                            Gran Catador respeta tu privacidad al 100%. Tus datos personales (nombre, cédula, teléfono y dirección) <strong>se almacenan exclusivamente de manera local</strong> en tu dispositivo mediante el navegador web (localStorage). Ninguna información es enviada a servidores de terceros ni procesada fuera de tus propios pedidos.
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                        
                        <div class="settings-card text-center">
                            <h3 class="settings-card-title"><i class="fa-solid fa-circle-question"></i> ¿Tienes Dudas?</h3>
                            <p class="modal-ajustes-support-desc">Ponte en contacto directo con nuestro equipo de atención y soporte al cliente en Barinas.</p>
                            <button type="button" class="btn-whatsapp-support" onclick="abrirSoporteWhatsApp()">
                                <i class="fa-brands fa-whatsapp"></i> Chatear con Soporte Técnico
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
        `;
    }
}
customElements.define('app-modals', AppModals);
