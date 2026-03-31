function getLoadingElement() {
    return document.getElementById('loading');
}

function getErrorElement() {
    return document.getElementById('error');
}

export function hideLoading() {
    const loadingElement = getLoadingElement();

    if (loadingElement) {
        loadingElement.classList.add('is-hidden');
    }
}

export function showError(message) {
    const errorElement = getErrorElement();

    if (!errorElement) {
        return;
    }

    errorElement.textContent = message;
    errorElement.classList.remove('is-hidden');
}
