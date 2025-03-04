<?php
header('Content-Type: application/json');

$query = $_GET['q'] ?? '';
$type = $_GET['type'] ?? 'all'; // all, users, repositories, posts

if (empty($query)) {
    echo json_encode([
        'success' => false,
        'message' => 'Termo de busca não fornecido'
    ]);
    exit();
}

// Carregar dados
$usersData = json_decode(file_get_contents(__DIR__ . '/../../data/users.json'), true)['users'] ?? [];
$repositoriesData = json_decode(file_get_contents(__DIR__ . '/../../data/repositories.json'), true)['repositories'] ?? [];
$postsData = json_decode(file_get_contents(__DIR__ . '/../../data/posts.json'), true)['posts'] ?? [];

$results = [
    'users' => [],
    'repositories' => [],
    'posts' => []
];

// Função para verificar se string contém termo de busca
function contains($haystack, $needle) {
    return stripos($haystack, $needle) !== false;
}

// Buscar usuários
if ($type === 'all' || $type === 'users') {
    foreach ($usersData as $user) {
        if (contains($user['username'], $query) || 
            contains($user['name'], $query) || 
            contains($user['bio'] ?? '', $query)) {
            
            // Remover dados sensíveis
            unset($user['password']);
            $results['users'][] = $user;
        }
    }
}

// Buscar repositórios
if ($type === 'all' || $type === 'repositories') {
    foreach ($repositoriesData as $repo) {
        if (contains($repo['name'], $query) || 
            contains($repo['description'] ?? '', $query)) {
            $results['repositories'][] = $repo;
        }
    }
}

// Buscar posts
if ($type === 'all' || $type === 'posts') {
    foreach ($postsData as $post) {
        if (contains($post['content'], $query)) {
            $results['posts'][] = $post;
        }
    }
}

echo json_encode([
    'success' => true,
    'query' => $query,
    'results' => $results
]);
?> 