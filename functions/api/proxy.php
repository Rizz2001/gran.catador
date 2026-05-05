<?php
/**
 * proxy.php - Proxy Universal en PHP (Alternativa a proxy.js de Cloudflare)
 * Úsalo solo si vas a alojar la página en un servidor cPanel, Hostinger o XAMPP.
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Atrapa cualquier endpoint dinámico (grupos, subgrupos, artículos) o una ruta de imagen (imagePath)
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : 'gruposinv';
$imagePath = isset($_GET['imagePath']) ? $_GET['imagePath'] : null;

if ($imagePath) {
    $urlFoxdata = 'https://apismartventas.foxdata.app' . $imagePath;
} else {
    $urlFoxdata = 'https://apismartventas.foxdata.app/api/v1/syn/' . $endpoint;
    
    // Redirigir cualquier parámetro extra (como codSubgrupo) hacia la API destino
    $queryParams = $_GET;
    unset($queryParams['endpoint']);
    if (!empty($queryParams)) {
        $separator = strpos($urlFoxdata, '?') !== false ? '&' : '?';
        $urlFoxdata .= $separator . http_build_query($queryParams);
    }
}

// 1. OBTENER UN TOKEN FRESCO
$tokenUrl = 'https://auth.foxdata.app/connect/token';
$body = [
    'grant_type'    => 'client_credentials',
    'client_id'     => 'smvt-apiweb-C0006',
    'client_secret' => 'i84so7BEzsUo',
    'scope'         => 'smartventas-api smartventas.service.read smartventas.service.write'
];

$chToken = curl_init($tokenUrl);
curl_setopt($chToken, CURLOPT_RETURNTRANSFER, true);
curl_setopt($chToken, CURLOPT_POST, true);
curl_setopt($chToken, CURLOPT_POSTFIELDS, http_build_query($body));
curl_setopt($chToken, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($chToken, CURLOPT_SSL_VERIFYPEER, true);
$tokenResponse = curl_exec($chToken);
curl_close($chToken);

$tokenData = json_decode($tokenResponse, true);
$tokenFresco = isset($tokenData['access_token']) ? $tokenData['access_token'] : '';

// 2. CONSULTAR EL ENDPOINT O IMAGEN SOLICITADA
$chApi = curl_init($urlFoxdata);
curl_setopt($chApi, CURLOPT_RETURNTRANSFER, true);

if ($imagePath) {
    // Para imágenes no enviamos Content-Type: application/json
    curl_setopt($chApi, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $tokenFresco]);
} else {
    curl_setopt($chApi, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $tokenFresco, 'Content-Type: application/json']);
}

curl_setopt($chApi, CURLOPT_SSL_VERIFYPEER, true);
$apiResponse = curl_exec($chApi);
$httpCode = curl_getinfo($chApi, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($chApi, CURLINFO_CONTENT_TYPE);
curl_close($chApi);

if ($imagePath) {
    header('Content-Type: ' . $contentType);
}

http_response_code($httpCode);
echo $apiResponse;
?>