document.addEventListener('DOMContentLoaded', function() {
    if (!currentUser) {
        window.location.replace('signin.html');
        return;
    }
    
    loadUserData();
    setupPhotoUpload();
});

async function loadUserData() {
    try {
        const response = await fetch(`php/profile/get_profile.php?username=${currentUser}`);
        const data = await response.json();
        
        if (data.success) {
            const user = data.user;
            
            // Preencher campos
            document.getElementById('name').value = user.name || '';
            document.getElementById('bio').value = user.bio || '';
            document.getElementById('company').value = user.company || '';
            document.getElementById('location').value = user.location || '';
            document.getElementById('website').value = user.website || '';
            
            // Atualizar foto
            if (user.photoUrl) {
                document.getElementById('current-photo').src = user.photoUrl;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        alert('Erro ao carregar dados do usuário');
    }
}

function setupPhotoUpload() {
    const photoInput = document.getElementById('photo-input');
    photoInput.addEventListener('change', async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem');
            return;
        }
        
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('username', currentUser);
        
        try {
            const response = await fetch('php/profile/upload_photo.php', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('current-photo').src = data.photoUrl;
                localStorage.setItem('userPhoto', data.photoUrl);
                document.getElementById('user-avatar').src = data.photoUrl;
            } else {
                alert(data.message || 'Erro ao fazer upload da foto');
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload da foto');
        }
    });
}

async function saveProfile() {
    const formData = {
        username: currentUser,
        name: document.getElementById('name').value,
        bio: document.getElementById('bio').value,
        company: document.getElementById('company').value,
        location: document.getElementById('location').value,
        website: document.getElementById('website').value
    };
    
    try {
        const response = await fetch('php/profile/update_profile.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Perfil atualizado com sucesso!');
            window.location.href = `view_profile.html?username=${currentUser}`;
        } else {
            alert(data.message || 'Erro ao atualizar perfil');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        alert('Erro ao salvar alterações');
    }
} 