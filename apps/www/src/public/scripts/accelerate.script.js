const SPEED_MULTIPLIER = 1.4;
const ANIMATION_DURATION = 0.22;
const INITIAL_DELAY = 0.5;
const STAGGER_INTERVAL = 0.02;
const MIN_STAGGER = 0.01;
const GLINT_SPEED = 1.5;
const GLINT_OFFSET = 0.02;
const GLINT_STAGGER = 0.01;
const GLINT_DURATION = 0.2;

function easeOutOct(value) {
	return 1 - Math.pow(1 - value, 8);
}

function initAccelerationEffect() {
	try {
		const accelerateWords = document.querySelectorAll('.accelerate-word');

		accelerateWords.forEach((element) => {
			const existingWord = element.getAttribute('data-word');
			const storedWord = element.getAttribute('data-original-word');
			const word = storedWord || existingWord || element.textContent || '';

			if (!storedWord) {
				element.setAttribute('data-original-word', word);
			}
			const words = word.trim().split(/\s+/).filter(Boolean);
			const totalLetters = words.reduce((count, part) => count + part.length, 0);
			const lastIndex = Math.max(totalLetters - 1, 1);
			let letterIndex = 0;
			const spinDuration = ANIMATION_DURATION / SPEED_MULTIPLIER;

			element.innerHTML = words
				.map((wordPart, wordIndex) => {
					const lettersMarkup = wordPart
						.split('')
						.map((letter) => {
							const progress = letterIndex / lastIndex;
							const easedIndex = easeOutOct(progress) * lastIndex;
							const easedDelay = easedIndex * (STAGGER_INTERVAL - MIN_STAGGER);
							const baseDelay = INITIAL_DELAY + letterIndex * MIN_STAGGER + easedDelay;
							const delay = baseDelay / SPEED_MULTIPLIER;

							const glintDelay =
								(delay + spinDuration + GLINT_OFFSET + letterIndex * GLINT_STAGGER) / GLINT_SPEED;
							const glintDuration = GLINT_DURATION / GLINT_SPEED;
							const animation = `spin ${spinDuration}s cubic-bezier(0.42, 0, 0.58, 1) ${delay}s forwards, glint ${glintDuration}s ease-in ${glintDelay}s both`;

							const markup = `<span data-letter="${letterIndex}" style="display: inline-block; animation: ${animation};">${letter}</span>`;
							letterIndex += 1;
							return markup;
						})
						.join('');

					const isLastWord = wordIndex === words.length - 1;
					return `<span class="accelerate-word-part${isLastWord ? '' : ' has-space'}">${lettersMarkup}</span>`;
				})
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
					@keyframes glint {
						0% {
							filter: brightness(1);
							text-shadow: none;
						}
						45% {
							filter: brightness(2.6);
							text-shadow: 0 0 10px rgba(255, 255, 255, 0.85),
								0 0 18px rgba(120, 200, 255, 0.7),
								0 0 28px rgba(80, 160, 255, 0.55);
						}
						100% {
							filter: brightness(1);
							text-shadow: none;
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
