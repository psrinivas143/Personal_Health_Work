import { renderDashboard } from './views/dashboard.js';
import { renderHealth } from './views/health.js';
import { renderWork } from './views/work.js';
import { renderSettings } from './views/settings.js';
import { getAppTheme } from './storage.js';

// Simple router
const routes = {
    dashboard: renderDashboard,
    health: renderHealth,
    work: renderWork,
    settings: renderSettings
};

let currentTab = 'dashboard';

function initApp() {
    // Apply global theme
    document.body.className = `theme-${getAppTheme()}`;

    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            navigateTo(tab);
        });
    });

    // Handle hash changes on load and subsequently
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
}

function navigateTo(tab) {
    if (!routes[tab]) return;

    // Update active tab UI
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add('active');

    // Update URL hash
    window.history.pushState(null, null, `#${tab}`);
    currentTab = tab;

    // Render content
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = ''; // clear current

    const headerTitle = document.getElementById('header-title');
    headerTitle.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);

    // Render new view
    routes[tab](mainContent);
}

document.addEventListener('DOMContentLoaded', initApp);
