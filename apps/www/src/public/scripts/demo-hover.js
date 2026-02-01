const hoverArea = document.getElementById('demo-hover-area');
if (hoverArea) {
    hoverArea.innerHTML = `
        <div class="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-150">
            <svg class="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span class="text-lg font-bold text-gray-900 dark:text-white">Activated</span>
            <span class="text-xs text-purple-500 font-medium bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">Ready to Interact</span>
        </div>
    `;
    hoverArea.className = 'h-32 bg-white dark:bg-gray-800 border-2 border-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/10 ring-4 ring-purple-500/5 transition-all duration-150 transform scale-100';
    hoverArea.setAttribute('data-script-loaded', 'true');
}
