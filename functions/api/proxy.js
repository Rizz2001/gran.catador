export async function onRequest(context) {
    // 1. Cabeceras CORS: Esto es lo que abre la puerta para que tu Live Server (127.0.0.1) pueda leer los datos
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // Respondemos rápido si el navegador solo está verificando permisos (Preflight OPTIONS)
    if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Determinar qué endpoint quiere consultar la app (gruposinv o articulos) o una imagen (imagePath)
        const requestUrl = new URL(context.request.url);
        const endpoint = requestUrl.searchParams.get("endpoint") || "gruposinv";
        const imagePath = requestUrl.searchParams.get("imagePath");

        let urlFoxdata = "";

        if (imagePath) {
            urlFoxdata = `https://apismartventas.foxdata.app${imagePath}`;
        } else {
            urlFoxdata = `https://apismartventas.foxdata.app/api/v1/syn/${endpoint}`;

            // Pasar los parámetros extras de la URL original a Foxdata (como codSubgrupo)
            const params = new URLSearchParams(requestUrl.searchParams);
            params.delete("endpoint");
            const extraQuery = params.toString();
            if (extraQuery) {
                urlFoxdata += (urlFoxdata.includes("?") ? "&" : "?") + extraQuery;
            }
        }

        // 2. OBTENER UN TOKEN FRESCO (Para que nunca expire)
        const authUrl = "https://auth.foxdata.app/connect/token";
        const credenciales = new URLSearchParams({
            'grant_type': 'client_credentials',
            'client_id': context.env.FOXDATA_CLIENT_ID,
            'client_secret': context.env.FOXDATA_CLIENT_SECRET,
            'scope': 'smartventas-api smartventas.service.read smartventas.service.write'
        });

        const tokenResponse = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: credenciales
        });

        const tokenData = await tokenResponse.json();
        const tokenFresco = tokenData.access_token; // Aquí Cloudflare atrapa tu token automáticamente

        // 3. CONSULTAR EL INVENTARIO O IMAGEN CON EL TOKEN FRESCO
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenFresco}`
            }
        };

        if (!imagePath) {
            fetchOptions.headers['Content-Type'] = 'application/json';
        }

        const apiResponse = await fetch(urlFoxdata, fetchOptions);

        if (imagePath) {
            // Si es una imagen, devolver la respuesta binaria directamente
            return new Response(apiResponse.body, {
                status: apiResponse.status,
                headers: {
                    'Content-Type': apiResponse.headers.get('Content-Type') || 'image/jpeg',
                    ...corsHeaders
                }
            });
        }

        const responseData = await apiResponse.json();

        // 4. DEVOLVER LOS DATOS A TU PÁGINA WEB (Con la puerta CORS abierta)
        return new Response(JSON.stringify(responseData), {
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });

    } catch (error) {
        // Si algo falla, te avisará en la consola sin bloquearte por CORS
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}