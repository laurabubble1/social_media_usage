import { clearContainer, createSVG, formatNumber, getCssVariable } from '../utils.js';
import { hideTooltip, moveTooltip, showTooltip } from '../chartTooltip.js';
import { createChartModule } from '../chartFrame.js';
import { createBands } from '../bandHelpers.js';

const SWARM_CONFIGS = [
    {
        key: 'avg_daily_usage_hours',
        title: 'Impact académique selon le temps d\'utilisation',
        axisLabel: 'Heures passées sur les médias sociaux par jour',
        tooltipLabel: 'Heures d\'utilisation',
        formatter: (value) => `${formatNumber(value, 1)} h`
    },
    {
        key: 'sleep_hours_per_night',
        title: 'Impact académique selon le sommeil',
        axisLabel: 'Heures de sommeil par nuit',
        tooltipLabel: 'Heures de sommeil',
        formatter: (value) => `${formatNumber(value, 1)} h`
    }
];

const IMPACT_LABELS = {
    true: 'Oui',
    false: 'Non'
};

function buildBandSummaries(data, valueKey) {
    const grouped = d3.rollup(
        data,
        (students) => ({
            yesCount: students.filter((student) => student.affects_academic_performance).length,
            noCount: students.filter((student) => !student.affects_academic_performance).length,
            totalCount: students.length
        }),
        (student) => Number(student[valueKey].toFixed(1))
    );

    return Array.from(grouped, ([value, counts]) => ({ value, ...counts }))
        .sort((first, second) => d3.ascending(first.value, second.value));
}

function buildSwarmNodes(data, valueKey) {
    return data.map((student, index) => ({
        id: `${valueKey}-${index}`,
        xValue: Number(student[valueKey].toFixed(1)),
        impact: student.affects_academic_performance,
        yCategory: student.affects_academic_performance ? 1 : 0
    }));
}

function runBeeswarmSimulation(nodes, xScale, rowScale) {
    const simulationNodes = nodes.map((node) => ({ ...node }));

    const simulation = d3.forceSimulation(simulationNodes)
        .force('x', d3.forceX((node) => xScale(node.xValue)).strength(1))
        .force('y', d3.forceY((node) => rowScale(node.yCategory)).strength(0.5))
        .force('collide', d3.forceCollide(5))
        .stop();

    for (let index = 0; index < 300; index += 1) {
        simulation.tick();
    }

    return simulationNodes;
}

function renderModuleShell(container) {
    const shell = createChartModule(container, {
        title: 'Beeswarms sur l impact academique',
        moduleTag: 'Module academicImpactBeeswarms',
        topContent: `
            <div class="beeswarm-legend">
                <div class="beeswarm-legend-item">
                    <span class="beeswarm-legend-dot negative"></span>
                    <span>Impact négatif déclaré</span>
                </div>
                <div class="beeswarm-legend-item">
                    <span class="beeswarm-legend-dot positive"></span>
                    <span>Pas d'impact négatif déclaré</span>
                </div>
            </div>
        `,
        chartMarkup: '<div class="beeswarm-grid"></div>',
        includeTooltip: true,
        note: 'Chaque bille représente un étudiant. La bande verticale au survol résume les réponses Oui et Non pour une même valeur d\'heures.'
    });

    return {
        chartsHost: shell.root.querySelector('.beeswarm-grid'),
        tooltip: shell.tooltip
    };
}

function createBandBoundaries(sortedValues, xScale, innerWidth) {
    return createBands(sortedValues, xScale, innerWidth);
}

