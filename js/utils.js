/**
 * utils.js - Funciones de utilidad general y configuración
 * Este archivo no debe contener lógica de negocio (carrito, inventario) 
 * ni manipulación directa del DOM (interfaz de usuario).
 */

// --- CONFIGURACIÓN ---
const diccionarioSinonimos = { 'birra': 'cerveza', 'curda': 'licor', 'cana': 'ron', 'pasapalo': 'snack', 'soda': 'refresco', 'fresco': 'refresco', 'chuche': 'snack', 'chucheria': 'snack', 'champagne': 'espumante', 'champaña': 'espumante', 'vinito': 'vino', 'roncito': 'ron', 'aguardiente': 'licor' };

// --- FUNCIONES DE TEXTO Y BÚSQUEDA ---
function limpiarCategoria(texto) { if (!texto) return "Otros"; return texto.trim().replace(/\s+/g, ' ').toUpperCase(); }
function quitarAcentos(texto) { return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function parseNumber(texto) { if (texto == null) return 0; let str = texto.toString().trim().replace(/\./g, '').replace(',', '.'); let num = parseFloat(str); return Number.isFinite(num) ? num : 0; }

// Determinar la carpeta principal según la categoría
function getCategoriaFolder(cat) {
    if (!cat) return 'otros';
    let c = cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (c.includes('LICOR') || c.includes('VINO') || c.includes('CERVEZA') || c.includes('RON') || c.includes('WHISKY') || c.includes('VODKA') || c.includes('GINEBRA') || c.includes('ANIS') || c.includes('TEQUILA') || c.includes('COCUY') || c.includes('AGUARDIENTE') || c.includes('COGNAC') || c.includes('BRANDY')) return 'licores';
    if (c.includes('SNACK') || c.includes('CHUCHERIA') || c.includes('ALIMENTO') || c.includes('PASAPALO') || c.includes('GALLETA') || c.includes('CHOCOLATE') || c.includes('DULCE')) return 'alimentos';
    if (c.includes('REFRESCO') || c.includes('AGUA') || c.includes('SODA') || c.includes('BEBIDA') || c.includes('MALTIN') || c.includes('MALTA') || c.includes('ENERGIZANTE')) return 'refrescos';
    if (c.includes('JUGO') || c.includes('NECTAR') || c.includes('FRUTA')) return 'jugos';
    return 'otros';
}

// Algoritmo de distancia de Levenshtein (para búsquedas con errores ortográficos)
function levenshtein(a, b) { const m = []; for (let i = 0; i <= b.length; i++)m[i] = [i]; for (let j = 0; j <= a.length; j++)m[0][j] = j; for (let i = 1; i <= b.length; i++) { for (let j = 1; j <= a.length; j++) { if (b.charAt(i - 1) === a.charAt(j - 1)) { m[i][j] = m[i - 1][j - 1]; } else { m[i][j] = Math.min(m[i - 1][j - 1] + 1, Math.min(m[i][j - 1] + 1, m[i - 1][j] + 1)); } } } return m[b.length][a.length]; }

// Cerebro para detectar plurales y sinónimos (Ej: rones -> ron, cervezas -> cerveza)
function procesarTermino(t) { let sin = diccionarioSinonimos[t] || t; if (sin.length > 3 && sin !== 'anis' && sin.endsWith('s')) { return sin.endsWith('es') ? sin.slice(0, -2) : sin.slice(0, -1); } return sin; }

// --- ENCODING / DECODING ---
function codificarNombre(str) { try { return btoa(unescape(encodeURIComponent(str))); } catch (e) { return btoa(str); } }
function decodificarNombre(b64) { try { return decodeURIComponent(escape(atob(b64))); } catch (e) { return atob(b64); } }

// --- REDES Y DOM HELPERS GENÉRICOS ---

function imgFallback(imgElement, codigoProducto, categoria) {
    let attempts = imgElement.dataset.attempts ? parseInt(imgElement.dataset.attempts) : 0; const formatos = ['webp', 'jpg', 'png', 'jpeg']; attempts++;
    let carpeta = getCategoriaFolder(categoria);
    if (attempts < formatos.length) { imgElement.dataset.attempts = attempts; imgElement.src = `assets/img/${carpeta}/${codigoProducto}.${formatos[attempts]}`; } else { imgElement.src = 'logo.png'; imgElement.onerror = null; }
}

function imgFallbackFolder(imgElement) {
    let attempts = imgElement.dataset.attempts ? parseInt(imgElement.dataset.attempts) : 0;
    let codigo = imgElement.dataset.codigo; let index = imgElement.dataset.index || "1";
    let categoria = imgElement.dataset.categoria || "otros";
    let carpeta = getCategoriaFolder(categoria);
    const formatos = ['webp', 'jpg', 'png', 'jpeg']; attempts++;
    if (attempts < formatos.length) {
        imgElement.dataset.attempts = attempts;
        imgElement.src = `assets/img/${carpeta}/${codigo}/${index}.${formatos[attempts]}`;
    } else {
        if (index === "1") { imgElement.src = 'logo.png'; } else { imgElement.style.display = 'none'; }
        imgElement.onerror = null;
    }
}