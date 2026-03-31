function setActiveLink(navLinks, activeId) {
    navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${activeId}`;
        link.classList.toggle('active', isActive);
    });
}

export function initializeNavigation() {
    const mainContainer = document.querySelector('.main-container');
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const sections = Array.from(document.querySelectorAll('.story-step[id]'));

    if (!mainContainer || navLinks.length === 0 || sections.length === 0) {
        return;
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            const targetId = link.getAttribute('href')?.slice(1);
            const targetElement = targetId ? document.getElementById(targetId) : null;

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntry = entries
                .filter((entry) => entry.isIntersecting)
                .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

            if (visibleEntry?.target?.id) {
                setActiveLink(navLinks, visibleEntry.target.id);
            }
        },
        {
            root: mainContainer,
            threshold: [0.35, 0.6, 0.85]
        }
    );

    sections.forEach((section) => observer.observe(section));
    setActiveLink(navLinks, sections[0].id);
}
