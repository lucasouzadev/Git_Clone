let profileUsername = new URLSearchParams(window.location.search).get('username');

// Se não houver username na URL, usar o usuário atual
if (!profileUsername) {
    profileUsername = currentUser;
}

document.addEventListener('DOMContentLoaded', function() {
    if (!currentUser) {
        window.location.replace('signin.html');
        return;
    }
    
    loadProfile();
    loadNotifications();
    
    // Atualizar avatar do header se disponível
    const userPhoto = localStorage.getItem('userPhoto');
    if (userPhoto) {
        document.getElementById('user-avatar').src = userPhoto;
    }
    
    // Atualizar link do perfil
    document.getElementById('profile-link').href = `view_profile.html?username=${currentUser}`;
    
    // Setup do toggle de notificações
    const notificationsToggle = document.getElementById('notifications-toggle');
    if (notificationsToggle) {
        notificationsToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleNotifications();
        });
    }
    
    // Fechar notificações ao clicar fora
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('notifications-dropdown');
        const toggle = document.getElementById('notifications-toggle');
        
        if (dropdown && !dropdown.contains(e.target) && !toggle.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
});

async function loadProfile() {
    try {
        const response = await fetch(`php/profile/get_profile.php?username=${profileUsername}`);
        const data = await response.json();

        if (data.success) {
            const user = data.user;
            
            // Atualizar informações básicas
            document.getElementById('profile-name').textContent = user.name;
            document.getElementById('profile-username').textContent = `@${user.username}`;
            document.getElementById('profile-bio').textContent = user.bio || 'Sem bio';
            document.getElementById('profile-avatar').src = user.photoUrl || 'assets/img/default-avatar.png';
            
            // Atualizar meta informações
            if (user.location) {
                document.getElementById('location-info').innerHTML = `📍 ${user.location}`;
            }
            if (user.website) {
                document.getElementById('website-info').innerHTML = 
                    `🔗 <a href="https://${user.website}" target="_blank">${user.website}</a>`;
            }
            if (user.company) {
                document.getElementById('company-info').innerHTML = `🏢 ${user.company}`;
            }
            
            // Atualizar contadores
            document.getElementById('repositories-count').textContent = 
                Array.isArray(user.repositories) ? user.repositories.length : 0;
            document.getElementById('followers-count').textContent = 
                Array.isArray(user.followers) ? user.followers.length : 0;
            document.getElementById('following-count').textContent = 
                Array.isArray(user.following) ? user.following.length : 0;
            
            // Renderizar botões de ação
            renderProfileActions(user);
            
            // Carregar conteúdo inicial
            loadRepositories();
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

function renderProfileActions(user) {
    const actionsContainer = document.getElementById('profile-actions');
    
    if (currentUser === profileUsername) {
        actionsContainer.innerHTML = `
            <button onclick="window.location.href='profile.html'" class="edit-profile-button">
                Editar perfil
            </button>
        `;
    } else {
        const isFollowing = Array.isArray(user.followers) && user.followers.includes(currentUser);
        actionsContainer.innerHTML = `
            <button onclick="toggleFollow('${user.username}', ${isFollowing})" 
                    class="follow-button ${isFollowing ? 'following' : ''}">
                ${isFollowing ? 'Deixar de seguir' : 'Seguir'}
            </button>
        `;
    }
}

async function toggleFollow(username, isFollowing) {
    try {
        const response = await fetch('php/social/follow.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                follower: currentUser,
                following: username,
                action: isFollowing ? 'unfollow' : 'follow'
            })
        });

        const data = await response.json();
        if (data.success) {
            loadProfile(); // Recarregar perfil para atualizar contadores
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Erro ao processar follow/unfollow:', error);
    }
}

function switchTab(tab) {
    // Atualizar botões
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`[onclick="switchTab('${tab}')"]`).classList.add('active');
    
    // Atualizar conteúdo
    document.getElementById('repositories-tab').style.display = tab === 'repositories' ? 'block' : 'none';
    document.getElementById('posts-tab').style.display = tab === 'posts' ? 'block' : 'none';
    
    // Carregar conteúdo
    if (tab === 'repositories') {
        loadRepositories();
    } else {
        loadPosts();
    }
}

async function loadRepositories() {
    try {
        const response = await fetch(`php/repositories/repositories.php?username=${profileUsername}`);
        const data = await response.json();
        
        const reposList = document.getElementById('repositories-list');
        reposList.innerHTML = '';
        
        if (data.success && data.repositories.length > 0) {
            data.repositories.forEach(repo => {
                reposList.innerHTML += `
                    <div class="repository-card">
                        <h3>${repo.name}</h3>
                        <p>${repo.description || 'Sem descrição'}</p>
                        <div class="repository-meta">
                            <span>⭐ ${Array.isArray(repo.stars) ? repo.stars.length : 0}</span>
                            <span>🔀 ${Array.isArray(repo.forks) ? repo.forks.length : 0}</span>
                            <span>📅 ${new Date(repo.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            reposList.innerHTML = '<p class="empty-message">Nenhum repositório encontrado</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar repositórios:', error);
    }
}

async function loadPosts() {
    try {
        const response = await fetch(`php/social/posts.php?username=${profileUsername}`);
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

// Adicionar estas funções ao profile.js
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection) {
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
    }
}

function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p class="no-comments">Nenhum comentário ainda</p>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <img src="${comment.userPhoto || 'assets/img/default-avatar.png'}" 
                 alt="Avatar" class="avatar-small">
            <div class="comment-content">
                <a href="view_profile.html?username=${comment.username}" 
                   class="comment-username">${comment.username}</a>
                <span class="comment-text">${comment.content}</span>
            </div>
        </div>
    `).join('');
}

function toggleNotifications() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Função para formatar data (se não existir)
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
            notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
            
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