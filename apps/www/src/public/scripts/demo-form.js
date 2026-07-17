const form = document.getElementById('demo-form');
if (form) {
	form.addEventListener('submit', (e) => e.preventDefault());
	form.setAttribute('data-script-loaded', 'true');
	const feedback = document.getElementById('demo-form-feedback');
	if (feedback) {
		feedback.textContent = 'Form validated and submitted';
		feedback.className = 'text-sm text-accent font-medium';
		console.log('Demo form script executed: Form validated and submitted', new FormData(form).get('email'));
	}
}
