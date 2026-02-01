const idleBadge = document.getElementById('demo-idle-badge');
if (idleBadge) {
	idleBadge.classList.remove('bg-gray-200', 'text-gray-500', 'animate-pulse');
	idleBadge.style.backgroundColor = '#115e59';
	idleBadge.style.color = 'white';
	idleBadge.textContent = 'Idle Resource Loaded';
	idleBadge.setAttribute('data-script-loaded', 'true');
}
