const hoverArea = document.getElementById('demo-hover-area');
if (hoverArea) {
	hoverArea.innerHTML = `
        <div class="flex flex-col items-center gap-2">
            <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-lg font-semibold text-on-background">Activated</span>
            <span class="rui-chip rui-chip--primary">Ready to interact</span>
        </div>
    `;
	hoverArea.className = 'showcase-trigger showcase-trigger--active';
	hoverArea.setAttribute('data-script-loaded', 'true');
}
