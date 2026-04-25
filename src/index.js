import { loadStudentData } from './scripts/dataLoader.js';
import { initializeNavigation } from './scripts/navigation.js';
import { initializeScrollReveal } from './scripts/scrollReveal.js';
import { hideLoading, showError } from './scripts/ui.js';
import { initializeAccessibilityPanel } from './scripts/accessibility.js';
import { initializeKeyboardShortcuts, makeChartsTabbable } from './scripts/keyboardAccessibility.js';
import { addKeyboardInteractionStyles } from './scripts/keyboardChartInteraction.js';
import { renderPlatformComparison } from './scripts/charts/platformComparison.js';
import { renderUsageImpactBubbles } from './scripts/charts/usageImpactBubbles.js';
import { renderAddictionUsageHeatmap } from './scripts/charts/addictionUsageHeatmap.js';
import { renderAcademicImpactBeeswarms } from './scripts/charts/academicImpactBeeswarms.js';
import { renderAddictionAcademicLines } from './scripts/charts/addictionAcademicLines.js';

const visualizations = [
    { containerId: 'viz1', render: renderPlatformComparison },
    { containerId: 'viz2', render: renderUsageImpactBubbles },
    { containerId: 'viz3', render: renderAddictionUsageHeatmap },
    { containerId: 'viz4', render: renderAcademicImpactBeeswarms },
    { containerId: 'viz5', render: renderAddictionAcademicLines }
];

function renderVisualizations(data) {
    visualizations.forEach(({ containerId, render }) => {
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn(`Conteneur introuvable : ${containerId}`);
            return;
        }

        render(data, container);
    });
}

async function initializeApp() {
    try {
        addKeyboardInteractionStyles();
        initializeAccessibilityPanel();
        initializeKeyboardShortcuts();
        initializeNavigation();
        initializeScrollReveal();

        const data = await loadStudentData();

        hideLoading();
        renderVisualizations(data);
        makeChartsTabbable();

        return data;
    } catch (error) {
        hideLoading();
        showError(`Erreur : ${error.message}`);
        console.error('Erreur lors du chargement des donnees :', error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
