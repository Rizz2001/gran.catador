import re
import os

files = [
    r'c:\Users\riizz\Desktop\seguimoscata\gran.catador\index.html',
    r'c:\Users\riizz\Desktop\seguimoscata\gran.catador\producto.html',
    r'c:\Users\riizz\Desktop\seguimoscata\gran.catador\carrito\index.html'
]

component_block = '''    <!-- Componentes Web -->
    <script src="js/components/AppAgeGate.js" defer></script>
    <script src="js/components/AppHeader.js" defer></script>
    <script src="js/components/AppSidebar.js" defer></script>
    <script src="js/components/AppFooter.js" defer></script>
    <script src="js/components/AppModals.js" defer></script>
    <script src="js/components/AppBottomNav.js" defer></script>'''

component_block_no_defer = '''    <!-- Componentes Web -->
    <script src="js/components/AppAgeGate.js"></script>
    <script src="js/components/AppHeader.js"></script>
    <script src="js/components/AppSidebar.js"></script>
    <script src="js/components/AppFooter.js"></script>
    <script src="js/components/AppModals.js"></script>
    <script src="js/components/AppBottomNav.js"></script>'''

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the existing component block
    # It might have defer or not. Let's use regex to remove it safely.
    pattern = r'[ \t]*<!-- Componentes Web -->.*?<script src="js/components/AppBottomNav\.js"(?: defer)?></script>\n'
    content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Insert it right before PapaParse or before the first config script
    if 'producto.html' in filepath:
        # producto.html might not have papaparse, let's look for js/utils.js or js/config
        target = '<script src="js/utils.js'
        if target in content:
            content = content.replace(target, component_block_no_defer + '\n\n    ' + target)
        else:
            # fallback
            target = '<script src="js/app.js'
            content = content.replace(target, component_block_no_defer + '\n\n    ' + target)
    else:
        target = '<script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse'
        if target in content:
            content = content.replace(target, component_block + '\n\n    ' + target)
        else:
            target = '<script src="js/utils.js'
            content = content.replace(target, component_block + '\n\n    ' + target)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed scripts order in {filepath}")

