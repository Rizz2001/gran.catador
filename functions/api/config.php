<?php
/**
5:  * config.php - Configuración de Credenciales de Foxdata
6:  * Este archivo contiene las credenciales de la API de Foxdata para el proxy PHP.
7:  * Está protegido contra acceso web directo y debe excluirse de Git en .gitignore.
8:  */
9: if (!defined('SECURE_ACCESS')) {
10:     http_response_code(403);
11:     exit(json_encode(['error' => 'Acceso denegado. No está permitido el acceso directo a este archivo.']));
12: }
13: 
14: return [
15:     'client_id'     => 'smvt-apiweb-C0006',
16:     'client_secret' => 'i84so7BEzsUo',
17: ];
