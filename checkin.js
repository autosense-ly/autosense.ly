document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('checkinForm');
    if (!form) return;

    const serviceSelect = document.getElementById('vService');

    // Load real services from Supabase into the dropdown
    const services = window.db ? await window.db.getServices() : [];

    if (services.length === 0) {
        serviceSelect.innerHTML = '<option value="">No services available — add one in Settings</option>';
    } else {
        serviceSelect.innerHTML = services.map(s =>
            `<option value="${s.id}">${s.name} - ${Number(s.price).toFixed(2)} LYD</option>`
        ).join('');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('.primary-btn');
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Checking in...';

        const plateNumber = document.getElementById('vNumber').value.toUpperCase();
        const carModel = document.getElementById('vModel').value;
        const customerName = document.getElementById('vOwner').value;
        const customerPhone = document.getElementById('vPhone').value;
        const serviceId = serviceSelect.value;

        if (!serviceId) {
            alert('Please select a service, or add one in Settings first.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            return;
        }

        const profile = await window.db.getCurrentProfile();
        if (!profile) {
            alert('Could not verify your session. Please log in again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            return;
        }

        const selectedService = services.find(s => s.id === serviceId);

        const newJob = await window.db.createJob({
            business_id: profile.business_id,
            plate_number: plateNumber,
            car_model: carModel,
            customer_name: customerName,
            customer_phone: customerPhone,
            status: 'waiting',
            total_price: selectedService.price,
            created_by: profile.id
        });

        if (!newJob) {
            alert('Something went wrong creating the job. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
            return;
        }

        // Link the chosen service to this job
        const { error: linkError } = await window.db.supabase
            .from('job_services')
            .insert({
                job_id: newJob.id,
                service_id: selectedService.id,
                price_at_time: selectedService.price
            });

        if (linkError) {
            console.error('job_services link error:', linkError);
        }

        alert('Vehicle checked in successfully!');
        window.location.href = 'vehicles.html';
    });
});
