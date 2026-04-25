/**
 * Interaction clavier pour les graphiques D3
 * Permet de naviguer dans les points de données avec les flèches et d'annoncer les valeurs
 */

// ARIA live region pour l'annonce des données
function createLiveRegion() {
    let region = document.getElementById('chart-announcer');
    if (!region) {
        region = document.createElement('div');
        region.id = 'chart-announcer';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.style.position = 'absolute';
        region.style.left = '-10000px';
        region.style.width = '1px';
        region.style.height = '1px';
        region.style.overflow = 'hidden';
        document.body.appendChild(region);
    }
    return region;
}

/**
 * Annonce un message via le lecteur d'écran
 */
function announceData(message) {
    const region = createLiveRegion();
    region.textContent = message;
}

function buildTooltipContent(element) {
    const title = element.getAttribute('data-tooltip-title');
    const lines = (element.getAttribute('data-tooltip-lines') || '')
        .split('||')
        .map((line) => line.trim())
        .filter(Boolean);
    const fallback = element.getAttribute('data-tooltip-content');

    if (title || lines.length > 0) {
        return {
            title: title || fallback || '',
            lines
        };
    }

    if (!fallback) {
        return null;
    }

    return {
        title: fallback,
        lines: []
    };
}

function showKeyboardTooltip(element) {
    const tooltip = d3.select('.chart-tooltip');
    const tooltipApi = window.__chartTooltip || {};
    const content = buildTooltipContent(element);

    if (tooltip.empty() || !content || typeof tooltipApi.showTooltipAt !== 'function') {
        return;
    }

    const rect = element.getBoundingClientRect();

    tooltipApi.showTooltipAt(
        tooltip,
        {
            left: rect.left + rect.width / 2 + 12,
            top: rect.top - 12
        },
        content
    );
}

function hideKeyboardTooltip() {
    const tooltip = d3.select('.chart-tooltip');
    const tooltipApi = window.__chartTooltip || {};

    if (tooltip.empty() || typeof tooltipApi.hideTooltip !== 'function') {
        return;
    }

    tooltipApi.hideTooltip(tooltip);
}

function moveFocus(items, currentIndex, nextIndex) {
    if (nextIndex === currentIndex || !items[nextIndex]) {
        return currentIndex;
    }

    items[currentIndex].setAttribute('tabindex', '-1');
    items[nextIndex].setAttribute('tabindex', '0');
    items[nextIndex].focus();
    return nextIndex;
}

/**
 * Rend les barres d'un graphique navigables au clavier
 */
export function makeBarChartKeyboardAccessible(chartContainer, options = {}) {
    const { onDataSelect = () => {} } = options;

    const bars = chartContainer.querySelectorAll('[data-keyboard-index]');
    if (bars.length === 0) return;

    let currentIndex = 0;

    // Rendre les barres focusables
    bars.forEach((bar, index) => {
        bar.setAttribute('tabindex', index === 0 ? '0' : '-1');
        bar.setAttribute('role', 'button');
        bar.setAttribute('data-keyboard-index', index);

        // Afficher tooltip au focus
        bar.addEventListener('focus', () => {
            currentIndex = index;
            showKeyboardTooltip(bar);
            const announcement = bar.getAttribute('data-keyboard-announcement') || bar.getAttribute('data-tooltip-content');
            if (announcement) {
                announceData(announcement);
            }
        });

        bar.addEventListener('blur', () => {
            hideKeyboardTooltip();
        });

        // Navigation aux flèches
        bar.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % bars.length;
                currentIndex = moveFocus(bars, currentIndex, nextIndex);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + bars.length) % bars.length;
                currentIndex = moveFocus(bars, currentIndex, prevIndex);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDataSelect(bars[currentIndex]);
            }
        });
    });
}

/**
 * Rend les points d'un graphique de type scatter/bubble navigables au clavier
 */
export function makeScatterChartKeyboardAccessible(chartContainer, options = {}) {
    const {
        onDataSelect = () => {},
        rows = 4,
        cols = 4
    } = options;

    const points = chartContainer.querySelectorAll('[data-keyboard-point]');
    if (points.length === 0) return;

    let currentIndex = 0;

    points.forEach((point, index) => {
        point.setAttribute('tabindex', index === 0 ? '0' : '-1');
        point.setAttribute('role', 'button');
        point.setAttribute('data-keyboard-index', index);

        point.addEventListener('focus', () => {
            currentIndex = index;
            showKeyboardTooltip(point);
            const announcement = point.getAttribute('data-keyboard-announcement') || point.getAttribute('data-tooltip-content');
            if (announcement) {
                announceData(announcement);
            }
            point.classList.add('is-keyboard-focused');
        });

        point.addEventListener('blur', () => {
            hideKeyboardTooltip();
            point.classList.remove('is-keyboard-focused');
        });

        point.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = Math.min(currentIndex + 1, points.length - 1);
                currentIndex = moveFocus(points, currentIndex, nextIndex);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = Math.max(currentIndex - 1, 0);
                currentIndex = moveFocus(points, currentIndex, prevIndex);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = Math.min(currentIndex + cols, points.length - 1);
                currentIndex = moveFocus(points, currentIndex, nextIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = Math.max(currentIndex - cols, 0);
                currentIndex = moveFocus(points, currentIndex, prevIndex);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDataSelect(points[currentIndex]);
            }
        });
    });
}

