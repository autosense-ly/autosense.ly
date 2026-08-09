document.addEventListener('DOMContentLoaded', async () => {
    const nameEl = document.getElementById('profileName');
    const roleEl = document.getElementById('profileRole');
    const menuGroup = document.getElementById('menuGroup');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!nameEl) return;

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await window.db.signOut();
        window.location.href = 'login.html';
    });

    const profile = await window.db.getCurrentProfile();
    if (!profile) {
        nameEl.textContent = 'Not logged in';
        roleEl.textContent = '';
        return;
    }

    // textContent is injection-safe on its own — no escaping needed here
    nameEl.textContent = profile.name || 'Unnamed User';
    roleEl.textContent = profile.role === 'owner' ? 'Owner' : 'Manager';

    let menuHTML = `
        <a href="services.html" class="menu-item">
            <span><i class="fa-solid fa-list-check"></i> Wash Services Catalog</span>
            <i class="fa-solid fa-chevron-right"></i>
        </a>
    `;

    if (profile.role === 'owner') {
        menuHTML += `
            <a href="employees.html" class="menu-item">
                <span><i class="fa-solid fa-users"></i> Manage Employees</span>
                <i class="fa-solid fa-chevron-right"></i>
            </a>
            <a href="settings.html" class="menu-item">
                <span><i class="fa-solid fa-sliders"></i> System Settings</span>
                <i class="fa-solid fa-chevron-right"></i>
            </a>
        `;
    }

    menuGroup.innerHTML = menuHTML;
});
