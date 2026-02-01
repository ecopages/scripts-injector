const parent = document.getElementById('demo-nested-parent');
if (parent) {
	parent.style.border = '2px dashed #4F46E5';
	const label = document.createElement('span');
	label.textContent = 'Parent Loaded ';
	label.className = 'absolute top-0 right-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-bl';
	parent.appendChild(label);
}
