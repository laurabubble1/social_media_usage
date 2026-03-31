export function initializeScrollReveal() {
    const mainContainer = document.querySelector('.main-container');
    const steps = document.querySelectorAll('.story-step');

    if (!mainContainer || steps.length === 0) {
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        },
        {
            root: mainContainer,
            threshold: 0.2,
            rootMargin: '0px 0px -10% 0px'
        }
    );

    steps.forEach((step) => observer.observe(step));
}
