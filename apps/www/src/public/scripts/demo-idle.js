const idleBadge = document.getElementById('demo-idle-badge');
if (idleBadge) {
	idleBadge.classList.remove('animate-pulse', 'text-muted-foreground');
	idleBadge.classList.add('bg-primary', 'text-on-primary', 'border-primary');
	idleBadge.textContent = 'Idle Resource Loaded';
	idleBadge.setAttribute('data-script-loaded', 'true');
}
