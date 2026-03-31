/**
 * Helpers pour créer des hitbox bands et des limites géométriques
 */

/**
 * Crée des bands avec limites basées sur des valeurs à l'échelle
 * @param {Array} values - Valeurs triées
 * @param {Function} scale - Échelle D3
 * @param {Number} width - Largeur totale
 * @returns {Array} Array de {value, x, width}
 */
export function createBands(values, scale, width) {
    return values.map((value, index) => {
        const previous = index === 0 ? 0 : (scale(values[index - 1]) + scale(value)) / 2;
        const next = index === values.length - 1 ? width : (scale(value) + scale(values[index + 1])) / 2;

        return {
            value,
            x: previous,
            width: Math.max(next - previous, 8)
        };
    });
}

/**
 * Crée des bands avec limites basées sur des scores (adaptés pour score distribution)
 * @param {Array} scores - Scores (ex: addiction scores 0-10)
 * @param {Function} scale - Échelle D3
 * @param {Number} width - Largeur totale
 * @returns {Array} Array de {score, x, width}
 */
export function createScoreBands(scores, scale, width) {
    return scores.map((score, index) => {
        const previous = index === 0 ? 0 : (scale(scores[index - 1]) + scale(score)) / 2;
        const next = index === scores.length - 1 ? width : (scale(score) + scale(scores[index + 1])) / 2;

        return {
            score,
            x: previous,
            width: Math.max(next - previous, 8)
        };
    });
}
