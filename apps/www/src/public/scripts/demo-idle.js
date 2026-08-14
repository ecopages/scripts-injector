const idleBadge = document.getElementById('demo-idle-badge');
if (idleBadge) {
	idleBadge.className = 'rui-chip rui-chip--primary showcase-idle-badge';
	idleBadge.textContent = 'Idle Resource Loaded';
	idleBadge.setAttribute('data-script-loaded', 'true');
}
