const marginBox = document.getElementById('demo-margin-box');
if (marginBox) {
    marginBox.textContent = 'Loaded early! (Margin hit)';
    marginBox.className = 'h-32 bg-orange-500 text-white flex items-center justify-center rounded shadow-lg transition-all duration-1000 w-full';
    marginBox.setAttribute('data-script-loaded', 'true');
}
