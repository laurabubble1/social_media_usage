/**
 * Accessibilité - Gestion des options d'accessibilité
 */

const ACCESSIBILITY_STORAGE_KEY = 'accessibility-preferences';

const DEFAULT_PREFERENCES = {
    highContrast: false,
    fontSize: 'normal', // 'normal', 'large', 'extra-large'
    reduceMotion: false,
    focusIndicator: true,
    patterns: false // Ajouter des patterns aux éléments colorés
};

let preferences = { ...DEFAULT_PREFERENCES };

function ensurePatternDefinitions() {
    if (document.getElementById('a11y-pattern-defs')) {
        return;
    }

    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('id', 'a11y-pattern-defs');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';

    svg.innerHTML = `
        <defs>
            <pattern id="a11y-pattern-mental" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#1f6feb"></rect>
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.85)" stroke-width="3"></line>
            </pattern>
            <pattern id="a11y-pattern-sleep" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <rect width="8" height="8" fill="#f28f3b"></rect>
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.85)" stroke-width="3"></line>
            </pattern>
            <pattern id="a11y-pattern-negative" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#d64545"></rect>
                <path d="M-2 2 L2 -2 M0 10 L10 0 M8 12 L12 8" stroke="rgba(255,255,255,0.9)" stroke-width="2"></path>
            </pattern>
            <pattern id="a11y-pattern-positive" width="10" height="10" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#2a9d4b"></rect>
                <path d="M0 2 L10 2 M0 7 L10 7" stroke="rgba(255,255,255,0.9)" stroke-width="2"></path>
            </pattern>
        </defs>
    `;

    document.body.appendChild(svg);
}

/**
 * Charge les préférences sauvegardées
 */
