let currentQuery = '';
let currentFilter = 'all';

async function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query) {
        clearResults(); // Limpa resultados se a consulta estiver vazia
        return;
    }
    
    currentQuery = query;
    
    try {
        const response = await fetch(`php/search/search.php?q=${encodeURIComponent(query)}&type=${currentFilter}`);
        
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data.results);
            // Atualizar URL com a busca
            window.history.pushState({}, '', `search.html?q=${encodeURIComponent(query)}`);
        } else {
            alert(data.message || 'Erro ao realizar busca');
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        alert('Erro ao realizar busca: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    
    if (queryParam) {
        document.getElementById('search-input').value = queryParam;
        performSearch();
    }
    
    // Listener para busca ao pressionar Enter
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
});

function filterResults(type) {
    currentFilter = type;
    
    // Atualizar botões de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="filterResults('${type}')"]`).classList.add('active');
    
    // Se já houver uma busca, realizar novamente com o novo filtro
    if (currentQuery) {
        performSearch();
    }
}

function clearResults() {
    document.getElementById('users-list').innerHTML = '';
    document.getElementById('repositories-list').innerHTML = '';
    document.getElementById('posts-list').innerHTML = '';
    
    document.getElementById('users-results').style.display = 'none';
    document.getElementById('repositories-results').style.display = 'none'; 
    document.getElementById('posts-results').style.display = 'none';
}

function displayResults(results) {
    // Exibir resultados de usuários
    const usersList = document.getElementById('users-list');
    const usersSection = document.getElementById('users-results');
    
    if (currentFilter === 'all' || currentFilter === 'users') {
        usersSection.style.display = 'block';
        if (results.users && results.users.length > 0) {
            usersList.innerHTML = results.users.map(user => `
                <div class="user-result">
                    <img src="${user.photoUrl || 'assets/img/default-avatar.png'}" alt="Avatar">
                    <div class="user-info">
                        <h3><a href="view_profile.html?username=${user.username}">${user.name}</a></h3>
                        <p>@${user.username}</p>
                        ${user.bio ? `<p class="bio">${user.bio}</p>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            usersList.innerHTML = '<p class="no-results">Nenhum usuário encontrado</p>';
        }
    } else {
        usersSection.style.display = 'none';
    }
    
    // Exibir resultados de repositórios
    const reposList = document.getElementById('repositories-list');
    const reposSection = document.getElementById('repositories-results');
    
    if (currentFilter === 'all' || currentFilter === 'repositories') {
        reposSection.style.display = 'block';
        if (results.repositories && results.repositories.length > 0) {
            reposList.innerHTML = results.repositories.map(repo => `
                <div class="repository-result">
                    <h3><a href="view_repository.html?id=${repo.id}">${repo.name}</a></h3>
                    <p>${repo.description || 'Sem descrição'}</p>
                    <div class="repository-meta">
                        <span>⭐ ${repo.stars.length}</span>
                        <span>🔀 ${repo.forks.length}</span>
                        <span>👤 ${repo.owner}</span>
                    </div>
                </div>
            `).join('');
        } else {
            reposList.innerHTML = '<p class="no-results">Nenhum repositório encontrado</p>';
        }
    } else {
        reposSection.style.display = 'none';
    }
    
    // Exibir resultados de posts
    const postsList = document.getElementById('posts-list');
    const postsSection = document.getElementById('posts-results');
    
    if (currentFilter === 'all' || currentFilter === 'posts') {
        postsSection.style.display = 'block';
        if (results.posts && results.posts.length > 0) {
            postsList.innerHTML = results.posts.map(post => `
                <div class="post-result">
                    <div class="post-header">
                        <img src="${post.userPhoto || 'assets/img/default-avatar.png'}" alt="Avatar">
                        <div>
                            <strong><a href="view_profile.html?username=${post.username}">${post.username}</a></strong>
                            <small>${formatDate(post.created_at)}</small>
                        </div>
                    </div>
                    <p class="post-content">${post.content}</p>
                    <div class="post-meta">
                        <span>❤️ ${post.likes.length}</span>
                        <span>💬 ${post.comments.length}</span>
                    </div>
                </div>
            `).join('');
        } else {
            postsList.innerHTML = '<p class="no-results">Nenhum post encontrado</p>';
        }
    } else {
        postsSection.style.display = 'none';
    }
} 