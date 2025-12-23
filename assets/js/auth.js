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
            localStorage.setItem('userCover', data.user.coverUrl || '');
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

async function requestPasswordReset() {
    const usernameOrEmail = document.getElementById('username-email').value;

    if (!usernameOrEmail) {
        alert('Por favor, informe seu usuário ou email');
        return;
    }

    try {
        const response = await fetch('php/auth/forgot_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ usernameOrEmail })
        });

        const data = await response.json();

        if (data.success) {
            // Armazenar token e username para usar na próxima página
            localStorage.setItem('resetToken', data.token);
            localStorage.setItem('resetUsername', data.username);

            alert('Token de recuperação gerado! Você será redirecionado para redefinir sua senha.');
            window.location.href = 'reset-password.html';
        } else {
            alert(data.message || 'Erro ao solicitar recuperação de senha');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao solicitar recuperação de senha');
    }
}

async function resetPassword() {
    const token = document.getElementById('token').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!token || !newPassword || !confirmPassword) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('As senhas não coincidem');
        return;
    }

    if (newPassword.length < 5) {
        alert('A senha deve ter pelo menos 5 caracteres');
        return;
    }

    try {
        const response = await fetch('php/auth/reset_password.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();

        if (data.success) {
            alert('Senha redefinida com sucesso! Você será redirecionado para o login.');
            // Limpar tokens do localStorage
            localStorage.removeItem('resetToken');
            localStorage.removeItem('resetUsername');
            window.location.href = 'signin.html';
        } else {
            alert(data.message || 'Erro ao redefinir senha');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao redefinir senha');
    }
} 