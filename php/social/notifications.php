<?php
header('Content-Type: application/json');

$notificationsFile = __DIR__ . '/../../data/notifications.json';
$notificationsData = ['notifications' => []];

if (file_exists($notificationsFile)) {
    $notificationsData = json_decode(file_get_contents($notificationsFile), true) ?: ['notifications' => []];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $username = $_GET['username'] ?? '';
    
    if (!$username) {
        echo json_encode(['success' => false, 'message' => 'Username não fornecido']);
        exit();
    }
    
    // Filtrar notificações do usuário
    $userNotifications = array_filter($notificationsData['notifications'], function($notification) use ($username) {
        return $notification['to_username'] === $username;
    });
    
    // Ordenar por data, mais recentes primeiro
    usort($userNotifications, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    echo json_encode([
        'success' => true,
        'notifications' => array_values($userNotifications)
    ]);
    exit();
}

// Função auxiliar para criar notificações
function createNotification($type, $fromUsername, $toUsername, $content = '', $postId = null) {
    global $notificationsFile, $notificationsData;
    
    $notification = [
        'id' => uniqid(),
        'type' => $type,
        'from_username' => $fromUsername,
        'to_username' => $toUsername,
        'content' => $content,
        'post_id' => $postId,
        'created_at' => date('Y-m-d H:i:s'),
        'read' => false
    ];
    
    array_unshift($notificationsData['notifications'], $notification);
    file_put_contents($notificationsFile, json_encode($notificationsData, JSON_PRETTY_PRINT));
    
    return $notification;
}
?> 