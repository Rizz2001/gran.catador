const fs = require('fs');
let content = fs.readFileSync('js/cart.ts', 'utf8');
const regex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
let match;
let exposes = '\n// Exponer funciones al scope global para que los botones en HTML funcionen\n';
while ((match = regex.exec(content)) !== null) {
    let fn = match[1];
    exposes += `(window as any).${fn} = ${fn};\n`;
}
fs.writeFileSync('js/cart.ts', content + exposes);
console.log("Funciones expuestas.");
