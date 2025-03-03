<?php
header('Content-Type: application/json');

$reposFile = __DIR__ . '/../../data/repositories.json';
$reposData = ['repositories' => []];

if (file_exists($reposFile)) {
    $reposData = json_decode(file_get_contents($reposFile), true) ?: ['repositories' => []];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $username = $_GET['username'] ?? '';
    
    if (!$username) {
        echo json_encode(['success' => false, 'message' => 'Username não fornecido']);
        exit();
    }
    
    $userRepos = array_filter($reposData['repositories'], function($repo) use ($username) {
        return $repo['owner'] === $username;
    });
    
    echo json_encode(['success' => true, 'repositories' => array_values($userRepos)]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['name']) || empty($data['username'])) {
        echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
        exit();
    }
    
    $newRepo = [
        'id' => uniqid(),
        'name' => $data['name'],
        'description' => $data['description'] ?? '',
        'owner' => $data['username'],
        'created_at' => date('Y-m-d H:i:s'),
        'stars' => [],
        'forks' => []
    ];
    
    $reposData['repositories'][] = $newRepo;
    
    if (file_put_contents($reposFile, json_encode($reposData, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true, 'repository' => $newRepo]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar repositório']);
    }
    exit();
}
?> 