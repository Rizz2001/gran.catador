export async function onRequest(context) {
    const url = new URL(context.request.url);
    const productId = url.searchParams.get("id");

    // Si no hay id de producto, servir la página HTML original normalmente
    if (!productId) {
        return context.next();
    }

    const cleanedId = String(productId).trim();
    const origin = url.origin;
    const imageUrl = `${origin}/assets/img/productos/${cleanedId}.jpg`;
    const canonicalUrl = `${origin}/producto.html?id=${encodeURIComponent(cleanedId)}`;

    // Obtener la respuesta HTML original
    const response = await context.next();

    // Usar HTMLRewriter de Cloudflare para inyectar dinámicamente las meta etiquetas OpenGraph y Twitter
    return new HTMLRewriter()
        .on('title', {
            element(element) {
                element.setInnerContent(`Producto #${cleanedId} — Gran Catador Barinas`);
            }
        })
        .on('meta[property="og:title"]', {
            element(element) {
                element.setAttribute('content', `Producto #${cleanedId} | Gran Catador Barinas`);
            }
        })
        .on('meta[property="og:description"]', {
            element(element) {
                element.setAttribute('content', `Pide este producto con delivery a domicilio en Barinas a través de Gran Catador Supermercado y Bodegón.`);
            }
        })
        .on('meta[property="og:image"]', {
            element(element) {
                element.setAttribute('content', imageUrl);
            }
        })
        .on('meta[property="og:url"]', {
            element(element) {
                element.setAttribute('content', canonicalUrl);
            }
        })
        .on('meta[name="twitter:title"]', {
            element(element) {
                element.setAttribute('content', `Producto #${cleanedId} | Gran Catador Barinas`);
            }
        })
        .on('meta[name="twitter:description"]', {
            element(element) {
                element.setAttribute('content', `Disponible en Gran Catador Supermercado y Bodegón con delivery en Barinas.`);
            }
        })
        .on('meta[name="twitter:image"]', {
            element(element) {
                element.setAttribute('content', imageUrl);
            }
        })
        .transform(response);
}
