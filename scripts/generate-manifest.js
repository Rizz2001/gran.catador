const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '../assets/img/productos');
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
    console.error('[Manifest Error] Error al generar el manifest de imágenes:', error);
}
