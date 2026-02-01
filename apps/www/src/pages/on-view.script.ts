const onViewObserverOptions = {
	root: null,
	rootMargin: '0px',
	threshold: 0.1,
};

const onViewObserver = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		if (entry.isIntersecting) {
			entry.target.classList.remove('opacity-0', 'translate-y-4');
			entry.target.classList.add('opacity-100', 'translate-y-0');
			onViewObserver.unobserve(entry.target);
		}
	});
}, onViewObserverOptions);

const animatedElements = document.querySelectorAll('.showcase-info');
animatedElements.forEach((el, index) => {
	(el as HTMLElement).style.transitionDelay = `${(index % 2) * 100}ms`;
	onViewObserver.observe(el);
});
