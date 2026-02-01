console.log('Script loaded: Analytics (Idle)');
window.dummyAnalytics = {
	initialized: true,
	timestamp: Date.now(),
};
console.log('Analytics initialized at', window.dummyAnalytics.timestamp);
