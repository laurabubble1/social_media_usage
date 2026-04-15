export function createTooltip(container) {
    const host = d3.select(document.body);
    const existing = host.select('.chart-tooltip');

    if (!existing.empty()) {
        return existing;
    }

    return host
        .append('div')
        .attr('class', 'chart-tooltip is-hidden');
}

export function showTooltip(tooltip, event, content) {
    tooltip
        .classed('is-hidden', false)
        .html(formatTooltipContent(content));

    moveTooltip(tooltip, event);
}

export function moveTooltip(tooltip, event) {
    const node = tooltip.node();

    if (!node) {
        return;
    }

    const offset = 16;
    const bounds = node.getBoundingClientRect();
    const maxLeft = window.innerWidth - bounds.width - offset;
    const maxTop = window.innerHeight - bounds.height - offset;
    const left = Math.max(offset, Math.min(event.clientX + offset, maxLeft));
    const top = Math.max(offset, Math.min(event.clientY - offset, maxTop));

    tooltip
        .style('left', `${left}px`)
        .style('top', `${top}px`);
}

export function hideTooltip(tooltip) {
    tooltip.classed('is-hidden', true);
}

export function formatTooltipContent(content) {
    const lines = (content.lines || []).map((line) => `<span>${line}</span>`).join('');
    const titleStyle = content.titleColor ? ` style="color: ${content.titleColor};"` : '';

    return `
        <strong${titleStyle}>${content.title}</strong>
        ${lines}
    `;
}
