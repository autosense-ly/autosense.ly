document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db) return;

    const report = await window.db.getMonthlyReport();

    setText('reportRevenue', `${report.revenue.toFixed(2)} LYD`);
    setText('reportWashes', report.totalWashes);
    setText('reportExpenses', report.totalExpenses.toFixed(2));
    setText('reportEmployeePay', report.employeePayments.toFixed(2));
    setText('reportNetProfitCard', report.netProfit.toFixed(2));
    setText('reportNetProfit', `Net Profit: ${report.netProfit.toFixed(2)} LYD`);

    // Color the net profit line red if the business is running at a loss this month
    const netProfitEl = document.getElementById('reportNetProfit');
    if (netProfitEl && report.netProfit < 0) {
        netProfitEl.style.color = '#ef4444';
    }
});

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}
