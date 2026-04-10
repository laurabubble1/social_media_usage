import { clearContainer, createSVG, formatNumber, getCssVariable } from '../utils.js';
import { createChartModule } from '../chartFrame.js';
import { createTooltip, showTooltip, moveTooltip, hideTooltip } from '../chartTooltip.js';
import { createScoreBands } from '../bandHelpers.js';

const VIEW_MODES = {
    count: {
        label: 'Décompte',
        positiveAccessor: (item) => item.yesCount,
        negativeAccessor: (item) => item.noCount,
        tickFormatter: (value) => Math.abs(value),
        tooltipFormatter: (value) => `${value}`
    },
    percentage: {
        label: 'Pourcentage',
        positiveAccessor: (item) => item.yesPercentage,
        negativeAccessor: (item) => item.noPercentage,
        tickFormatter: (value) => `${Math.abs(value)} %`,
        tooltipFormatter: (value) => `${formatNumber(value, 1)} %`
    }
};

function buildScoreDistribution(data) {
    const grouped = d3.rollup(
        data,
        (students) => {
            const yesCount = students.filter((student) => student.affects_academic_performance).length;
            const noCount = students.length - yesCount;

            return {
                yesCount,
                noCount,
                totalCount: students.length,
                yesPercentage: students.length === 0 ? 0 : (yesCount / students.length) * 100,
                noPercentage: students.length === 0 ? 0 : (noCount / students.length) * 100
            };
        },
        (student) => student.addicted_score
    );

    const minScore = d3.min(data, (student) => student.addicted_score) ?? 0;
    const maxScore = d3.max(data, (student) => student.addicted_score) ?? 10;
    const scoreRange = d3.range(minScore, maxScore + 1);

    return scoreRange.map((score) => {
        const summary = grouped.get(score) || {
            yesCount: 0,
            noCount: 0,
            totalCount: 0,
            yesPercentage: 0,
            noPercentage: 0
        };

        return { score, ...summary };
    });
}

function renderModuleShell(container) {
    return createChartModule(container, {
        title: 'Impact académique selon l’addiction',
        topContent: `
            <div class="diverging-legend">
                <div class="diverging-legend-item">
                    <span class="diverging-legend-line positive"></span>
                    <span>Impact négatif déclaré</span>
                </div>
                <div class="diverging-legend-item">
                    <span class="diverging-legend-line negative"></span>
                    <span>Pas d’impact négatif déclaré</span>
                </div>
            </div>
            <div class="chart-controls">
                <div class="toggle-group" role="group" aria-label="Mode d'affichage">
                    <button type="button" class="toggle-button is-active" data-mode="count">Décompte</button>
                    <button type="button" class="toggle-button" data-mode="percentage">Pourcentage</button>
                </div>
            </div>
        `,
        chartMarkup: '<div class="diverging-chart"></div>',
        note: 'Le toggle permet de passer du nombre d’étudiants à la part relative pour chaque score d’addiction.'
    });
}

function buildSeries(distribution, mode) {
    const config = VIEW_MODES[mode];

    return {
        positive: distribution.map((item) => ({ score: item.score, value: config.positiveAccessor(item), raw: item })),
        negative: distribution.map((item) => ({ score: item.score, value: -config.negativeAccessor(item), raw: item }))
    };
}

function buildImpactSummaryTitle(datum) {
    if (!datum || !datum.totalCount) {
        return 'Aucune donnée';
    }

    if (datum.yesPercentage === datum.noPercentage) {
        return `Répartition équilibrée : ${formatNumber(datum.yesPercentage, 1)} %`;
    }

    if (datum.yesPercentage > datum.noPercentage) {
        return `Impact négatif majoritaire : ${formatNumber(datum.yesPercentage, 1)} %`;
    }

    return `Pas d’impact majoritaire : ${formatNumber(datum.noPercentage, 1)} %`;
}

