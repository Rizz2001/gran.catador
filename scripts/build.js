const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// --- 0. Compilar TypeScript a JavaScript automáticamente ---
try {
    const tsFiles = ['js/cart.ts', 'js/state.ts'];
    for (const tsFile of tsFiles) {
        const fullPath = path.join(ROOT, tsFile);
        if (fs.existsSync(fullPath)) {
            const outPath = fullPath.replace(/\.ts$/, '.js');
            execSync(`npx esbuild "${fullPath}" --outfile="${outPath}" --format=iife --bundle=false`, { stdio: 'inherit' });
            // Ensure no trailing export statement exists
            let content = fs.readFileSync(outPath, 'utf8');
            if (content.includes('export {')) {
                content = content.replace(/export\s*\{[^}]*\};?/g, '');
                fs.writeFileSync(outPath, content, 'utf8');
            }
        }
    }
    console.log('[TS Compiler] Archivos TypeScript compilados a JavaScript correctamente.');
} catch (error) {
    console.warn('[TS Compiler Warning] No se pudo ejecutar esbuild automático, usando JS existente.', error.message);
}

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
    if (src.endsWith('.ts')) return; // No copiar archivos TypeScript a producción

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
