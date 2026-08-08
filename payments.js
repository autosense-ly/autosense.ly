document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('paymentList');
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

    await loadUnpaidJobs();

    async function loadUnpaidJobs() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">Loading...</p>';

        const jobs = await window.db.getJobs();

        // A job counts as unpaid if none of its payment records are marked paid
        const unpaidJobs = jobs.filter(job => {
            const payments = job.payments || [];
            return !payments.some(p => p.paid === true);
        });

        if (unpaidJobs.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No outstanding payments — everything is collected.</p>';
            return;
        }

        listContainer.innerHTML = unpaidJobs.map(job => {
            const serviceNames = (job.job_services || [])
                .map(js => js.services ? js.services.name : '')
                .filter(Boolean)
                .join(', ') || 'No service selected';

            return `
                <div class="payment-card" data-job-id="${job.id}">
                    <div class="payment-top-row">
                        <div>
                            <h4 class="payment-plate">${escapeHTML(job.plate_number) || 'No plate'}</h4>
                            <p class="payment-info">${escapeHTML(serviceNames)} • ${escapeHTML(job.customer_name) || 'Unknown'}</p>
                        </div>
                        <span class="payment-amount">${Number(job.total_price).toFixed(2)} LYD</span>
                    </div>
                    <div class="payment-actions">
                        <select class="payment-method-select" id="method-${job.id}">
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                        </select>
                        <button class="pay-btn" data-job-id="${job.id}" data-amount="${job.total_price}">
                            Collect
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.pay-btn').forEach(btn => {
            btn.addEventListener('click', handleCollect);
        });
    }

    async function handleCollect(e) {
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
            alert('Something went wrong collecting the payment. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Collect';
            return;
        }

        alert('Payment collected & receipt recorded!');
        await loadUnpaidJobs();
    }
});
