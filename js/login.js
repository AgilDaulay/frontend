document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error');
    const API_URL = 'http://localhost:5000/api/auth/login';

    // Jika sudah login, langsung redirect ke halaman utama
    if (localStorage.getItem('token')) {
        window.location.href = 'index.html';
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Login gagal!');
            }

            // Simpan token dan data user ke localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            window.location.href = 'index.html';

        } catch (error) {
            errorMessage.textContent = error.message;
        }
    });
});