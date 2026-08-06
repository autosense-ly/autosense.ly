document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('.login-btn');
        const originalBtnText = submitBtn.textContent;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        const result = await window.db.signIn(email, password);

        if (!result.success) {
            alert(result.error || 'Login failed. Check your email and password.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }

        if (window.Router) {
            window.Router.navigate('dashboard');
        } else {
            window.location.href = 'dashboard.html';
        }
    });
});
