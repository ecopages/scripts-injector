const btn = document.getElementById('demo-click-btn');
if (btn) {
	btn.innerHTML = '<span>Launched!</span>';
	btn.className = 'rui-button rui-button--filled rui-button--md shadow-control';
	btn.setAttribute('data-script-loaded', 'true');

	const particle = document.createElement('div');
	particle.className = 'absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary animate-ping';
	btn.style.position = 'relative';
	btn.appendChild(particle);
}
