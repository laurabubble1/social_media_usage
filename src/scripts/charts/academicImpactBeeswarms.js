import { clearContainer, createSVG, formatNumber, getCssVariable } from '../utils.js';
import { createTooltip, showTooltip, moveTooltip, hideTooltip } from '../chartTooltip.js';
import { createChartModule } from '../chartFrame.js';
import { createBands } from '../bandHelpers.js';

const SWARM_CONFIGS = [
    {
        key: 'avg_daily_usage_hours',
        title: 'Impact académique selon l’utilisation',
        axisLabel: 'Heures passées sur les médias sociaux par jour',
        tooltipLabel: 'Heures d’utilisation',
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

function runBeeswarmSimulation(nodes, xScale, rowScale, innerHeight) {
    const dotRadius = 4;
    const verticalPadding = 4;
    const simulationNodes = nodes.map((node) => ({ ...node }));

    const simulation = d3.forceSimulation(simulationNodes)
        .force('x', d3.forceX((node) => xScale(node.xValue)).strength(6))
        .force('y', d3.forceY((node) => rowScale(node.yCategory)).strength(0.5))
        .force('collide', d3.forceCollide(dotRadius + 1))
        .stop();

    for (let index = 0; index < 300; index += 1) {
        simulation.tick();
    }

    const chartTop = dotRadius + verticalPadding;
    const chartBottom = innerHeight - dotRadius - verticalPadding;

    simulationNodes.forEach((node) => {
        node.y = Math.max(chartTop, Math.min(chartBottom, node.y));
    });

    return simulationNodes;
}

function buildImpactSummaryTitle(yesCount, noCount, totalCount) {
    if (!totalCount) {
        return 'Aucune donnée';
    }

    const yesShare = (yesCount / totalCount) * 100;
    const noShare = (noCount / totalCount) * 100;

    if (yesCount === noCount) {
        return `Répartition équilibrée : ${formatNumber(yesShare, 1)} %`;
    }

    if (yesCount > noCount) {
        return `Impact négatif majoritaire : ${formatNumber(yesShare, 1)} %`;
    }

    return `Pas d’impact majoritaire : ${formatNumber(noShare, 1)} %`;
}

function renderModuleShell(container) {
    const shell = createChartModule(container, {
        title: 'Impact académique selon l’utilisation et le sommeil',
        topContent: `
            <div class="beeswarm-legend">
                <div class="beeswarm-legend-item">
                    <span class="beeswarm-legend-dot negative"></span>
                    <span>Impact négatif déclaré</span>
                </div>
                <div class="beeswarm-legend-item">
                    <span class="beeswarm-legend-dot positive"></span>
                    <span>Pas d’impact négatif déclaré</span>
                </div>
            </div>
        `,
        chartMarkup: '<div class="beeswarm-grid"></div>',
        note: 'Le survol résume la répartition des réponses pour une même valeur d’utilisation ou de sommeil. La couleur de son titre indique si l’impact négatif est majoritaire ou non pour cette valeur.'
    });

    return {
        chartsHost: shell.root.querySelector('.beeswarm-grid')
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
    const gridColor = getCssVariable('--color-text-secondary');
    const positiveColor = getCssVariable('--color-beeswarm-positive');
    const negativeColor = getCssVariable('--color-beeswarm-negative');
    const bandColor = getCssVariable('--color-beeswarm-band');

    const { svg, chartGroup, innerWidth, innerHeight } = createSVG(canvas, {
        height: 390,
        margin: { top: 12, right: 12, bottom: 74, left: 88 }
    });

    const xExtent = d3.extent(nodes, (node) => node.xValue);
    const xScale = d3.scaleLinear()
        .domain([
            Math.floor((xExtent[0] ?? 0) * 10) / 10,
            Math.ceil((xExtent[1] ?? 10) * 10) / 10
        ])
        .nice()
        .range([0, innerWidth]);

    const desiredRowGap = 104;
    const rowMidpoint = innerHeight / 2;
    const topRowY = rowMidpoint - (desiredRowGap / 2);
    const bottomRowY = rowMidpoint + (desiredRowGap / 2);

    const rowScale = d3.scalePoint()
        .domain([0, 1])
        .range([bottomRowY, topRowY]);

    const simulatedNodes = runBeeswarmSimulation(nodes, xScale, rowScale, innerHeight);

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
        .attr('stroke-opacity', 0.45)
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
        .attr('y', innerHeight + 52)
        .attr('text-anchor', 'middle')
        .text(config.axisLabel);

    const bandOverlay = chartGroup.append('g').attr('class', 'beeswarm-band-overlay');
    const activeGuide = bandOverlay.append('line')
        .attr('class', 'beeswarm-guide-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
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
        .on('mouseenter', function (event, datum) {
            const summary = summaries.find((item) => item.value === datum.value);
            const yesCount = summary?.yesCount || 0;
            const noCount = summary?.noCount || 0;
            const totalCount = summary?.totalCount || 0;
            const yesShare = totalCount ? (yesCount / totalCount) * 100 : 0;
            const noShare = totalCount ? (noCount / totalCount) * 100 : 0;
            const titleColor = yesCount === noCount
                ? null
                : (yesCount > noCount ? negativeColor : positiveColor);

            activeGuide
                .attr('x1', xScale(datum.value))
                .attr('x2', xScale(datum.value))
                .attr('opacity', 1);

            showTooltip(tooltip, event, {
                title: buildImpactSummaryTitle(yesCount, noCount, totalCount),
                titleColor,
                lines: [
                    `${config.tooltipLabel} : ${config.formatter(datum.value)}`,
                    `Impact négatif : ${yesCount} / ${totalCount} (${formatNumber(yesShare, 1)} %)`,
                    `Pas d’impact négatif : ${noCount} / ${totalCount} (${formatNumber(noShare, 1)} %)`
                ]
            });
        })
        .on('mousemove', function (event) {
            const pointerX = d3.pointer(event, chartGroup.node())[0];
            activeGuide
                .attr('x1', pointerX)
                .attr('x2', pointerX)
                .attr('opacity', 1);
            moveTooltip(tooltip, event);
        })
        .on('mouseleave', function () {
            activeGuide.attr('opacity', 0);
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
        .attr('pointer-events', 'none')
        .attr('opacity', 0.88);

    svg.append('title').text(config.title);
}

export function renderAcademicImpactBeeswarms(data, container) {
    clearContainer(container);
    const { chartsHost } = renderModuleShell(container);
    const tooltip = createTooltip(chartsHost);

    SWARM_CONFIGS.forEach((config) => {
        renderSingleBeeswarm(config, data, chartsHost, tooltip);
    });
}
