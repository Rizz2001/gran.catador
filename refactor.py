import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Scripts
    if 'producto.html' in filepath:
        content = content.replace(
            '<script src="js/app.js"></script>',
            '''<!-- Componentes Web -->
    <script src="js/components/AppAgeGate.js"></script>
    <script src="js/components/AppHeader.js"></script>
    <script src="js/components/AppSidebar.js"></script>
    <script src="js/components/AppFooter.js"></script>
    <script src="js/components/AppModals.js"></script>
    <script src="js/components/AppBottomNav.js"></script>

    <script src="js/app.js"></script>'''
        )
    else:
        content = content.replace(
            '<script src="js/app.js" defer></script>',
            '''<!-- Componentes Web -->
    <script src="js/components/AppAgeGate.js" defer></script>
    <script src="js/components/AppHeader.js" defer></script>
    <script src="js/components/AppSidebar.js" defer></script>
    <script src="js/components/AppFooter.js" defer></script>
    <script src="js/components/AppModals.js" defer></script>
    <script src="js/components/AppBottomNav.js" defer></script>

    <script src="js/app.js" defer></script>'''
        )

    # 2. Age Gate
    content = re.sub(r'<div id="age-gate">.*?</div>\s*</div>', '<app-age-gate></app-age-gate>', content, flags=re.DOTALL)

    # 3. Header
    content = re.sub(r'<div class="header-top-bar marquee-container">.*?</header>', '<app-header></app-header>', content, flags=re.DOTALL)

    # 4. Sidebar
    # Sidebar can be a bit tricky. We look for <div id="sidebar-overlay"...> to </aside>
    # Wait, in producto.html there's no sidebar-overlay? Let's check.
    # Ah, in producto.html: <div id="sidebar-overlay" class="sidebar-overlay" onclick="closeSidebar()"></div> is there!
    # Let's replace both.
    content = re.sub(r'<div id="sidebar-overlay"[^>]*></div>', '', content)
    content = re.sub(r'<aside id="sidebar-menu".*?</aside>', '<app-sidebar></app-sidebar>', content, flags=re.DOTALL)

    # 5. Footer
    content = re.sub(r'<footer class="main-footer-new".*?</footer>', '<app-footer></app-footer>', content, flags=re.DOTALL)

    # 6. Modals (toast-container, modal-perfil, modal-ajustes)
    content = re.sub(r'<div id="toast-container"></div>\s*<div id="modal-perfil".*?<div id="modal-ajustes".*?</div>\s*</div>\s*</div>\s*</div>', '<app-modals></app-modals>', content, flags=re.DOTALL)
    
    # Alternatively for Modals, just match toast-container to the end of modal-ajustes
    content = re.sub(r'<div id="toast-container"></div>.*?<!-- Bottom Navigation', '<app-modals></app-modals>\n\n    <!-- Bottom Navigation', content, flags=re.DOTALL)

    # 7. Bottom Nav & Scroll top
    content = re.sub(r'<!-- Bottom Navigation \(Mobile Only\) -->.*?aria-label="Volver arriba">\s*<i class="fa-solid fa-chevron-up"></i>\s*</button>', '<app-bottom-nav></app-bottom-nav>', content, flags=re.DOTALL)


    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

files = [
    r'c:\Users\riizz\Desktop\seguimoscata\gran.catador\index.html',
    r'c:\Users\riizz\Desktop\seguimoscata\gran.catador\producto.html',
    r'c:\Users\riizz\Desktop\seguimoscata\gran.catador\carrito\index.html'
]

for file in files:
    process_file(file)
    print(f"Processed {file}")
