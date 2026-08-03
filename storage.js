class StorageManager {
    constructor() {
        this.prefix = 'cwp_';
        this.initDefaults();
    }

    initDefaults() {
        if (!this.get('vehicles')) {
            this.set('vehicles', [
                { id: '1', number: 'MH 12 AB 1234', owner: 'Rahul Sharma', service: 'Super Foam Wash', status: 'In Progress', amount: 850, time: '10:30 AM' },
                { id: '2', number: 'DL 01 XY 9999', owner: 'Ananya Verma', service: 'Interior Cleaning', status: 'Pending', amount: 1200, time: '11:15 AM' }
            ]);
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage Set Error:', e);
        }
    }
}

window.db = new StorageManager();