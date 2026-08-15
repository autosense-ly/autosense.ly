document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('vehicleList');
    if (!listContainer) return;

    const searchInput = document.getElementById('searchInput');
    const filterPills = document.querySelectorAll('.filter-pill');

    const STATUS_SEQUENCE = ['waiting', 'washing', 'drying', 'completed', 'delivered'];

    let allJobs = [];
    let currentFilter = 'all';
    let currentSearch = '';

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

    function isPaid(job) {
        const payments = job.payments || [];
        return payments.some(p => p.paid === true);
    }

    function matchesFilter(job, filter) {
        const status = (job.status || '').toLowerCase();
        if (filter === 'all') return true;
        return status === filter;
    }

    function matchesSearch(job, query) {
        if (!query) return true;
        const q = query.toLowerCase();
        const plate = (job.plate_number || '').toLowerCase();
        const name = (job.customer_name || '').toLowerCase();
        return plate.includes(q) || name.includes(q);
    }

    function updateCounts() {
        const counts = { all: allJobs.length, waiting: 0, washing: 0, drying: 0, completed: 0, delivered: 0 };
        allJobs.forEach(j => {
            const status = (j.status || '').toLowerCase();
            if (counts.hasOwnProperty(status)) counts[status]++;
        });

        document.getElementById('countAll').textContent = counts.all;
        document.getElementById('countWaiting').textContent = counts.waiting;
        document.getElementById('countWashing').textContent = counts.washing;
        document.getElementById('countDrying').textContent = counts.drying;
        document.getElementById('countCompleted').textContent = counts.completed;
        document.getElementById('countDelivered').textContent = counts.delivered;
    }

    function render() {
        const filtered = allJobs
            .filter(job => matchesFilter(job, currentFilter))
            .filter(job => matchesSearch(job, currentSearch));

        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No vehicles match.</p>';
            return;
        }

        listContainer.innerHTML = filtered.map(job => {
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

            const paid = isPaid(job);
            const paymentControl = paid
                ? `<span class="paid-badge"><i class="fa-solid fa-circle-check"></i> Paid</span>`
                : `<div class="pay-control">
                     <select class="payment-method-select" id="method-${job.id}">
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                     </select>
                     <button class="mark-paid-btn" data-job-id="${job.id}" data-amount="${job.total_price}">
                        Mark as Paid — ${Number(job.total_price).toFixed(2)} LYD
                     </button>
                   </div>`;

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
                    ${paymentControl}
                </div>
            `;
        }).join('');

        document.querySelectorAll('.status-advance-btn').forEach(btn => {
            btn.addEventListener('click', handleAdvance);
        });

        document.querySelectorAll('.mark-paid-btn').forEach(btn => {
            btn.addEventListener('click', handleMarkPaid);
        });
    }

    async function loadJobs() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">Loading...</p>';
        allJobs = window.db ? await window.db.getJobs() : [];
        updateCounts();
        render();
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

    async function handleMarkPaid(e) {
        const btn = e.currentTarget;
        const jobId = btn.dataset.jobId;
        const amount = btn.dataset.amount;
        const methodSelect = document.getElementById(`method-${jobId}`);
        const method = methodSelect.value;

        btn.disabled = true;
        btn.textContent = 'Processing...';

        const result = await window.db.addPayment({
            job_id: jobId,
            amount: Number(amount),
            method: method,
            paid: true,
            paid_at: new Date().toISOString()
        });

        if (!result) {
            alert('Something went wrong recording the payment. Please try again.');
            btn.disabled = false;
            btn.textContent = `Mark as Paid — ${Number(amount).toFixed(2)} LYD`;
            return;
        }

        await loadJobs();
    }

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        render();
    });

    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            render();
        });
    });

    await loadJobs();
});
