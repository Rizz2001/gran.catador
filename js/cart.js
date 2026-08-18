"use strict";
function guardarCarritoLS() {
  safeSetItem("gc_cart", JSON.stringify(appState.carrito));
}
function calcularStockRestante(nombreBase) {
  const prodObj = appState.inventario.find((x) => x.Nombre === nombreBase);
  if (!prodObj) {
    return { prodObj: null, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja: 12 };
  }
  const stockDisponible = prodObj.StockNum;
  const unidadesPorCaja = prodObj.CantidadGrup && prodObj.CantidadGrup > 0 ? prodObj.CantidadGrup : 12;
  if (stockDisponible >= 999) {
    return { prodObj, stockDisponible: 999, unidadesEnCarrito: 0, unidadesRestantes: 999, unidadesPorCaja };
  }
  const cantUnidades = appState.carrito[`${nombreBase} (UNIDAD)`]?.cantidad || 0;
  const cantCajas = appState.carrito[`${nombreBase} (CAJA)`]?.cantidad || 0;
  const unidadesEnCarrito = cantUnidades + cantCajas * unidadesPorCaja;
  const unidadesRestantes = Math.max(0, stockDisponible - unidadesEnCarrito);
  return { prodObj, stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja };
}
function tieneStockSuficiente(nombreBase, esCaja) {
  const { prodObj, stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja } = calcularStockRestante(nombreBase);
  if (!prodObj) return true;
  if (stockDisponible >= 999) return true;
  const unidadesPorAgregar = esCaja ? unidadesPorCaja : 1;
  if (unidadesRestantes <= 0) {
    mostrarToastError(
      `\u{1F6AB} L\xEDmite de stock alcanzado`,
      `Solo hay <b>${stockDisponible}</b> unidad${stockDisponible !== 1 ? "es" : ""} y ya las tienes todas en el carrito.`
    );
    return false;
  }
  if (unidadesPorAgregar > unidadesRestantes) {
    if (esCaja) {
      mostrarToastError(
        `\u{1F4E6} Stock insuficiente para una caja`,
        `Solo quedan <b>${unidadesRestantes}</b> unidad${unidadesRestantes !== 1 ? "es" : ""} disponible${unidadesRestantes !== 1 ? "s" : ""}. Una caja requiere <b>${unidadesPorCaja}</b>.`
      );
    } else {
      mostrarToastError(
        `\u26A0\uFE0F Stock insuficiente`,
        `Solo quedan <b>${unidadesRestantes}</b> unidad${unidadesRestantes !== 1 ? "es" : ""} disponible${unidadesRestantes !== 1 ? "s" : ""}.`
      );
    }
    return false;
  }
  return true;
}
function mostrarToastError(titulo, detalle) {
  const cont = document.getElementById("toast-container");
  if (!cont) {
    mostrarToast(titulo);
    return;
  }
  const prev = cont.querySelector(".toast-error");
  if (prev) prev.remove();
  const t = document.createElement("div");
  t.className = "toast toast-error";
  t.style.cssText = [
    "background: linear-gradient(135deg, #ff4b4b, #c0392b)",
    "border-left: 4px solid #ff1a1a",
    "min-width: 240px",
    "padding: 12px 16px",
    "border-radius: 12px",
    "box-shadow: 0 8px 24px rgba(234,67,53,0.35)",
    "animation: toastSlideIn 0.3s ease"
  ].join(";");
  t.innerHTML = `
        <div style="font-size:13px;font-weight:800;margin-bottom:3px;">${titulo}</div>
        <div style="font-size:12px;opacity:0.9;line-height:1.4;">${detalle}</div>
    `;
  cont.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function animarAlCarrito(btnElement, imgSrc) {
  if (!btnElement || !imgSrc) return;
  let cartIcon = document.querySelector('.header-right .icon-btn[aria-label="Carrito"]');
  const navCart = document.getElementById("nav-cart");
  const bottomNav = document.querySelector(".bottom-nav");
  if (navCart && bottomNav && getComputedStyle(bottomNav).display !== "none") {
    cartIcon = navCart;
  }
  if (!cartIcon) return;
  const btnRect = btnElement.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();
  const flyingImg = document.createElement("img");
  flyingImg.src = imgSrc;
  flyingImg.className = "flying-img";
  flyingImg.style.left = `${btnRect.left}px`;
  flyingImg.style.top = `${btnRect.top}px`;
  document.body.appendChild(flyingImg);
  setTimeout(() => {
    flyingImg.style.left = `${cartRect.left + cartRect.width / 2 - 7.5}px`;
    flyingImg.style.top = `${cartRect.top + cartRect.height / 2 - 7.5}px`;
    flyingImg.style.width = "15px";
    flyingImg.style.height = "15px";
    flyingImg.style.opacity = "0.3";
  }, 10);
  setTimeout(() => {
    flyingImg.remove();
    cartIcon.style.transform = "scale(1.2)";
    setTimeout(() => cartIcon.style.transform = "scale(1)", 200);
  }, 600);
}
function agregarAlCarrito(nombre, precio, btnElement, isCross = false, imgSrc = "", esCaja = false) {
  try {
    let d = /* @__PURE__ */ new Date();
    let formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: false, timeZone: "America/Caracas" });
    let parts = formatter.format(d).split(":");
    let horaCaracas = parseInt(parts[0]);
    let minutoCaracas = parseInt(parts[1]);
    if (horaCaracas === 24) horaCaracas = 0;
    let isAbierto = horaCaracas >= 8 && horaCaracas < 20 || horaCaracas === 20 && minutoCaracas <= 30;
    if (!isAbierto) {
      mostrarToastError("Tienda Cerrada", "Lo sentimos, estamos fuera del horario laboral (8:00 AM - 8:30 PM).");
      return;
    }
  } catch (e) {
    if (typeof window.isTiendaAbierta !== "undefined" && window.isTiendaAbierta === false) {
      mostrarToastError("Tienda Cerrada", "Lo sentimos, estamos fuera del horario laboral (8:00 AM - 8:30 PM).");
      return;
    }
  }
  if (!tieneStockSuficiente(nombre, esCaja)) {
    return;
  }
  let nombreFinal = esCaja ? `${nombre} (CAJA)` : `${nombre} (UNIDAD)`;
  let prodObj = appState.inventario.find((x) => x.Nombre === nombre);
  if (appState.carrito[nombreFinal]) {
    appState.carrito[nombreFinal].cantidad++;
    appState.carrito[nombreFinal].subtotal = appState.carrito[nombreFinal].cantidad * appState.carrito[nombreFinal].precio;
  } else {
    appState.carrito[nombreFinal] = {
      precio,
      cantidad: 1,
      subtotal: precio,
      codigo: prodObj ? prodObj.codigo : "",
      categoria: prodObj ? prodObj.Grupo || prodObj.Subgrupo : "",
      esCaja
    };
  }
  guardarCarritoLS();
  actualizarCartCount();
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(50);
  }
  if (btnElement && imgSrc) {
    animarAlCarrito(btnElement, imgSrc);
  }
  if (btnElement) {
    let iconoOriginal = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="fa-solid fa-check"></i>';
    btnElement.style.background = "#fff";
    btnElement.style.color = "var(--verde-btn)";
    let parent = btnElement.parentElement;
    parent.style.position = "relative";
    let oldMsg = parent.querySelector(".cart-msg-toast");
    if (oldMsg) oldMsg.remove();
    let msgConf = document.createElement("div");
    msgConf.className = "cart-msg-toast";
    msgConf.innerText = "\xA1Agregado al carrito!";
    msgConf.style.position = "absolute";
    msgConf.style.background = "var(--color-success, #10B981)";
    msgConf.style.color = "white";
    msgConf.style.fontSize = "10px";
    msgConf.style.fontWeight = "700";
    msgConf.style.padding = "4px 8px";
    msgConf.style.borderRadius = "6px";
    msgConf.style.whiteSpace = "nowrap";
    msgConf.style.pointerEvents = "none";
    msgConf.style.zIndex = "100";
    msgConf.style.opacity = "0";
    msgConf.style.transform = "translateY(-5px)";
    msgConf.style.transition = "all 0.3s ease";
    msgConf.style.boxShadow = "var(--shadow-sm, 0 2px 4px rgba(0,0,0,0.1))";
    msgConf.style.right = "0";
    msgConf.style.top = btnElement.offsetTop + btnElement.offsetHeight + 6 + "px";
    parent.appendChild(msgConf);
    requestAnimationFrame(() => {
      msgConf.style.opacity = "1";
      msgConf.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      btnElement.innerHTML = iconoOriginal;
      btnElement.style.background = esCaja ? "var(--dorado)" : "var(--verde-btn)";
      btnElement.style.color = esCaja ? "black" : "#fff";
    }, 500);
    setTimeout(() => {
      msgConf.style.opacity = "0";
      msgConf.style.transform = "translateY(-5px)";
      setTimeout(() => msgConf.remove(), 300);
    }, 2e3);
  }
  if (!isCross && !esCaja && prodObj) {
    let catMayus = (prodObj.Cat || "").toUpperCase();
    let activadoresCrossSell = ["RON", "WHISKY", "VODKA", "GINEBRA", "LICOR", "TEQUILA"];
    if (activadoresCrossSell.some((keyword) => catMayus.includes(keyword))) {
      sugerirAcompa\u00F1ante();
    }
  }
}
function sugerirAcompa\u00F1ante() {
  let sugerencias = [];
  if (appState.codigosRecomendados && appState.codigosRecomendados.length > 0) {
    sugerencias = (appState.inventario || []).filter((p) => appState.codigosRecomendados.includes(p.codigo) && p.StockNum > 0).slice(0, 3);
  } else {
    sugerencias = (appState.inventario || []).filter((p) => (p.Nombre.includes("HIELO") || p.Nombre.includes("COLA") || p.Nombre.includes("REFRESCO")) && p.StockNum > 0).slice(0, 3);
  }
  if (sugerencias.length > 0) {
    let cont = document.getElementById("cross-sell-items");
    let modal = document.getElementById("modal-cross-sell");
    if (cont && modal) {
      cont.innerHTML = sugerencias.map((p) => {
        let nombreB64 = codificarNombre(p.Nombre);
        let imgSrc = obtenerImgProducto(p);
        let attempts = p.ImagenUrl ? 0 : 1;
        return `
                    <div style="min-width:130px; border:1px solid var(--color-border); border-radius:var(--radius-md); padding:12px; text-align:center; background:var(--color-card); box-shadow:var(--shadow-sm);">
                        <img loading="lazy" src="${imgSrc}" width="60" height="60" data-codigo="${p.codigo}" data-categoria="${p.Cat}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" style="height:60px; width:100%; object-fit:contain; margin-bottom:8px; mix-blend-mode:multiply;">
                        <p style="font-size:12px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--color-text); font-family:'Inter',sans-serif;">${p.Nombre}</p>
                        <p style="font-size:15px; color:var(--color-text); font-weight:700; font-family:'Inter',sans-serif; margin-top:2px;">$${p.PrecioStr}</p>
                        <button onclick="agregarAlCarritoB64('${nombreB64}', ${p.PrecioNum}, this, true, '${imgSrc}', false); cerrarCrossSell();" style="background:var(--color-primary); color:white; border:none; padding:8px; border-radius:var(--radius-full); font-size:12px; font-weight:700; width:100%; margin-top:8px; cursor:pointer; transition:0.2s;"><i class="fa-solid fa-plus"></i> A\xF1adir</button>
                    </div>`;
      }).join("");
      modal.style.display = "flex";
    }
  }
}
function cerrarCrossSell() {
  let modal = document.getElementById("modal-cross-sell");
  if (modal) modal.style.display = "none";
}
function actualizarCartCount() {
  let totalItems = 0;
  for (let key in appState.carrito) {
    totalItems += appState.carrito[key].cantidad;
  }
  const cartCountElem = document.getElementById("cart-count");
  if (cartCountElem) cartCountElem.innerText = totalItems.toString();
  const bottomCartCountElem = document.getElementById("bottom-cart-count");
  if (bottomCartCountElem) bottomCartCountElem.innerText = totalItems.toString();
}
function vaciarCarrito() {
  if (confirm("\xBFEst\xE1s seguro de vaciar tu pedido?")) {
    appState.carrito = {};
    guardarCarritoLS();
    actualizarCartCount();
    if (!window.location.href.includes("carrito")) {
      cerrarModal("modal-cart", "nav-home");
    } else {
      renderizarCarrito();
    }
    mostrarToast("Pedido vaciado");
  }
}
function abrirCarrito() {
  if (window.location.href.includes("carrito")) {
    renderizarCarrito();
    return;
  }
  window.location.href = "carrito/";
}
function repetirPedido(index) {
  let histStr = safeGetItem("gc_historial");
  let hist = histStr ? JSON.parse(histStr) : [];
  let ped = hist[index];
  if (!ped) return;
  appState.carrito = {};
  ped.items.forEach((i) => {
    appState.carrito[i.nombre] = { precio: i.precio, cantidad: i.cantidad, subtotal: i.precio * i.cantidad, codigo: i.codigo || "", categoria: i.categoria || "" };
  });
  guardarCarritoLS();
  actualizarCartCount();
  cerrarModal("modal-perfil", "nav-home");
  abrirCarrito();
  mostrarToast("Pedido cargado");
}
function renderizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  if (!lista) return;
  appState.totalCarrito = 0;
  appState.totalCarritoBs = 0;
  if (Object.keys(appState.carrito).length === 0) {
    lista.innerHTML = `
            <div class="cart-empty-state">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 20px;">
                    <path d="M5 7h14l-1.5 9h-11L5 7zm3.5-3h7l1 3h-9l1-3z" fill="currentColor" opacity="0.15"/>
                    <path d="M7 8h10l1 6H6l1-6zm2-4h4l.8 3H8.2L9 4z" fill="currentColor"/>
                </svg>
                <h3>Tu carrito est\xE1 vac\xEDo</h3>
                <p>Agrega tus favoritos y contin\xFAa tu pedido r\xE1pido por WhatsApp.</p>
                <button onclick="window.location.href='../index.html'" class="btn-checkout-primary">Volver a la tienda</button>
            </div>`;
    let checkoutSections2 = document.getElementById("checkout-sections");
    if (checkoutSections2) checkoutSections2.style.display = "none";
    return;
  }
  let checkoutSections = document.getElementById("checkout-sections");
  if (checkoutSections) checkoutSections.style.display = "block";
  let renderHTML = "";
  for (let nombre in appState.carrito) {
    let nombreB64 = codificarNombre(nombre);
    let item = appState.carrito[nombre];
    let subTotalItem = parseFloat((item.precio * item.cantidad).toFixed(2));
    let subTotalItemBs = parseFloat((subTotalItem * appState.tasaOficial).toFixed(2));
    appState.totalCarrito += subTotalItem;
    appState.totalCarritoBs += subTotalItemBs;
    let prodObj = appState.inventario.find((x) => x.codigo === item.codigo);
    let imgSrc = obtenerImgProducto(prodObj || { codigo: item.codigo });
    let attempts = prodObj && prodObj.ImagenUrl ? 0 : 1;
    let imgInnerHTML = item.codigo ? `<img loading="lazy" src="${imgSrc}" width="60" height="60" data-codigo="${item.codigo}" data-categoria="${item.categoria || ""}" data-index="1" data-attempts="${attempts}" onerror="imgFallbackFolder(this)" class="cart-item-img">` : `<div class="cart-item-img-placeholder"><i class="fa-solid fa-wine-bottle"></i></div>`;
    let imgHTML = `<div class="cart-item-image">${imgInnerHTML}</div>`;
    let btnMinus = '<i class="fa-solid fa-minus"></i>';
    const nombreBase = nombre.replace(/ \((CAJA|UNIDAD)\)$/, "");
    const esCajaItem = nombre.includes("(CAJA)");
    const { stockDisponible, unidadesEnCarrito, unidadesRestantes, unidadesPorCaja } = calcularStockRestante(nombreBase);
    const enLimite = stockDisponible < 999 && unidadesRestantes <= 0;
    const noAlcanzaOtraCaja = esCajaItem && stockDisponible < 999 && unidadesRestantes < unidadesPorCaja;
    const bloquearSumar = enLimite || noAlcanzaOtraCaja;
    let stockBadge = "";
    if (stockDisponible < 999) {
      if (unidadesRestantes <= 0) {
        stockBadge = `<span class="cart-stock-badge limit">\u{1F534} Stock m\xE1ximo en carrito</span>`;
      } else if (unidadesRestantes <= 3) {
        stockBadge = `<span class="cart-stock-badge warning">\u26A0\uFE0F Quedan ${unidadesRestantes} unid. disponibles</span>`;
      } else {
        stockBadge = `<span class="cart-stock-badge info">${stockDisponible} unid. en stock</span>`;
      }
    }
    let btnSumarAttrs = bloquearSumar ? `class="cart-btn cart-btn-disabled" disabled title="Stock agotado \u2014 no hay m\xE1s unidades disponibles"` : `class="cart-btn" onclick="cambiarCantB64('${nombreB64}', 1)"`;
    renderHTML += `
            <div class="cart-item">
                <div class="cart-item-left">
                    ${imgHTML}
                    <div class="cart-item-info">
                        <p class="cart-item-title">${nombre}</p>
                        <p class="cart-item-unit">$${item.precio.toFixed(2)} <span class="cart-item-price-bs">/ ${(item.precio * appState.tasaOficial).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</span></p>
                        ${stockBadge}
                    </div>
                </div>
                <div class="cart-item-right">
                    <div class="cart-item-total">$${subTotalItem.toFixed(2)}<br><span style="font-size:12px; color:var(--color-text-muted); font-weight:normal; display:block;">${subTotalItemBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs</span></div>
                    <div class="cart-controls" aria-label="Controles de cantidad">
                        <button type="button" class="cart-btn" onclick="cambiarCantB64('${nombreB64}', -1)">${btnMinus}</button>
                        <span class="cart-item-qty">${item.cantidad}</span>
                        <button type="button" ${btnSumarAttrs}><i class="fa-solid ${bloquearSumar ? "fa-lock" : "fa-plus"}"></i></button>
                    </div>
                    <button type="button" class="cart-item-delete" onclick="cambiarCantB64('${nombreB64}', -${item.cantidad})" aria-label="Eliminar ${nombre}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
  }
  lista.innerHTML = renderHTML;
  appState.totalCarrito = parseFloat(appState.totalCarrito.toFixed(2));
  appState.totalCarritoBs = parseFloat(appState.totalCarritoBs.toFixed(2));
  document.getElementById("totalUsdModal").innerText = `$${appState.totalCarrito.toFixed(2)}`;
  document.getElementById("totalBsModal").innerText = `${appState.totalCarritoBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
  calcularVuelto();
  setCheckoutStep(1);
}
function cambiarCant(n, delta) {
  if (delta > 0) {
    try {
      let d = /* @__PURE__ */ new Date();
      let formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "numeric", hour12: false, timeZone: "America/Caracas" });
      let parts = formatter.format(d).split(":");
      let horaCaracas = parseInt(parts[0]);
      let minutoCaracas = parseInt(parts[1]);
      if (horaCaracas === 24) horaCaracas = 0;
      let isAbierto = horaCaracas >= 8 && horaCaracas < 20 || horaCaracas === 20 && minutoCaracas <= 30;
      if (!isAbierto) {
        mostrarToastError("Tienda Cerrada", "Lo sentimos, estamos fuera del horario laboral (8:00 AM - 8:30 PM).");
        return;
      }
    } catch (e) {
      if (typeof window.isTiendaAbierta !== "undefined" && window.isTiendaAbierta === false) {
        mostrarToastError("Tienda Cerrada", "Lo sentimos, estamos fuera del horario laboral (8:00 AM - 8:30 PM).");
        return;
      }
    }
    const esCaja = n.includes("(CAJA)");
    const nombreBase = n.replace(/ \((CAJA|UNIDAD)\)$/, "");
    if (!tieneStockSuficiente(nombreBase, esCaja)) {
      renderizarCarrito();
      return;
    }
  }
  if (!appState.carrito[n]) return;
  appState.carrito[n].cantidad += delta;
  if (appState.carrito[n].cantidad <= 0) {
    delete appState.carrito[n];
  }
  guardarCarritoLS();
  actualizarCartCount();
  renderizarCarrito();
}
function toggleDireccion() {
  let inputMetodo = document.querySelector('input[name="metodoEntrega"]:checked');
  if (!inputMetodo) return;
  let met = inputMetodo.value;
  let dirInput = document.getElementById("direccionDelivery");
  let btnGeo = document.getElementById("btn-geo");
  let btnMap = document.getElementById("btnMap");
  if (met === "Delivery") {
    if (dirInput) dirInput.style.display = "block";
    if (btnGeo) btnGeo.style.display = "block";
    if (btnMap) btnMap.style.display = "none";
    if (dirInput && (safeGetItem("gc_direccion") || "") && !dirInput.value) {
      dirInput.value = safeGetItem("gc_direccion") || "";
    }
  } else {
    if (dirInput) dirInput.style.display = "none";
    if (btnGeo) btnGeo.style.display = "none";
    if (btnMap) btnMap.style.display = "block";
  }
}
function obtenerUbicacion(inputId = "direccionDelivery", btnId = "btn-geo") {
  if (navigator.geolocation) {
    let btn = document.getElementById(btnId);
    let originalHTML = btn ? btn.innerHTML : "";
    if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    navigator.geolocation.getCurrentPosition(function(pos) {
      let link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      let input = document.getElementById(inputId);
      if (input) input.value = (input.value ? input.value + " - " : "") + "\u{1F4CD} Ubicaci\xF3n GPS: " + link;
      if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-check" style="color: #10B981;"></i>';
        setTimeout(() => btn.innerHTML = originalHTML, 2e3);
      }
    }, function(err) {
      alert("\u26A0\uFE0F No pudimos obtener tu ubicaci\xF3n. Verifica que el GPS est\xE9 encendido y hayas dado permisos al navegador.");
      if (btn) btn.innerHTML = originalHTML;
    }, { timeout: 1e4, enableHighAccuracy: true });
  } else {
    alert("Tu navegador no soporta geolocalizaci\xF3n.");
  }
}
function abrirMapa() {
  window.open("https://maps.app.goo.gl/tgjTHzaRd8xPdNbb7", "_blank");
}
function actualizarMetodoPago() {
  let selectElem = document.getElementById("metodoPagoSelect");
  let radioElem = document.querySelector('input[name="metodoPago"]:checked');
  let val = radioElem ? radioElem.value : selectElem ? selectElem.value : "Efectivo";
  let boxE = document.getElementById("box-efectivo");
  if (boxE) boxE.style.display = val === "Efectivo" ? "block" : "none";
  let boxPm = document.getElementById("box-pagomovil");
  if (boxPm) boxPm.style.display = val === "Pago Movil" || val === "PagoMovil" ? "block" : "none";
  let boxZ = document.getElementById("box-zelle");
  if (boxZ) boxZ.style.display = val === "Zelle" ? "block" : "none";
}
function calcularVuelto() {
  let pago = parseFloat(document.getElementById("montoPago")?.value) || 0;
  let res = document.getElementById("res-vuelto");
  if (pago > 0 && pago > appState.totalCarrito) {
    let vUsd = parseFloat((pago - appState.totalCarrito).toFixed(2));
    let vBs = parseFloat((vUsd * appState.tasaOficial).toFixed(2));
    res.style.display = "block";
    res.style.color = "var(--verde-btn)";
    res.innerHTML = `Vuelto: $${vUsd.toFixed(2)} / ${vBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
  } else {
    res.style.display = "none";
  }
}
function enviarPedido() {
  if (Object.keys(appState.carrito).length === 0) return alert("Tu carrito est\xE1 vac\xEDo.");
  if (!appState.isTiendaAbierta) return alert("Lo sentimos, Gran Catador est\xE1 cerrado en este momento.");
  let nombreUser = (safeGetItem("gc_nombre") || "" || "").trim();
  let cedulaUser = (safeGetItem("gc_cedula") || "" || "").trim();
  let telefonoUser = (safeGetItem("gc_telefono") || "" || "").trim();
  if (!nombreUser || !cedulaUser || !telefonoUser) {
    alert("\u26A0\uFE0F Datos incompletos.\nPor favor, completa tu Nombre, C\xE9dula y Tel\xE9fono en tu perfil antes de hacer el pedido.");
    abrirPerfil();
    return;
  }
  let cedulaLimpia = cedulaUser.toUpperCase().replace(/\s/g, "");
  if (!/^[VEJGP]-?[\d\-]+$/.test(cedulaLimpia) && !/^[\d\-]+$/.test(cedulaLimpia)) {
    alert("\u26A0\uFE0F C\xE9dula inv\xE1lida.\nPor favor, verifica que tu C\xE9dula contenga n\xFAmeros v\xE1lidos (Ej: V-12345678).");
    abrirPerfil();
    return;
  }
  if (!/^[\+0-9\-\s]+$/.test(telefonoUser) || telefonoUser.replace(/[^0-9]/g, "").length < 10) {
    alert("\u26A0\uFE0F Tel\xE9fono inv\xE1lido.\nPor favor, ingresa un n\xFAmero de tel\xE9fono v\xE1lido (Ej: 0414-1234567).");
    abrirPerfil();
    return;
  }
  let historial = JSON.parse(safeGetItem("gc_historial") || "") || [];
  let fechaDate = /* @__PURE__ */ new Date();
  let fechaStr = fechaDate.toLocaleDateString("es-VE") + " - " + fechaDate.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  let nuevoPedido = {
    fecha: fechaStr,
    total: appState.totalCarrito,
    items: Object.keys(appState.carrito).map((k) => ({
      nombre: k,
      precio: appState.carrito[k].precio,
      cantidad: appState.carrito[k].cantidad,
      codigo: appState.carrito[k].codigo,
      categoria: appState.carrito[k].categoria
    }))
  };
  historial.unshift(nuevoPedido);
  if (historial.length > 5) historial.pop();
  safeSetItem("gc_historial", JSON.stringify(historial));
  let msg = `\u{1F525} *NUEVO PEDIDO - GRAN CATADOR* \u{1F525}

\u{1F464} *Cliente:* ${nombreUser}
\u{1FAAA} *C\xE9dula:* ${cedulaUser}
\u{1F4F1} *Tel\xE9fono:* ${telefonoUser}
--------------------------------
`;
  for (let nombre in appState.carrito) {
    let iconoProducto = nombre.includes("(CAJA)") ? "\u{1F4E6}" : "\u{1F37E}";
    msg += `${iconoProducto} ${appState.carrito[nombre].cantidad}x *${nombre}*
`;
  }
  msg += `--------------------------------
`;
  let entrega = document.querySelector('input[name="metodoEntrega"]:checked').value;
  msg += `\u{1F4E6} *Entrega:* ${entrega}
`;
  if (entrega === "Delivery") {
    let dir = document.getElementById("direccionDelivery")?.value.trim();
    if (!dir) return alert("Por favor, ingresa tu direcci\xF3n para el delivery.");
    msg += `\u{1F4CD} *Direcci\xF3n:* ${dir}
`;
    if (!(safeGetItem("gc_direccion") || "")) safeSetItem("gc_direccion", dir);
  }
  let notas = document.getElementById("notasPedido")?.value.trim();
  if (notas) msg += `\u{1F4DD} *Notas:* ${notas}
`;
  let selectMetodo = document.getElementById("metodoPagoSelect");
  let radioMetodo = document.querySelector('input[name="metodoPago"]:checked');
  let metodo = radioMetodo ? radioMetodo.value : selectMetodo ? selectMetodo.value : "Efectivo";
  msg += `\u{1F4B3} *M\xE9todo de Pago:* ${metodo}
`;
  if (metodo === "Efectivo") {
    let pago = parseFloat(document.getElementById("montoPago")?.value) || 0;
    if (pago > appState.totalCarrito) {
      msg += `\u{1F4B5} _Paga con $${pago.toFixed(2)}_
\u{1F7E2} _Requiere vuelto: $${(pago - appState.totalCarrito).toFixed(2)}_
`;
    }
  } else {
    if (metodo === "Pago Movil" || metodo === "PagoMovil") {
      let refPm = document.getElementById("refPagoMovil") ? document.getElementById("refPagoMovil")?.value.trim() : "";
      if (refPm) msg += `\u{1F9FE} *Referencia:* ${refPm}
`;
    } else if (metodo === "Zelle") {
      let refZelle = document.getElementById("refZelle") ? document.getElementById("refZelle")?.value.trim() : "";
      if (refZelle) msg += `\u{1F464} *Titular Zelle:* ${refZelle}
`;
    }
    msg += `\u{1F4CE} _[Capture adjunto en el siguiente mensaje]_
`;
  }
  msg += `
\u{1F4B0} *TOTAL A PAGAR: $${appState.totalCarrito.toFixed(2)}* / *${appState.totalCarritoBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs*
\u{1F4B1} _(Tasa BCV: ${appState.tasaOficial.toFixed(2)} Bs)_`;
  safeRemoveItem("gc_inv_time_v3");
  appState.carrito = {};
  guardarCarritoLS();
  actualizarCartCount();
  let whatsappUrl = `https://wa.me/584245496366?text=${encodeURIComponent(msg)}`;
  let win = window.open(whatsappUrl, "_blank");
  if (!win) {
    window.location.href = whatsappUrl;
  }
  let btnEnviar = document.getElementById("btn-whatsapp");
  if (!btnEnviar) return;
  let originalHTML = btnEnviar.innerHTML;
  btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando WhatsApp...';
  btnEnviar.classList.add("disabled");
  btnEnviar.disabled = true;
  setTimeout(() => {
    btnEnviar.innerHTML = originalHTML;
    btnEnviar.classList.remove("disabled");
    btnEnviar.disabled = false;
  }, 800);
}
function agregarAlCarritoB64(b64, p, btn, c = false, img = "", esCaja = false) {
  agregarAlCarrito(decodificarNombre(b64), p, btn, c, img, esCaja);
}
function cambiarCantB64(b64, d) {
  cambiarCant(decodificarNombre(b64), d);
}
function setCheckoutStep(step) {
  appState.checkoutStep = step;
  let step1Summary = document.getElementById("step-1-summary");
  let step2Delivery = document.getElementById("step-2-delivery");
  let step3Payment = document.getElementById("step-3-payment");
  let step4Confirm = document.getElementById("step-4-confirm");
  if (!step1Summary || !step2Delivery || !step3Payment || !step4Confirm) return;
  if (step === 3) {
    let radioEntrega = document.querySelector('input[name="metodoEntrega"]:checked');
    let metodoEntrega = radioEntrega ? radioEntrega.value : "Retiro";
    if (metodoEntrega === "Delivery") {
      let dir = document.getElementById("direccionDelivery");
      if (dir && !dir.value.trim()) {
        alert("Por favor, ingresa tu direcci\xF3n para el delivery antes de continuar.");
        appState.checkoutStep = 2;
        return;
      }
    }
  }
  step1Summary.style.display = "none";
  step2Delivery.style.display = "none";
  step3Payment.style.display = "none";
  step4Confirm.style.display = "none";
  if (step === 1) {
    step1Summary.style.display = "block";
  } else if (step === 2) {
    step2Delivery.style.display = "block";
  } else if (step === 3) {
    step3Payment.style.display = "block";
    let totalUsdEl3 = document.getElementById("totalUsdStep3");
    let totalBsEl3 = document.getElementById("totalBsStep3");
    if (totalUsdEl3) totalUsdEl3.innerText = document.getElementById("totalUsdModal")?.innerText || "";
    if (totalBsEl3) totalBsEl3.innerText = document.getElementById("totalBsModal")?.innerText || "";
  } else if (step === 4) {
    step4Confirm.style.display = "block";
    let totalUsdEl = document.getElementById("totalUsdModalFinal");
    let totalBsEl = document.getElementById("totalBsModalFinal");
    if (totalUsdEl) totalUsdEl.innerText = document.getElementById("totalUsdModal")?.innerText || "";
    if (totalBsEl) totalBsEl.innerText = document.getElementById("totalBsModal")?.innerText || "";
  }
  let layout = document.querySelector(".premium-cart-layout");
  if (layout) {
    if (step > 1) {
      layout.classList.add("checkout-active");
    } else {
      layout.classList.remove("checkout-active");
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  actualizarCartCount();
});
export {};
window.guardarCarritoLS = guardarCarritoLS;
window.calcularStockRestante = calcularStockRestante;
window.tieneStockSuficiente = tieneStockSuficiente;
window.mostrarToastError = mostrarToastError;
window.animarAlCarrito = animarAlCarrito;
window.agregarAlCarrito = agregarAlCarrito;
window.cerrarCrossSell = cerrarCrossSell;
window.actualizarCartCount = actualizarCartCount;
window.vaciarCarrito = vaciarCarrito;
window.abrirCarrito = abrirCarrito;
window.repetirPedido = repetirPedido;
window.renderizarCarrito = renderizarCarrito;
window.cambiarCant = cambiarCant;
window.toggleDireccion = toggleDireccion;
window.obtenerUbicacion = obtenerUbicacion;
window.abrirMapa = abrirMapa;
window.actualizarMetodoPago = actualizarMetodoPago;
window.calcularVuelto = calcularVuelto;
window.enviarPedido = enviarPedido;
window.agregarAlCarritoB64 = agregarAlCarritoB64;
window.cambiarCantB64 = cambiarCantB64;
window.setCheckoutStep = setCheckoutStep;
