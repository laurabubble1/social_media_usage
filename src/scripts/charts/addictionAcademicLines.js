import { clearContainer, createSVG, formatNumber, getCssVariable } from '../utils.js';
import { createChartModule } from '../chartFrame.js';
import { hideTooltip, moveTooltip, showTooltip } from '../chartTooltip.js';
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
        title: 'Lignes divergentes sur l\'impact académique',
        moduleTag: 'Module addictionAcademicLines',
        topContent: `
            <div class="diverging-legend">
                <div class="diverging-legend-item">
                    <span class="diverging-legend-line positive"></span>
                    <span>Impact négatif déclaré</span>
                </div>
                <div class="diverging-legend-item">
                    <span class="diverging-legend-line negative"></span>
                    <span>Pas d'impact négatif déclaré</span>
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
        includeTooltip: true,
        note: 'Le toggle permet de basculer entre le nombre d\'étudiants et la proportion d\'impact négatif pour chaque score d\'addiction.'
    });
}

function buildSeries(distribution, mode) {
    const config = VIEW_MODES[mode];

    return {
        positive: distribution.map((item) => ({ score: item.score, value: config.positiveAccessor(item), raw: item })),
        negative: distribution.map((item) => ({ score: item.score, value: -config.negativeAccessor(item), raw: item }))
    };
}

function buildOverlayBands(scores, xScale, innerWidth) {
    return createScoreBands(scores, xScale, innerWidth);
}

function renderChart(container, tooltip, distribution, mode) {
    const chartContainer = container.querySelector('.diverging-chart');
    chartContainer.innerHTML = '';

    const axisColor = getCssVariable('--color-text-secondary');
    const gridColor = getCssVariable('--color-border');
    const positiveColor = getCssVariable('--color-beeswarm-negative');
    const negativeColor = getCssVariable('--color-beeswarm-positive');
    const bandColor = getCssVariable('--color-beeswarm-band');

    const { svg, chartGroup, innerWidth, innerHeight } = createSVG(chartContainer, {
        height: 420,
        margin: { top: 24, right: 20, bottom: 56, left: 78 }
    });

    const scores = distribution.map((item) => item.score);
    const { positive, negative } = buildSeries(distribution, mode);
    const modeConfig = VIEW_MODES[mode];
    const maxValue = d3.max([
        d3.max(positive, (item) => item.value) || 0,
        Math.abs(d3.min(negative, (item) => item.value) || 0)
    ]) || 1;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(scores))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([-maxValue * 1.15, maxValue * 1.15])
        .nice()
        .range([innerHeight, 0]);

    const areaGenerator = d3.area()
        .x((item) => xScale(item.score))
        .y0(() => yScale(0))
        .y1((item) => yScale(item.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    const lineGenerator = d3.line()
        .x((item) => xScale(item.score))
        .y((item) => yScale(item.value))
        .curve(d3.curveCatmullRom.alpha(0.5));

    chartGroup.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(scores.length).tickFormat(d3.format('d')))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor));

    chartGroup.append('g')
        .call(d3.axisLeft(yScale).ticks(6).tickFormat((value) => modeConfig.tickFormatter(value)))
        .call((group) => group.select('.domain').remove())
        .call((group) => group.selectAll('text').attr('fill', axisColor))
        .call((group) => group.selectAll('line').attr('stroke', gridColor));

    chartGroup.append('line')
        .attr('class', 'diverging-baseline')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0));

    chartGroup.append('path')
        .datum(positive)
        .attr('class', 'diverging-area positive')
        .attr('fill', positiveColor)
        .attr('opacity', 0.22)
        .attr('d', areaGenerator);

    chartGroup.append('path')
        .datum(negative)
        .attr('class', 'diverging-area negative')
        .attr('fill', negativeColor)
        .attr('opacity', 0.22)
        .attr('d', areaGenerator);

    chartGroup.append('path')
        .datum(positive)
        .attr('class', 'diverging-line positive')
        .attr('fill', 'none')
        .attr('stroke', positiveColor)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGenerator);

    chartGroup.append('path')
        .datum(negative)
        .attr('class', 'diverging-line negative')
        .attr('fill', 'none')
        .attr('stroke', negativeColor)
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGenerator);

    chartGroup.selectAll('.diverging-point.positive')
        .data(positive)
        .enter()
        .append('circle')
        .attr('class', 'diverging-point positive')
        .attr('cx', (item) => xScale(item.score))
        .attr('cy', (item) => yScale(item.value))
        .attr('r', 4)
        .attr('fill', positiveColor);

    chartGroup.selectAll('.diverging-point.negative')
        .data(negative)
        .enter()
        .append('circle')
        .attr('class', 'diverging-point negative')
        .attr('cx', (item) => xScale(item.score))
        .attr('cy', (item) => yScale(item.value))
        .attr('r', 4)
        .attr('fill', negativeColor);

    chartGroup.append('text')
        .attr('class', 'bubble-axis-label')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 42)
        .attr('text-anchor', 'middle')
        .text('Score d addiction aux reseaux sociaux');

    chartGroup.append('text')
        .attr('class', 'bubble-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerHeight / 2)
        .attr('y', -54)
        .attr('text-anchor', 'middle')
        .text(mode === 'count' ? 'Nombre d etudiants' : 'Part des etudiants');

    const overlayGroup = chartGroup.append('g');
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
        .attr('opacity', 0);

    const bands = buildOverlayBands(scores, xScale, innerWidth);

    overlayGroup.selectAll('.diverging-hitbox')
        .data(bands)
        .enter()
        .append('rect')
        .attr('class', 'diverging-hitbox')
        .attr('x', (item) => item.x)
        .attr('y', 0)
        .attr('width', (item) => item.width)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .on('mouseenter', function handleEnter(event, band) {
            const datum = distribution.find((item) => item.score === band.score);

            activeBand.attr('x', band.x).attr('width', band.width).attr('opacity', 1);
            activeGuide
                .attr('x1', xScale(band.score))
                .attr('x2', xScale(band.score))
                .attr('opacity', 1);

            chartGroup.selectAll('.diverging-point')
                .classed('is-dimmed', (point) => point.score !== band.score)
                .classed('is-highlighted', (point) => point.score === band.score);

            showTooltip(tooltip, event, {
                title: `Score d addiction : ${band.score}`,
                lines: [
                    `Impact negatif : ${modeConfig.tooltipFormatter(datum ? modeConfig.positiveAccessor(datum) : 0)}`,
                    `Pas d impact negatif : ${modeConfig.tooltipFormatter(datum ? modeConfig.negativeAccessor(datum) : 0)}`,
                    `Etudiants representes : ${datum?.totalCount || 0}`
                ]
            });
        })
        .on('mousemove', function handleMove(event) {
            moveTooltip(tooltip, event);
        })
        .on('mouseleave', function handleLeave() {
            activeBand.attr('opacity', 0);
            activeGuide.attr('opacity', 0);
            chartGroup.selectAll('.diverging-point')
                .classed('is-dimmed', false)
                .classed('is-highlighted', false);
            hideTooltip(tooltip);
        });

    svg.append('title').text('Diagramme a lignes divergentes montrant l impact academique en fonction du score d addiction');
}

export function renderAddictionAcademicLines(data, container) {
    clearContainer(container);
    const shell = renderModuleShell(container);
    const distribution = buildScoreDistribution(data);
    const chartContainer = shell.root.querySelector('.diverging-chart');
    const toggleButtons = Array.from(shell.root.querySelectorAll('.toggle-button'));

    let currentMode = 'count';

    function updateChart(nextMode) {
        currentMode = nextMode;
        toggleButtons.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.mode === nextMode);
        });
        renderChart(shell.root, shell.tooltip, distribution, nextMode);
    }

    toggleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.dataset.mode !== currentMode) {
                updateChart(button.dataset.mode);
            }
        });
    });

    if (chartContainer) {
        updateChart(currentMode);
    }
}
