from pathlib import Path
import re

root = Path('.')
patterns = {
    'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú', 'Ã±': 'ñ', 'Ã': 'Á', 'Ã‰': 'É', 'Ã“': 'Ó', 'Ãš': 'Ú', 'Ã‘': 'Ñ', 'Ã¼': 'ü',
    'Â¿': '¿', 'Â¡': '¡', 'Â©': '©', 'â€“': '–', 'â€”': '—', 'â€œ': '“', 'â€�': '”', 'â€˜': '‘', 'â€™': '’',
    'MÃ³dulos': 'Módulos', 'extraÃ­dos': 'extraídos', 'MenÃº': 'Menú', 'bÃºsqueda': 'búsqueda', 'AÃ±o': 'Año',
    'AÃ±adir': 'Añadir', 'MÃ©todo': 'Método', 'Pago MÃ³vil': 'Pago Móvil', 'DirecciÃ³n': 'Dirección',
    'TelÃ©fono': 'Teléfono', 'PolÃ­ticas': 'Políticas', 'TÃ©cnico': 'Técnico', 'CÃ©dula': 'Cédula',
    'dÃ­as': 'días', 'estÃ¡': 'está', 'guardarÃ¡n': 'guardarían' if False else 'guardarán',
    'catÃ¡logo': 'catálogo', 'informaciÃ³n': 'información', 'opciÃ³n': 'opción', 'accesos RÃ¡pidos': 'Accesos Rápidos',
    'botÃ³n': 'botón', 'pÃ­ldoras': 'píldoras', 'relaciÃ³n': 'relación', 'secciÃ³n': 'sección', 'encabezado': 'encabezado',
    'AÃ±o': 'Año', 'sÃ³lo': 'sólo', 'estado e integridad': 'estado e integridad',
    'atenciÃ³n': 'atención', 'artÃ­culos': 'artículos', 'cÃ¡lculo': 'cálculo', 'pÃ¡gina': 'página',
    'Cargar mÃ¡s': 'Cargar más', 'accesos RÃ¡pidos': 'Accesos Rápidos', 'QuizaÃ­s': 'Quizás',
    'MÃ©todo de Pago': 'Método de Pago', 'Pago MÃ³vil': 'Pago Móvil', 'DirecciÃ³n de Delivery': 'Dirección de Delivery',
    'CÃ³dula': 'Cédula', 'Ã³ptimo': 'óptimo', 'comunicación': 'comunicación'
}
emoji_map = {
    'ðŸ•’': '🔥', 'ðŸª': '🏪', 'ðŸ›µ': '🛵', 'ðŸ’µ': '💵', 'ðŸ“±': '📱', 'ðŸŸ£': '💳', 'ðŸ¾': '📦', 'ðŸ“¦': '📦',
    'ðŸ’ª': '🛍️', 'ðŸ½': '🏬', 'ðŸ’£': '💸'
}
patterns.update(emoji_map)

# Additional cleanup for common mojibake sequences
patterns.update({
    'Â ': ' ', 'Â': '',
})

exclusions = ['.git', 'node_modules']
files = list(root.rglob('*'))
for file in files:
    if file.is_file() and file.suffix.lower() in {'.html', '.htm', '.css', '.js', '.php', '.txt', '.json'}:
        try:
            content = file.read_text(encoding='utf-8')
        except Exception:
            continue
        new_content = content
        for bad, good in patterns.items():
            new_content = new_content.replace(bad, good)
        if new_content != content:
            file.write_text(new_content, encoding='utf-8')
            print(f'fixed: {file}')
