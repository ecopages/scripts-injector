const select = document.getElementById('demo-select');
if (select) {
	const val = select.value;
	const feedback = document.getElementById('demo-select-feedback');
	if (feedback) {
		feedback.textContent = `Selection changed to: ${val}`;
		feedback.className = 'showcase-feedback showcase-feedback--center';
	}
	select.setAttribute('data-script-loaded', 'true');
}
