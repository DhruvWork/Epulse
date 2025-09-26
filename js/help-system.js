/**
 * Help and Onboarding System for EngineerPulse
 * Provides guided tours, tutorials, and comprehensive help documentation
 */

class HelpSystem {
    constructor() {
        this.tours = new Map();
        this.currentTour = null;
        this.currentStep = 0;
        this.isActive = false;
        this.listeners = {};
        this.settings = {
            animationSpeed: 300,
            highlightPadding: 8,
            tooltipOffset: 10,
            autoAdvance: false,
            showProgress: true,
            allowSkip: true,
            darkOverlay: true
        };
        
        this.init();
    }

    init() {
        this.createHelpUI();
        this.setupEventListeners();
        this.registerDefaultTours();
        this.checkFirstVisit();
    }

    // Event system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Help UI Creation
    createHelpUI() {
        // Create help button
        this.createHelpButton();
        
        // Create tour overlay
        this.createTourOverlay();
        
        // Create help panel
        this.createHelpPanel();
        
        // Create tooltip
        this.createTooltip();
    }

    createHelpButton() {
        const helpButton = document.createElement('div');
        helpButton.id = 'help-button';
        helpButton.className = 'fixed bottom-6 right-6 z-50 help-button';
        helpButton.innerHTML = `
            <button class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 transform hover:scale-105">
                <i data-feather="help-circle" class="w-6 h-6"></i>
            </button>
        `;
        
        document.body.appendChild(helpButton);
        
        // Add click handler
        helpButton.addEventListener('click', () => {
            this.toggleHelpPanel();
        });
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    createTourOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.className = 'fixed inset-0 z-40 hidden tour-overlay';
        overlay.innerHTML = `
            <div class="absolute inset-0 bg-black bg-opacity-75 transition-opacity duration-300"></div>
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    createHelpPanel() {
        const panel = document.createElement('div');
        panel.id = 'help-panel';
        panel.className = 'fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 transform translate-x-full transition-transform duration-300 help-panel';
        panel.innerHTML = `
            <div class="h-full flex flex-col">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-900">Help & Tutorials</h2>
                        <button class="close-help-btn text-gray-400 hover:text-gray-600">
                            <i data-feather="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">Get started with EngineerPulse</p>
                </div>
                
                <div class="flex-1 overflow-y-auto">
                    <div class="p-6">
                        <div class="space-y-6">
                            <div class="help-section">
                                <h3 class="font-medium text-gray-900 mb-3">Getting Started</h3>
                                <div class="space-y-2">
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="dashboard">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <i data-feather="home" class="w-4 h-4 text-indigo-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Dashboard Overview</div>
                                                <div class="text-xs text-gray-600">Learn about your main dashboard</div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="tasks">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <i data-feather="trello" class="w-4 h-4 text-blue-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Managing Tasks</div>
                                                <div class="text-xs text-gray-600">Kanban board and task management</div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="time-tracking">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <i data-feather="clock" class="w-4 h-4 text-green-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Time Tracking</div>
                                                <div class="text-xs text-gray-600">Track your productivity and time</div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="collaboration">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                <i data-feather="users" class="w-4 h-4 text-purple-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Team Collaboration</div>
                                                <div class="text-xs text-gray-600">Comments, mentions, and teamwork</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="help-section">
                                <h3 class="font-medium text-gray-900 mb-3">Advanced Features</h3>
                                <div class="space-y-2">
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="metrics">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <i data-feather="bar-chart-2" class="w-4 h-4 text-yellow-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Metrics & Analytics</div>
                                                <div class="text-xs text-gray-600">Track performance and insights</div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="goals">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                <i data-feather="target" class="w-4 h-4 text-red-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Goal Setting</div>
                                                <div class="text-xs text-gray-600">Set and track your objectives</div>
                                            </div>
                                        </div>
                                    </button>
                                    
                                    <button class="tour-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-tour="data-management">
                                        <div class="flex items-center space-x-3">
                                            <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                <i data-feather="database" class="w-4 h-4 text-gray-600"></i>
                                            </div>
                                            <div>
                                                <div class="font-medium text-sm">Data Management</div>
                                                <div class="text-xs text-gray-600">Export, import, and backup</div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="help-section">
                                <h3 class="font-medium text-gray-900 mb-3">Quick Actions</h3>
                                <div class="space-y-2">
                                    <button class="action-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-action="keyboard-shortcuts">
                                        <div class="flex items-center space-x-3">
                                            <i data-feather="command" class="w-5 h-5 text-gray-600"></i>
                                            <span class="text-sm">Keyboard Shortcuts</span>
                                        </div>
                                    </button>
                                    
                                    <button class="action-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-action="reset-tour">
                                        <div class="flex items-center space-x-3">
                                            <i data-feather="refresh-ccw" class="w-5 h-5 text-gray-600"></i>
                                            <span class="text-sm">Reset All Tours</span>
                                        </div>
                                    </button>
                                    
                                    <button class="action-btn w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200" data-action="feedback">
                                        <div class="flex items-center space-x-3">
                                            <i data-feather="message-circle" class="w-5 h-5 text-gray-600"></i>
                                            <span class="text-sm">Send Feedback</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="p-6 border-t border-gray-200 bg-gray-50">
                    <div class="text-center">
                        <p class="text-xs text-gray-600 mb-2">Need more help?</p>
                        <button class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.panel = panel;
        
        // Add event handlers
        this.setupHelpPanelEvents();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'tour-tooltip';
        tooltip.className = 'fixed z-50 hidden tour-tooltip';
        tooltip.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm">
                <div class="p-4">
                    <div class="flex items-start justify-between mb-3">
                        <div class="tooltip-step-indicator text-xs text-indigo-600 font-medium"></div>
                        <button class="skip-tour-btn text-gray-400 hover:text-gray-600">
                            <i data-feather="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <h4 class="tooltip-title font-semibold text-gray-900 mb-2"></h4>
                    <p class="tooltip-content text-sm text-gray-600 mb-4"></p>
                    <div class="flex items-center justify-between">
                        <div class="tooltip-progress flex items-center space-x-1">
                            <!-- Progress dots will be inserted here -->
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="prev-step-btn btn btn-outline text-sm hidden">Previous</button>
                            <button class="next-step-btn btn btn-primary text-sm">Next</button>
                        </div>
                    </div>
                </div>
                <div class="tooltip-arrow"></div>
            </div>
        `;
        
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
        
        // Add event handlers
        this.setupTooltipEvents();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Event Handlers
    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.endTour();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.toggleHelpPanel();
            }
            
            if (this.isActive) {
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    e.preventDefault();
                    this.nextStep();
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.previousStep();
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.isActive) {
                this.positionTooltip();
            }
        });

        // Handle scroll
        window.addEventListener('scroll', () => {
            if (this.isActive) {
                this.positionTooltip();
            }
        });
    }

    setupHelpPanelEvents() {
        // Close button
        this.panel.querySelector('.close-help-btn').addEventListener('click', () => {
            this.hideHelpPanel();
        });

        // Tour buttons
        this.panel.querySelectorAll('.tour-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tourName = btn.dataset.tour;
                this.hideHelpPanel();
                setTimeout(() => this.startTour(tourName), 300);
            });
        });

        // Action buttons
        this.panel.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleAction(action);
            });
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!this.panel.contains(e.target) && !e.target.closest('#help-button')) {
                if (this.panel.classList.contains('show')) {
                    this.hideHelpPanel();
                }
            }
        });
    }

    setupTooltipEvents() {
        // Skip tour
        this.tooltip.querySelector('.skip-tour-btn').addEventListener('click', () => {
            this.endTour();
        });

        // Next step
        this.tooltip.querySelector('.next-step-btn').addEventListener('click', () => {
            this.nextStep();
        });

        // Previous step
        this.tooltip.querySelector('.prev-step-btn').addEventListener('click', () => {
            this.previousStep();
        });
    }

    // Tour Management
    registerTour(name, tour) {
        this.tours.set(name, tour);
    }

    startTour(name) {
        const tour = this.tours.get(name);
        if (!tour) {
            console.error(`Tour '${name}' not found`);
            return;
        }

        this.currentTour = tour;
        this.currentStep = 0;
        this.isActive = true;

        // Show overlay
        this.overlay.classList.remove('hidden');
        setTimeout(() => {
            this.overlay.classList.add('show');
        }, 10);

        // Start first step
        this.showStep(0);

        // Mark tour as taken
        this.markTourAsTaken(name);

        this.emit('onTourStart', { tourName: name, tour });
    }

    endTour() {
        if (!this.isActive) return;

        this.isActive = false;
        this.hideTooltip();
        this.hideHighlight();

        // Hide overlay
        this.overlay.classList.remove('show');
        setTimeout(() => {
            this.overlay.classList.add('hidden');
        }, 300);

        this.emit('onTourEnd', { 
            tourName: this.currentTour?.name, 
            completed: this.currentStep >= (this.currentTour?.steps.length || 0) - 1
        });

        this.currentTour = null;
        this.currentStep = 0;
    }

    showStep(stepIndex) {
        if (!this.currentTour || stepIndex >= this.currentTour.steps.length) {
            this.endTour();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.currentTour.steps[stepIndex];

        // Execute step action if provided
        if (step.action) {
            step.action();
        }

        // Wait for element to be available
        this.waitForElement(step.element, (element) => {
            this.highlightElement(element, step);
            this.showTooltip(step, element);
            this.updateProgress();
        });

        this.emit('onStepShow', { 
            tourName: this.currentTour.name, 
            step, 
            stepIndex 
        });
    }

    nextStep() {
        if (!this.isActive) return;

        const nextIndex = this.currentStep + 1;
        if (nextIndex >= this.currentTour.steps.length) {
            this.endTour();
            this.showCompletionMessage();
        } else {
            this.showStep(nextIndex);
        }
    }

    previousStep() {
        if (!this.isActive || this.currentStep <= 0) return;
        this.showStep(this.currentStep - 1);
    }

    // Element Highlighting
    highlightElement(element, step) {
        this.removeHighlight();

        const rect = element.getBoundingClientRect();
        const padding = this.settings.highlightPadding;

        const highlight = document.createElement('div');
        highlight.className = 'tour-highlight';
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - padding}px;
            left: ${rect.left - padding}px;
            width: ${rect.width + padding * 2}px;
            height: ${rect.height + padding * 2}px;
            border: 2px solid #6366f1;
            border-radius: 8px;
            background-color: rgba(99, 102, 241, 0.1);
            z-index: 45;
            pointer-events: none;
            transition: all 0.3s ease;
        `;

        document.body.appendChild(highlight);
        this.currentHighlight = highlight;

        // Scroll element into view if needed
        const viewportHeight = window.innerHeight;
        const elementTop = rect.top;
        const elementBottom = rect.bottom;

        if (elementTop < 100 || elementBottom > viewportHeight - 100) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            setTimeout(() => {
                this.positionTooltip();
            }, 500);
        }
    }

    removeHighlight() {
        if (this.currentHighlight) {
            this.currentHighlight.remove();
            this.currentHighlight = null;
        }
    }

    hideHighlight() {
        this.removeHighlight();
    }

    // Tooltip Management
    showTooltip(step, element) {
        const tooltip = this.tooltip;
        
        // Update content
        tooltip.querySelector('.tooltip-step-indicator').textContent = 
            `Step ${this.currentStep + 1} of ${this.currentTour.steps.length}`;
        tooltip.querySelector('.tooltip-title').textContent = step.title;
        tooltip.querySelector('.tooltip-content').textContent = step.content;

        // Update navigation buttons
        const prevBtn = tooltip.querySelector('.prev-step-btn');
        const nextBtn = tooltip.querySelector('.next-step-btn');

        if (this.currentStep > 0) {
            prevBtn.classList.remove('hidden');
        } else {
            prevBtn.classList.add('hidden');
        }

        if (this.currentStep === this.currentTour.steps.length - 1) {
            nextBtn.textContent = 'Finish';
        } else {
            nextBtn.textContent = 'Next';
        }

        // Show tooltip
        tooltip.classList.remove('hidden');
        
        // Position tooltip
        setTimeout(() => {
            this.positionTooltip(element, step.position);
        }, 10);
    }

    positionTooltip(element, position = 'bottom') {
        if (!element) {
            const highlightedElement = document.querySelector('.tour-highlight');
            if (!highlightedElement) return;
            
            element = highlightedElement;
        }

        const tooltip = this.tooltip;
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const offset = this.settings.tooltipOffset;

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - offset;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + offset;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - offset;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + offset;
                break;
            default:
                top = rect.bottom + offset;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
        }

        // Keep tooltip within viewport
        const margin = 20;
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    hideTooltip() {
        this.tooltip.classList.add('hidden');
    }

    updateProgress() {
        const progressContainer = this.tooltip.querySelector('.tooltip-progress');
        const totalSteps = this.currentTour.steps.length;
        
        progressContainer.innerHTML = '';
        
        for (let i = 0; i < totalSteps; i++) {
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full ${
                i <= this.currentStep ? 'bg-indigo-600' : 'bg-gray-300'
            }`;
            progressContainer.appendChild(dot);
        }
    }

    // Help Panel Management
    toggleHelpPanel() {
        if (this.panel.classList.contains('show')) {
            this.hideHelpPanel();
        } else {
            this.showHelpPanel();
        }
    }

    showHelpPanel() {
        this.panel.classList.remove('translate-x-full');
        this.panel.classList.add('show');
        this.emit('onHelpPanelShow');
    }

    hideHelpPanel() {
        this.panel.classList.add('translate-x-full');
        this.panel.classList.remove('show');
        this.emit('onHelpPanelHide');
    }

    // Action Handlers
    handleAction(action) {
        switch (action) {
            case 'keyboard-shortcuts':
                this.showKeyboardShortcuts();
                break;
            case 'reset-tour':
                this.resetAllTours();
                break;
            case 'feedback':
                this.showFeedbackModal();
                break;
        }
    }

    showKeyboardShortcuts() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-lg">Keyboard Shortcuts</h3>
                    <button class="close-modal text-gray-400 hover:text-gray-600">
                        <i data-feather="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span>Open Help</span>
                        <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + H</kbd>
                    </div>
                    <div class="flex justify-between">
                        <span>Global Search</span>
                        <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl + K</kbd>
                    </div>
                    <div class="flex justify-between">
                        <span>Next Tour Step</span>
                        <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">→ or Space</kbd>
                    </div>
                    <div class="flex justify-between">
                        <span>Previous Tour Step</span>
                        <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd>
                    </div>
                    <div class="flex justify-between">
                        <span>Exit Tour</span>
                        <kbd class="px-2 py-1 bg-gray-100 rounded text-xs">Escape</kbd>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    showFeedbackModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-lg">Send Feedback</h3>
                    <button class="close-modal text-gray-400 hover:text-gray-600">
                        <i data-feather="x" class="w-6 h-6"></i>
                    </button>
                </div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select class="form-input w-full">
                            <option>Bug Report</option>
                            <option>Feature Request</option>
                            <option>General Feedback</option>
                            <option>Help Documentation</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea class="form-input w-full" rows="4" placeholder="Tell us what you think..."></textarea>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" class="cancel-feedback btn btn-outline">Cancel</button>
                        <button type="submit" class="submit-feedback btn btn-primary">Send Feedback</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event handlers
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.cancel-feedback').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate sending feedback
            this.showNotification('Feedback sent successfully!', 'success');
            document.body.removeChild(modal);
        });

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Tour Registration
    registerDefaultTours() {
        // Dashboard Tour
        this.registerTour('dashboard', {
            name: 'Dashboard Overview',
            description: 'Learn about your main dashboard',
            steps: [
                {
                    element: '.header',
                    title: 'Welcome to EngineerPulse',
                    content: 'This is your main navigation. From here you can access all features and switch between different views.',
                    position: 'bottom'
                },
                {
                    element: '.sidebar',
                    title: 'Navigation Sidebar',
                    content: 'Use the sidebar to navigate between different sections like Dashboard, Tasks, Metrics, and Settings.',
                    position: 'right'
                },
                {
                    element: '.stat-card',
                    title: 'Performance Metrics',
                    content: 'These cards show your key performance indicators and productivity metrics at a glance.',
                    position: 'bottom'
                },
                {
                    element: '#theme-toggle',
                    title: 'Theme Toggle',
                    content: 'Switch between light and dark mode to customize your viewing experience.',
                    position: 'bottom'
                }
            ]
        });

        // Tasks Tour
        this.registerTour('tasks', {
            name: 'Task Management',
            description: 'Learn how to manage tasks with Kanban board',
            steps: [
                {
                    element: '.kanban-column',
                    title: 'Kanban Board',
                    content: 'Your tasks are organized in columns representing different stages of work: Backlog, To Do, In Progress, and Done.',
                    position: 'top'
                },
                {
                    element: '.task-card',
                    title: 'Task Cards',
                    content: 'Each card represents a task. You can drag and drop them between columns to change their status.',
                    position: 'bottom'
                },
                {
                    element: '.start-timer-btn',
                    title: 'Time Tracking',
                    content: 'Click the "Track" button to start timing your work on any task. This helps measure productivity.',
                    position: 'top'
                }
            ]
        });

        // Time Tracking Tour
        this.registerTour('time-tracking', {
            name: 'Time Tracking',
            description: 'Learn how to track your productivity and time',
            steps: [
                {
                    element: '#timeTrackerContainer',
                    title: 'Time Tracker Widget',
                    content: 'This widget shows your current time tracking session and daily statistics.',
                    position: 'right'
                },
                {
                    element: '.start-timer-btn',
                    title: 'Start Tracking',
                    content: 'Click any "Track" button next to tasks to start measuring time spent on that specific task.',
                    position: 'top'
                }
            ]
        });

        // Add more tours for other features...
    }

    // Utility Methods
    waitForElement(selector, callback, timeout = 5000) {
        const startTime = Date.now();
        
        const checkElement = () => {
            const element = typeof selector === 'string' ? 
                document.querySelector(selector) : selector;
                
            if (element) {
                callback(element);
            } else if (Date.now() - startTime < timeout) {
                setTimeout(checkElement, 100);
            } else {
                console.warn(`Element not found: ${selector}`);
                this.nextStep(); // Skip this step
            }
        };
        
        checkElement();
    }

    checkFirstVisit() {
        const hasVisited = localStorage.getItem('engineerpulse-visited');
        if (!hasVisited) {
            localStorage.setItem('engineerpulse-visited', 'true');
            
            // Show welcome message after a short delay
            setTimeout(() => {
                this.showWelcomeMessage();
            }, 2000);
        }
    }

    showWelcomeMessage() {
        const welcome = document.createElement('div');
        welcome.className = 'fixed top-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm transform translate-x-full transition-transform duration-300';
        welcome.innerHTML = `
            <div class="flex items-start space-x-3">
                <i data-feather="wave" class="w-6 h-6 mt-0.5"></i>
                <div class="flex-1">
                    <h4 class="font-semibold">Welcome to EngineerPulse!</h4>
                    <p class="text-sm mt-1">Would you like a quick tour to get started?</p>
                    <div class="flex space-x-2 mt-3">
                        <button class="start-tour-btn bg-white text-indigo-600 px-3 py-1 rounded text-sm font-medium">
                            Start Tour
                        </button>
                        <button class="dismiss-welcome bg-indigo-700 text-white px-3 py-1 rounded text-sm">
                            Maybe Later
                        </button>
                    </div>
                </div>
                <button class="close-welcome text-indigo-200 hover:text-white">
                    <i data-feather="x" class="w-5 h-5"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(welcome);
        
        // Animate in
        setTimeout(() => {
            welcome.style.transform = 'translateX(0)';
        }, 100);
        
        // Event handlers
        welcome.querySelector('.start-tour-btn').addEventListener('click', () => {
            document.body.removeChild(welcome);
            this.startTour('dashboard');
        });
        
        welcome.querySelector('.dismiss-welcome').addEventListener('click', () => {
            this.hideWelcome(welcome);
        });
        
        welcome.querySelector('.close-welcome').addEventListener('click', () => {
            this.hideWelcome(welcome);
        });
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (document.body.contains(welcome)) {
                this.hideWelcome(welcome);
            }
        }, 10000);

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    hideWelcome(element) {
        element.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(element)) {
                document.body.removeChild(element);
            }
        }, 300);
    }

    showCompletionMessage() {
        this.showNotification(
            `🎉 Great job! You've completed the ${this.currentTour.name} tour.`,
            'success',
            5000
        );
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-feather="${
                    type === 'success' ? 'check-circle' :
                    type === 'error' ? 'alert-circle' :
                    'info'
                }" class="w-5 h-5"></i>
                <span class="text-sm">${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    markTourAsTaken(tourName) {
        const takenTours = JSON.parse(localStorage.getItem('tours-taken') || '[]');
        if (!takenTours.includes(tourName)) {
            takenTours.push(tourName);
            localStorage.setItem('tours-taken', JSON.stringify(takenTours));
        }
    }

    resetAllTours() {
        localStorage.removeItem('tours-taken');
        localStorage.removeItem('engineerpulse-visited');
        this.showNotification('All tours have been reset', 'success');
    }

    // Public API
    isTourTaken(tourName) {
        const takenTours = JSON.parse(localStorage.getItem('tours-taken') || '[]');
        return takenTours.includes(tourName);
    }

    getAvailableTours() {
        return Array.from(this.tours.keys());
    }

    getTourProgress() {
        if (!this.isActive) return null;
        
        return {
            tourName: this.currentTour.name,
            currentStep: this.currentStep,
            totalSteps: this.currentTour.steps.length,
            progress: ((this.currentStep + 1) / this.currentTour.steps.length) * 100
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HelpSystem;
} else {
    window.HelpSystem = HelpSystem;
}