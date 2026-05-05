<?php
/**
 * get_inventario.php - Bridge entre MySQL y el catálogo (Frontend)
 * Este archivo debe estar en una carpeta llamada 'functions/api' en la raíz.
 */

header('Content-Type: application/json');
// Seguridad: Restringir CORS al dominio real
header('Access-Control-Allow-Origin: https://grancatador.com'); 

// 1. Leer las credenciales desde el archivo JSON (Ruta acomodada a ../../)
$settingsPath = '../../data/config/settings.json';
if (!file_exists($settingsPath)) {
    echo json_encode(["error" => "No se encontró el archivo de configuración en $settingsPath"]);
    exit;
}

$settings = json_decode(file_get_contents($settingsPath), true);

if (!$settings || !isset($settings['db_host'])) {
    echo json_encode(["error" => "Configuración inválida."]);
    exit;
}

$host = $settings['db_host'];
$db   = $settings['db_name'];
$user = $settings['db_user'];
$pass = $settings['db_pass'];
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

// 2. Determinar qué datos enviar
$task = isset($_GET['task']) ? $_GET['task'] : 'inventario';

if ($task === 'config') {
    // Ejemplo para cargar tabla de configuración
    $stmt = $pdo->query("SELECT clave, valor FROM configuracion");
    $data = $stmt->fetchAll();
    echo json_encode($data);
} else {
    // Cargar inventario
    $stmt = $pdo->query("SELECT codigo, nombre, categoria, precio_usd, precio_bs, precio_caja_usd, precio_caja_bs, stock FROM inventario");
    $data = $stmt->fetchAll();
    echo json_encode($data);
}
?>