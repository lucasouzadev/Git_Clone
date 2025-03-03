// Verificar se já está logado
if (localStorage.getItem('username') && window.location.pathname.includes('signin.html')) {
    window.location.replace('index.html');
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    try {
        const response = await fetch('php/auth/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('username', username);
            localStorage.setItem('userPhoto', data.user.photoUrl || '');
            window.location.replace('index.html');
        } else {
            alert(data.message || 'Erro ao fazer login');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao fazer login');
    }
}

async function register() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;

    if (!username || !password || !email || !name) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    try {
        const response = await fetch('php/auth/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
                email,
                name
            })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Cadastro realizado com sucesso!');
            window.location.href = 'signin.html';
        } else {
            alert(data.message || 'Erro ao cadastrar');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao cadastrar');
    }
}

async function logout() {
    try {
        // Chamar o endpoint de logout
        const response = await fetch('php/auth/logout.php');
        const data = await response.json();
        
        if (data.success) {
            // Limpar dados do localStorage
            localStorage.clear();
            
            // Redirecionar para a página de login
            window.location.replace('signin.html');
        } else {
            console.error('Erro ao fazer logout:', data.message);
            alert('Erro ao fazer logout. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        // Em caso de erro, tentar fazer logout local
        localStorage.clear();
        window.location.replace('signin.html');
    }
} 