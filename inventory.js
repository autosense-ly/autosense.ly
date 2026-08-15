document.addEventListener('DOMContentLoaded', async () => {
    const addBtn = document.getElementById('addExpenseBtn');
    const form = document.getElementById('expenseForm');
    const saveBtn = document.getElementById('saveExpenseBtn');
    const listContainer = document.getElementById('expenseList');
    const totalContainer = document.getElementById('expenseTotal');
    const itemCountEl = document.getElementById('itemCount');
    const dateInput = document.getElementById('expDate');

    if (!listContainer) return;

    let editingId = null;

    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Default the date field to today
    dateInput.value = new Date().toISOString().split('T')[0];

    addBtn.addEventListener('click', () => {
        const isVisible = form.style.display !== 'none';
        if (isVisible) {
            form.style.display = 'none';
        } else {
            resetForm();
            form.style.display = 'block';
        }
    });

    function resetForm() {
        editingId = null;
        document.getElementById('expName').value = '';
        document.getElementById('expCategory').value = '';
        document.getElementById('expUnit').value = '';
        document.getElementById('expQuantity').value = '1';
        document.getElementById('expAmount').value = '';
        document.getElementById('expNotes').value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Item';
    }

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('expName').value.trim();
        const category = document.getElementById('expCategory').value.trim();
        const unit = document.getElementById('expUnit').value.trim();
        const quantity = document.getElementById('expQuantity').value;
        const amount = document.getElementById('expAmount').value;
        const date = dateInput.value;
        const notes = document.getElementById('expNotes').value.trim();

        if (!name) {
            alert('Please enter an item name.');
            return;
        }
        if (!amount) {
            alert('Please enter a price.');
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

        const payload = {
            name: name,
            category: category || null,
            unit: unit || null,
            quantity: quantity ? Number(quantity) : 1,
            amount: Number(amount),
            expense_date: date,
            notes: notes || null
        };

        let result;
        if (editingId) {
            result = await window.db.updateExpense(editingId, payload);
        } else {
            result = await window.db.addExpense({
                ...payload,
                business_id: profile.business_id,
                created_by: profile.id
            });
        }

        saveBtn.disabled = false;

        if (!result) {
            alert('Something went wrong saving the item. Please try again.');
            saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Item';
            return;
        }

        resetForm();
        form.style.display = 'none';

        await loadExpenses();
    });

    async function adjustQuantity(item, delta) {
        const newQty = Math.max(0, Number(item.quantity || 0) + delta);
        const result = await window.db.updateExpense(item.id, { quantity: newQty });
        if (!result) {
            alert('Could not update quantity. Please try again.');
            return;
        }
        await loadExpenses();
    }

    function startEdit(item) {
        editingId = item.id;
        document.getElementById('expName').value = item.name || '';
        document.getElementById('expCategory').value = item.category || '';
        document.getElementById('expUnit').value = item.unit || '';
        document.getElementById('expQuantity').value = item.quantity != null ? item.quantity : 1;
        document.getElementById('expAmount').value = item.amount;
        document.getElementById('expNotes').value = item.notes || '';
        dateInput.value = item.expense_date;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Update Item';
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    async function deleteItem(id) {
        if (!confirm('Delete this item? This cannot be undone.')) return;
        const success = await window.db.deleteExpense(id);
        if (!success) {
            alert('Could not delete this item. Please try again.');
            return;
        }
        await loadExpenses();
    }

    await loadExpenses();

    async function loadExpenses() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 20px; font-size: 14px;">Loading...</p>';
        totalContainer.innerHTML = '';

        const expenses = await window.db.getExpenses();

        itemCountEl.textContent = `${expenses.length} item${expenses.length === 1 ? '' : 's'}`;

        if (expenses.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No items recorded yet.</p>';
            return;
        }

        const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        totalContainer.innerHTML = `Total: ${total.toFixed(2)} LYD`;

        listContainer.innerHTML = expenses.map(exp => {
            const [y, m, d] = exp.expense_date.split('-').map(Number);
            const formattedDate = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const categoryUnit = [exp.category, exp.unit].filter(Boolean).join(' · ');
            const subtitle = categoryUnit || formattedDate;

            return `
                <div class="expense-card">
                    <div class="item-icon-badge"><i class="fa-solid fa-box"></i></div>
                    <div class="item-middle">
                        <h4 class="expense-name">${escapeHTML(exp.name)}</h4>
                        <p class="expense-info">${escapeHTML(subtitle)}</p>
                    </div>
                    <div class="item-right">
                        <div class="qty-stepper">
                            <button class="qty-btn" data-action="dec" data-id="${exp.id}">−</button>
                            <span class="qty-value">${exp.quantity != null ? exp.quantity : 1}</span>
                            <button class="qty-btn" data-action="inc" data-id="${exp.id}">+</button>
                        </div>
                        <span class="expense-amount">${Number(exp.amount).toFixed(2)} LYD</span>
                        <div class="item-actions">
                            <button class="item-edit-btn" data-id="${exp.id}"><i class="fa-solid fa-pen"></i></button>
                            <button class="item-delete-btn" data-id="${exp.id}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = expenses.find(e => e.id === btn.dataset.id);
                if (!item) return;
                const delta = btn.dataset.action === 'inc' ? 1 : -1;
                adjustQuantity(item, delta);
            });
        });

        listContainer.querySelectorAll('.item-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = expenses.find(e => e.id === btn.dataset.id);
                if (item) startEdit(item);
            });
        });

        listContainer.querySelectorAll('.item-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteItem(btn.dataset.id));
        });
    }
});
