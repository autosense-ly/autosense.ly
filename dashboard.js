document.addEventListener('DOMContentLoaded', () => {
    initDateDisplay();
    initCounterAnimations();
});

function initDateDisplay() {
    const dateElement = document.getElementById('currentDate');
    if (!dateElement) return;

    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
}

function initCounterAnimations() {
    const statValues = document.querySelectorAll('.stat-value');

    statValues.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'), 10);
        if (isNaN(target)) return;

        const isCurrency = counter.textContent.includes('₹');
        const duration = 1000; 
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);
        let frame = 0;

        const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentCount = Math.round(target * (1 - Math.pow(1 - progress, 3)));

            if (isCurrency) {
                counter.textContent = `₹${currentCount.toLocaleString('en-IN')}`;
            } else {
                counter.textContent = currentCount;
            }

            if (frame === totalFrames) {
                clearInterval(timer);
            }
        }, frameRate);
    });
}