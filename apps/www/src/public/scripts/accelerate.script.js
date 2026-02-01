const SPEED_MULTIPLIER = 1.4;
const ANIMATION_DURATION = 0.22;
const INITIAL_DELAY = 0.18;
const STAGGER_INTERVAL = 0.02;
const MIN_STAGGER = 0.01;

function easeOutOct(value) {
	return 1 - Math.pow(1 - value, 8);
}

function initAccelerationEffect() {
	try {
		const accelerateWords = document.querySelectorAll('.accelerate-word');

		accelerateWords.forEach((element) => {
			const word = element.getAttribute('data-word') || element.textContent || '';
			const letters = word.split('');
			const lastIndex = Math.max(letters.length - 1, 1);

			element.innerHTML = letters
				.map(
					(letter, index) => {
						const progress = index / lastIndex;
						const easedIndex = easeOutOct(progress) * lastIndex;
						const easedDelay = easedIndex * (STAGGER_INTERVAL - MIN_STAGGER);
						const baseDelay = INITIAL_DELAY + index * MIN_STAGGER + easedDelay;
						const delay = baseDelay / SPEED_MULTIPLIER;

						return `<span data-letter="${index}" style="display: inline-block; animation: spin ${
							ANIMATION_DURATION / SPEED_MULTIPLIER
						}s cubic-bezier(0.42, 0, 0.58, 1) forwards; animation-delay: ${delay}s">${
							letter === ' ' ? '&nbsp;' : letter
						}</span>`;
					},
				)
				.join('');

			const style = document.createElement('style');
			if (!document.querySelector('style[data-spin-animation]')) {
				style.setAttribute('data-spin-animation', 'true');
				style.textContent = `
          @keyframes spin {
            from {
              transform: rotateY(0deg) skewX(0deg);
            }
            to {
              transform: rotateY(360deg) skewX(-8deg);
            }
          }
        `;
				document.head.appendChild(style);
			}
		});
	} catch (error) {
		console.error('Acceleration effect error:', error);
	}
}

initAccelerationEffect();

window.addEventListener('theme-changed', () => {
	initAccelerationEffect();
});
