import { clearContainer, createSVG, formatNumber, getCssVariable } from '../utils.js';
import { createTooltip, showTooltip, moveTooltip, hideTooltip } from '../chartTooltip.js';
import { createChartModule } from '../chartFrame.js';

const SERIES = [
    {
        key: 'mental_health_score',
        label: 'Santé mentale',
        colorVariable: '--color-series-mental',
        tooltipLabel: 'Score moyen de santé mentale'
    },
    {
        key: 'sleep_hours_per_night',
        label: 'Sommeil',
        colorVariable: '--color-series-sleep',
        tooltipLabel: 'Nombre moyen d’heures de sommeil'
    }
];

function buildUsageGroups(data) {
    return Array.from(
        d3.rollup(
            data,
            (students) => ({
                count: students.length,
                mental_health_score: d3.mean(students, (student) => student.mental_health_score),
                sleep_hours_per_night: d3.mean(students, (student) => student.sleep_hours_per_night)
            }),
            (student) => student.avg_daily_usage_hours
        ),
        ([usageHours, values]) => ({ usageHours: Number(usageHours), ...values })
    ).sort((first, second) => d3.ascending(first.usageHours, second.usageHours));
}

function buildBubbleData(groups) {
    return SERIES.flatMap((series) => {
        return groups.map((group) => ({
            seriesKey: series.key,
            seriesLabel: series.label,
            tooltipLabel: series.tooltipLabel,
            colorVariable: series.colorVariable,
            usageHours: group.usageHours,
            yValue: group[series.key],
            count: group.count
        }));
    });
}

function getSeriesColor(seriesKey, mentalColor, sleepColor) {
    return seriesKey === 'mental_health_score' ? mentalColor : sleepColor;
}

function areaToRadius(area) {
    return Math.sqrt(area / Math.PI);
}

function renderModuleShell(container) {
    const legendMarkup = `
        <div class="bubble-legend">
            ${SERIES.map((series) => `
                <div class="bubble-legend-item">
                    <span class="bubble-legend-swatch ${series.key}"></span>
                    <span>${series.label}</span>
                </div>
            `).join('')}
        </div>
    `;

    const shell = createChartModule(container, {
        title: 'Sommeil et santé mentale selon l’utilisation',
        topContent: legendMarkup,
        chartMarkup: '<div class="bubble-chart"></div>',
        note: 'Chaque bulle représente un groupe d’étudiants partageant le même temps d’utilisation. La taille indique combien d’étudiants appartiennent à ce groupe.'
    });

    return {
        chartContainer: shell.root.querySelector('.bubble-chart')
    };
}

function renderSeriesLine(chartGroup, seriesData, xScale, yScale, color) {
    const lineGenerator = d3.line()
        .x((datum) => xScale(datum.usageHours))
        .y((datum) => yScale(datum.yValue))
        .curve(d3.curveMonotoneX);

    chartGroup.append('path')
        .datum(seriesData)
        .attr('class', `bubble-line ${seriesData[0].seriesKey}`)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('opacity', 0.65)
        .attr('d', lineGenerator);
}

function updateSeriesFocus(chartGroup, activeSeriesKey) {
    chartGroup.selectAll('.bubble-point')
        .classed('is-dimmed', (datum) => activeSeriesKey !== null && datum.seriesKey !== activeSeriesKey)
        .classed('is-highlighted', (datum) => activeSeriesKey !== null && datum.seriesKey === activeSeriesKey);

    chartGroup.selectAll('.bubble-line')
        .classed('is-dimmed', function () {
            if (activeSeriesKey === null) {
                return false;
            }

            return !d3.select(this).classed(activeSeriesKey);
        })
        .classed('is-highlighted', function () {
            if (activeSeriesKey === null) {
                return false;
            }

            return d3.select(this).classed(activeSeriesKey);
        });

    if (activeSeriesKey !== null) {
        chartGroup.select(`.bubble-series.${activeSeriesKey}`).raise();
    }
}