function initializeChart(chartContainer) {
    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');
    const positiveColor = getCssVariable('--color-beeswarm-negative');
    const negativeColor = getCssVariable('--color-beeswarm-positive');
    const bandColor = getCssVariable('--color-beeswarm-band');
    const tooltip = createTooltip(chartContainer);

    const { svg, chartGroup, innerWidth, innerHeight } = createSVG(chartContainer, {
        height: 420,
        margin: { top: 24, right: 20, bottom: 56, left: 78 }
    });

    const xAxisGroup = chartGroup.append('g')
        .attr('class', 'diverging-x-axis')
        .attr('transform', `translate(0,${innerHeight})`);

    const yAxisGroup = chartGroup.append('g')
        .attr('class', 'diverging-y-axis');

    const baseline = chartGroup.append('line')
        .attr('class', 'diverging-baseline');

    const areaGroup = chartGroup.append('g').attr('class', 'diverging-areas');
    const lineGroup = chartGroup.append('g').attr('class', 'diverging-lines');
    const pointGroup = chartGroup.append('g').attr('class', 'diverging-points');

    chartGroup.append('text')
        .attr('class', 'bubble-axis-label diverging-x-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 42)
        .attr('text-anchor', 'middle')
        .text('Score d’addiction aux réseaux sociaux');

    const yLabel = chartGroup.append('text')
        .attr('class', 'bubble-axis-label diverging-y-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -54)
        .attr('text-anchor', 'middle');

    const overlayGroup = chartGroup.append('g').attr('class', 'diverging-overlay');
    const activeBand = overlayGroup.append('rect')
        .attr('class', 'diverging-hover-band')
        .attr('y', 0)
        .attr('height', innerHeight)
        .attr('fill', bandColor)
        .attr('opacity', 0)
        .attr('pointer-events', 'none');

    const activeGuide = overlayGroup.append('line')
        .attr('class', 'diverging-guide-line')
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('opacity', 0)
        .attr('pointer-events', 'none');

    return {
        svg,
        chartGroup,
        innerWidth,
        innerHeight,
        axisColor,
        gridColor,
        positiveColor,
        negativeColor,
        tooltip,
        xAxisGroup,
        yAxisGroup,
        baseline,
        areaGroup,
        lineGroup,
        pointGroup,
        yLabel,
        overlayGroup,
        activeBand,
        activeGuide
    };
}

function updateOverlay(state, distribution, mode, xScale) {
    const scores = distribution.map((item) => item.score);
    const bands = createScoreBands(scores, xScale, state.innerWidth);
    const modeConfig = VIEW_MODES[mode];

    state.overlayGroup.selectAll('.diverging-hitbox')
        .data(bands, (item) => item.score)
        .join('rect')
        .attr('class', 'diverging-hitbox')
        .attr('x', (item) => item.x)
        .attr('y', 0)
        .attr('width', (item) => item.width)
        .attr('height', state.innerHeight)
        .attr('fill', 'transparent')
        .on('mouseenter', function (event, band) {
            const datum = distribution.find((item) => item.score === band.score);

            state.activeBand
                .attr('x', band.x)
                .attr('width', band.width)
                .attr('opacity', 1);

            state.activeGuide
                .attr('x1', xScale(band.score))
                .attr('x2', xScale(band.score))
                .attr('opacity', 1);

            showTooltip(state.tooltip, event, {
                title: buildImpactSummaryTitle(datum),
                lines: [
                    `Score d’addiction : ${band.score}`,
                    `Impact négatif : ${datum?.yesCount || 0} / ${datum?.totalCount || 0} (${formatNumber(datum?.yesPercentage || 0, 1)} %)`,
                    `Pas d’impact négatif : ${datum?.noCount || 0} / ${datum?.totalCount || 0} (${formatNumber(datum?.noPercentage || 0, 1)} %)`,
                    `${mode === 'count' ? 'Valeurs affichées' : 'Mode pourcentage'} : ${modeConfig.tooltipFormatter(datum ? modeConfig.positiveAccessor(datum) : 0)} / ${modeConfig.tooltipFormatter(datum ? modeConfig.negativeAccessor(datum) : 0)}`
                ]
            });
        })
        .on('mousemove', (event) => {
            const pointerX = d3.pointer(event, state.chartGroup.node())[0];
            state.activeGuide
                .attr('x1', pointerX)
                .attr('x2', pointerX)
                .attr('opacity', 1);
            moveTooltip(state.tooltip, event);
        })
        .on('mouseleave', () => {
            state.activeBand.attr('opacity', 0);
            state.activeGuide.attr('opacity', 0);
            hideTooltip(state.tooltip);
        });
}

function updateChart(state, distribution, mode, animate = true) {
    const { positive, negative } = buildSeries(distribution, mode);
    const modeConfig = VIEW_MODES[mode];
    const scores = distribution.map((item) => item.score);
    const maxValue = d3.max([
        d3.max(positive, (item) => item.value) || 0,
        Math.abs(d3.min(negative, (item) => item.value) || 0)
    ]) || 1;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(scores))
        .range([0, state.innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([-maxValue * 1.15, maxValue * 1.15])
        .nice()
        .range([state.innerHeight, 0]);

    const areaGenerator = d3.area()
        .x((item) => xScale(item.score))
        .y0(() => yScale(0))
        .y1((item) => yScale(item.value))
        .curve(d3.curveMonotoneX);

    const lineGenerator = d3.line()
        .x((item) => xScale(item.score))
        .y((item) => yScale(item.value))
        .curve(d3.curveMonotoneX);

    const transition = animate
        ? d3.transition().duration(500).ease(d3.easeCubicInOut)
        : null;

    const xAxis = d3.axisBottom(xScale).ticks(scores.length).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat((value) => modeConfig.tickFormatter(value));

    if (transition) {
        state.xAxisGroup.transition(transition).call(xAxis);
        state.yAxisGroup.transition(transition).call(yAxis);
    } else {
        state.xAxisGroup.call(xAxis);
        state.yAxisGroup.call(yAxis);
    }

    state.xAxisGroup.select('.domain').remove();
    state.xAxisGroup.selectAll('text').attr('fill', state.axisColor);

    state.yAxisGroup.select('.domain').remove();
    state.yAxisGroup.selectAll('text').attr('fill', state.axisColor);
    state.yAxisGroup.selectAll('line').attr('stroke', state.gridColor);

    const baselineSelection = state.baseline
        .attr('x1', 0)
        .attr('x2', state.innerWidth);

    if (transition) {
        baselineSelection.transition(transition)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0));
    } else {
        baselineSelection
            .attr('y1', yScale(0))
            .attr('y2', yScale(0));
    }

    const areas = [
        { key: 'positive', values: positive, color: state.positiveColor },
        { key: 'negative', values: negative, color: state.negativeColor }
    ];

    const areaSelection = state.areaGroup.selectAll('.diverging-area')
        .data(areas, (item) => item.key)
        .join('path')
        .attr('class', (item) => `diverging-area ${item.key}`)
        .attr('fill', (item) => item.color)
        .attr('opacity', 0.22);

    if (transition) {
        areaSelection.transition(transition).attr('d', (item) => areaGenerator(item.values));
    } else {
        areaSelection.attr('d', (item) => areaGenerator(item.values));
    }

    const lineSelection = state.lineGroup.selectAll('.diverging-line')
        .data(areas, (item) => item.key)
        .join('path')
        .attr('class', (item) => `diverging-line ${item.key}`)
        .attr('fill', 'none')
        .attr('stroke', (item) => item.color)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

    if (transition) {
        lineSelection.transition(transition).attr('d', (item) => lineGenerator(item.values));
    } else {
        lineSelection.attr('d', (item) => lineGenerator(item.values));
    }

    const points = [
        ...positive.map((item) => ({ ...item, key: `positive-${item.score}`, series: 'positive', color: state.positiveColor })),
        ...negative.map((item) => ({ ...item, key: `negative-${item.score}`, series: 'negative', color: state.negativeColor }))
    ];

    const pointSelection = state.pointGroup.selectAll('.diverging-point')
        .data(points, (item) => item.key)
        .join('circle')
        .attr('class', (item) => `diverging-point ${item.series}`)
        .attr('r', 4)
        .attr('fill', (item) => item.color)
        .attr('pointer-events', 'none');

    if (transition) {
        pointSelection.transition(transition)
            .attr('cx', (item) => xScale(item.score))
            .attr('cy', (item) => yScale(item.value));
    } else {
        pointSelection
            .attr('cx', (item) => xScale(item.score))
            .attr('cy', (item) => yScale(item.value));
    }

    state.yLabel.text(mode === 'count' ? 'Nombre d’étudiants' : 'Part des étudiants');
    updateOverlay(state, distribution, mode, xScale);
}

export function renderAddictionAcademicLines(data, container) {
    clearContainer(container);
    const shell = renderModuleShell(container);
    const distribution = buildScoreDistribution(data);
    const chartContainer = shell.root.querySelector('.diverging-chart');
    const toggleButtons = Array.from(shell.root.querySelectorAll('.toggle-button'));
    const state = initializeChart(chartContainer);

    let currentMode = 'count';

    function applyMode(nextMode, animate = true) {
        currentMode = nextMode;
        toggleButtons.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.mode === nextMode);
        });

        updateChart(state, distribution, nextMode, animate);
    }

    toggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.dataset.mode !== currentMode) {
                applyMode(button.dataset.mode, true);
            }
        });
    });

    applyMode(currentMode, false);
}
