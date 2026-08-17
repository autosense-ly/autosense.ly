document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('businessSetupForm');
    const submitBtn = document.getElementById('setupSubmitBtn');
    const businessIdCard = document.getElementById('businessIdCard');
    const businessIdDisplay = document.getElementById('businessIdDisplay');
    const continueBtn = document.getElementById('continueBtn');

    if (!form) return;

    const ownerName = sessionStorage.getItem('pendingOwnerName');
    const ownerEmail = sessionStorage.getItem('pendingOwnerEmail');
    const ownerId = sessionStorage.getItem('pendingOwnerId');

    if (!ownerName || !ownerEmail || !ownerId) {
        alert('Please sign up first.');
        window.location.href = 'signup.html';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const businessName = document.getElementById('bizName').value.trim();
        const currency = document.getElementById('bizCurrency').value;

        if (!businessName) {
            alert('Please enter your business name.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';

        const result = await window.db.createOwnerBusiness({
            businessName: businessName,
            currency: currency,
            ownerName: ownerName,
            ownerEmail: ownerEmail
        });

        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Business';

        if (!result || result.error) {
            alert('Error: ' + (result && result.error ? result.error : 'Something went wrong creating your business.'));
            return;
        }

        sessionStorage.removeItem('pendingOwnerName');
        sessionStorage.removeItem('pendingOwnerEmail');
        sessionStorage.removeItem('pendingOwnerId');

        form.style.display = 'none';
        businessIdDisplay.textContent = result.business.id;
        businessIdCard.style.display = 'block';
    });

    continueBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
});
