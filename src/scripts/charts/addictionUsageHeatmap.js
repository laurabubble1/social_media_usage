import { clearContainer, createSVG, formatNumber, getCssVariable } from '../utils.js';
import { hideTooltip, moveTooltip, showTooltip } from '../chartTooltip.js';
import { createChartModule } from '../chartFrame.js';

function buildHeatmapData(data) {
    const grouped = d3.rollup(
        data,
        (students) => ({
            averageConflicts: d3.mean(students, (student) => student.conflicts_over_social_media),
            count: students.length
        }),
        (student) => Math.round(student.avg_daily_usage_hours),
        (student) => student.addicted_score
    );

    const usageHours = Array.from(grouped.keys()).sort((first, second) => d3.ascending(first, second));
    const addictionScores = Array.from(new Set(data.map((student) => student.addicted_score))).sort((first, second) => d3.descending(first, second));

    const cells = [];

    usageHours.forEach((hour) => {
        addictionScores.forEach((score) => {
            const values = grouped.get(hour)?.get(score);

            cells.push({
                hour,
                score,
                averageConflicts: values ? values.averageConflicts : null,
                count: values ? values.count : 0
            });
        });
    });

    return { usageHours, addictionScores, cells };
}

function renderModuleShell(container) {
    const shell = createChartModule(container, {
        title: 'Heat map des conflits moyens',
        moduleTag: 'Module addictionUsageHeatmap',
        topContent: `
            <div class="heatmap-legend">
                <span>Faible conflit moyen</span>
                <div class="heatmap-legend-gradient"></div>
                <span>Conflit moyen élevé</span>
            </div>
        `,
        chartMarkup: '<div class="heatmap-chart"></div>',
        includeTooltip: true,
        note: 'Chaque case représente une combinaison entre une heure d\'utilisation quotidienne entière et un score d\'addiction. La couleur indique le niveau moyen de conflits associé.'
    });

    return {
        chartContainer: shell.root.querySelector('.heatmap-chart'),
        tooltip: shell.tooltip
    };
}

export function renderAddictionUsageHeatmap(data, container) {
    const { usageHours, addictionScores, cells } = buildHeatmapData(data);
    const conflictValues = cells
        .filter((cell) => cell.averageConflicts !== null)
        .map((cell) => cell.averageConflicts);

    clearContainer(container);
    const { chartContainer, tooltip } = renderModuleShell(container);

    const axisColor = getCssVariable('--color-text-secondary');
    const gridBorder = getCssVariable('--color-surface');
    const emptyFill = getCssVariable('--color-heatmap-empty');

    const { chartGroup, innerWidth, innerHeight } = createSVG(chartContainer, {
        height: 460,
        margin: { top: 16, right: 16, bottom: 56, left: 72 }
    });

    const xScale = d3.scaleBand()
        .domain(usageHours)
        .range([0, innerWidth])
        .padding(0.04);

    const yScale = d3.scaleBand()
        .domain(addictionScores)
        .range([0, innerHeight])
        .padding(0.04);

    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(conflictValues) || 1])
        .interpolator(d3.interpolateYlOrRd);

    chartGroup.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor));

    chartGroup.append('g')
        .call(d3.axisLeft(yScale))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor));

    chartGroup.append('text')
        .attr('class', 'heatmap-axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 42)
        .attr('text-anchor', 'middle')
        .text('Heures d\'utilisation quotidiennes (entières)');

    chartGroup.append('text')
        .attr('class', 'heatmap-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -48)
        .attr('text-anchor', 'middle')
        .text('Score d\'addiction');

    chartGroup.selectAll('.heatmap-cell')
        .data(cells)
        .enter()
        .append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', (datum) => xScale(datum.hour))
        .attr('y', (datum) => yScale(datum.score))
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('rx', 4)
        .attr('fill', (datum) => datum.averageConflicts === null ? emptyFill : colorScale(datum.averageConflicts))
        .attr('stroke', gridBorder)
        .attr('stroke-width', 1)
        .on('mouseenter', function handleMouseEnter(event, datum) {
            d3.select(this).classed('is-hovered', true);
            showTooltip(tooltip, event, {
                title: `${datum.hour} h par jour`,
                lines: [
                    `Score d'addiction : ${datum.score}`,
                    `Conflit moyen : ${datum.averageConflicts === null ? 'Aucune donnée' : formatNumber(datum.averageConflicts, 2)}`,
                    `Étudiants représentés : ${datum.count}`
                ]
            });
        })
        .on('mousemove', function handleMouseMove(event, datum) {
            moveTooltip(tooltip, event);
        })
        .on('mouseleave', function handleMouseLeave() {
            d3.select(this).classed('is-hovered', false);
            hideTooltip(tooltip);
        });
}
