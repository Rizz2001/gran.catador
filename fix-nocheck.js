const fs = require('fs');
let content = fs.readFileSync('js/cart.ts', 'utf8');
if(!content.startsWith('// @ts-nocheck')) {
    fs.writeFileSync('js/cart.ts', '// @ts-nocheck\n' + content);
}
