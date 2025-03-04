<?php
header('Content-Type: application/json');

$postsFile = __DIR__ . '/../../data/posts.json';
$postsData = ['posts' => []];

if (file_exists($postsFile)) {
    $postsData = json_decode(file_get_contents($postsFile), true) ?: ['posts' => []];
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['action']) || empty($data['postId']) || empty($data['username'])) {
    echo json_encode(['success' => false, 'message' => 'Dados incompletos']);
    exit();
}

$action = $data['action'];
$postId = $data['postId'];
$username = $data['username'];

// Encontrar o post
$postIndex = -1;
foreach ($postsData['posts'] as $index => $post) {
    if ($post['id'] === $postId) {
        $postIndex = $index;
        break;
    }
}

if ($postIndex === -1) {
    echo json_encode(['success' => false, 'message' => 'Post não encontrado']);
    exit();
}

switch ($action) {
    case 'like':
        // Toggle like
        $likes = &$postsData['posts'][$postIndex]['likes'];
        $likeIndex = array_search($username, $likes);
        
        if ($likeIndex === false) {
            $likes[] = $username; // Adiciona like
            
            // Criar notificação apenas quando der like (não quando remover)
            if ($postsData['posts'][$postIndex]['username'] !== $username) {
                require_once(__DIR__ . '/notifications.php');
                createNotification(
                    'like',
                    $username,
                    $postsData['posts'][$postIndex]['username'],
                    '',
                    $postId
                );
            }
        } else {
            array_splice($likes, $likeIndex, 1); // Remove like
        }
        break;

    case 'comment':
        if (empty($data['content'])) {
            echo json_encode(['success' => false, 'message' => 'Conteúdo do comentário é obrigatório']);
            exit();
        }

        // Buscar foto do usuário
        $usersFile = __DIR__ . '/../../data/users.json';
        $usersData = json_decode(file_get_contents($usersFile), true);
        $userPhoto = '';
        
        foreach ($usersData['users'] as $user) {
            if ($user['username'] === $username) {
                $userPhoto = $user['photoUrl'] ?? '';
                break;
            }
        }

        // Adicionar comentário
        $postsData['posts'][$postIndex]['comments'][] = [
            'id' => uniqid(),
            'username' => $username,
            'content' => $data['content'],
            'userPhoto' => $userPhoto,
            'created_at' => date('Y-m-d H:i:s'),
            'isPinned' => false
        ];

        // Criar notificação para o dono do post
        if ($postsData['posts'][$postIndex]['username'] !== $username) {
            require_once(__DIR__ . '/notifications.php');
            createNotification(
                'comment',
                $username,
                $postsData['posts'][$postIndex]['username'],
                $data['content'],
                $postId
            );
        }
        break;

    case 'delete_post':
        // Verificar se o usuário é o dono do post
        if ($postsData['posts'][$postIndex]['username'] !== $username) {
            echo json_encode(['success' => false, 'message' => 'Você não tem permissão para excluir este post']);
            exit();
        }
        array_splice($postsData['posts'], $postIndex, 1);
        break;

    case 'delete_comment':
        if (empty($data['commentId'])) {
            echo json_encode(['success' => false, 'message' => 'ID do comentário não fornecido']);
            exit();
        }

        $commentIndex = -1;
        foreach ($postsData['posts'][$postIndex]['comments'] as $index => $comment) {
            if ($comment['id'] === $data['commentId']) {
                $commentIndex = $index;
                break;
            }
        }

        if ($commentIndex === -1) {
            echo json_encode(['success' => false, 'message' => 'Comentário não encontrado']);
            exit();
        }

        // Verificar se o usuário é o dono do comentário ou do post
        if ($postsData['posts'][$postIndex]['comments'][$commentIndex]['username'] !== $username && 
            $postsData['posts'][$postIndex]['username'] !== $username) {
            echo json_encode(['success' => false, 'message' => 'Você não tem permissão para excluir este comentário']);
            exit();
        }

        array_splice($postsData['posts'][$postIndex]['comments'], $commentIndex, 1);
        break;

    case 'pin_post':
        // Verificar se o usuário é o dono do post
        if ($postsData['posts'][$postIndex]['username'] !== $username) {
            echo json_encode(['success' => false, 'message' => 'Você não tem permissão para fixar este post']);
            exit();
        }
        $postsData['posts'][$postIndex]['isPinned'] = !$postsData['posts'][$postIndex]['isPinned'];
        break;

    case 'pin_comment':
        if (empty($data['commentId'])) {
            echo json_encode(['success' => false, 'message' => 'ID do comentário não fornecido']);
            exit();
        }

        // Verificar se o usuário é o dono do post
        if ($postsData['posts'][$postIndex]['username'] !== $username) {
            echo json_encode(['success' => false, 'message' => 'Você não tem permissão para fixar comentários neste post']);
            exit();
        }

        foreach ($postsData['posts'][$postIndex]['comments'] as &$comment) {
            if ($comment['id'] === $data['commentId']) {
                $comment['isPinned'] = !$comment['isPinned'];
                break;
            }
        }
        break;

    case 'repost':
        // Verificar se o post já é um repost
        if ($postsData['posts'][$postIndex]['originalPostId']) {
            echo json_encode(['success' => false, 'message' => 'Não é possível republicar um repost']);
            exit();
        }

        // Verificar se já existe um repost deste post
        foreach ($postsData['posts'] as $post) {
            if ($post['originalPostId'] === $postId && $post['username'] === $username) {
                echo json_encode(['success' => false, 'message' => 'Você já republicou este post']);
                exit();
            }
        }

        // Criar novo post como repost
        $originalPost = $postsData['posts'][$postIndex];
        $newPost = [
            'id' => uniqid(),
            'username' => $username,
            'content' => $originalPost['content'],
            'userPhoto' => $data['userPhoto'] ?? '',
            'created_at' => date('Y-m-d H:i:s'),
            'likes' => [],
            'comments' => [],
            'isPinned' => false,
            'repostCount' => 0,
            'originalPostId' => $postId
        ];

        // Incrementar contador de reposts do post original
        $postsData['posts'][$postIndex]['repostCount']++;

        // Adicionar novo post
        array_unshift($postsData['posts'], $newPost);

        // Criar notificação para o dono do post original
        if ($originalPost['username'] !== $username) {
            require_once(__DIR__ . '/notifications.php');
            createNotification(
                'repost',
                $username,
                $originalPost['username'],
                '',
                $postId
            );
        }
        break;
}

if (file_put_contents($postsFile, json_encode($postsData, JSON_PRETTY_PRINT))) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao salvar alterações']);
}
?> 