/**
 * Goals Widget for EngineerPulse
 * UI component for goal management and tracking
 */

class GoalsWidget {
    constructor(container, goalsManager) {
        this.container = container;
        this.goalsManager = goalsManager;
        this.currentView = 'dashboard'; // dashboard, list, create, edit
        this.editingGoalId = null;
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.render();
        this.bindGoalsEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="goals-widget">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 class="text-xl font-bold">Goals & Objectives</h2>
                        <p class="text-gray-600 text-sm">Track your progress and achieve your targets</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="goalsViewToggle" class="btn btn-outline text-sm">
                            <i data-feather="list" class="w-4 h-4 mr-1"></i>
                            View All
                        </button>
                        <button id="createGoalBtn" class="btn btn-primary text-sm">
                            <i data-feather="plus" class="w-4 h-4 mr-1"></i>
                            New Goal
                        </button>
                    </div>
                </div>

                <div id="goalsContent">
                    ${this.renderDashboard()}
                </div>
            </div>
        `;

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderDashboard() {
        const summary = this.goalsManager.getDashboardSummary();
        const activeGoals = this.goalsManager.getGoals({ status: 'active' }).slice(0, 3);
        const upcomingDeadlines = this.goalsManager.getUpcomingDeadlines(7);

        return `
            <div class="goals-dashboard">
                <!-- Summary Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="stat-card">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-700">Active Goals</h3>
                            <i data-feather="target" class="w-4 h-4 text-indigo-600"></i>
                        </div>
                        <div class="text-2xl font-bold text-gray-900">${summary.totalActiveGoals}</div>
                        <div class="text-xs text-gray-500 mt-1">${summary.averageProgress}% avg progress</div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-700">Completed</h3>
                            <i data-feather="check-circle" class="w-4 h-4 text-green-600"></i>
                        </div>
                        <div class="text-2xl font-bold text-gray-900">${summary.totalCompletedGoals}</div>
                        <div class="text-xs text-gray-500 mt-1">${summary.recentCompletions} this month</div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-700">High Priority</h3>
                            <i data-feather="alert-circle" class="w-4 h-4 text-red-600"></i>
                        </div>
                        <div class="text-2xl font-bold text-gray-900">${summary.priorityBreakdown.high + summary.priorityBreakdown.critical}</div>
                        <div class="text-xs text-gray-500 mt-1">Needs attention</div>
                    </div>

                    <div class="stat-card">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-700">Due Soon</h3>
                            <i data-feather="clock" class="w-4 h-4 text-yellow-600"></i>
                        </div>
                        <div class="text-2xl font-bold text-gray-900">${upcomingDeadlines.length}</div>
                        <div class="text-xs text-gray-500 mt-1">Next 7 days</div>
                    </div>
                </div>

                <!-- Active Goals -->
                <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold">Current Goals</h3>
                        <a href="#" id="viewAllGoals" class="text-sm text-indigo-600 hover:text-indigo-800">View All</a>
                    </div>
                    <div class="space-y-4">
                        ${activeGoals.length > 0 ? activeGoals.map(goal => this.renderGoalCard(goal)).join('') : 
                          '<div class="text-center py-8 text-gray-500">No active goals. <a href="#" id="createFirstGoal" class="text-indigo-600">Create your first goal</a></div>'}
                    </div>
                </div>

                <!-- Upcoming Deadlines -->
                ${upcomingDeadlines.length > 0 ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-center mb-3">
                        <i data-feather="alert-triangle" class="w-5 h-5 text-yellow-600 mr-2"></i>
                        <h3 class="font-semibold text-yellow-800">Upcoming Deadlines</h3>
                    </div>
                    <div class="space-y-2">
                        ${upcomingDeadlines.slice(0, 3).map(goal => `
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-yellow-800">${goal.title}</span>
                                <span class="text-yellow-600">${new Date(goal.targetDate).toLocaleDateString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>` : ''}
            </div>
        `;
    }

    renderGoalsList() {
        const goals = this.goalsManager.getGoals();
        
        return `
            <div class="goals-list">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <button id="backToDashboard" class="btn btn-outline text-sm">
                            <i data-feather="arrow-left" class="w-4 h-4 mr-1"></i>
                            Back
                        </button>
                        <div class="flex items-center space-x-2">
                            <select id="statusFilter" class="form-input text-sm">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
                            </select>
                            <select id="priorityFilter" class="form-input text-sm">
                                <option value="">All Priorities</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                    <button id="exportGoals" class="btn btn-outline text-sm">
                        <i data-feather="download" class="w-4 h-4 mr-1"></i>
                        Export
                    </button>
                </div>

                <div class="bg-white rounded-lg shadow-sm">
                    ${goals.length > 0 ? `
                        <div class="divide-y divide-gray-200">
                            ${goals.map(goal => this.renderGoalListItem(goal)).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-12">
                            <i data-feather="target" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
                            <p class="text-gray-500 mb-4">Start by creating your first goal to track your progress</p>
                            <button class="btn btn-primary" onclick="goalsWidget.showCreateForm()">
                                <i data-feather="plus" class="w-4 h-4 mr-2"></i>
                                Create Goal
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderGoalCard(goal) {
        const progress = this.goalsManager.calculateProgress(goal);
        const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && goal.status === 'active';
        
        return `
            <div class="goal-card border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" data-goal-id="${goal.id}">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-900">${goal.title}</h4>
                        <p class="text-sm text-gray-600 mt-1">${goal.description}</p>
                    </div>
                    <div class="flex items-center space-x-2 ml-4">
                        <span class="text-xs px-2 py-1 rounded-full ${this.getPriorityClass(goal.priority)}">${goal.priority}</span>
                        ${isOverdue ? '<span class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Overdue</span>' : ''}
                    </div>
                </div>
                
                <div class="mb-3">
                    <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Progress: ${goal.currentValue} / ${goal.targetValue} ${goal.unit}</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${this.getProgressColor(progress)}" style="width: ${progress}%"></div>
                    </div>
                </div>

                <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>${goal.timeframe} • ${goal.type}</span>
                    ${goal.targetDate ? `<span>Due: ${new Date(goal.targetDate).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderGoalListItem(goal) {
        const progress = this.goalsManager.calculateProgress(goal);
        
        return `
            <div class="goal-list-item p-4 hover:bg-gray-50 cursor-pointer" data-goal-id="${goal.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3">
                            <h4 class="font-medium text-gray-900">${goal.title}</h4>
                            <span class="text-xs px-2 py-1 rounded-full ${this.getStatusClass(goal.status)}">${goal.status}</span>
                            <span class="text-xs px-2 py-1 rounded-full ${this.getPriorityClass(goal.priority)}">${goal.priority}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${goal.description}</p>
                        <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>${goal.currentValue} / ${goal.targetValue} ${goal.unit}</span>
                            <span>${goal.timeframe}</span>
                            ${goal.targetDate ? `<span>Due: ${new Date(goal.targetDate).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <div class="text-right">
                            <div class="text-lg font-bold text-gray-900">${progress}%</div>
                            <div class="w-20">
                                <div class="progress-bar">
                                    <div class="progress-fill ${this.getProgressColor(progress)}" style="width: ${progress}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <button class="text-gray-400 hover:text-indigo-600" onclick="goalsWidget.editGoal('${goal.id}')" title="Edit">
                                <i data-feather="edit-2" class="w-4 h-4"></i>
                            </button>
                            <button class="text-gray-400 hover:text-green-600" onclick="goalsWidget.updateProgress('${goal.id}')" title="Update Progress">
                                <i data-feather="plus-circle" class="w-4 h-4"></i>
                            </button>
                            <button class="text-gray-400 hover:text-red-600" onclick="goalsWidget.deleteGoal('${goal.id}')" title="Delete">
                                <i data-feather="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCreateForm() {
        const templates = this.goalsManager.getGoalTemplates();
        
        return `
            <div class="create-goal-form">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="text-lg font-semibold">Create New Goal</h3>
                        <p class="text-gray-600 text-sm">Set a new objective to track your progress</p>
                    </div>
                    <button id="cancelCreate" class="btn btn-outline text-sm">Cancel</button>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6">
                    <form id="goalForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="form-label">Goal Title *</label>
                                <input type="text" id="goalTitle" class="form-input" placeholder="Enter goal title" required>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="form-label">Description</label>
                                <textarea id="goalDescription" class="form-input" rows="3" placeholder="Describe your goal..."></textarea>
                            </div>
                            
                            <div>
                                <label class="form-label">Type</label>
                                <select id="goalType" class="form-input">
                                    <option value="productivity">Productivity</option>
                                    <option value="learning">Learning</option>
                                    <option value="code_quality">Code Quality</option>
                                    <option value="collaboration">Collaboration</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="form-label">Priority</label>
                                <select id="goalPriority" class="form-input">
                                    <option value="low">Low</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="form-label">Timeframe</label>
                                <select id="goalTimeframe" class="form-input">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly" selected>Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="form-label">Target Date</label>
                                <input type="date" id="goalTargetDate" class="form-input">
                            </div>
                            
                            <div>
                                <label class="form-label">Target Value *</label>
                                <input type="number" id="goalTargetValue" class="form-input" placeholder="100" min="1" required>
                            </div>
                            
                            <div>
                                <label class="form-label">Unit</label>
                                <input type="text" id="goalUnit" class="form-input" placeholder="points, hours, %" value="points">
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <h4 class="font-medium mb-3">Quick Templates</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${templates.map((template, index) => `
                                    <button type="button" class="template-btn text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors" data-template-index="${index}">
                                        <div class="font-medium text-sm">${template.title}</div>
                                        <div class="text-xs text-gray-500 mt-1">${template.description}</div>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="flex justify-end space-x-3 pt-4">
                            <button type="button" id="cancelGoalForm" class="btn btn-outline">Cancel</button>
                            <button type="submit" class="btn btn-primary">Create Goal</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            // Create goal button
            if (e.target.closest('#createGoalBtn') || e.target.closest('#createFirstGoal')) {
                this.showCreateForm();
            }
            
            // View toggle
            if (e.target.closest('#goalsViewToggle') || e.target.closest('#viewAllGoals')) {
                this.showGoalsList();
            }
            
            // Back to dashboard
            if (e.target.closest('#backToDashboard') || e.target.closest('#cancelCreate') || e.target.closest('#cancelGoalForm')) {
                this.showDashboard();
            }
            
            // Export goals
            if (e.target.closest('#exportGoals')) {
                this.exportGoals();
            }
            
            // Goal card clicks
            if (e.target.closest('.goal-card') && !e.target.closest('button')) {
                const goalId = e.target.closest('.goal-card').dataset.goalId;
                this.showGoalDetails(goalId);
            }
            
            // Template buttons
            if (e.target.closest('.template-btn')) {
                const templateIndex = parseInt(e.target.closest('.template-btn').dataset.templateIndex);
                this.applyTemplate(templateIndex);
            }
        });

        // Form submission
        this.container.addEventListener('submit', (e) => {
            if (e.target.id === 'goalForm') {
                e.preventDefault();
                this.handleGoalFormSubmit();
            }
        });

        // Filter changes
        this.container.addEventListener('change', (e) => {
            if (e.target.id === 'statusFilter' || e.target.id === 'priorityFilter') {
                this.applyFilters();
            }
        });
    }

    bindGoalsEvents() {
        this.goalsManager.on('onGoalCreated', () => {
            this.showDashboard();
            this.showNotification('Goal created successfully!', 'success');
        });

        this.goalsManager.on('onGoalUpdated', () => {
            this.refreshCurrentView();
            this.showNotification('Goal updated successfully!', 'success');
        });

        this.goalsManager.on('onGoalCompleted', (goal) => {
            this.refreshCurrentView();
            this.showNotification(`Congratulations! You completed: ${goal.title}`, 'success');
        });

        this.goalsManager.on('onGoalDeleted', () => {
            this.refreshCurrentView();
            this.showNotification('Goal deleted successfully!', 'info');
        });
    }

    showDashboard() {
        this.currentView = 'dashboard';
        const content = this.container.querySelector('#goalsContent');
        content.innerHTML = this.renderDashboard();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    showGoalsList() {
        this.currentView = 'list';
        const content = this.container.querySelector('#goalsContent');
        content.innerHTML = this.renderGoalsList();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    showCreateForm() {
        this.currentView = 'create';
        const content = this.container.querySelector('#goalsContent');
        content.innerHTML = this.renderCreateForm();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    applyTemplate(templateIndex) {
        const templates = this.goalsManager.getGoalTemplates();
        const template = templates[templateIndex];
        
        if (template) {
            document.getElementById('goalTitle').value = template.title;
            document.getElementById('goalDescription').value = template.description;
            document.getElementById('goalType').value = template.type;
            document.getElementById('goalTimeframe').value = template.timeframe;
            document.getElementById('goalTargetValue').value = template.targetValue;
            document.getElementById('goalUnit').value = template.unit;
        }
    }

    handleGoalFormSubmit() {
        const formData = {
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            type: document.getElementById('goalType').value,
            priority: document.getElementById('goalPriority').value,
            timeframe: document.getElementById('goalTimeframe').value,
            targetDate: document.getElementById('goalTargetDate').value || null,
            targetValue: parseInt(document.getElementById('goalTargetValue').value),
            unit: document.getElementById('goalUnit').value
        };

        try {
            this.goalsManager.createGoal(formData);
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    updateProgress(goalId) {
        const goal = this.goalsManager.getGoal(goalId);
        if (!goal) return;

        const newValue = prompt(`Update progress for "${goal.title}"\nCurrent: ${goal.currentValue} / ${goal.targetValue} ${goal.unit}\nEnter new value:`, goal.currentValue);
        
        if (newValue !== null && !isNaN(newValue)) {
            const notes = prompt('Add notes for this progress update (optional):') || '';
            try {
                this.goalsManager.updateGoalProgress(goalId, parseInt(newValue), notes);
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }

    editGoal(goalId) {
        // This would open an edit form - simplified for now
        alert('Goal editing form would open here. This will be enhanced in the next iteration.');
    }

    deleteGoal(goalId) {
        const goal = this.goalsManager.getGoal(goalId);
        if (!goal) return;

        if (confirm(`Are you sure you want to delete the goal "${goal.title}"?`)) {
            try {
                this.goalsManager.deleteGoal(goalId);
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }

    showGoalDetails(goalId) {
        const goal = this.goalsManager.getGoal(goalId);
        if (!goal) return;

        // This would show a detailed view - simplified for now
        alert(`Goal Details:\n${goal.title}\n${goal.description}\nProgress: ${this.goalsManager.calculateProgress(goal)}%`);
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value;
        const priorityFilter = document.getElementById('priorityFilter')?.value;
        
        const filters = {};
        if (statusFilter) filters.status = statusFilter;
        if (priorityFilter) filters.priority = priorityFilter;
        
        const goals = this.goalsManager.getGoals(filters);
        const container = this.container.querySelector('.goals-list .bg-white');
        
        if (container) {
            container.innerHTML = goals.length > 0 ? `
                <div class="divide-y divide-gray-200">
                    ${goals.map(goal => this.renderGoalListItem(goal)).join('')}
                </div>
            ` : `
                <div class="text-center py-12">
                    <i data-feather="search" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No goals match your filters</h3>
                    <p class="text-gray-500">Try adjusting your filter criteria</p>
                </div>
            `;
            
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    }

    exportGoals() {
        try {
            const data = this.goalsManager.exportGoals('json');
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `goals-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Goals exported successfully!', 'success');
        } catch (error) {
            this.showNotification('Error exporting goals', 'error');
        }
    }

    refreshCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                this.showDashboard();
                break;
            case 'list':
                this.showGoalsList();
                break;
            default:
                this.showDashboard();
        }
    }

    // Utility methods
    getPriorityClass(priority) {
        const classes = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800'
        };
        return classes[priority] || classes.medium;
    }

    getStatusClass(status) {
        const classes = {
            active: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            paused: 'bg-yellow-100 text-yellow-800',
            archived: 'bg-gray-100 text-gray-800'
        };
        return classes[status] || classes.active;
    }

    getProgressColor(progress) {
        if (progress >= 100) return 'bg-green-500';
        if (progress >= 75) return 'bg-blue-500';
        if (progress >= 50) return 'bg-indigo-500';
        if (progress >= 25) return 'bg-yellow-500';
        return 'bg-gray-400';
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };

        const notification = document.createElement('div');
        notification.className = `fixed top-20 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-feather="check-circle" class="w-5 h-5"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoalsWidget;
} else {
    window.GoalsWidget = GoalsWidget;
}