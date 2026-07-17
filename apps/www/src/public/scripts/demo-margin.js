const marginBox = document.getElementById('demo-margin-box');
if (marginBox) {
	marginBox.textContent = 'Loaded early! (Margin hit)';
	marginBox.className =
		'h-32 bg-primary text-on-primary border border-primary flex items-center justify-center rounded-md shadow-lg transition-all duration-1000 w-full animate-bounce animate-duration-1000';
	marginBox.setAttribute('data-script-loaded', 'true');
}
