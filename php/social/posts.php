<?php
header('Content-Type: application/json');

$postsFile = __DIR__ . '/../../data/posts.json';
$postsData = ['posts' => []];

if (file_exists($postsFile)) {
    $postsData = json_decode(file_get_contents($postsFile), true) ?: ['posts' => []];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Carregar posts
    $username = $_GET['username'] ?? null;
    
    if ($username) {
        // Filtrar posts do usuário específico
        $userPosts = array_filter($postsData['posts'], function($post) use ($username) {
            return $post['username'] === $username;
        });
        $posts = array_values($userPosts);
    } else {
        // Retornar todos os posts
        $posts = $postsData['posts'];
    }
    
    // Ordenar posts: fixados primeiro, depois por data
    usort($posts, function($a, $b) {
        if ($a['isPinned'] !== $b['isPinned']) {
            return $b['isPinned'] - $a['isPinned'];
        }
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    echo json_encode(['success' => true, 'posts' => $posts]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['content']) || empty($data['username'])) {
        echo json_encode(['success' => false, 'message' => 'Conteúdo e usuário são obrigatórios']);
        exit();
    }
    
    // Carregar dados do usuário para obter a foto
    $usersFile = __DIR__ . '/../../data/users.json';
    $usersData = json_decode(file_get_contents($usersFile), true);
    $userPhoto = '';
    
    foreach ($usersData['users'] as $user) {
        if ($user['username'] === $data['username']) {
            $userPhoto = $user['photoUrl'] ?? '';
            break;
        }
    }
    
    // Criar novo post
    $newPost = [
        'id' => uniqid(),
        'username' => $data['username'],
        'content' => $data['content'],
        'userPhoto' => $userPhoto,
        'created_at' => date('Y-m-d H:i:s'),
        'likes' => [],
        'comments' => [],
        'isPinned' => false,
        'repostCount' => 0,
        'originalPostId' => null
    ];
    
    array_unshift($postsData['posts'], $newPost);
    
    if (file_put_contents($postsFile, json_encode($postsData, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true, 'post' => $newPost]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar post']);
    }
    exit();
}
?> 