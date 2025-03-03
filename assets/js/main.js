// Verificar autenticação
const currentUser = localStorage.getItem('username');
if (!currentUser) {
    window.location.replace('signin.html');
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    
    // Event listeners para elementos que existem em todas as páginas
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('click', toggleNotifications);
    }
    
    // Atualizar avatar se disponível
    const userPhoto = localStorage.getItem('userPhoto');
    const userAvatar = document.getElementById('user-avatar');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    
    if (userPhoto) {
        if (userAvatar) userAvatar.src = userPhoto;
        if (sidebarAvatar) sidebarAvatar.src = userPhoto;
    }
    
    // Atualizar link do perfil
    const profileLink = document.getElementById('profile-link');
    if (profileLink) {
        profileLink.href = `view_profile.html?username=${currentUser}`;
    }
});

async function initializePage() {
    try {
        // Atualizar foto do usuário no formulário de post
        const userPhoto = localStorage.getItem('userPhoto');
        const postAvatar = document.getElementById('post-avatar');
        if (postAvatar) {
            postAvatar.src = userPhoto || 'assets/img/default-avatar.png';
        }

        await Promise.all([
            loadUserInfo(),
            loadRepositories(),
            loadPosts(),
            loadNotifications()
        ]);
    } catch (error) {
        console.error('Erro ao inicializar página:', error);
    }
}

async function loadUserInfo() {
    try {
        const sidebarName = document.getElementById('sidebar-name');
        const sidebarUsername = document.getElementById('sidebar-username');
        
        if (!sidebarName || !sidebarUsername) return;

        const response = await fetch(`php/profile/get_profile.php?username=${currentUser}`);
        const data = await response.json();
        
        if (data.success) {
            sidebarName.textContent = data.user.name;
            sidebarUsername.textContent = `@${data.user.username}`;
        }
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

async function loadRepositories() {
    try {
        const repoList = document.getElementById('repo-list');
        if (!repoList) return;

        const response = await fetch(`php/repositories/repositories.php?username=${currentUser}`);
        const data = await response.json();
        
        repoList.innerHTML = '';
        
        if (data.success && data.repositories.length > 0) {
            data.repositories.forEach(repo => {
                repoList.innerHTML += `
                    <div class="repo-item">
                        <h4>${repo.name}</h4>
                        <p>${repo.description || 'Sem descrição'}</p>
                    </div>
                `;
            });
        } else {
            repoList.innerHTML = '<p>Nenhum repositório encontrado</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar repositórios:', error);
    }
}

async function loadNotifications() {
    try {
        const response = await fetch(`php/social/notifications.php?username=${currentUser}`);
        const data = await response.json();
        
        const notificationsList = document.getElementById('notifications-list');
        const notificationCount = document.getElementById('notification-count');
        
        if (!notificationsList || !notificationCount) return;
        
        if (data.success) {
            const unreadCount = data.notifications.filter(n => !n.read).length;
            notificationCount.textContent = unreadCount.toString();
            notificationCount.style.display = unreadCount > 0 ? 'block' : 'none';
            
            if (data.notifications.length > 0) {
                notificationsList.innerHTML = data.notifications.map(notification => {
                    let message = '';
                    switch (notification.type) {
                        case 'follow':
                            message = `<strong>${notification.from_username}</strong> começou a seguir você`;
                            break;
                        case 'like':
                            message = `<strong>${notification.from_username}</strong> curtiu seu post`;
                            break;
                        case 'comment':
                            message = `<strong>${notification.from_username}</strong> comentou: ${notification.content}`;
                            break;
                        case 'repost':
                            message = `<strong>${notification.from_username}</strong> republicou seu post`;
                            break;
                    }
                    
                    return `
                        <div class="notification-item ${notification.read ? 'read' : 'unread'}"
                             onclick="markNotificationAsRead('${notification.id}')">
                            <p>${message}</p>
                            <small>${formatDate(notification.created_at)}</small>
                        </div>
                    `;
                }).join('');
            } else {
                notificationsList.innerHTML = '<p class="no-notifications">Nenhuma notificação</p>';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch('php/social/mark_notification_read.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notification_id: notificationId,
                username: currentUser
            })
        });
        
        const data = await response.json();
        if (data.success) {
            loadNotifications(); // Recarregar notificações
        }
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
    }
}

// Função para alternar visibilidade das notificações
function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Função para criar novo repositório
function showNewRepoModal() {
    document.getElementById('new-repo-modal').style.display = 'flex';
}

function closeNewRepoModal() {
    document.getElementById('new-repo-modal').style.display = 'none';
}

async function createRepository() {
    const name = document.getElementById('repo-name').value;
    const description = document.getElementById('repo-description').value;
    
    if (!name) {
        alert('Nome do repositório é obrigatório');
        return;
    }
    
    try {
        const response = await fetch('php/repositories/repositories.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                description,
                username: currentUser
            })
        });
        
        const data = await response.json();
        if (data.success) {
            closeNewRepoModal();
            loadRepositories();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Erro ao criar repositório:', error);
        alert('Erro ao criar repositório');
    }
}

