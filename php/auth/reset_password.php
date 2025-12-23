<?php
header('Content-Type: application/json');

// Carregar dados dos usuários e tokens
$usersFile = __DIR__ . '/../../data/users.json';
$tokensFile = __DIR__ . '/../../data/reset_tokens.json';

if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Arquivo de usuários não encontrado']);
    exit();
}

if (!file_exists($tokensFile)) {
    echo json_encode(['success' => false, 'message' => 'Token inválido']);
    exit();
}

$usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];
$tokensData = json_decode(file_get_contents($tokensFile), true) ?: [];

// Obter dados do POST
$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$newPassword = $data['newPassword'] ?? '';

// Validar dados
if (!$token || !$newPassword) {
    echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
    exit();
}

// Verificar se o token existe
if (!isset($tokensData[$token])) {
    echo json_encode(['success' => false, 'message' => 'Token inválido']);
    exit();
}

$tokenInfo = $tokensData[$token];

// Verificar se o token expirou
if (time() > $tokenInfo['expires_at']) {
    echo json_encode(['success' => false, 'message' => 'Token expirado. Por favor, solicite uma nova recuperação de senha']);
    exit();
}

// Atualizar a senha do usuário
$userUpdated = false;
foreach ($usersData['users'] as &$user) {
    if ($user['username'] === $tokenInfo['username']) {
        $user['password'] = $newPassword;
        $userUpdated = true;
        break;
    }
}

if (!$userUpdated) {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar senha']);
    exit();
}

// Salvar usuários atualizados
file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));

// Remover token usado
unset($tokensData[$token]);
file_put_contents($tokensFile, json_encode($tokensData, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Senha redefinida com sucesso'
]);
?>
