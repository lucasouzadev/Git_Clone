<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['notification_id']) || empty($data['username'])) {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit();
}

$notificationsFile = __DIR__ . '/../../data/notifications.json';
$notificationsData = json_decode(file_get_contents($notificationsFile), true) ?: ['notifications' => []];

$updated = false;
foreach ($notificationsData['notifications'] as &$notification) {
    if ($notification['id'] === $data['notification_id'] && 
        $notification['to_username'] === $data['username']) {
        $notification['read'] = true;
        $updated = true;
        break;
    }
}

if ($updated) {
    if (file_put_contents($notificationsFile, json_encode($notificationsData, JSON_PRETTY_PRINT))) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Erro ao salvar alterações']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Notificação não encontrada']);
}
?> 