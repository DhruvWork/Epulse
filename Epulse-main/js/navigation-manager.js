/**
 * Navigation Manager
 * Handles unified navigation across all pages with breadcrumbs, active states, and mobile support
 */
class NavigationManager {
    constructor() {
        this.pages = {
            'index.html': { title: 'Dashboard', icon: 'home', category: 'main' },
            'code-activity.html': { title: 'Code Activity', icon: 'github', category: 'analytics' },
            'project-tasks.html': { title: 'Project Tasks', icon: 'trello', category: 'management' },
            'metrics.html': { title: 'Metrics', icon: 'bar-chart-2', category: 'analytics' },
            'add-data.html': { title: 'Add Data', icon: 'database', category: 'management' },
            'settings.html': { title: 'Settings', icon: 'settings', category: 'system' }
        };
        
        this.categories = {
            'main': { title: 'Overview', color: 'indigo' },
            'analytics': { title: 'Analytics', color: 'blue' },
            'management': { title: 'Management', color: 'green' },
            'system': { title: 'System', color: 'gray' }
        };
        
        this.currentPage = this.getCurrentPage();
        this.init();
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename === '' ? 'index.html' : filename;
    }
    
    init() {
        this.createBreadcrumbs();
        this.createQuickNavigation();
        this.updateActiveStates();
        this.setupKeyboardNavigation();
        this.createPageActions();
        
        // Listen for theme changes to update navigation colors
        window.addEventListener('themeChanged', () => {
            this.updateTheme();
        });
    }
    
    createBreadcrumbs() {
        const breadcrumbContainer = document.querySelector('#breadcrumbs');
        if (!breadcrumbContainer) return;
        
        const currentPageInfo = this.pages[this.currentPage];
        if (!currentPageInfo) return;
        
        const category = this.categories[currentPageInfo.category];
        const categoryColor = category.color;
        
        breadcrumbContainer.innerHTML = `
            <nav class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <a href="index.html" class="flex items-center hover:text-${categoryColor}-600 dark:hover:text-${categoryColor}-400 transition-colors">
                    <i data-feather="home" class="w-4 h-4 mr-1"></i>
                    Dashboard
                </a>
                <i data-feather="chevron-right" class="w-4 h-4"></i>
                <span class="text-${categoryColor}-600 dark:text-${categoryColor}-400 font-medium">${category.title}</span>
                <i data-feather="chevron-right" class="w-4 h-4"></i>
                <span class="text-gray-900 dark:text-white font-medium">${currentPageInfo.title}</span>
            </nav>
        `;
        
        feather.replace();
    }
    
    createQuickNavigation() {
        const quickNavContainer = document.querySelector('#quick-nav');
        if (!quickNavContainer) return;
        
        const currentPageInfo = this.pages[this.currentPage];
        const categoryPages = Object.entries(this.pages)
            .filter(([_, info]) => info.category === currentPageInfo.category)
            .filter(([page, _]) => page !== this.currentPage);
        
        if (categoryPages.length === 0) return;
        
        const categoryColor = this.categories[currentPageInfo.category].color;
        
        quickNavContainer.innerHTML = `
            <div class="flex items-center space-x-1">
                <span class="text-sm text-gray-500 dark:text-gray-400 mr-2">Related:</span>
                ${categoryPages.map(([page, info]) => `
                    <a href="${page}" 
                       class="inline-flex items-center px-2 py-1 text-xs bg-${categoryColor}-50 dark:bg-${categoryColor}-900/20 
                              text-${categoryColor}-700 dark:text-${categoryColor}-300 rounded-md hover:bg-${categoryColor}-100 
                              dark:hover:bg-${categoryColor}-900/30 transition-colors"
                       title="Go to ${info.title}">
                        <i data-feather="${info.icon}" class="w-3 h-3 mr-1"></i>
                        ${info.title}
                    </a>
                `).join('')}
            </div>
        `;
        
        feather.replace();
    }
    
    createPageActions() {
        const actionsContainer = document.querySelector('#page-actions');
        if (!actionsContainer) return;
        
        const currentPageInfo = this.pages[this.currentPage];
        const categoryColor = this.categories[currentPageInfo.category].color;
        
        // Define page-specific actions
        const actions = this.getPageActions(this.currentPage, categoryColor);
        
        if (actions.length === 0) return;
        
        actionsContainer.innerHTML = `
            <div class="flex items-center space-x-2">
                ${actions.map(action => `
                    <button onclick="${action.onclick}" 
                            class="inline-flex items-center px-3 py-1 text-sm bg-${action.color}-600 
                                   hover:bg-${action.color}-700 text-white rounded-md transition-colors"
                            title="${action.title}">
                        <i data-feather="${action.icon}" class="w-4 h-4 mr-1"></i>
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
        
        feather.replace();
    }
    
