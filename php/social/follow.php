<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['follower']) || empty($data['following']) || empty($data['action'])) {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit();
}

$usersFile = __DIR__ . '/../../data/users.json';
$usersData = json_decode(file_get_contents($usersFile), true) ?: ['users' => []];

$follower = $data['follower'];
$following = $data['following'];
$action = $data['action'];

// Encontrar índices dos usuários
$followerIndex = -1;
$followingIndex = -1;

foreach ($usersData['users'] as $index => $user) {
    if ($user['username'] === $follower) {
        $followerIndex = $index;
    }
    if ($user['username'] === $following) {
        $followingIndex = $index;
    }
}

if ($followerIndex === -1 || $followingIndex === -1) {
    echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
    exit();
}

// Atualizar listas de following/followers
if ($action === 'follow') {
    if (!in_array($following, $usersData['users'][$followerIndex]['following'])) {
        $usersData['users'][$followerIndex]['following'][] = $following;
        $usersData['users'][$followingIndex]['followers'][] = $follower;
        
        // Criar notificação
        require_once(__DIR__ . '/notifications.php');
        createNotification('follow', $follower, $following);
    }
} else {
    $usersData['users'][$followerIndex]['following'] = array_diff(
        $usersData['users'][$followerIndex]['following'],
        [$following]
    );
    $usersData['users'][$followingIndex]['followers'] = array_diff(
        $usersData['users'][$followingIndex]['followers'],
        [$follower]
    );
}

if (file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao atualizar seguidores']);
}
?> 