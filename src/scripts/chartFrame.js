export function createChartModule(container, options) {
    const {
        title,
        moduleTag,
        topContent = '',
        chartMarkup,
        note = '',
        includeTooltip = false
    } = options;

    container.innerHTML = `
        <div class="chart-module">
            <div class="module-heading">
                <h3>${title}</h3>
                <span class="module-tag">${moduleTag}</span>
            </div>
            ${topContent}
            ${chartMarkup}
            ${includeTooltip ? '<div class="chart-tooltip is-hidden"></div>' : ''}
            ${note ? `<p class="module-note">${note}</p>` : ''}
        </div>
    `;

    return {
        root: container.querySelector('.chart-module'),
        tooltip: container.querySelector('.chart-tooltip')
    };
}