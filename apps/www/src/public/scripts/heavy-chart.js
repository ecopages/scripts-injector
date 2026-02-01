const chartContainer = document.getElementById('heavy-chart-container');
if (chartContainer) {
	chartContainer.innerHTML = '<div class="p-4 bg-green-100 text-green-800 rounded">Chart Loaded!</div>';
	chartContainer.setAttribute('data-chart-loaded', 'true');
}
