<?php
header('Content-Type: application/json');

if (!isset($_FILES['cover']) || !isset($_POST['username'])) {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit();
}

$username = $_POST['username'];
$uploadDir = __DIR__ . '/../../uploads/';

// Criar diretório se não existir
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Gerar nome único para o arquivo
$fileExtension = pathinfo($_FILES['cover']['name'], PATHINFO_EXTENSION);
$fileName = $username . '_' . time() . '.' . $fileExtension;
$targetFile = $uploadDir . $fileName;

// Verificar tipo de arquivo
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($_FILES['cover']['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Tipo de arquivo não permitido']);
    exit();
}

if (move_uploaded_file($_FILES['cover']['tmp_name'], $targetFile)) {
    // Atualizar URL da foto no users.json
    $usersFile = __DIR__ . '/../../data/users.json';
    $usersData = json_decode(file_get_contents($usersFile), true);
    
    foreach ($usersData['users'] as &$user) {
        if ($user['username'] === $username) {
            $user['coverUrl'] = 'uploads/' . $fileName;
            break;
        }
    }
    
    if (file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'coverUrl' => 'uploads/' . $fileName
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao atualizar dados do usuário']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao fazer upload do arquivo']);
}
?> 