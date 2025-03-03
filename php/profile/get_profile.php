<?php
header('Content-Type: application/json');

$username = $_GET['username'] ?? '';

if (!$username) {
    echo json_encode(['success' => false, 'message' => 'Username não fornecido']);
    exit();
}

$usersFile = __DIR__ . '/../../data/users.json';

if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Arquivo de usuários não encontrado']);
    exit();
}

$usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];

foreach ($usersData['users'] as $user) {
    if ($user['username'] === $username) {
        // Remove senha antes de enviar
        unset($user['password']);
        echo json_encode(['success' => true, 'user' => $user]);
        exit();
    }
}

echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
?> 