/**
 * Rend les cellules d'une heatmap navigables au clavier
 */
export function makeHeatmapKeyboardAccessible(chartContainer, options = {}) {
    const {
        onDataSelect = () => {},
        cols = 0
    } = options;

    const cells = chartContainer.querySelectorAll('[data-keyboard-cell]');
    if (cells.length === 0) return;

    let currentIndex = 0;

    cells.forEach((cell, index) => {
        cell.setAttribute('tabindex', index === 0 ? '0' : '-1');
        cell.setAttribute('role', 'button');
        cell.setAttribute('data-keyboard-index', index);

        cell.addEventListener('focus', () => {
            currentIndex = index;
            showKeyboardTooltip(cell);
            const announcement = cell.getAttribute('data-keyboard-announcement') || cell.getAttribute('data-tooltip-content');
            if (announcement) {
                announceData(announcement);
            }
            cell.classList.add('is-keyboard-focused');
        });

        cell.addEventListener('blur', () => {
            hideKeyboardTooltip();
            cell.classList.remove('is-keyboard-focused');
        });

        cell.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = Math.min(currentIndex + 1, cells.length - 1);
                currentIndex = moveFocus(cells, currentIndex, nextIndex);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = Math.max(currentIndex - 1, 0);
                currentIndex = moveFocus(cells, currentIndex, prevIndex);
            } else if (e.key === 'ArrowDown' && cols > 0) {
                e.preventDefault();
                const nextIndex = Math.min(currentIndex + cols, cells.length - 1);
                currentIndex = moveFocus(cells, currentIndex, nextIndex);
            } else if (e.key === 'ArrowUp' && cols > 0) {
                e.preventDefault();
                const prevIndex = Math.max(currentIndex - cols, 0);
                currentIndex = moveFocus(cells, currentIndex, prevIndex);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDataSelect(cells[currentIndex]);
            }
        });
    });
}

/**
 * Rend les points d'un beeswarm navigables au clavier
 */
export function makeBeeswarmKeyboardAccessible(chartContainer, options = {}) {
    const { onDataSelect = () => {} } = options;

    const dots = chartContainer.querySelectorAll('[data-keyboard-dot]');
    if (dots.length === 0) return;

    let currentIndex = 0;

    dots.forEach((dot, index) => {
        dot.setAttribute('tabindex', index === 0 ? '0' : '-1');
        dot.setAttribute('role', 'button');
        dot.setAttribute('data-keyboard-index', index);

        dot.addEventListener('focus', () => {
            currentIndex = index;
            showKeyboardTooltip(dot);
            const announcement = dot.getAttribute('data-keyboard-announcement') || dot.getAttribute('data-tooltip-content');
            if (announcement) {
                announceData(announcement);
            }
            dot.classList.add('is-keyboard-focused');
        });

        dot.addEventListener('blur', () => {
            hideKeyboardTooltip();
            dot.classList.remove('is-keyboard-focused');
        });

        dot.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % dots.length;
                currentIndex = moveFocus(dots, currentIndex, nextIndex);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + dots.length) % dots.length;
                currentIndex = moveFocus(dots, currentIndex, prevIndex);
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onDataSelect(dots[currentIndex]);
            }
        });
    });
}

/**
 * Ajoute des styles pour l'interaction clavier
 */
export function addKeyboardInteractionStyles() {
    if (document.getElementById('keyboard-interaction-styles')) return;

    const style = document.createElement('style');
    style.id = 'keyboard-interaction-styles';
    style.textContent = `
        /* Éléments du graphique focusables au clavier */
        [data-keyboard-index] {
            cursor: pointer;
            outline: none;
            transition: filter 0.2s ease;
        }

        [data-keyboard-index]:focus-visible {
            filter: brightness(1.15);
            outline: 2px solid var(--color-accent-highlight);
            outline-offset: 2px;
        }

        [data-keyboard-index].is-keyboard-focused {
            filter: brightness(1.15);
        }

        /* Lecture d'écran: live region */
        #chart-announcer {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        }

        /* Amélioration visuelle des points/barres au focus */
        svg [data-keyboard-index]:focus-visible {
            stroke: var(--color-accent-highlight) !important;
            stroke-width: 2px !important;
            filter: brightness(1.15);
        }
    `;
    document.head.appendChild(style);
}

export {
    announceData,
    createLiveRegion
};
