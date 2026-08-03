document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const user = document.getElementById('username').value;
            
            if (window.db) {
                window.db.set('session', { loggedIn: true, user: user || 'Alex Morgan' });
            }
            
            if (window.Router) {
                window.Router.navigate('dashboard');
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }
});