function loadPreferences() {
    const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
    if (stored) {
        preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return preferences;
}

/**
 * Sauvegarde les préférences
 */
function savePreferences() {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
}

/**
 * Applique les préférences au DOM
 */
function applyPreferences() {
    const html = document.documentElement;

    // High contrast
    html.classList.toggle('a11y-high-contrast', preferences.highContrast);

    // Font size
    html.setAttribute('data-a11y-fontsize', preferences.fontSize);

    // Reduce motion
    html.classList.toggle('a11y-reduce-motion', preferences.reduceMotion);

    // Focus indicator
    html.classList.toggle('a11y-focus-indicator', preferences.focusIndicator);

    // Patterns
    html.classList.toggle('a11y-patterns', preferences.patterns);
}

/**
 * Bascule une préférence
 */
function togglePreference(key) {
    if (typeof preferences[key] === 'boolean') {
        preferences[key] = !preferences[key];
    }
    savePreferences();
    applyPreferences();
    updateToggles();
}

/**
 * Change la taille de police
 */
function setFontSize(size) {
    if (['normal', 'large', 'extra-large'].includes(size)) {
        preferences.fontSize = size;
        savePreferences();
        applyPreferences();
        updateToggles();
    }
}

/**
 * Met à jour les toggles dans l'interface
 */
function updateToggles() {
    document.querySelectorAll('[data-a11y-toggle]').forEach((toggle) => {
        const key = toggle.getAttribute('data-a11y-toggle');
        if (key in preferences && typeof preferences[key] === 'boolean') {
            toggle.checked = preferences[key];
            toggle.setAttribute('aria-pressed', preferences[key]);
        }
    });

    document.querySelectorAll('[data-a11y-fontsize-option]').forEach((btn) => {
        const size = btn.getAttribute('data-a11y-fontsize-option');
        btn.classList.toggle('is-active', preferences.fontSize === size);
        btn.setAttribute('aria-pressed', preferences.fontSize === size);
    });
}

/**
 * Crée le panneau de contrôle d'accessibilité
 */
function createAccessibilityPanel() {
    const panel = document.createElement('div');
    panel.className = 'a11y-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', 'a11y-panel-title');

    panel.innerHTML = `
        <button class="a11y-panel-toggle" aria-label="Ouvrir les options d'accessibilité" aria-expanded="false">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 2a1 1 0 100 2 1 1 0 000-2zM5.5 7a1 1 0 100 2 1 1 0 000-2zM14.5 7a1 1 0 100 2 1 1 0 000-2zM10 12a1 1 0 100 2 1 1 0 000-2zM4 14a1 1 0 110 2h12a1 1 0 110-2H4z"/>
            </svg>
        </button>

        <div class="a11y-panel-content" hidden>
            <h2 id="a11y-panel-title">Options d'accessibilité</h2>

            <fieldset class="a11y-option-group">
                <legend>Affichage</legend>
                
                <label class="a11y-toggle-label">
                    <input type="checkbox" class="a11y-toggle" data-a11y-toggle="highContrast" aria-describedby="a11y-high-contrast-desc">
                    Contraste élevé
                </label>
                <p id="a11y-high-contrast-desc" class="a11y-description">Augmente le contraste des couleurs pour une meilleure lisibilité</p>

                <label class="a11y-toggle-label">
                    <input type="checkbox" class="a11y-toggle" data-a11y-toggle="patterns" aria-describedby="a11y-patterns-desc">
                    Motifs graphiques
                </label>
                <p id="a11y-patterns-desc" class="a11y-description">Ajoute des motifs aux éléments colorés pour mieux les distinguer</p>
            </fieldset>

            <fieldset class="a11y-option-group">
                <legend>Mouvement</legend>
                
                <label class="a11y-toggle-label">
                    <input type="checkbox" class="a11y-toggle" data-a11y-toggle="reduceMotion" aria-describedby="a11y-reduce-motion-desc">
                    Réduire les animations
                </label>
                <p id="a11y-reduce-motion-desc" class="a11y-description">Réduit les animations et les transitions</p>
            </fieldset>

            <fieldset class="a11y-option-group">
                <legend>Taille du texte</legend>
                <div class="a11y-fontsize-buttons">
                    <button data-a11y-fontsize-option="normal" class="a11y-fontsize-btn" aria-pressed="false">Normal</button>
                    <button data-a11y-fontsize-option="large" class="a11y-fontsize-btn" aria-pressed="false">Grand</button>
                    <button data-a11y-fontsize-option="extra-large" class="a11y-fontsize-btn" aria-pressed="false">Très grand</button>
                </div>
            </fieldset>

            <fieldset class="a11y-option-group">
                <legend>Navigation</legend>
                
                <label class="a11y-toggle-label">
                    <input type="checkbox" class="a11y-toggle" data-a11y-toggle="focusIndicator" aria-describedby="a11y-focus-indicator-desc">
                    Indicateurs de focus visibles
                </label>
                <p id="a11y-focus-indicator-desc" class="a11y-description">Améliore les indicateurs visuels de focus au clavier</p>
            </fieldset>
        </div>
    `;

    return panel;
}

/**
 * Initialise le panneau d'accessibilité
 */
function initializeAccessibilityPanel() {
    ensurePatternDefinitions();

    // Charger les préférences sauvegardées
    loadPreferences();
    applyPreferences();

    // Créer et ajouter le panneau
    const panel = createAccessibilityPanel();
    document.body.appendChild(panel);

    // Toggle du panneau
    const toggleBtn = panel.querySelector('.a11y-panel-toggle');
    const content = panel.querySelector('.a11y-panel-content');

    toggleBtn.addEventListener('click', () => {
        const isOpen = content.hidden;
        content.hidden = !isOpen;
        toggleBtn.setAttribute('aria-expanded', isOpen);
        toggleBtn.setAttribute('aria-label', isOpen ? 'Fermer les options d\'accessibilité' : 'Ouvrir les options d\'accessibilité');
    });

    // Toggles
    document.querySelectorAll('[data-a11y-toggle]').forEach((toggle) => {
        toggle.addEventListener('change', () => {
            const key = toggle.getAttribute('data-a11y-toggle');
            togglePreference(key);
        });
    });

    // Boutons de taille de police
    document.querySelectorAll('[data-a11y-fontsize-option]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const size = btn.getAttribute('data-a11y-fontsize-option');
            setFontSize(size);
        });
    });

    // Mettre à jour l'affichage initial
    updateToggles();

    // Émettre un événement personnalisé
    window.dispatchEvent(new CustomEvent('a11y-initialized', { detail: { preferences } }));
}

export {
    initializeAccessibilityPanel,
    togglePreference,
    setFontSize,
    loadPreferences,
    preferences
};
