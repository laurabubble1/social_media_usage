/**
 * Utilitaires réutilisables
 * Fonctions communes pour les modules D3 et les vues de synthèse.
 */

export function clearContainer(container) {
    container.innerHTML = '';
}

export function formatNumber(value, decimals = 1) {
    return Number(value).toFixed(decimals);
}

export function groupBy(data, property) {
    return d3.group(data, (item) => item[property]);
}

export function filterData(data, filters = {}) {
    return data.filter((item) => {
        return Object.keys(filters).every((key) => {
            if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
                return true;
            }

            return item[key] === filters[key] || item[key].toString().includes(filters[key]);
        });
    });
}

export function getColorScale(domain, scheme = d3.schemeTableau10) {
    return d3.scaleOrdinal()
        .domain(domain)
        .range(scheme);
}

export function getCssVariable(variableName) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
}

export function getChartDimensions(container, options = {}) {
    const {
        minWidth = 320,
        fallbackWidth = 720,
        height = 320,
        margin = { top: 24, right: 24, bottom: 56, left: 72 }
    } = options;

    const containerWidth = Math.max(container.clientWidth || fallbackWidth, minWidth);

    return {
        width: containerWidth,
        height,
        margin,
        innerWidth: containerWidth - margin.left - margin.right,
        innerHeight: height - margin.top - margin.bottom
    };
}

export function createSVG(container, options = {}) {
    const dimensions = getChartDimensions(container, options);

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('role', 'img')
        .attr('aria-hidden', 'true');

    const chartGroup = svg.append('g')
        .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    return {
        svg,
        chartGroup,
        ...dimensions
    };
}

export function addLegend(svg, colorScale, x = 10, y = 10) {
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${x},${y})`);

    const items = colorScale.domain();

    legend.selectAll('rect')
        .data(items)
        .enter()
        .append('rect')
        .attr('x', 0)
        .attr('y', (_, index) => index * 20)
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', (item) => colorScale(item));

    legend.selectAll('text')
        .data(items)
        .enter()
        .append('text')
        .attr('x', 24)
        .attr('y', (_, index) => index * 20 + 13)
        .attr('font-size', '12px')
        .text((item) => item);
}
