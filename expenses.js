document.addEventListener('DOMContentLoaded', async () => {
    const addBtn = document.getElementById('addExpenseBtn');
    const form = document.getElementById('expenseForm');
    const saveBtn = document.getElementById('saveExpenseBtn');
    const listContainer = document.getElementById('expenseList');
    const totalContainer = document.getElementById('expenseTotal');
    const dateInput = document.getElementById('expDate');

    if (!listContainer) return;

    // Default the date field to today
    dateInput.value = new Date().toISOString().split('T')[0];

    addBtn.addEventListener('click', () => {
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
    });

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('expName').value.trim();
        const amount = document.getElementById('expAmount').value;
        const date = dateInput.value;
        const notes = document.getElementById('expNotes').value.trim();

        if (!name) {
            alert('Please enter an expense name.');
            return;
        }
        if (!amount) {
            alert('Please enter an amount.');
            return;
        }
        if (!date) {
            alert('Please pick a date.');
            return;
        }

        const profile = await window.db.getCurrentProfile();
        if (!profile) {
            alert('Could not verify your session. Please log in again.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const result = await window.db.addExpense({
            business_id: profile.business_id,
            name: name,
            amount: Number(amount),
            expense_date: date,
            notes: notes || null,
            created_by: profile.id
        });

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Expense';

        if (!result) {
            alert('Something went wrong saving the expense. Please try again.');
            return;
        }

        document.getElementById('expName').value = '';
        document.getElementById('expAmount').value = '';
        document.getElementById('expNotes').value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
        form.style.display = 'none';

        await loadExpenses();
    });

    await loadExpenses();

    async function loadExpenses() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 20px; font-size: 14px;">Loading...</p>';
        totalContainer.innerHTML = '';

        const expenses = await window.db.getExpenses();

        if (expenses.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No expenses recorded yet.</p>';
            return;
        }

        const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        totalContainer.innerHTML = `Total: ${total.toFixed(2)} LYD`;

        listContainer.innerHTML = expenses.map(exp => {
            const [y, m, d] = exp.expense_date.split('-').map(Number);
            const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const notesText = exp.notes ? ` • ${exp.notes}` : '';

            return `
                <div class="expense-card">
                    <div>
                        <h4 class="expense-name">${exp.name}</h4>
                        <p class="expense-info">${formattedDate}${notesText}</p>
                    </div>
                    <span class="expense-amount">-${Number(exp.amount).toFixed(2)} LYD</span>
                </div>
            `;
        }).join('');
    }
});
