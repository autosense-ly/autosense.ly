(async function () {
    const module = document.body.dataset.module;
    if (!module) return;

    const perms = await window.db.getMyPermissions();

    if (!perms) {
        window.location.href = 'login.html';
        return;
    }

    const isBlocked = module === 'settings' ? perms.role !== 'owner' : !perms[module];

    if (isBlocked) {
        alert('You do not have access to this page.');
        window.location.href = perms.live_operations ? 'vehicles.html' : 'login.html';
        return;
    }

    document.querySelectorAll('[data-nav-module]').forEach(el => {
        const navModule = el.dataset.navModule;
        const navBlocked = navModule === 'settings' ? perms.role !== 'owner' : !perms[navModule];
        if (navBlocked) {
            el.style.display = 'none';
        }
    });

    window.currentPermissions = perms;
})();
