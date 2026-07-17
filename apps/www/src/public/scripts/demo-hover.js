const hoverArea = document.getElementById('demo-hover-area');
if (hoverArea) {
	hoverArea.innerHTML = `
        <div class="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-150">
            <svg class="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-lg font-bold text-on-background">Activated</span>
            <span class="text-xs text-on-primary-container font-medium bg-primary-container px-2 py-1 rounded-full">Ready to Interact</span>
        </div>
    `;
	hoverArea.className =
		'h-32 bg-background border-2 border-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/10 ring-4 ring-primary/5 transition-all duration-150 transform scale-100';
	hoverArea.setAttribute('data-script-loaded', 'true');
}
