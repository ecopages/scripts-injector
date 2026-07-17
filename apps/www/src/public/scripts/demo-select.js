const select = document.getElementById('demo-select');
if (select) {
	const val = select.value;
	const feedback = document.getElementById('demo-select-feedback');
	if (feedback) {
		feedback.textContent = `Selection changed to: ${val}`;
		feedback.className = 'mt-4 text-center h-4 font-semibold text-accent';
	}
	select.setAttribute('data-script-loaded', 'true');
}
