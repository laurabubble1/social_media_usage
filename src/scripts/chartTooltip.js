let activeTooltip = null;
let globalGuardsInitialized = false;
let hideTimeoutId = null;
let fadeTimeoutId = null;

const HIDE_DELAY_MS = 20;
const FADE_DURATION_MS = 80;

function clearHideTimeout() {
    if (hideTimeoutId !== null) {
        window.clearTimeout(hideTimeoutId);
        hideTimeoutId = null;
    }
}

function clearFadeTimeout() {
    if (fadeTimeoutId !== null) {
        window.clearTimeout(fadeTimeoutId);
        fadeTimeoutId = null;
    }
}

function cancelPendingHide() {
    clearHideTimeout();
    clearFadeTimeout();
}

function setTooltipHidden(tooltip) {
    tooltip
        .classed('is-fading-out', false)
        .classed('is-hidden', true);

    if (activeTooltip && activeTooltip.node() === tooltip.node()) {
        activeTooltip = null;
    }
}

function hideActiveTooltip() {
    if (!activeTooltip) {
        return;
    }

    cancelPendingHide();
    setTooltipHidden(activeTooltip);
}

function initializeGlobalTooltipGuards() {
    if (globalGuardsInitialized) {
        return;
    }

    globalGuardsInitialized = true;

    const hideOnInteractionChange = () => {
        hideActiveTooltip();
    };

    window.addEventListener('blur', hideOnInteractionChange, { passive: true });
    window.addEventListener('resize', hideOnInteractionChange, { passive: true });
    window.addEventListener('wheel', hideOnInteractionChange, { passive: true });
    window.addEventListener('touchstart', hideOnInteractionChange, { passive: true });
    window.addEventListener('pointercancel', hideOnInteractionChange, { passive: true });

    document.addEventListener('scroll', hideOnInteractionChange, true);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            hideOnInteractionChange();
        }
    });

    document.addEventListener('pointermove', (event) => {
        if (!activeTooltip || activeTooltip.classed('is-hidden')) {
            return;
        }

        moveTooltip(activeTooltip, event);
    }, { passive: true });

    // When the cursor exits the browser viewport quickly, local mouseleave handlers can be skipped.
    document.addEventListener('mouseout', (event) => {
        if (!event.relatedTarget) {
            hideOnInteractionChange();
        }
    });
}

export function createTooltip(container) {
    const host = d3.select(document.body);
    const existing = host.select('.chart-tooltip');

    initializeGlobalTooltipGuards();

    if (!existing.empty()) {
        return existing;
    }

    return host
        .append('div')
        .attr('class', 'chart-tooltip is-hidden');
}

export function showTooltip(tooltip, event, content) {
    activeTooltip = tooltip;
    cancelPendingHide();

    tooltip
        .classed('is-fading-out', false)
        .classed('is-hidden', false)
        .html(formatTooltipContent(content));

    moveTooltip(tooltip, event);
}

export function moveTooltip(tooltip, event) {
    const node = tooltip.node();

    if (!node || typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') {
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
    cancelPendingHide();
    hideTimeoutId = window.setTimeout(() => {
        hideTimeoutId = null;
        tooltip.classed('is-fading-out', true);

        fadeTimeoutId = window.setTimeout(() => {
            fadeTimeoutId = null;
            setTooltipHidden(tooltip);
        }, FADE_DURATION_MS);
    }, HIDE_DELAY_MS);
}

export function formatTooltipContent(content) {
    const lines = (content.lines || []).map((line) => `<span>${line}</span>`).join('');
    const titleStyle = content.titleColor ? ` style="color: ${content.titleColor};"` : '';

    return `
        <strong${titleStyle}>${content.title}</strong>
        ${lines}
    `;
}
