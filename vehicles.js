document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('vehicleList');
    if (!listContainer) return;

    const vehicles = window.db ? (window.db.get('vehicles') || []) : [];

    if (vehicles.length === 0) {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No active vehicles in queue.</p>';
        return;
    }

    listContainer.innerHTML = vehicles.map(v => {
        const isPending = v.status && v.status.toLowerCase() === 'pending';
        const badgeClass = isPending ? 'status-badge pending' : 'status-badge in-progress';

        return `
            <div class="vehicle-card">
                <div>
                    <h4 class="vehicle-number">${v.number}</h4>
                    <p class="vehicle-info">${v.service} • ${v.owner}</p>
                    <span class="vehicle-time">Check In: ${v.time}</span>
                </div>
                <span class="${badgeClass}">${v.status || 'In Progress'}</span>
            </div>
        `;
    }).join('');
});