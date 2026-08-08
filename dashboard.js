document.addEventListener('DOMContentLoaded', async () => {
    initDateDisplay();
    await loadDashboardStats();
});

function initDateDisplay() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;

    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
}

async function loadDashboardStats() {
    if (!window.db) return;

    const stats = await window.db.getDashboardStats();

    setText('revenueAmount', `${stats.revenue.toFixed(2)} LYD`);
    setText('statCarsWashed', stats.carsWashed);
    setText('statPending', stats.pending);
    setText('statEmployees', stats.employees);
    setText('statAvgIncome', `${stats.avgIncome.toFixed(2)} LYD`);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
