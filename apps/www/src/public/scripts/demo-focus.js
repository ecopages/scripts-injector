const input = document.getElementById('demo-focus-input');

if (input) {
	input.classList.add('ring-4', 'ring-blue-400', 'bg-blue-50');
	input.placeholder = 'Search active...';
	input.setAttribute('data-script-loaded', 'true');

	const feedback = document.createElement('div');
	feedback.textContent = 'Input activated via script!';
	feedback.className = 'text-xs text-blue-600 mt-1 font-bold';
	input.parentNode.appendChild(feedback);
}
