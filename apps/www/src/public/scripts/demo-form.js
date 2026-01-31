const form = document.getElementById('demo-form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const feedback = document.getElementById('demo-form-feedback');
        if (feedback) {
            feedback.textContent = 'Form validated and submitted via injected script.';
            feedback.className = 'mt-2 text-sm text-green-600 font-semibold';
        }
        form.setAttribute('data-script-loaded', 'true');
    });
}
