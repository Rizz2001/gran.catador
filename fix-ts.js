const fs = require('fs');
let content = fs.readFileSync('js/cart.ts', 'utf8');

// Fix implicit any params
content = content.replace(/function (\w+)\(([^)]+)\)/g, (match, p1, p2) => {
    let params = p2.split(',').map(p => {
        let name = p.trim();
        if (name && !name.includes(':') && !name.includes('=')) {
            return name + ': any';
        }
        return name;
    }).join(', ');
    return `function ${p1}(${params})`;
});

// Fix arrow functions with implicit any (x =>)
content = content.replace(/(\w+)\s*=>/g, "( $1: any ) =>");

// Fix HTMLInputElement value
content = content.replace(/document\.getElementById\(([^)]+)\)\.value/g, "(<HTMLInputElement>document.getElementById($1))?.value");

// Fix .style on generic Element
content = content.replace(/(\w+)\.style\.([a-zA-Z]+)/g, "(<HTMLElement>$1)?.style?.$2");

// Fix .disabled on generic Element
content = content.replace(/(\w+)\.disabled/g, "(<HTMLButtonElement>$1)?.disabled");

// Null checks
content = content.replace(/document\.getElementById\(([^)]+)\)\./g, "document.getElementById($1)?.");

// Fix safeGetItem string | null -> string
content = content.replace(/safeGetItem\(([^)]+)\)/g, "(safeGetItem($1) || '')");

// Export to fix isolatedModules
content += "\nexport {};\n";

fs.writeFileSync('js/cart.ts', content);
console.log("Fixed cart.ts");
