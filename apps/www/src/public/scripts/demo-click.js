const btn = document.getElementById('demo-click-btn');
if (btn) {
    btn.innerHTML = '<span>Launched!</span>';
    btn.className = 'btn btn-primary bg-green-600 hover:bg-green-700 shadow-lg transform scale-105 transition-all duration-150';
    btn.setAttribute('data-script-loaded', 'true');
    
    const particle = document.createElement('div');
    particle.className = 'absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping';
    btn.style.position = 'relative';
    btn.appendChild(particle);
}
