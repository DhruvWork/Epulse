/**
 * Dark Mode Management System
 * Provides consistent dark mode functionality across all pages
 */
class DarkModeManager {
    constructor() {
        this.storageKey = 'epulse-theme';
        this.darkModeClass = 'dark-mode';
        this.init();
    }

    init() {
        this.initializeDarkMode();
        this.setupToggleListener();
        this.setupSystemThemeListener();
    }

    initializeDarkMode() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }
    }

    enableDarkMode() {
        document.body.classList.add(this.darkModeClass);
        this.updateToggleButton(true);
        localStorage.setItem(this.storageKey, 'dark');
        this.dispatchThemeEvent('dark');
    }

    disableDarkMode() {
        document.body.classList.remove(this.darkModeClass);
        this.updateToggleButton(false);
        localStorage.setItem(this.storageKey, 'light');
        this.dispatchThemeEvent('light');
    }

    toggleDarkMode() {
        const isDark = document.body.classList.contains(this.darkModeClass);
        if (isDark) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    updateToggleButton(isDark) {
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const icon = toggle.querySelector('i');
        const text = toggle.querySelector('span');
        
        if (isDark) {
            icon.setAttribute('data-feather', 'sun');
            text.textContent = 'Light Mode';
        } else {
            icon.setAttribute('data-feather', 'moon');
            text.textContent = 'Dark Mode';
        }
        
        // Replace feather icons if available
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    setupToggleListener() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleDarkMode());
        }
    }

    setupSystemThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set a preference
            if (!localStorage.getItem(this.storageKey)) {
                if (e.matches) {
                    this.enableDarkMode();
                } else {
                    this.disableDarkMode();
                }
            }
        });
    }

    dispatchThemeEvent(theme) {
        // Dispatch custom event for widgets and components to listen to
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { 
                theme: theme,
                isDark: theme === 'dark'
            }
        }));
    }

    // Public methods for external use
    isDarkMode() {
        return document.body.classList.contains(this.darkModeClass);
    }

    getCurrentTheme() {
        return this.isDarkMode() ? 'dark' : 'light';
    }

    setTheme(theme) {
        if (theme === 'dark') {
            this.enableDarkMode();
        } else if (theme === 'light') {
            this.disableDarkMode();
        }
    }

    // Method to update chart colors based on theme
    getChartColors() {
        const isDark = this.isDarkMode();
        return {
            background: isDark ? '#1f2937' : '#ffffff',
            text: isDark ? '#f9fafb' : '#374151',
            grid: isDark ? '#374151' : '#e5e7eb',
            primary: '#6366f1',
            secondary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#06b6d4'
        };
    }

    // Method to update widget themes
    updateWidgetThemes() {
        // Update collaboration widget
        const collaborationWidget = document.querySelector('.collaboration-widget');
        if (collaborationWidget) {
            collaborationWidget.dispatchEvent(new CustomEvent('themeUpdate', {
                detail: { theme: this.getCurrentTheme() }
            }));
        }

        // Update help system
        const helpSystem = window.helpSystem;
        if (helpSystem && typeof helpSystem.updateTheme === 'function') {
            helpSystem.updateTheme(this.getCurrentTheme());
        }

        // Update charts
        if (window.chartsManager && typeof window.chartsManager.updateTheme === 'function') {
            window.chartsManager.updateTheme(this.getChartColors());
        }
    }
}

// Initialize dark mode manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.darkModeManager = new DarkModeManager();
    
    // Listen for theme changes to update widgets
    window.addEventListener('themeChanged', () => {
        if (window.darkModeManager) {
            window.darkModeManager.updateWidgetThemes();
        }
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DarkModeManager;
}