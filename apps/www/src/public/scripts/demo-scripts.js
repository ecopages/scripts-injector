const btn = document.getElementById('demo-click-btn');
if (btn) {
    btn.style.border = '2px solid red';
    btn.setAttribute('data-script-loaded', 'true');
}

console.log('Script loaded: Demo Hover');
const hoverArea = document.getElementById('demo-hover-area');
if (hoverArea) {
    hoverArea.style.backgroundColor = 'lightgreen';
    hoverArea.setAttribute('data-script-loaded', 'true');
}

console.log('Script loaded: Demo Focus');
const input = document.getElementById('demo-focus-input');
if (input) {
    input.style.backgroundColor = 'lightyellow';
    input.setAttribute('data-script-loaded', 'true');
}
