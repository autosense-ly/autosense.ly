document.addEventListener('DOMContentLoaded', async () => {
    const addBtn = document.getElementById('addServiceBtn');
    const form = document.getElementById('serviceForm');
    const saveBtn = document.getElementById('saveServiceBtn');
    const listContainer = document.getElementById('serviceList');
    const filterPills = document.querySelectorAll('.filter-pill');

    if (!listContainer) return;

    let allServices = [];
    let currentFilter = 'all';

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    addBtn.addEventListener('click', () => {
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
    });

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('svcName').value.trim();
        const price = document.getElementById('svcPrice').value;

        if (!name) {
            alert('Please enter a service name.');
            return;
        }
        if (!price) {
            alert('Please enter a price.');
            return;
        }

        const profile = await window.db.getCurrentProfile();
        if (!profile) {
            alert('Could not verify your session. Please log in again.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const result = await window.db.createService({
            business_id: profile.business_id,
            name: name,
            price: Number(price),
            enabled: true
        });

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Service';

        if (!result) {
            alert('Something went wrong saving the service. Please try again.');
            return;
        }

        document.getElementById('svcName').value = '';
        document.getElementById('svcPrice').value = '';
        form.style.display = 'none';

        await loadServices();
    });

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            render();
        });
    });

    function updateCounts() {
        const allCount = allServices.length;
        const activeCount = allServices.filter(s => s.enabled).length;
        const disabledCount = allServices.filter(s => !s.enabled).length;

        document.getElementById('countAll').textContent = allCount;
        document.getElementById('countActive').textContent = activeCount;
        document.getElementById('countDisabled').textContent = disabledCount;
    }

    function render() {
        const filtered = allServices.filter(svc => {
            if (currentFilter === 'all') return true;
            if (currentFilter === 'active') return svc.enabled;
            if (currentFilter === 'disabled') return !svc.enabled;
            return true;
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No services match.</p>';
            return;
        }

        listContainer.innerHTML = filtered.map(svc => {
            const statusText = svc.enabled ? 'Active' : 'Disabled';
            const statusClass = svc.enabled ? 'status-active' : 'status-disabled';
            const toggleLabel = svc.enabled ? 'Disable' : 'Enable';

            return `
                <div class="service-card">
                    <div>
                        <h4 class="service-name">${escapeHTML(svc.name)}</h4>
                        <span class="service-status ${statusClass}">${statusText}</span>
                        <button class="service-toggle-btn" data-id="${svc.id}" data-enabled="${svc.enabled}">${toggleLabel}</button>
                    </div>
                    <span class="service-price">${Number(svc.price).toFixed(2)} LYD</span>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.service-toggle-btn').forEach(btn => {
            btn.addEventListener('click', handleToggle);
        });
    }

    await loadServices();

    async function loadServices() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 20px; font-size: 14px;">Loading...</p>';

        allServices = await window.db.getAllServices();
        updateCounts();

        if (allServices.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No services added yet. Add one so check-in has options to offer.</p>';
            return;
        }

        render();
    }

    async function handleToggle(e) {
        const btn = e.currentTarget;
        const id = btn.dataset.id;
        const currentlyEnabled = btn.dataset.enabled === 'true';

        btn.disabled = true;
        btn.textContent = 'Updating...';

        const result = await window.db.updateService(id, { enabled: !currentlyEnabled });

        if (!result) {
            alert('Something went wrong updating the service. Please try again.');
            btn.disabled = false;
            btn.textContent = currentlyEnabled ? 'Disable' : 'Enable';
            return;
        }

        await loadServices();
    }
});
