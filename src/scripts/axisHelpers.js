/**
 * Helpers pour créer et styliser les axes D3
 */
import { getCssVariable } from './utils.js';

export function createBottomAxis(chartGroup, scale, options = {}) {
    const {
        ticks = 10,
        tickSize = 0,
        tickFormat = null,
        label = null,
        labelY = 42
    } = options;

    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');

    const axis = d3.axisBottom(scale)
        .ticks(ticks)
        .tickSize(tickSize);

    if (tickFormat) {
        axis.tickFormat(tickFormat);
    }

    chartGroup.append('g')
        .attr('class', 'axis axis-bottom')
        .call(axis)
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor))
        .call((group) => {
            if (tickSize !== 0) {
                group.selectAll('line').attr('stroke', gridColor);
            }
        });

    if (label) {
        chartGroup.append('text')
            .attr('class', 'axis-label')
            .attr('x', scale.range()[1] / 2)
            .attr('y', labelY)
            .attr('text-anchor', 'middle')
            .text(label);
    }
}

export function createLeftAxis(chartGroup, scale, options = {}) {
    const {
        ticks = 6,
        tickSize = 0,
        tickFormat = null
    } = options;

    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');

    const axis = d3.axisLeft(scale)
        .ticks(ticks)
        .tickSize(tickSize);

    if (tickFormat) {
        axis.tickFormat(tickFormat);
    }

    chartGroup.append('g')
        .attr('class', 'axis axis-left')
        .call(axis)
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor))
        .call((group) => {
            if (tickSize !== 0) {
                group.selectAll('line').attr('stroke', gridColor);
            }
        });
}

export function createOrdinalAxis(chartGroup, scale, options = {}) {
    const {
        orient = 'bottom',
        tickFormat = null,
        label = null,
        labelY = 42
    } = options;

    const axisColor = getCssVariable('--color-text-secondary');

    const axisFunc = orient === 'left' ? d3.axisLeft : d3.axisBottom;
    const axis = axisFunc(scale);

    if (tickFormat) {
        axis.tickFormat(tickFormat);
    }

    if (orient === 'bottom') {
        chartGroup.append('g')
            .attr('class', 'axis axis-bottom')
            .attr('transform', `translate(0,0)`)
            .call(axis)
            .call((group) => group.select('.domain').remove())
            .call((group) => group.selectAll('text').attr('fill', axisColor));

        if (label) {
            chartGroup.append('text')
                .attr('class', 'axis-label')
                .attr('x', scale.range()[1] / 2)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .text(label);
        }
    } else if (orient === 'left') {
        chartGroup.append('g')
            .attr('class', 'axis axis-left')
            .call(axis)
            .call((group) => group.select('.domain').remove())
            .call((group) => group.selectAll('text').attr('fill', axisColor));
    }
}
