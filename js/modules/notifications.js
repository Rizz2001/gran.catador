/**
 * SISTEMA DE NOTIFICACIONES PUSH WEB & DESCUENTOS — GRAN CATADOR
 */

// Inicializar OneSignal SDK v16
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function(OneSignal) {
  try {
    await OneSignal.init({
      appId: "ONESIGNAL_APP_ID_PLACEHOLDER",
      notifyButton: {
        enable: false
      },
      welcomeNotification: {
        title: "¡Bienvenido a Gran Catador! 🍾",
        message: "Recibirás nuestras mejores promociones y cupones de descuento exclusivos."
      }
    });

    if (OneSignal.Notifications) {
      OneSignal.Notifications.addEventListener("permissionChange", function(permission) {
        if (permission) {
          cerrarPromptNotificaciones();
          if (typeof window.mostrarToast === 'function') {
            window.mostrarToast("¡Suscrito a descuentos exclusivos!");
          }
        }
      });
    }
  } catch (err) {
    console.warn("OneSignal push init:", err);
  }
});

/**
 * Muestra el banner flotante de invitación a descuentos si aún no se ha otorgado permiso
 */
function inicializarBannerNotificaciones() {
  const yaRespondio = localStorage.getItem("gc_push_optin_asked");
  if (yaRespondio === "true") return;

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    return;
  }

  setTimeout(() => {
    crearBannerNotificacionesDOM();
  }, 4000);
}

/**
 * Crea la estructura HTML del banner glassmorphism de descuentos
 */
function crearBannerNotificacionesDOM() {
  if (document.getElementById("push-notifications-banner")) return;

  const banner = document.createElement("div");
  banner.id = "push-notifications-banner";
  banner.className = "push-banner-container";

  banner.innerHTML = `
    <div class="push-banner-content">
      <div class="push-banner-icon-wrap">
        <i class="fa-solid fa-bell push-bell-anim"></i>
        <span class="push-badge-dot"></span>
      </div>
      <div class="push-banner-text">
        <div class="push-banner-title">
          <span>✨ Club Catador Descuentos</span>
        </div>
        <p class="push-banner-desc">
          ¡Activa las notificaciones y recibe cupones de descuento, ofertas relámpago y regalos exclusivos en tu pantalla!
        </p>
      </div>
      <div class="push-banner-actions">
        <button type="button" class="btn-push-allow" onclick="solicitarPermisoNotificaciones()">
          <i class="fa-solid fa-check"></i> Activar
        </button>
        <button type="button" class="btn-push-dismiss" onclick="cerrarPromptNotificaciones()">
          Ahora no
        </button>
      </div>
    </div>
  `;

  const parentElem = document.body || document.documentElement;
  if (parentElem) parentElem.appendChild(banner);

  requestAnimationFrame(() => {
    banner.classList.add("show");
  });
}

/**
 * Solicita el permiso oficial de notificaciones al navegador / OneSignal
 */
async function solicitarPermisoNotificaciones() {
  localStorage.setItem("gc_push_optin_asked", "true");

  try {
    if (window.OneSignalDeferred && window.OneSignal) {
      await window.OneSignal.Notifications.requestPermission();
    } else if (typeof Notification !== "undefined" && Notification.requestPermission) {
      const res = await Notification.requestPermission();
      if (res === "granted" && typeof window.mostrarToast === 'function') {
        window.mostrarToast("¡Notificaciones activadas!");
      }
    }
  } catch (e) {
    console.warn("Permiso de notificaciones:", e);
  }

  cerrarPromptNotificaciones();
}

/**
 * Cierra el banner flotante
 */
function cerrarPromptNotificaciones() {
  const banner = document.getElementById("push-notifications-banner");
  if (banner) {
    banner.classList.remove("show");
    banner.classList.add("hide");
    setTimeout(() => banner.remove(), 400);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarBannerNotificaciones);
} else {
  inicializarBannerNotificaciones();
}

window.solicitarPermisoNotificaciones = solicitarPermisoNotificaciones;
window.cerrarPromptNotificaciones = cerrarPromptNotificaciones;
