const idleBadge = document.getElementById('demo-idle-badge');
if (idleBadge) {
    idleBadge.classList.replace('bg-gray-200', 'bg-teal-500');
    idleBadge.classList.replace('text-gray-500', 'text-white');
    idleBadge.textContent = 'Idle Resource Loaded';
    idleBadge.setAttribute('data-script-loaded', 'true');
}
