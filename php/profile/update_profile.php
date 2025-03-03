<?php
header('Content-Type: application/json');

// Receber dados do POST
$data = json_decode(file_get_contents('php://input'), true);

// Verificar dados obrigatórios
if (empty($data['username']) || empty($data['name'])) {
    echo json_encode(['success' => false, 'message' => 'Nome é obrigatório']);
    exit();
}

// Carregar arquivo de usuários
$usersFile = __DIR__ . '/../../data/users.json';
$usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];

$updated = false;

// Atualizar dados do usuário
foreach ($usersData['users'] as &$user) {
    if ($user['username'] === $data['username']) {
        // Atualizar campos permitidos
        $user['name'] = $data['name'];
        $user['bio'] = $data['bio'] ?? '';
        $user['company'] = $data['company'] ?? '';
        $user['location'] = $data['location'] ?? '';
        $user['website'] = $data['website'] ?? '';
        
        $updated = true;
        break;
    }
}

if ($updated) {
    // Salvar alterações no arquivo
    if (file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'message' => 'Perfil atualizado com sucesso'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Erro ao salvar alterações'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Usuário não encontrado'
    ]);
}
?> 