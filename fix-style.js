const fs = require('fs');
let content = fs.readFileSync('js/cart.ts', 'utf8');
content = content.replace(/\?\.style\?\./g, ".style.");
content = content.replace(/\)\?\.disabled =/g, ").disabled =");
fs.writeFileSync('js/cart.ts', content);
