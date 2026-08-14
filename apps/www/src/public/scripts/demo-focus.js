const input = document.getElementById('demo-focus-input');

if (input) {
	input.classList.add('ring-2', 'ring-focus-ring', 'bg-primary-container', 'border-primary');
	input.placeholder = 'Search active...';
	input.setAttribute('data-script-loaded', 'true');

	const feedback = document.getElementById('demo-focus-feedback');
	if (feedback) {
		feedback.textContent = 'Input activated via script';
		feedback.className = 'showcase-feedback';
	}
}
