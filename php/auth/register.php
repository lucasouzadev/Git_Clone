<?php
header('Content-Type: application/json');

// Carregar dados dos usuários
$usersFile = __DIR__ . '/../../data/users.json';
$usersData = ['users' => []];

if (file_exists($usersFile)) {
    $usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];
}

// Obter dados do POST
$data = json_decode(file_get_contents('php://input'), true);

// Validar dados obrigatórios
$requiredFields = ['username', 'password', 'email', 'name'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
        exit();
    }
}

// Verificar se usuário já existe
foreach ($usersData['users'] as $user) {
    if ($user['username'] === $data['username']) {
        echo json_encode(['success' => false, 'message' => 'Nome de usuário já existe']);
        exit();
    }
    if ($user['email'] === $data['email']) {
        echo json_encode(['success' => false, 'message' => 'E-mail já cadastrado']);
        exit();
    }
}

// Criar novo usuário
$newUser = [
    'username' => $data['username'],
    'password' => $data['password'], // Em produção, usar password_hash()
    'email' => $data['email'],
    'name' => $data['name'],
    'photoUrl' => '',
    'bio' => '',
    'location' => '',
    'website' => '',
    'company' => '',
    'followers' => [],
    'following' => [],
    'repositories' => [],
    'created_at' => date('Y-m-d H:i:s')
];

// Adicionar ao array e salvar
$usersData['users'][] = $newUser;

if (file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true, 'message' => 'Usuário cadastrado com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar usuário']);
}
?> 