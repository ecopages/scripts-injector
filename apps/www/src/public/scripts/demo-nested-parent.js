const parent = document.getElementById('demo-nested-parent');
if (parent) {
	parent.classList.add('border-primary', 'border-2', 'border-dashed');
	const label = document.createElement('span');
	label.textContent = 'Parent Loaded ';
	label.className = 'absolute top-0 left-0 bg-primary text-on-primary text-xs px-2 py-1 rounded-br-sm';
	parent.appendChild(label);
}
