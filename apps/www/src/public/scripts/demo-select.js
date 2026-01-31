const select = document.getElementById('demo-select');
if (select) {
    select.addEventListener('change', (e) => {
        const val = e.target.value;
        const feedback = document.getElementById('demo-select-feedback');
        if (feedback) {
            feedback.textContent = `Selection changed to: ${val}`;
            feedback.className = 'mt-2 text-sm text-blue-600 font-bold';
        }
        select.setAttribute('data-script-loaded', 'true');
    });
}
