function renderTooltipContent(content) {
    const lines = (content.lines || []).map((line) => `<span>${line}</span>`).join('');
    return `
        <strong>${content.title}</strong>
        ${lines}
    `;
}

export function showTooltip(tooltip, event, content) {
    tooltip.classList.remove('is-hidden');
    tooltip.innerHTML = renderTooltipContent(content);
    moveTooltip(tooltip, event);
}

export function moveTooltip(tooltip, event) {
    tooltip.style.left = `${event.pageX + 16}px`;
    tooltip.style.top = `${event.pageY - 18}px`;
}

export function hideTooltip(tooltip) {
    tooltip.classList.add('is-hidden');
}