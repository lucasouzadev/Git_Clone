<?php
header('Content-Type: application/json');

// Carregar dados dos usuários
$usersFile = __DIR__ . '/../../data/users.json';
if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Arquivo de usuários não encontrado']);
    exit();
}

$usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];

// Obter dados do POST
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Validar dados
if (!$username || !$password) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit();
}

// Procurar usuário
foreach ($usersData['users'] as $user) {
    if ($user['username'] === $username && $user['password'] === $password) {
        // Remove senha antes de enviar
        unset($user['password']);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
        exit();
    }
}

echo json_encode(['success' => false, 'message' => 'Usuário ou senha incorretos']);
?> 