const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// --- 1. Generar manifest de imágenes de productos ---
const imgDir = path.join(ROOT, 'assets/img/productos');
const manifestPath = path.join(imgDir, 'manifest.json');

try {
    if (fs.existsSync(imgDir)) {
        const files = fs.readdirSync(imgDir);
        const codes = files
            .filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg') || f.toLowerCase().endsWith('.webp') || f.toLowerCase().endsWith('.png'))
            .map(f => f.replace(/\.(jpg|jpeg|webp|png)$/i, ''));
        
        fs.writeFileSync(manifestPath, JSON.stringify(codes));
        console.log(`[Manifest] Generado exitosamente. ${codes.length} imágenes indexadas.`);
    }
} catch (error) {
    console.error('[Manifest Error]', error);
}

// --- 2. Copiar TODO el proyecto al dist (excluyendo lo innecesario) ---
const EXCLUDE = new Set([
    'node_modules', '.git', 'dist', 'scripts', '.gitignore', 
    'package.json', 'package-lock.json', 'vite.config.mjs', 'vite.config.js',
    'tsconfig.json', '.vscode', '.nvmrc', '.agents', 'functions'
]);

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;

    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        // Crear directorio padre si no existe
        const parentDir = path.dirname(dest);
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

// Limpiar dist
if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
}
fs.mkdirSync(DIST, { recursive: true });

// Copiar archivos
const entries = fs.readdirSync(ROOT);
let totalFiles = 0;

for (const entry of entries) {
    if (EXCLUDE.has(entry)) continue;
    const srcPath = path.join(ROOT, entry);
    const destPath = path.join(DIST, entry);
    copyRecursive(srcPath, destPath);
    totalFiles++;
}

console.log(`[Build] Copiados ${totalFiles} elementos al directorio dist/`);
console.log('[Build] ¡Build completado exitosamente!');