export function renderUsageImpactBubbles(data, container) {
    const usageGroups = buildUsageGroups(data);
    const bubbleData = buildBubbleData(usageGroups);
    const countExtent = d3.extent(usageGroups, (group) => group.count);
    const radiusDomain = countExtent[0] === countExtent[1]
        ? [0, countExtent[1] || 1]
        : countExtent;

    clearContainer(container);
    const { chartContainer } = renderModuleShell(container);
    const tooltip = createTooltip(chartContainer);

    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');
    const mentalColor = getCssVariable('--color-series-mental');
    const sleepColor = getCssVariable('--color-series-sleep');

    const { chartGroup, innerWidth, innerHeight } = createSVG(chartContainer, {
        height: 460,
        margin: { top: 24, right: 24, bottom: 56, left: 68 }
    });

    const xScale = d3.scaleLinear()
        .domain([0, Math.max(10, d3.max(usageGroups, (group) => group.usageHours))])
        .nice()
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, 10])
        .range([innerHeight, 0]);

    const areaScale = d3.scaleLinear()
        .domain(radiusDomain)
        .range([Math.PI * 3 ** 2, Math.PI * 14 ** 2]);

    chartGroup.append('g')
        .attr('class', 'bubble-grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(10).tickSize(-innerHeight))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor))
        .call((group) => group.selectAll('line').attr('stroke', gridColor));

    chartGroup.append('g')
        .call(d3.axisLeft(yScale).ticks(10).tickSize(-innerWidth))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor))
        .call((group) => group.selectAll('line').attr('stroke', gridColor));

    chartGroup.append('text')
        .attr('class', 'bubble-axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 44)
        .attr('text-anchor', 'middle')
        .text('Heures passées sur les médias sociaux par jour');

    chartGroup.append('text')
        .attr('class', 'bubble-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -46)
        .attr('text-anchor', 'middle')
        .text('Valeur moyenne (0 à 10)');

    chartGroup.on('mouseleave', () => {
        chartGroup.selectAll('.bubble-point').classed('is-hovered', false);
        updateSeriesFocus(chartGroup, null);
        hideTooltip(tooltip);
    });

    const seriesGroups = d3.group(bubbleData, (datum) => datum.seriesKey);

    Array.from(seriesGroups, ([seriesKey, seriesData]) => {
        const seriesGroup = chartGroup.append('g')
            .attr('class', `bubble-series ${seriesKey}`);

        renderSeriesLine(
            seriesGroup,
            seriesData,
            xScale,
            yScale,
            getSeriesColor(seriesKey, mentalColor, sleepColor)
        );

        seriesGroup.selectAll('.bubble-point')
            .data(seriesData)
            .enter()
            .append('circle')
            .attr('class', (datum) => `bubble-point ${datum.seriesKey}`)
            .attr('cx', (datum) => xScale(datum.usageHours))
            .attr('cy', (datum) => yScale(datum.yValue))
            .attr('r', (datum) => areaToRadius(areaScale(datum.count)))
            .attr('fill', (datum) => getSeriesColor(datum.seriesKey, mentalColor, sleepColor))
            .attr('opacity', 0.7)
            .on('mouseenter', function (event, datum) {
                updateSeriesFocus(chartGroup, datum.seriesKey);
                chartGroup.selectAll('.bubble-point').classed('is-hovered', false);
                d3.select(this).classed('is-hovered', true);
                showTooltip(tooltip, event, {
                    title: datum.seriesLabel,
                    lines: [
                        `Utilisation moyenne : ${formatNumber(datum.usageHours, 1)} h`,
                        `${datum.tooltipLabel} : ${formatNumber(datum.yValue, 2)}`,
                        `Étudiants représentés : ${datum.count}`
                    ]
                });
            })
            .on('mousemove', (event) => {
                moveTooltip(tooltip, event);
            })
            .on('mouseleave', function () {
                updateSeriesFocus(chartGroup, null);
                d3.select(this).classed('is-hovered', false);
                hideTooltip(tooltip);
            });
    });
}
