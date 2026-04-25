/**
 * Gestion améliorée du clavier et des raccourcis
 */

/**
 * Initialise les raccourcis clavier
 */
export function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Alt + H : Aide (affiche les raccourcis)
        if (event.altKey && event.key === 'h') {
            event.preventDefault();
            showKeyboardHelp();
        }

        // Alt + S : Skip to content
        if (event.altKey && event.key === 's') {
            event.preventDefault();
            const skipLink = document.querySelector('.skip-link');
            if (skipLink) {
                skipLink.focus();
                skipLink.click();
            }
        }

        // Alt + 0 : Aller à l'accueil
        if (event.altKey && event.key === '0') {
            event.preventDefault();
            const homeLink = document.querySelector('a[href="#intro"]');
            if (homeLink) homeLink.click();
        }

        // Alt + 1 : Aller à la section 1
        if (event.altKey && event.key === '1') {
            event.preventDefault();
            const link = document.querySelector('a[href="#section1"]');
            if (link) link.click();
        }

        // Alt + 2 : Aller à la section 2
        if (event.altKey && event.key === '2') {
            event.preventDefault();
            const link = document.querySelector('a[href="#section2"]');
            if (link) link.click();
        }

        // Alt + 3 : Aller à la section 3
        if (event.altKey && event.key === '3') {
            event.preventDefault();
            const link = document.querySelector('a[href="#section3"]');
            if (link) link.click();
        }

        // Alt + 4 : Aller à la section 4
        if (event.altKey && event.key === '4') {
            event.preventDefault();
            const link = document.querySelector('a[href="#section4"]');
            if (link) link.click();
        }
    });
}

/**
 * Affiche l'aide des raccourcis clavier
 */
function showKeyboardHelp() {
    // Vérifier si le dialogue existe déjà
    let dialog = document.getElementById('keyboard-help-dialog');
    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = 'keyboard-help-dialog';
        dialog.className = 'keyboard-help-dialog';
        dialog.setAttribute('role', 'alertdialog');
        dialog.setAttribute('aria-labelledby', 'keyboard-help-title');
        dialog.setAttribute('aria-describedby', 'keyboard-help-content');

        dialog.innerHTML = `
            <div class="keyboard-help-content">
                <h2 id="keyboard-help-title">Raccourcis clavier</h2>
                <div id="keyboard-help-content">
                    <dl class="keyboard-shortcuts-list">
                        <dt style="color: var(--color-accent-start); font-size: 14px; margin-top: 16px; text-transform: uppercase;">Navigation globale</dt>
                    
                        <dt>Alt + H</dt>
                        <dd>Afficher cette aide</dd>
                    
                        <dt>Alt + S</dt>
                        <dd>Sauter au contenu principal</dd>
                    
                        <dt>Alt + 0</dt>
                        <dd>Aller à l'accueil</dd>
                    
                        <dt>Alt + 1</dt>
                        <dd>Aller à la section "Les plateformes"</dd>
                    
                        <dt>Alt + 2</dt>
                        <dd>Aller à la section "Le temps d'utilisation"</dd>
                    
                        <dt>Alt + 3</dt>
                        <dd>Aller à la section "Les conflits"</dd>
                    
                        <dt>Alt + 4</dt>
                        <dd>Aller à la section "L'impact académique"</dd>
                    
                        <dt style="color: var(--color-accent-start); font-size: 14px; margin-top: 16px; text-transform: uppercase;">Navigation et interaction</dt>
                    
                        <dt>Tab</dt>
                        <dd>Naviguer entre les éléments interactifs et les graphiques</dd>
                    
                        <dt>↑ ↓ ← →</dt>
                        <dd>Naviguer dans les données des graphiques (barres, points, cellules)</dd>
                    
                        <dt>Entrée / Espace</dt>
                        <dd>Sélectionner un élément du graphique</dd>
                    
                        <dt style="color: var(--color-accent-start); font-size: 14px; margin-top: 16px; text-transform: uppercase;">Accessibilité graphiques</dt>
                    
                        <dt>Annonces vocales</dt>
                        <dd>Les valeurs sont lues automatiquement lors de la navigation au clavier avec un lecteur d'écran (NVDA, JAWS, VoiceOver)</dd>
                    
                        <dt>Tooltips</dt>
                        <dd>Les descriptions s'affichent automatiquement quand vous naviguez aux flèches dans un graphique</dd>
                    
                        <dt style="color: var(--color-accent-start); font-size: 14px; margin-top: 16px; text-transform: uppercase;">Options d'accessibilité</dt>
                    
                        <dt>Bouton en bas à droite</dt>
                        <dd>Contraste élevé, taille du texte, motifs graphiques, réduire animations</dd>
                    </dl>
                </div>
                <button class="keyboard-help-close" aria-label="Fermer l'aide">Fermer</button>
            </div>
        `;

        // Ajouter les styles
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-help-dialog {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                align-items: center;
                justify-content: center;
            }

            .keyboard-help-dialog.is-visible {
                display: flex;
            }

            .keyboard-help-content {
                background: var(--color-surface);
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }

            .keyboard-help-content h2 {
                margin-bottom: 20px;
                font-size: 24px;
                color: var(--color-text-primary);
            }

            .keyboard-shortcuts-list {
                margin-bottom: 20px;
            }

            .keyboard-shortcuts-list dt {
                font-weight: 600;
                color: var(--color-accent-start);
                margin-top: 12px;
            }

            .keyboard-shortcuts-list dd {
                margin-left: 20px;
                color: var(--color-text-secondary);
                margin-bottom: 8px;
            }

            .keyboard-help-close {
                background: var(--color-accent-start);
                color: var(--color-text-light);
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                width: 100%;
            }

            .keyboard-help-close:hover,
            .keyboard-help-close:focus-visible {
                opacity: 0.9;
                outline: 2px solid var(--color-accent-highlight);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(dialog);

        const closeBtn = dialog.querySelector('.keyboard-help-close');
        closeBtn.addEventListener('click', () => {
            dialog.classList.remove('is-visible');
            closeBtn.blur();
        });

        // Fermer au clic en dehors
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.classList.remove('is-visible');
            }
        });

        // Fermer avec Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                dialog.classList.remove('is-visible');
                document.removeEventListener('keydown', escapeHandler);
            }
        };

        // Ajouter le listener Escape lorsque le dialogue est ouvert
        dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dialog.classList.remove('is-visible');
            }
        });
    }

    dialog.classList.add('is-visible');
    dialog.querySelector('.keyboard-help-close').focus();
}

/**
 * Améliore la navigation au clavier dans les graphiques
 */
export function makeChartsTabbable() {
    const charts = document.querySelectorAll('[role="img"]');
    charts.forEach((chart) => {
        if (!chart.hasAttribute('tabindex')) {
            chart.setAttribute('tabindex', '0');
        }

        // Ajouter un événement pour les tooltips au focus
        chart.addEventListener('focus', () => {
            chart.style.outline = '2px solid var(--color-accent-start)';
            chart.style.outlineOffset = '2px';
        });

        chart.addEventListener('blur', () => {
            chart.style.outline = 'none';
        });
    });
}
