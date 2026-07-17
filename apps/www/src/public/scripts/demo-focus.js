const input = document.getElementById('demo-focus-input');

if (input) {
	input.classList.add('ring-4', 'ring-primary/30', 'bg-primary-container', 'border-primary/40');
	input.placeholder = 'Search active...';
	input.setAttribute('data-script-loaded', 'true');

	const feedback = document.getElementById('demo-focus-feedback');
	if (feedback) {
		feedback.textContent = 'Input activated via script';
		feedback.className = 'text-sm text-accent font-medium';
	}
}
