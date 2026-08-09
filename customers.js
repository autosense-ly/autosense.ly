document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.querySelector('.customer-list');
    const searchInput = document.querySelector('.search-input');
    if (!listContainer) return;

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    let allCustomers = [];

    await loadCustomers();

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            renderCustomers(allCustomers);
            return;
        }
        const filtered = allCustomers.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.plate.toLowerCase().includes(query) ||
            c.phone.toLowerCase().includes(query)
        );
        renderCustomers(filtered);
    });

    async function loadCustomers() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">Loading...</p>';

        const jobs = await window.db.getJobs();

        if (jobs.length === 0) {
            allCustomers = [];
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No customers yet — they\'ll appear here after check-ins.</p>';
            return;
        }

        // Group jobs into customers by phone (fallback to name if no phone given)
        const groups = {};
        jobs.forEach(job => {
            const key = (job.customer_phone && job.customer_phone.trim())
                ? job.customer_phone.trim()
                : `name:${job.customer_name || 'Unknown'}`;

            if (!groups[key]) groups[key] = [];
            groups[key].push(job);
        });

        allCustomers = Object.values(groups).map(jobsForCustomer => {
            const sorted = jobsForCustomer.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const latest = sorted[0];
            return {
                name: latest.customer_name || 'Unknown',
                phone: latest.customer_phone || '',
                plate: latest.plate_number || '',
                visits: jobsForCustomer.length
            };
        }).sort((a, b) => b.visits - a.visits);

        renderCustomers(allCustomers);
    }

    function renderCustomers(customers) {
        if (customers.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No matching customers.</p>';
            return;
        }

        listContainer.innerHTML = customers.map(c => {
            const isVip = c.visits >= 5;
            const tagClass = isVip ? 'loyalty-tag vip' : 'loyalty-tag regular';
            const tagText = isVip ? 'VIP Member' : 'Regular';
            const contactLine = [c.plate, c.phone].filter(Boolean).map(escapeHTML).join(' • ') || 'No contact details';

            return `
                <div class="customer-card">
                    <div class="customer-avatar"><i class="fa-solid fa-user"></i></div>
                    <div class="customer-info">
                        <h4>${escapeHTML(c.name)}</h4>
                        <p>${contactLine}</p>
                        <span class="${tagClass}">${c.visits} Visit${c.visits === 1 ? '' : 's'} • ${tagText}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
});
