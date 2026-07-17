const marginBox = document.getElementById('rounded-md');
if (marginBox) {
	marginBox.textContent = 'Loaded early! (Margin hit)';
	marginBox.className =
		'bg-primary text-on-primary flex items-center justify-center rounded-md shadow-lg transition-all duration-1000 w-full';
	marginBox.setAttribute('data-script-loaded', 'true');
}
