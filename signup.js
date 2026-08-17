document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    if (!form) return;

    const toggleBtns = document.querySelectorAll('.signup-toggle-btn');
    const businessIdGroup = document.getElementById('businessIdGroup');
    const businessIdInput = document.getElementById('businessId');
    const submitBtn = document.getElementById('signupSubmitBtn');
    let mode = 'owner';

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mode = btn.dataset.mode;
            if (mode === 'manager') {
                businessIdGroup.style.display = 'block';
                businessIdInput.required = true;
                submitBtn.textContent = 'Join Business';
            } else {
                businessIdGroup.style.display = 'none';
                businessIdInput.required = false;
                submitBtn.textContent = 'Create Business Account';
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const businessId = businessIdInput.value.trim();

        if (!name) {
            alert('Please enter your name.');
            return;
        }

        if (mode === 'manager' && !businessId) {
            alert('Please enter the Business ID your owner gave you.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        const signUpResult = await window.db.signUp(email, password);

        if (!signUpResult.success) {
            alert(signUpResult.error || 'Could not create account. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = mode === 'manager' ? 'Join Business' : 'Create Business Account';
            return;
        }

        const userId = signUpResult.user.id;

        if (mode === 'owner') {
            sessionStorage.setItem('pendingOwnerName', name);
            sessionStorage.setItem('pendingOwnerEmail', email);
            sessionStorage.setItem('pendingOwnerId', userId);
            window.location.href = 'business-setup.html';
        } else {
            const result = await window.db.createManagerProfile({
                businessId: businessId,
                name: name,
                email: email
            });

            if (!result || result.error) {
                await window.db.signOut();
                alert('Error: ' + (result && result.error ? result.error : 'Could not join that business. Please check the Business ID and try again.'));
                submitBtn.disabled = false;
                submitBtn.textContent = 'Join Business';
                return;
            }

            window.location.href = 'vehicles.html';
        }
    });
});
