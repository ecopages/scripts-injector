const INITIAL_DELAY = 0.5;

function initAccelerationEffect() {
  try {
    const accelerateWords = document.querySelectorAll(".accelerate-word");

    accelerateWords.forEach((element) => {
      const word =
        element.getAttribute("data-word") || element.textContent || "";

      element.innerHTML = word
        .split("")
        .map(
          (letter, index) =>
            `<span data-letter="${index}" style="display: inline-block; animation: spin 0.6s cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; animation-delay: ${INITIAL_DELAY + index * 0.04}s">${
              letter === " " ? "&nbsp;" : letter
            }</span>`,
        )
        .join("");

      const style = document.createElement("style");
      if (!document.querySelector("style[data-spin-animation]")) {
        style.setAttribute("data-spin-animation", "true");
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
    console.error("Acceleration effect error:", error);
  }
}

initAccelerationEffect();

window.addEventListener("theme-changed", () => {
  initAccelerationEffect();
});
