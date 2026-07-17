const btn = document.getElementById('demo-click-btn');
if (btn) {
	btn.innerHTML = '<span>Launched!</span>';
	btn.className =
		'button button--primary shadow-lg transform scale-105 transition-all duration-150';
	btn.setAttribute('data-script-loaded', 'true');

	const particle = document.createElement('div');
	particle.className = 'absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-ping';
	btn.style.position = 'relative';
	btn.appendChild(particle);
}
