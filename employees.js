document.addEventListener('DOMContentLoaded', async () => {
    const addBtn = document.getElementById('addEmployeeBtn');
    const form = document.getElementById('employeeForm');
    const saveBtn = document.getElementById('saveEmployeeBtn');
    const payTypeSelect = document.getElementById('empPayType');
    const salaryFields = document.getElementById('salaryFields');
    const percentageFields = document.getElementById('percentageFields');
    const listContainer = document.getElementById('employeeList');

    if (!listContainer) return;

    addBtn.addEventListener('click', () => {
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
    });

    payTypeSelect.addEventListener('change', () => {
        if (payTypeSelect.value === 'salary') {
            salaryFields.style.display = 'block';
            percentageFields.style.display = 'none';
        } else {
            salaryFields.style.display = 'none';
            percentageFields.style.display = 'block';
        }
    });

    saveBtn.addEventListener('click', async () => {
        const name = document.getElementById('empName').value.trim();
        if (!name) {
            alert('Please enter a name.');
            return;
        }

        const payType = payTypeSelect.value;
        const profile = await window.db.getCurrentProfile();
        if (!profile) {
            alert('Could not verify your session. Please log in again.');
            return;
        }

        const employeeData = {
            business_id: profile.business_id,
            name: name,
            pay_type: payType
        };

        if (payType === 'salary') {
            const amount = document.getElementById('empSalaryAmount').value;
            if (!amount) {
                alert('Please enter a salary amount.');
                return;
            }
            employeeData.salary_amount = Number(amount);
            employeeData.salary_frequency = document.getElementById('empSalaryFrequency').value;
        } else {
            const rate = document.getElementById('empPercentageRate').value;
            if (!rate) {
                alert('Please enter a percentage rate.');
                return;
            }
            employeeData.percentage_rate = Number(rate);
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const result = await window.db.createEmployee(employeeData);

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Employee';

        if (!result) {
            alert('Something went wrong saving the employee. Please try again.');
            return;
        }

        document.getElementById('empName').value = '';
        document.getElementById('empSalaryAmount').value = '';
        document.getElementById('empPercentageRate').value = '';
        form.style.display = 'none';

        await loadEmployees();
    });

    await loadEmployees();

    async function loadEmployees() {
        listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 20px; font-size: 14px;">Loading...</p>';

        const employees = await window.db.getEmployees();

        if (employees.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; text-align: center; margin-top: 40px; font-size: 14px;">No employees added yet.</p>';
            return;
        }

        listContainer.innerHTML = employees.map(emp => {
            const payInfo = emp.pay_type === 'salary'
                ? `${Number(emp.salary_amount).toFixed(2)} LYD / ${emp.salary_frequency}`
                : `${Number(emp.percentage_rate)}% per job`;

            return `
                <div class="employee-card">
                    <div>
                        <h4 class="employee-name">${emp.name}</h4>
                        <p class="employee-pay-info">${payInfo}</p>
                    </div>
                    <span class="employee-pay-badge">${emp.pay_type}</span>
                </div>
            `;
        }).join('');
    }
});
