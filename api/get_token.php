<?php
/**
 * get_token.php - Puente seguro para obtener el token de acceso a la API
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Ajustar por seguridad según sea necesario

// 1. Credenciales de la API SmartVentas
$tokenUrl = 'https://apismartventas.foxdata.app/connect/token';
$client_id = 'smvt-apiweb-C0006';
$client_secret = 'i84so7BEzsUo';
$scope = 'smartventas-api smartventas.service.read smartventas.service.write';

// 2. Preparar la solicitud cURL hacia la API externa
$postData = http_build_query([
    'grant_type' => 'client_credentials',
    'client_id' => $client_id,
    'client_secret' => $client_secret,
    'scope' => $scope
]);

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(["error" => "Error de conexión en el servidor: " . curl_error($ch)]);
} else {
    echo $response;
}

curl_close($ch);
?>