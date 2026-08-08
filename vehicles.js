document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('vehicleList');
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

    listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">Loading...</p>';

    const jobs = window.db ? await window.db.getJobs() : [];

    if (jobs.length === 0) {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No active vehicles in queue.</p>';
        return;
    }

    listContainer.innerHTML = jobs.map(job => {
        const isPending = job.status && job.status.toLowerCase() === 'waiting';
        const badgeClass = isPending ? 'status-badge pending' : 'status-badge in-progress';

        const checkInTime = job.created_at
            ? new Date(job.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '';

        const serviceNames = (job.job_services || [])
            .map(js => js.services ? js.services.name : '')
            .filter(Boolean)
            .join(', ') || 'No service selected';

        return `
            <div class="vehicle-card">
                <div>
                    <h4 class="vehicle-number">${escapeHTML(job.plate_number) || 'No plate'}</h4>
                    <p class="vehicle-info">${escapeHTML(serviceNames)} • ${escapeHTML(job.customer_name) || 'Unknown'}</p>
                    <span class="vehicle-time">Check In: ${checkInTime}</span>
                </div>
                <span class="${badgeClass}">${escapeHTML(job.status) || 'waiting'}</span>
            </div>
        `;
    }).join('');
});
