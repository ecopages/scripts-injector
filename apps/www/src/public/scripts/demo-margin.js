const marginBox = document.getElementById('demo-margin-box');
if (marginBox) {
	marginBox.textContent = 'Loaded early! (Margin hit)';
	marginBox.className = 'showcase-margin-box showcase-margin-box--loaded';
	marginBox.setAttribute('data-script-loaded', 'true');
}