function renderSingleBeeswarm(config, data, parent, tooltip) {
    const card = document.createElement('article');
    card.className = 'beeswarm-card';
    parent.appendChild(card);

    const title = document.createElement('h4');
    title.className = 'mini-chart-title';
    title.textContent = config.title;
    card.appendChild(title);

    const canvas = document.createElement('div');
    canvas.className = 'beeswarm-canvas';
    card.appendChild(canvas);

    const summaries = buildBandSummaries(data, config.key);
    const nodes = buildSwarmNodes(data, config.key);

    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');
    const positiveColor = getCssVariable('--color-beeswarm-positive');
    const negativeColor = getCssVariable('--color-beeswarm-negative');
    const bandColor = getCssVariable('--color-beeswarm-band');

    const { svg, chartGroup, innerWidth, innerHeight } = createSVG(canvas, {
        height: 240,
        margin: { top: 12, right: 12, bottom: 48, left: 88 }
    });

    const xExtent = d3.extent(nodes, (node) => node.xValue);
    const xScale = d3.scaleLinear()
        .domain([
            Math.floor((xExtent[0] ?? 0) * 10) / 10,
            Math.ceil((xExtent[1] ?? 10) * 10) / 10
        ])
        .nice()
        .range([0, innerWidth]);

    const rowScale = d3.scalePoint()
        .domain([0, 1])
        .range([innerHeight - 70, 70]);

    const simulatedNodes = runBeeswarmSimulation(nodes, xScale, rowScale);

    chartGroup.append('g')
        .attr('class', 'beeswarm-grid-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(8))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor));

    chartGroup.selectAll('.beeswarm-row-line')
        .data([0, 1])
        .enter()
        .append('line')
        .attr('class', 'beeswarm-row-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', (value) => rowScale(value))
        .attr('y2', (value) => rowScale(value))
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '4 4');

    chartGroup.append('g')
        .call(d3.axisLeft(rowScale)
            .tickValues([0, 1])
            .tickFormat((value) => value === 0 ? IMPACT_LABELS.false : IMPACT_LABELS.true))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor));

    chartGroup.append('text')
        .attr('class', 'bubble-axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 42)
        .attr('text-anchor', 'middle')
        .text(config.axisLabel);

    const bandOverlay = chartGroup.append('g').attr('class', 'beeswarm-band-overlay');
    const activeBand = bandOverlay.append('rect')
        .attr('class', 'beeswarm-active-band')
        .attr('y', 0)
        .attr('height', innerHeight)
        .attr('fill', bandColor)
        .attr('opacity', 0)
        .attr('pointer-events', 'none');

    const bandBoundaries = createBandBoundaries(summaries.map((summary) => summary.value), xScale, innerWidth);

    bandOverlay.selectAll('.beeswarm-band-hitbox')
        .data(bandBoundaries)
        .enter()
        .append('rect')
        .attr('class', 'beeswarm-band-hitbox')
        .attr('x', (datum) => datum.x)
        .attr('y', 0)
        .attr('width', (datum) => datum.width)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .on('mouseenter', function handleBandEnter(event, datum) {
            const summary = summaries.find((item) => item.value === datum.value);

            activeBand
                .attr('x', datum.x)
                .attr('width', datum.width)
                .attr('opacity', 1);

            chartGroup.selectAll('.beeswarm-dot')
                .classed('is-dimmed', (node) => node.xValue !== datum.value)
                .classed('is-highlighted', (node) => node.xValue === datum.value);

            showTooltip(tooltip, event, {
                title: `${config.tooltipLabel} : ${config.formatter(datum.value)}`,
                lines: [
                    `Impact négatif : ${summary?.yesCount || 0}`,
                    `Pas d'impact négatif : ${summary?.noCount || 0}`,
                    `Étudiants représentés : ${summary?.totalCount || 0}`
                ]
            });
        })
        .on('mousemove', function handleBandMove(event) {
            moveTooltip(tooltip, event);
        })
        .on('mouseleave', function handleBandLeave() {
            activeBand.attr('opacity', 0);
            chartGroup.selectAll('.beeswarm-dot')
                .classed('is-dimmed', false)
                .classed('is-highlighted', false);
            hideTooltip(tooltip);
        });

    chartGroup.selectAll('.beeswarm-dot')
        .data(simulatedNodes)
        .enter()
        .append('circle')
        .attr('class', (node) => `beeswarm-dot ${node.impact ? 'negative' : 'positive'}`)
        .attr('cx', (node) => node.x)
        .attr('cy', (node) => node.y)
        .attr('r', 4)
        .attr('fill', (node) => node.impact ? negativeColor : positiveColor)
        .attr('opacity', 0.88);

    svg.append('title').text(config.title);
}

export function renderAcademicImpactBeeswarms(data, container) {
    clearContainer(container);
    const { chartsHost, tooltip } = renderModuleShell(container);

    SWARM_CONFIGS.forEach((config) => {
        renderSingleBeeswarm(config, data, chartsHost, tooltip);
    });
}
