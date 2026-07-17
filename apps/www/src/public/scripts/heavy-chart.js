const chartContainer = document.getElementById('heavy-chart-container');
if (chartContainer) {
	chartContainer.innerHTML = '<div class="p-4 bg-primary-container text-on-primary-container rounded">Chart Loaded!</div>';
	chartContainer.setAttribute('data-chart-loaded', 'true');
}
