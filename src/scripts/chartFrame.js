export function createChartModule(container, options) {
    const {
        title,
        moduleTag = '',
        topContent = '',
        chartMarkup,
        note = ''
    } = options;

    container.innerHTML = `
        <div class="chart-module">
            <div class="module-heading">
                <h3>${title}</h3>
                ${moduleTag ? `<span class="module-tag">${moduleTag}</span>` : ''}
            </div>
            ${topContent}
            ${chartMarkup}
            ${note ? `<p class="module-note">${note}</p>` : ''}
        </div>
    `;

    return {
        root: container.querySelector('.chart-module')
    };
}
