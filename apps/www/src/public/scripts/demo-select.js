const select = document.getElementById('demo-select');
if (select) {
    const val = select.value;
    const feedback = document.getElementById('demo-select-feedback');
    if (feedback) {
        feedback.textContent = `Selection changed to: ${val}`;
        feedback.className = 'mt-2 text-sm text-blue-600 font-bold';
    }
    select.setAttribute('data-script-loaded', 'true');
}
