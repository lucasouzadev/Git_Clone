<?php
header('Content-Type: application/json');

// Carregar dados dos usuários
$usersFile = __DIR__ . '/../../data/users.json';
$tokensFile = __DIR__ . '/../../data/reset_tokens.json';

if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Arquivo de usuários não encontrado']);
    exit();
}

$usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];

// Obter dados do POST
$data = json_decode(file_get_contents('php://input'), true);
$usernameOrEmail = $data['usernameOrEmail'] ?? '';

// Validar dados
if (!$usernameOrEmail) {
    echo json_encode(['success' => false, 'message' => 'Por favor, informe um usuário ou email']);
    exit();
}

// Procurar usuário por username ou email
$foundUser = null;
foreach ($usersData['users'] as $user) {
    if ($user['username'] === $usernameOrEmail || $user['email'] === $usernameOrEmail) {
        $foundUser = $user;
        break;
    }
}

if (!$foundUser) {
    echo json_encode(['success' => false, 'message' => 'Usuário ou email não encontrado']);
    exit();
}

// Gerar token único
$token = bin2hex(random_bytes(32));
$expiresAt = time() + 3600; // Token válido por 1 hora

// Carregar tokens existentes
$tokensData = [];
if (file_exists($tokensFile)) {
    $tokensData = json_decode(file_get_contents($tokensFile), true) ?: [];
}

// Adicionar novo token
$tokensData[$token] = [
    'username' => $foundUser['username'],
    'email' => $foundUser['email'],
    'expires_at' => $expiresAt,
    'created_at' => time()
];

// Salvar tokens
file_put_contents($tokensFile, json_encode($tokensData, JSON_PRETTY_PRINT));

// Em uma aplicação real, aqui seria enviado um email com o link de reset
// Por simplicidade, vamos retornar o token para ser usado diretamente
echo json_encode([
    'success' => true,
    'message' => 'Instruções de recuperação enviadas com sucesso',
    'token' => $token,
    'username' => $foundUser['username']
]);
?>
