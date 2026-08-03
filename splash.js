document.addEventListener('DOMContentLoaded', () => {

    setTimeout(() => {
        if (window.Router) {
            window.Router.navigate('login');
        } else {
            window.location.href = 'login.html';
        }
    }, 2200);
});