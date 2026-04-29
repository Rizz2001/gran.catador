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

// ─────────────────────────────────────────────────────────────────────────────
// ÍNDICE INVERTIDO DE BÚSQUEDA
// Se construye UNA sola vez cuando el inventario cambia.
// Permite buscar en O(k) en vez de O(n) con Levenshtein en cada tecla.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {Map<string, Set<string>>} token → Set de códigos de producto */
let _searchIndex = new Map();

/** @type {number} Número de productos al momento de construir el índice */
let _searchIndexVersion = 0;

/**
 * Tokeniza un texto: normaliza, quita acentos y genera prefijos (≥3 chars).
 * @param {string} texto
 * @returns {string[]}
 */
function tokenizar(texto) {
    if (!texto) return [];
    let base = quitarAcentos(texto.toString());
    let palabras = base.split(/\s+/).filter(w => w.length >= 2);
    let tokens = new Set();
    palabras.forEach(w => {
        tokens.add(w); // Palabra completa
        for (let i = 3; i < w.length; i++) tokens.add(w.slice(0, i)); // Prefijos

        // Versión sin caracteres especiales (ej: "0.70L" o "0,70" -> "070l")
        let alphaNum = w.replace(/[^a-z0-9]/g, '');
        if (alphaNum !== w && alphaNum.length >= 2) {
            tokens.add(alphaNum);
            for (let i = 3; i < alphaNum.length; i++) tokens.add(alphaNum.slice(0, i));
        }
    });
    return Array.from(tokens);
}

/**
 * (Re)construye el índice invertido a partir del inventario.
 * Solo reconstruye si el número de productos cambió.
 * @param {Array} lista - Array de productos del inventario
 */
function buildSearchIndex(lista) {
    if (!lista || lista.length === 0) return;
    if (lista.length === _searchIndexVersion) return;

    const nuevoIndice = new Map();
    lista.forEach(p => {
        const texto = (p.TextoBusquedaLimpio || '') + ' ' +
            quitarAcentos(p.Cat || '') + ' ' +
            quitarAcentos(p.SubCat || '');

        const tokens = tokenizar(texto);

        // Agregar siempre el código del producto para permitir escaneo con lectores de barras
        if (p.codigo) {
            tokens.push(quitarAcentos(p.codigo.toString().trim()));
        }

        tokens.forEach(token => {
            if (!nuevoIndice.has(token)) nuevoIndice.set(token, new Set());
            nuevoIndice.get(token).add(p.codigo);
        });
    });

    _searchIndex = nuevoIndice;
    _searchIndexVersion = lista.length;
}

/**
 * Busca productos usando el índice invertido (rápido) con fallback fuzzy.
 * @param {string} query - Consulta normalizada del usuario
 * @param {Array} inventario - Array completo de productos
 * @returns {{ producto: Object, score: number }[]} Resultados ordenados por score
 */
function searchWithIndex(query, inventario) {
    if (!query || inventario.length === 0) return [];

    buildSearchIndex(inventario);

    const terms = quitarAcentos(query).split(/\s+/).filter(t => t.length > 0).map(procesarTermino);
    if (terms.length === 0) return [];

    // ── FASE 1: Búsqueda por índice (exacta + prefijo) ────────────────────────
    let codigosResultado = null;

    terms.forEach(term => {
        let codigosTerm = new Set();

        if (_searchIndex.has(term)) {
            _searchIndex.get(term).forEach(c => codigosTerm.add(c));
        }

        // Si no hay coincidencia exacta, buscar tokens del índice que empiecen por el término
        if (codigosTerm.size === 0 && term.length >= 2) {
            _searchIndex.forEach((codigos, token) => {
                if (token.startsWith(term)) codigos.forEach(c => codigosTerm.add(c));
            });
        }

        // Intersección: resultado debe satisfacer TODOS los términos
        if (codigosResultado === null) {
            codigosResultado = codigosTerm;
        } else {
            codigosResultado = new Set([...codigosResultado].filter(c => codigosTerm.has(c)));
        }
    });

    // ── FASE 2: Calcular score si hay resultados del índice ───────────────────
    if (codigosResultado && codigosResultado.size > 0) {
        const mapa = new Map(inventario.map(p => [p.codigo, p]));
        const resultados = [];

        codigosResultado.forEach(codigo => {
            const p = mapa.get(codigo);
            if (!p) return;
            let score = 0;
            const nombreLimpio = quitarAcentos(p.Nombre);
            const wordsNombre = nombreLimpio.split(/\s+/).flatMap(w => {
                let an = w.replace(/[^a-z0-9]/g, '');
                return an !== w ? [w, an] : [w];
            });
            const pCodigoLimpio = p.codigo ? quitarAcentos(p.codigo.toString().trim()) : "";

            terms.forEach(term => {
                // Mayor puntaje si coincide exactamente con el código de barras/producto
                if (term === pCodigoLimpio) score += 100;
                else if (wordsNombre.includes(term)) score += 50;
                else if (nombreLimpio.includes(term)) score += 25;
                else score += 10;
            });
            resultados.push({ producto: p, score });
        });

        return resultados.sort((a, b) => b.score - a.score);
    }

    // ── FASE 3: Fallback fuzzy (Levenshtein) — solo si el índice no dio nada ─
    if (terms.some(t => t.length >= 4)) {
        const resultadosFuzzy = [];

        inventario.forEach(p => {
            const textoCompleto = (p.TextoBusquedaLimpio || '') + ' ' +
                quitarAcentos(p.Cat || '') + ' ' +
                quitarAcentos(p.SubCat || '');
            const words = textoCompleto.split(/\s+/).flatMap(w => {
                let an = w.replace(/[^a-z0-9]/g, '');
                return an !== w ? [w, an] : [w];
            });
            const nombreLimpio = quitarAcentos(p.Nombre);
            const wordsNombre = nombreLimpio.split(/\s+/).flatMap(w => {
                let an = w.replace(/[^a-z0-9]/g, '');
                return an !== w ? [w, an] : [w];
            });
            let score = 0;

            const coincide = terms.every(term => {
                if (term.length < 4) {
                    if (words.some(w => w === term || w.startsWith(term))) {
                        score += 5;
                        return true;
                    }
                    return false;
                }
                const maxDist = term.length >= 6 ? 2 : 1;
                if (words.some(w => levenshtein(term, w) <= maxDist)) {
                    score += wordsNombre.some(w => levenshtein(term, w) <= maxDist) ? 15 : 5;
                    return true;
                }
                return false;
            });

            if (coincide) resultadosFuzzy.push({ producto: p, score });
        });

        return resultadosFuzzy.sort((a, b) => b.score - a.score);
    }

    return [];
}

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