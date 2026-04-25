/**
 * Helper pour ajouter l'accessibilité clavier aux graphiques D3
 */

/**
 * Ajoute les attributs nécessaires à une barre pour l'interaction clavier
 */
export function makeBarKeyboardAccessible(bar, data, formatter) {
    bar.attr('data-keyboard-index', (d, i) => i)
        .attr('data-tooltip-content', (d) => formatter(d))
        .attr('data-keyboard-announcement', (d) => {
            if (typeof formatter === 'function') {
                return formatter(d);
            }
            return JSON.stringify(d);
        });
}

/**
 * Ajoute les attributs nécessaires à un point (scatter/bubble) pour l'interaction clavier
 */
export function makePointKeyboardAccessible(point, data, formatter) {
    point.attr('data-keyboard-point', true)
        .attr('data-keyboard-index', (d, i) => i)
        .attr('data-tooltip-content', (d) => formatter(d))
        .attr('data-keyboard-announcement', (d) => {
            if (typeof formatter === 'function') {
                return formatter(d);
            }
            return JSON.stringify(d);
        });
}

/**
 * Ajoute les attributs nécessaires à une cellule de heatmap pour l'interaction clavier
 */
export function makeCellKeyboardAccessible(cell, data, formatter, rows = 0, cols = 0) {
    cell.attr('data-keyboard-cell', true)
        .attr('data-keyboard-index', (d, i) => i)
        .attr('data-keyboard-rows', rows)
        .attr('data-keyboard-cols', cols)
        .attr('data-tooltip-content', (d) => formatter(d))
        .attr('data-keyboard-announcement', (d) => {
            if (typeof formatter === 'function') {
                return formatter(d);
            }
            return JSON.stringify(d);
        });
}

/**
 * Ajoute les attributs nécessaires à un point de beeswarm pour l'interaction clavier
 */
export function makeDotKeyboardAccessible(dot, data, formatter) {
    dot.attr('data-keyboard-dot', true)
        .attr('data-keyboard-index', (d, i) => i)
        .attr('data-tooltip-content', (d) => formatter(d))
        .attr('data-keyboard-announcement', (d) => {
            if (typeof formatter === 'function') {
                return formatter(d);
            }
            return JSON.stringify(d);
        });
}

/**
 * Formateur standard pour les données
 */
export function createDataFormatter(labels) {
    return (data) => {
        return Object.entries(labels)
            .map(([key, label]) => {
                const value = data[key];
                if (value === undefined) return '';
                return `${label}: ${typeof value === 'number' ? value.toFixed(2) : value}`;
            })
            .filter(Boolean)
            .join('. ');
    };
}
