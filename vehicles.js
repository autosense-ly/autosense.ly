document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('vehicleList');
    if (!listContainer) return;

    const STATUS_SEQUENCE = ['waiting', 'washing', 'drying', 'completed', 'delivered'];

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function nextStatus(current) {
        const idx = STATUS_SEQUENCE.indexOf((current || '').toLowerCase());
        if (idx === -1 || idx === STATUS_SEQUENCE.length - 1) return null;
        return STATUS_SEQUENCE[idx + 1];
    }

    function badgeClassFor(status) {
        switch ((status || '').toLowerCase()) {
            case 'waiting': return 'status-badge pending';
            case 'completed':
            case 'delivered': return 'status-badge in-progress';
            default: return 'status-badge in-progress';
        }
    }

    await loadJobs();

    async function loadJobs() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">Loading...</p>';

        const jobs = window.db ? await window.db.getJobs() : [];

        if (jobs.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No active vehicles in queue.</p>';
            return;
        }

        listContainer.innerHTML = jobs.map(job => {
            const checkInTime = job.created_at
                ? new Date(job.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : '';

            const serviceNames = (job.job_services || [])
                .map(js => js.services ? js.services.name : '')
                .filter(Boolean)
                .join(', ') || 'No service selected';

            const upcoming = nextStatus(job.status);
            const advanceButton = upcoming
                ? `<button class="status-advance-btn" data-job-id="${job.id}" data-next-status="${upcoming}">Mark as ${upcoming}</button>`
                : '';

            return `
                <div class="vehicle-card" style="flex-direction: column; align-items: stretch; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 class="vehicle-number">${escapeHTML(job.plate_number) || 'No plate'}</h4>
                            <p class="vehicle-info">${escapeHTML(serviceNames)} • ${escapeHTML(job.customer_name) || 'Unknown'}</p>
                            <span class="vehicle-time">Check In: ${checkInTime}</span>
                        </div>
                        <span class="${badgeClassFor(job.status)}">${escapeHTML(job.status) || 'waiting'}</span>
                    </div>
                    ${advanceButton}
                </div>
            `;
        }).join('');

        document.querySelectorAll('.status-advance-btn').forEach(btn => {
            btn.addEventListener('click', handleAdvance);
        });
    }

    async function handleAdvance(e) {
        const btn = e.currentTarget;
        const jobId = btn.dataset.jobId;
        const newStatus = btn.dataset.nextStatus;

        btn.disabled = true;
        btn.textContent = 'Updating...';

        const result = await window.db.updateJob(jobId, { status: newStatus });

        if (!result) {
            alert('Something went wrong updating the status. Please try again.');
            btn.disabled = false;
            btn.textContent = `Mark as ${newStatus}`;
            return;
        }

        await loadJobs();
    }
});
