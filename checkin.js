document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('checkinForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const number = document.getElementById('vNumber').value.toUpperCase();
            const owner = document.getElementById('vOwner').value;
            const phone = document.getElementById('vPhone').value;
            const serviceSelect = document.getElementById('vService');
            const serviceName = serviceSelect.options[serviceSelect.selectedIndex].text.split(' - ')[0];
            
            const newVehicle = {
                id: Date.now().toString(),
                number: number,
                owner: owner,
                phone: phone,
                service: serviceName,
                status: 'In Progress',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const vehicles = window.db ? (window.db.get('vehicles') || []) : [];
            vehicles.unshift(newVehicle);
            if (window.db) window.db.set('vehicles', vehicles);

            alert('Vehicle registered successfully!');
            window.location.href = 'dashboard.html';
        });
    }
});