    getPageActions(page, categoryColor) {
        const actions = {
            'index.html': [
                { label: 'Refresh Data', icon: 'refresh-cw', onclick: 'refreshDashboard()', color: categoryColor, title: 'Refresh dashboard data' },
                { label: 'Export Report', icon: 'download', onclick: 'exportDashboardReport()', color: 'green', title: 'Export dashboard report' }
            ],
            'code-activity.html': [
                { label: 'Sync Repos', icon: 'git-branch', onclick: 'syncRepositories()', color: categoryColor, title: 'Sync repository data' },
                { label: 'View Commits', icon: 'git-commit', onclick: 'viewCommitHistory()', color: 'gray', title: 'View commit history' }
            ],
            'project-tasks.html': [
                { label: 'Add Task', icon: 'plus', onclick: 'addNewTask()', color: categoryColor, title: 'Create new task' },
                { label: 'Import Tasks', icon: 'upload', onclick: 'importTasks()', color: 'blue', title: 'Import tasks from file' }
            ],
            'metrics.html': [
                { label: 'Generate Report', icon: 'file-text', onclick: 'generateMetricsReport()', color: categoryColor, title: 'Generate metrics report' },
                { label: 'Custom Chart', icon: 'pie-chart', onclick: 'createCustomChart()', color: 'purple', title: 'Create custom chart' }
            ],
            'add-data.html': [
                { label: 'Import CSV', icon: 'upload', onclick: 'importCSVData()', color: categoryColor, title: 'Import CSV data' },
                { label: 'Template', icon: 'file-plus', onclick: 'downloadTemplate()', color: 'blue', title: 'Download data template' }
            ],
            'settings.html': [
                { label: 'Export Settings', icon: 'download', onclick: 'exportSettings()', color: categoryColor, title: 'Export configuration' },
                { label: 'Reset', icon: 'rotate-ccw', onclick: 'resetSettings()', color: 'red', title: 'Reset to defaults' }
            ]
        };
        
        return actions[page] || [];
    }
    
    updateActiveStates() {
        // Update sidebar active states
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === this.currentPage) {
                link.classList.add('active');
                link.classList.remove('text-gray-600', 'hover:text-indigo-600');
                link.classList.add('text-indigo-600', 'font-medium');
            } else {
                link.classList.remove('active');
                link.classList.add('text-gray-600', 'hover:text-indigo-600');
                link.classList.remove('text-indigo-600', 'font-medium');
            }
        });
        
        // Update mobile menu active states
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href === this.currentPage) {
                link.classList.add('text-indigo-600');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('text-indigo-600');
                link.classList.add('text-gray-600');
            }
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Alt + number keys for quick navigation
            if (e.altKey && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const pages = Object.keys(this.pages);
                const pageIndex = parseInt(e.key) - 1;
                if (pages[pageIndex]) {
                    window.location.href = pages[pageIndex];
                }
            }
            
            // Ctrl + Shift + N for navigation menu
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                this.showNavigationMenu();
            }
        });
    }
    
    showNavigationMenu() {
        // Create and show a modal navigation menu
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Quick Navigation</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i data-feather="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    ${Object.entries(this.pages).map(([page, info], index) => {
                        const category = this.categories[info.category];
                        const isActive = page === this.currentPage;
                        return `
                            <a href="${page}" 
                               class="flex items-center p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 
                                      ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} group">
                                <div class="flex items-center justify-center w-8 h-8 rounded-md bg-${category.color}-100 
                                            dark:bg-${category.color}-900/20 mr-3">
                                    <i data-feather="${info.icon}" class="w-4 h-4 text-${category.color}-600 dark:text-${category.color}-400"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900 dark:text-white">${info.title}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">${category.title}</div>
                                </div>
                                <div class="text-xs text-gray-400 dark:text-gray-500">Alt+${index + 1}</div>
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        feather.replace();
        
        // Close on escape key
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
        
        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', closeHandler);
            }
        });
    }
    
    updateTheme() {
        // Update navigation colors for dark mode
        const isDark = document.body.classList.contains('dark-mode');
        // Theme-specific navigation updates will be handled by CSS
    }
    
    // Utility method to get page title for document title
    getPageTitle() {
        const pageInfo = this.pages[this.currentPage];
        return pageInfo ? `${pageInfo.title} - EngineerPulse` : 'EngineerPulse';
    }
}

// Global navigation functions for page actions
window.refreshDashboard = function() {
    location.reload();
};

window.exportDashboardReport = function() {
    console.log('Exporting dashboard report...');
    // Implementation would go here
};

window.syncRepositories = function() {
    console.log('Syncing repositories...');
    // Implementation would go here
};

window.viewCommitHistory = function() {
    console.log('Opening commit history...');
    // Implementation would go here
};

window.addNewTask = function() {
    console.log('Adding new task...');
    // Implementation would go here
};

window.importTasks = function() {
    console.log('Importing tasks...');
    // Implementation would go here
};

window.generateMetricsReport = function() {
    console.log('Generating metrics report...');
    // Implementation would go here
};

window.createCustomChart = function() {
    console.log('Creating custom chart...');
    // Implementation would go here
};

window.importCSVData = function() {
    console.log('Importing CSV data...');
    // Implementation would go here
};

window.downloadTemplate = function() {
    console.log('Downloading template...');
    // Implementation would go here
};

window.exportSettings = function() {
    console.log('Exporting settings...');
    // Implementation would go here
};

window.resetSettings = function() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        console.log('Resetting settings...');
        // Implementation would go here
    }
};

// Initialize navigation manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
    
    // Update document title
    document.title = window.navigationManager.getPageTitle();
});