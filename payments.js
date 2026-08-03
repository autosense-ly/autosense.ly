document.addEventListener('DOMContentLoaded', () => {
    const payBtns = document.querySelectorAll('.pay-btn');
    payBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Payment collected & Digital Receipt generated!');
            btn.parentElement.style.opacity = '0.5';
            btn.innerText = 'Paid ✓';
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.disabled = true;
        });
    });
});