async function loadPosts() {
    try {
        const response = await fetch('php/social/posts.php');
        const data = await response.json();
        
        const postsList = document.getElementById('posts-list');
        if (!postsList) return;
        
        postsList.innerHTML = '';
        
        if (data.success && data.posts.length > 0) {
            data.posts.forEach(post => {
                const isOwner = post.username === currentUser;
                const isRepost = post.originalPostId !== null;
                const repostInfo = isRepost ? `<div class="repost-info">🔄 Republicado por ${post.username}</div>` : '';
                
                postsList.innerHTML += `
                    <div class="post-card" data-post-id="${post.id}">
                        <div class="post-header">
                            <img src="${post.userPhoto || 'assets/img/default-avatar.png'}" 
                                 alt="Avatar" class="avatar-small">
                            <div class="post-user-info">
                                <a href="view_profile.html?username=${post.username}" 
                                   class="post-username">${post.username}</a>
                                <div class="post-time">${formatDate(post.created_at)}</div>
                            </div>
                            ${isOwner ? `
                                <div class="post-options">
                                    <button onclick="togglePostOptions('${post.id}')" class="options-btn">⋮</button>
                                    <div id="post-options-${post.id}" class="options-menu" style="display: none;">
                                        <button onclick="pinPost('${post.id}')" class="option-item">
                                            ${post.isPinned ? '🔓 Desafixar' : '📌 Fixar'}
                                        </button>
                                        <button onclick="deletePost('${post.id}')" class="option-item delete">
                                            🗑️ Excluir
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        ${repostInfo}
                        <div class="post-content">${post.content}</div>
                        <div class="post-actions">
                            <button onclick="likePost('${post.id}')" class="post-action-btn">
                                ❤️ ${post.likes.length}
                            </button>
                            <button onclick="toggleComments('${post.id}')" class="post-action-btn">
                                💬 ${post.comments.length}
                            </button>
                            ${!isRepost ? `
                                <button onclick="repost('${post.id}')" class="post-action-btn">
                                    🔄 ${post.repostCount || 0}
                                </button>
                            ` : ''}
                        </div>
                        <div id="comments-${post.id}" class="comments-section" style="display: none;">
                            <div class="comments-list">
                                ${renderComments(post.comments)}
                            </div>
                            <div class="comment-input">
                                <input type="text" placeholder="Adicionar um comentário..." 
                                       id="comment-input-${post.id}">
                                <button onclick="addComment('${post.id}')" class="btn-post">
                                    Comentar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            postsList.innerHTML = '<p class="empty-message">Nenhum post encontrado</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
    }
}

async function createPost() {
    const content = document.getElementById('post-content').value.trim();
    
    if (!content) {
        alert('Por favor, escreva algo para publicar');
        return;
    }
    
    try {
        const response = await fetch('php/social/posts.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: currentUser,
                content: content
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('post-content').value = '';
            loadPosts(); // Recarregar posts
        } else {
            alert(data.message || 'Erro ao criar post');
        }
    } catch (error) {
        console.error('Erro ao criar post:', error);
        alert('Erro ao criar post');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff/60000)} minutos atrás`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)} horas atrás`;
    if (diff < 2592000000) return `${Math.floor(diff/86400000)} dias atrás`;
    
    return date.toLocaleDateString();
}

function renderComments(comments) {
    if (!Array.isArray(comments)) return '';
    
    // Ordenar comentários: fixados primeiro, depois por data
    const sortedComments = [...comments].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned - a.isPinned;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    return sortedComments.map(comment => {
        const isOwner = comment.username === currentUser;
        return `
            <div class="comment ${comment.isPinned ? 'pinned' : ''}" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <img src="${comment.userPhoto || 'assets/img/default-avatar.png'}" 
                         alt="Avatar" class="avatar-small">
                    <div class="comment-info">
                        <a href="view_profile.html?username=${comment.username}" 
                           class="comment-username">${comment.username}</a>
                        <div class="comment-time">${formatDate(comment.created_at)}</div>
                    </div>
                    ${isOwner ? `
                        <div class="comment-options">
                            <button onclick="toggleCommentOptions('${comment.id}')" class="options-btn">⋮</button>
                            <div id="comment-options-${comment.id}" class="options-menu" style="display: none;">
                                <button onclick="deleteComment('${comment.id}')" class="option-item delete">
                                    🗑️ Excluir
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-content">${comment.content}</div>
            </div>
        `;
    }).join('');
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

// Funções para likes e comentários
async function likePost(postId) {
    try {
        const response = await fetch('php/social/post_actions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'like',
                postId: postId,
                username: currentUser
            })
        });

        const data = await response.json();
        if (data.success) {
            loadPosts(); // Recarregar posts para atualizar contadores
        } else {
            alert(data.message || 'Erro ao processar like');
        }
    } catch (error) {
        console.error('Erro ao processar like:', error);
    }
}

async function addComment(postId) {
    const inputElement = document.getElementById(`comment-input-${postId}`);
    const content = inputElement.value.trim();

    if (!content) {
        alert('Por favor, escreva um comentário');
        return;
    }

    try {
        const response = await fetch('php/social/post_actions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'comment',
                postId: postId,
                username: currentUser,
                content: content
            })
        });

        const data = await response.json();
        if (data.success) {
            inputElement.value = ''; // Limpar campo
            loadPosts(); // Recarregar posts
        } else {
            alert(data.message || 'Erro ao adicionar comentário');
        }
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
    }
}

// Atualizar a função toggleComments para showComments
function showComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

function togglePostOptions(postId) {
    const optionsMenu = document.getElementById(`post-options-${postId}`);
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
}

function toggleCommentOptions(commentId) {
    const optionsMenu = document.getElementById(`comment-options-${commentId}`);
    optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
}

async function pinPost(postId) {
    try {
        const response = await fetch('php/social/post_actions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'pin_post',
                postId: postId,
                username: currentUser
            })
        });

        const data = await response.json();
        if (data.success) {
            loadPosts();
        } else {
            alert(data.message || 'Erro ao fixar post');
        }
    } catch (error) {
        console.error('Erro ao fixar post:', error);
    }
}

async function deletePost(postId) {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;

    try {
        const response = await fetch('php/social/post_actions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete_post',
                postId: postId,
                username: currentUser
            })
        });

        const data = await response.json();
        if (data.success) {
            loadPosts();
        } else {
            alert(data.message || 'Erro ao excluir post');
        }
    } catch (error) {
        console.error('Erro ao excluir post:', error);
    }
}

async function deleteComment(commentId) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) return;

    const postCard = document.querySelector(`[data-comment-id="${commentId}"]`).closest('.post-card');
    const postId = postCard.dataset.postId;

    try {
        const response = await fetch('php/social/post_actions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'delete_comment',
                postId: postId,
                commentId: commentId,
                username: currentUser
            })
        });

        const data = await response.json();
        if (data.success) {
            loadPosts();
        } else {
            alert(data.message || 'Erro ao excluir comentário');
        }
    } catch (error) {
        console.error('Erro ao excluir comentário:', error);
    }
}

async function repost(postId) {
    try {
        const response = await fetch('php/social/post_actions.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'repost',
                postId: postId,
                username: currentUser,
                userPhoto: localStorage.getItem('userPhoto')
            })
        });

        const data = await response.json();
        if (data.success) {
            loadPosts();
        } else {
            alert(data.message || 'Erro ao republicar post');
        }
    } catch (error) {
        console.error('Erro ao republicar post:', error);
    }
} 