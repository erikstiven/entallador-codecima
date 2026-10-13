<?php
/**
 * CimaTex Central API
 * Endpoint central de Autenticación, Salud y Sincronización en Hostinger
 */

// ── Cabeceras CORS y JSON ───────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Conexión a Base de Datos MySQL ──────────────────────────────────────────
$dbHost = '127.0.0.1';
$dbName = 'u836650900_cimatex';
$dbUser = 'u836650900_cimatex';
$dbPass = 'Nasa4036@';

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Error al conectar con la base de datos central: ' . $e->getMessage()
    ]);
    exit();
}

// ── Enrutamiento Básico ─────────────────────────────────────────────────────
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$route = $_GET['route'] ?? '';
if (!$route) {
    $route = preg_replace('#^.*?/api/?#', '', $requestUri);
}
$route = trim($route, '/');
if ($route === 'index.php') {
    $route = 'health';
}
$method = $_SERVER['REQUEST_METHOD'];

// Helper para UUID v4
function generateUuid() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// ── 1. Endpoint: GET /api/health ───────────────────────────────────────────
if ($route === 'health' || $route === '') {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) AS total_users FROM cimatex_users");
        $userCount = $stmt->fetch()['total_users'];

        echo json_encode([
            'status'     => 'ok',
            'service'    => 'CimaTex API Core',
            'version'    => '2.4.0',
            'database'   => 'connected',
            'db_name'    => $dbName,
            'users_registered' => (int)$userCount,
            'server_time' => date('c'),
        ]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        exit();
    }
}

// ── 2. Endpoint: POST /api/auth/google ──────────────────────────────────────
if (($route === 'auth/google' || $route === 'auth_google') && $method === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: [];

    // Extraer datos del payload
    $email = trim($input['email'] ?? $input['profile']['email'] ?? '');
    $fullName = trim($input['name'] ?? $input['fullName'] ?? $input['profile']['name'] ?? '');
    $googleId = trim($input['googleId'] ?? $input['sub'] ?? $input['profile']['id'] ?? '');
    $avatarUrl = trim($input['picture'] ?? $input['avatarUrl'] ?? $input['profile']['picture'] ?? '');

    // Si viene token JWT de Google Credential, decodificar el payload
    if (!$email && !empty($input['credential'])) {
        $parts = explode('.', $input['credential']);
        if (count($parts) === 3) {
            $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
            if (!empty($payload['email'])) {
                $email = $payload['email'];
                $fullName = $payload['name'] ?? $fullName;
                $googleId = $payload['sub'] ?? $googleId;
                $avatarUrl = $payload['picture'] ?? $avatarUrl;
            }
        }
    }

    if (empty($email)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error'   => 'El correo electrónico es requerido para el registro.'
        ]);
        exit();
    }

    try {
        // Verificar si el usuario ya existe
        $stmt = $pdo->prepare("SELECT * FROM cimatex_users WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $existingUser = $stmt->fetch();

        $userId = '';
        $plan = 'free';
        $role = 'user';

        if ($existingUser) {
            $userId = $existingUser['id'];
            $plan = $existingUser['plan'];
            $role = $existingUser['role'];

            // Actualizar datos de login
            $update = $pdo->prepare("
                UPDATE cimatex_users 
                SET last_login_at = NOW(),
                    full_name = COALESCE(NULLIF(:name, ''), full_name),
                    avatar_url = COALESCE(NULLIF(:avatar, ''), avatar_url),
                    google_id = COALESCE(NULLIF(:gid, ''), google_id)
                WHERE id = :id
            ");
            $update->execute([
                ':name'   => $fullName,
                ':avatar' => $avatarUrl,
                ':gid'    => $googleId,
                ':id'     => $userId
            ]);
        } else {
            // Crear nuevo usuario
            $userId = generateUuid();
            $insert = $pdo->prepare("
                INSERT INTO cimatex_users (id, google_id, email, full_name, avatar_url, plan, role, last_login_at)
                VALUES (:id, :gid, :email, :name, :avatar, 'free', 'user', NOW())
            ");
            $insert->execute([
                ':id'     => $userId,
                ':gid'    => $googleId,
                ':email'  => $email,
                ':name'   => $fullName ?: 'Usuario CimaTex',
                ':avatar' => $avatarUrl ?: null
            ]);
        }

        // Generar token de sesión seguro
        $sessionToken = bin2hex(random_bytes(32));
        $sessionStmt = $pdo->prepare("
            INSERT INTO cimatex_sessions (id, user_id, token_hash, ip_address, expires_at)
            VALUES (:sid, :uid, :hash, :ip, DATE_ADD(NOW(), INTERVAL 30 DAY))
        ");
        $sessionStmt->execute([
            ':sid'  => generateUuid(),
            ':uid'  => $userId,
            ':hash' => hash('sha256', $sessionToken),
            ':ip'   => $_SERVER['REMOTE_ADDR'] ?? null,
        ]);

        echo json_encode([
            'success' => true,
            'message' => 'Autenticación exitosa en base de datos central.',
            'token'   => $sessionToken,
            'user'    => [
                'id'       => $userId,
                'email'    => $email,
                'name'     => $fullName ?: 'Usuario CimaTex',
                'avatar'   => $avatarUrl,
                'plan'     => $plan,
                'role'     => $role,
            ]
        ]);
        exit();

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Error en base de datos: ' . $e->getMessage()
        ]);
        exit();
    }
}

// ── 3. Endpoint: GET /api/users (Lista administrativa) ─────────────────────
if ($route === 'users' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, email, full_name, plan, role, created_at, last_login_at FROM cimatex_users ORDER BY created_at DESC LIMIT 50");
        $users = $stmt->fetchAll();
        echo json_encode(['success' => true, 'total' => count($users), 'users' => $users]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        exit();
    }
}

// Ruta no encontrada
http_response_code(404);
echo json_encode([
    'success' => false,
    'error'   => "Ruta no encontrada: {$route}",
    'available_endpoints' => ['GET /api/health', 'POST /api/auth/google', 'GET /api/users']
]);
