import {
    clearContainer,
    createSVG,
    formatNumber,
    getCssVariable
} from '../utils.js';
import { createTooltip, showTooltip, moveTooltip, hideTooltip } from '../chartTooltip.js';
import { createChartModule } from '../chartFrame.js';
import { makeBarChartKeyboardAccessible } from '../keyboardChartInteraction.js';
import { makeBarKeyboardAccessible, createDataFormatter } from '../chartAccessibilityHelper.js';

const METRICS = [
    {
        key: 'sleep_hours',
        title: 'Sommeil moyen',
        accessor: (student) => student.sleep_hours_per_night,
        valueLabel: (value) => `${formatNumber(value, 2)} h`,
        tooltipLabel: 'Heures de sommeil moyennes: '
    },
    {
        key: 'mental_health',
        title: 'Santé mentale moyenne',
        accessor: (student) => student.mental_health_score,
        valueLabel: (value) => formatNumber(value, 2),
        tooltipLabel: 'Score de santé mentale moyen: '
    },
    {
        key: 'conflicts',
        title: 'Conflits moyens',
        accessor: (student) => student.conflicts_over_social_media,
        valueLabel: (value) => formatNumber(value, 2),
        tooltipLabel: 'Nombre moyen de conflits: '
    },
    {
        key: 'academic_impact',
        title: 'Impact académique négatif',
        accessor: (student) => (student.affects_academic_performance ? 100 : 0),
        valueLabel: (value) => `${formatNumber(value, 1)} %`,
        tooltipLabel: 'Pourcentage d’impact négatif: '
    }
];

function summarizeByPlatform(data) {
    return Array.from(
        d3.rollup(
            data,
            (students) => {
                const metrics = {};

                METRICS.forEach((metric) => {
                    metrics[metric.key] = d3.mean(students, metric.accessor);
                });

                metrics.sampleSize = students.length;
                return metrics;
            },
            (student) => student.most_used_platform
        ),
        ([platform, values]) => ({ platform, ...values })
    );
}

function renderModuleShell(container) {
    const shell = createChartModule(container, {
        title: 'Profil des plateformes',
        chartMarkup: '<div class="overview-multiples"></div>',
        note: 'Le survole d\'une barre affiche la valeur moyenne et met en évidence la même plateforme dans les quatre vues.'
    });

    return {
        chartsHost: shell.root.querySelector('.overview-multiples')
    };
}

function updateHighlight(activePlatform) {
    const bars = d3.selectAll('.platform-bar');
    const labels = d3.selectAll('.platform-label');
    const values = d3.selectAll('.mini-chart-value');

    if (!activePlatform) {
        bars.classed('is-highlighted', false).classed('is-dimmed', false);
        labels.classed('is-highlighted', false).classed('is-dimmed', false);
        values.classed('is-highlighted', false).classed('is-dimmed', false);
        return;
    }

    bars
        .classed('is-highlighted', (datum) => datum.platform === activePlatform)
        .classed('is-dimmed', (datum) => datum.platform !== activePlatform);

    labels
        .classed('is-highlighted', (datum) => datum === activePlatform)
        .classed('is-dimmed', (datum) => datum !== activePlatform);

    values
        .classed('is-highlighted', (datum) => datum.platform === activePlatform)
        .classed('is-dimmed', (datum) => datum.platform !== activePlatform);
}

function renderSmallChart(metric, platformData, parent, tooltip) {
    const sortedData = [...platformData].sort((first, second) => d3.descending(first[metric.key], second[metric.key]));

    const chartCard = document.createElement('article');
    chartCard.className = 'mini-chart-card';
    parent.appendChild(chartCard);

    const cardTitle = document.createElement('h4');
    cardTitle.className = 'mini-chart-title';
    cardTitle.textContent = metric.title;
    chartCard.appendChild(cardTitle);

    const chartCanvas = document.createElement('div');
    chartCanvas.className = 'mini-chart-canvas';
    chartCard.appendChild(chartCanvas);

    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');
    const labelColor = getCssVariable('--color-text-primary');
    const barColor = getCssVariable('--color-chart-bar');

    const { chartGroup, innerWidth, innerHeight } = createSVG(chartCanvas, {
        height: 320,
        margin: { top: 12, right: 56, bottom: 44, left: 116 }
    });

    const yScale = d3.scaleBand()
        .domain(sortedData.map((item) => item.platform))
        .range([0, innerHeight])
        .padding(0.24);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(sortedData, (item) => item[metric.key]) * 1.15])
        .nice()
        .range([0, innerWidth]);

    chartGroup.append('g')
        .attr('class', 'overview-grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor))
        .call((group) => group.selectAll('line').attr('stroke', gridColor));

    chartGroup.append('g')
        .call(d3.axisLeft(yScale))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text')
            .attr('class', 'platform-label')
            .attr('fill', axisColor));

    chartGroup.selectAll('.platform-bar')
        .data(sortedData)
        .enter()
        .append('rect')
        .attr('class', 'platform-bar')
        .attr('data-platform', (datum) => datum.platform)
        .attr('data-keyboard-index', (d, i) => i)
        .attr('data-tooltip-title', (datum) => datum.platform)
        .attr('data-tooltip-lines', (datum) => `${metric.tooltipLabel} ${metric.valueLabel(datum[metric.key])}`)
        .attr('data-tooltip-content', (datum) => `${datum.platform}: ${metric.valueLabel(datum[metric.key])}`)
        .attr('data-keyboard-announcement', (datum) => `${datum.platform}: ${metric.title} ${datum[metric.key].toFixed(2)}`)
        .attr('x', 0)
        .attr('y', (datum) => yScale(datum.platform))
        .attr('width', (datum) => xScale(datum[metric.key]))
        .attr('height', yScale.bandwidth())
        .attr('rx', 10)
        .attr('fill', barColor)
        .on('mouseenter', function (event, datum) {
            updateHighlight(datum.platform);
            showTooltip(tooltip, event, {
                title: datum.platform,
                lines: [`${metric.tooltipLabel} : ${metric.valueLabel(datum[metric.key])}`]
            });
            d3.select(this).raise();
        })
        .on('mousemove', (event) => {
            moveTooltip(tooltip, event);
        })
        .on('mouseleave', () => {
            updateHighlight(null);
            hideTooltip(tooltip);
        });

    chartGroup.selectAll('.mini-chart-value')
        .data(sortedData)
        .enter()
        .append('text')
        .attr('class', 'mini-chart-value')
        .attr('x', (datum) => xScale(datum[metric.key]) + 8)
        .attr('y', (datum) => yScale(datum.platform) + yScale.bandwidth() / 2)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'start')
        .attr('fill', labelColor)
        .attr('font-size', 11)
        .attr('font-weight', 700)
        .text((datum) => metric.valueLabel(datum[metric.key]));

    // Ajouter l'interaction clavier pour les barres
    setTimeout(() => {
        makeBarChartKeyboardAccessible(chartCanvas, {
            onDataSelect: (bar) => {
                const data = bar.getAttribute('data-tooltip-content');
                console.log('Bar selected:', data);
            }
        });
    }, 0);
}

export function renderPlatformComparison(data, container) {
    const platformData = summarizeByPlatform(data);

    clearContainer(container);
    const shell = renderModuleShell(container);
    const tooltip = createTooltip(shell.chartsHost);

    METRICS.forEach((metric) => {
        renderSmallChart(metric, platformData, shell.chartsHost, tooltip);
    });
}
