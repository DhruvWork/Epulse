/**
 * Goals Manager for EngineerPulse
 * Handles goal setting, tracking, and progress management
 */

class GoalsManager {
    constructor() {
        this.goals = JSON.parse(localStorage.getItem('engineerGoals') || '[]');
        this.callbacks = {
            onGoalCreated: [],
            onGoalUpdated: [],
            onGoalCompleted: [],
            onGoalDeleted: []
        };
        
        this.goalTypes = {
            PRODUCTIVITY: 'productivity',
            LEARNING: 'learning',
            CODE_QUALITY: 'code_quality',
            COLLABORATION: 'collaboration',
            CUSTOM: 'custom'
        };

        this.timeframes = {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            MONTHLY: 'monthly',
            QUARTERLY: 'quarterly',
            YEARLY: 'yearly'
        };

        this.priorities = {
            LOW: 'low',
            MEDIUM: 'medium',
            HIGH: 'high',
            CRITICAL: 'critical'
        };
    }

    // Event system
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    // Create a new goal
    createGoal(goalData) {
        const goal = {
            id: this.generateId(),
            title: goalData.title,
            description: goalData.description || '',
            type: goalData.type || this.goalTypes.CUSTOM,
            category: goalData.category || 'General',
            priority: goalData.priority || this.priorities.MEDIUM,
            timeframe: goalData.timeframe || this.timeframes.MONTHLY,
            targetValue: goalData.targetValue || 100,
            currentValue: goalData.currentValue || 0,
            unit: goalData.unit || 'points',
            startDate: goalData.startDate || new Date().toISOString(),
            targetDate: goalData.targetDate,
            completedDate: null,
            status: 'active', // active, completed, paused, archived
            isSmartGoal: goalData.isSmartGoal || false,
            milestones: goalData.milestones || [],
            tags: goalData.tags || [],
            linkedTasks: goalData.linkedTasks || [],
            notes: goalData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate goal
        if (!this.validateGoal(goal)) {
            throw new Error('Invalid goal data');
        }

        this.goals.push(goal);
        this.saveGoals();
        this.emit('onGoalCreated', goal);
        
        return goal;
    }

    // Update goal progress
    updateGoalProgress(goalId, newValue, notes = '') {
        const goal = this.getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        const oldValue = goal.currentValue;
        goal.currentValue = Math.max(0, newValue);
        goal.updatedAt = new Date().toISOString();
        
        // Add progress entry
        if (!goal.progressHistory) {
            goal.progressHistory = [];
        }
        
        goal.progressHistory.push({
            date: new Date().toISOString(),
            value: newValue,
            previousValue: oldValue,
            notes: notes,
            progress: this.calculateProgress(goal)
        });

        // Check if goal is completed
        if (goal.currentValue >= goal.targetValue && goal.status !== 'completed') {
            goal.status = 'completed';
            goal.completedDate = new Date().toISOString();
            this.emit('onGoalCompleted', goal);
        }

        // Check milestones
        this.checkMilestones(goal);

        this.saveGoals();
        this.emit('onGoalUpdated', goal);
        
        return goal;
    }

    // Update goal details
    updateGoal(goalId, updates) {
        const goal = this.getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        // Update allowed fields
        const allowedFields = ['title', 'description', 'priority', 'targetDate', 'targetValue', 'unit', 'tags', 'notes'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                goal[field] = updates[field];
            }
        });

        goal.updatedAt = new Date().toISOString();
        this.saveGoals();
        this.emit('onGoalUpdated', goal);
        
        return goal;
    }

    // Delete a goal
    deleteGoal(goalId) {
        const goalIndex = this.goals.findIndex(g => g.id === goalId);
        if (goalIndex === -1) {
            throw new Error('Goal not found');
        }

        const goal = this.goals[goalIndex];
        this.goals.splice(goalIndex, 1);
        this.saveGoals();
        this.emit('onGoalDeleted', goal);
        
        return goal;
    }

    // Get a specific goal
    getGoal(goalId) {
        return this.goals.find(g => g.id === goalId);
    }

    // Get all goals with optional filtering
    getGoals(filters = {}) {
        let filteredGoals = [...this.goals];

        // Filter by status
        if (filters.status) {
            filteredGoals = filteredGoals.filter(g => g.status === filters.status);
        }

        // Filter by type
        if (filters.type) {
            filteredGoals = filteredGoals.filter(g => g.type === filters.type);
        }

        // Filter by priority
        if (filters.priority) {
            filteredGoals = filteredGoals.filter(g => g.priority === filters.priority);
        }

        // Filter by timeframe
        if (filters.timeframe) {
            filteredGoals = filteredGoals.filter(g => g.timeframe === filters.timeframe);
        }

        // Filter by date range
        if (filters.startDate || filters.endDate) {
            filteredGoals = filteredGoals.filter(goal => {
                const goalDate = new Date(goal.startDate);
                const start = filters.startDate ? new Date(filters.startDate) : new Date('1970-01-01');
                const end = filters.endDate ? new Date(filters.endDate) : new Date('2100-01-01');
                return goalDate >= start && goalDate <= end;
            });
        }

        // Sort by priority and date
        filteredGoals.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return filteredGoals;
    }

    // Calculate goal progress percentage
    calculateProgress(goal) {
        if (goal.targetValue <= 0) return 0;
        return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    }

    // Check and update milestones
    checkMilestones(goal) {
        if (!goal.milestones || goal.milestones.length === 0) return;

        const progress = this.calculateProgress(goal);
        
        goal.milestones.forEach(milestone => {
            if (!milestone.completed && progress >= milestone.percentage) {
                milestone.completed = true;
                milestone.completedDate = new Date().toISOString();
                
                // Emit milestone completion event
                this.emit('onMilestoneCompleted', {
                    goal: goal,
                    milestone: milestone
                });
            }
        });
    }

    // Get goals dashboard summary
    getDashboardSummary() {
        const activeGoals = this.getGoals({ status: 'active' });
        const completedGoals = this.getGoals({ status: 'completed' });
        
        const totalGoals = activeGoals.length;
        const completedCount = completedGoals.length;
        const averageProgress = totalGoals > 0 
            ? activeGoals.reduce((sum, goal) => sum + this.calculateProgress(goal), 0) / totalGoals 
            : 0;

        // Goals by priority
        const priorityBreakdown = {
            critical: activeGoals.filter(g => g.priority === 'critical').length,
            high: activeGoals.filter(g => g.priority === 'high').length,
            medium: activeGoals.filter(g => g.priority === 'medium').length,
            low: activeGoals.filter(g => g.priority === 'low').length
        };

        // Goals by timeframe
        const timeframeBreakdown = {
            daily: activeGoals.filter(g => g.timeframe === 'daily').length,
            weekly: activeGoals.filter(g => g.timeframe === 'weekly').length,
            monthly: activeGoals.filter(g => g.timeframe === 'monthly').length,
            quarterly: activeGoals.filter(g => g.timeframe === 'quarterly').length,
            yearly: activeGoals.filter(g => g.timeframe === 'yearly').length
        };

        // Recent completions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentCompletions = completedGoals.filter(g => 
            g.completedDate && new Date(g.completedDate) > thirtyDaysAgo
        ).length;

        return {
            totalActiveGoals: totalGoals,
            totalCompletedGoals: completedCount,
            averageProgress: Math.round(averageProgress),
            recentCompletions,
            priorityBreakdown,
            timeframeBreakdown,
            upcomingDeadlines: this.getUpcomingDeadlines()
        };
    }

    // Get goals with upcoming deadlines
    getUpcomingDeadlines(days = 7) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);

        return this.getGoals({ status: 'active' }).filter(goal => {
            if (!goal.targetDate) return false;
            const targetDate = new Date(goal.targetDate);
            return targetDate >= now && targetDate <= futureDate;
        }).sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate));
    }

    // Link a task to a goal
    linkTaskToGoal(goalId, taskId, taskName) {
        const goal = this.getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        if (!goal.linkedTasks.find(t => t.taskId === taskId)) {
            goal.linkedTasks.push({
                taskId,
                taskName,
                linkedDate: new Date().toISOString()
            });
            
            goal.updatedAt = new Date().toISOString();
            this.saveGoals();
            this.emit('onGoalUpdated', goal);
        }
        
        return goal;
    }

    // Unlink a task from a goal
    unlinkTaskFromGoal(goalId, taskId) {
        const goal = this.getGoal(goalId);
        if (!goal) {
            throw new Error('Goal not found');
        }

        goal.linkedTasks = goal.linkedTasks.filter(t => t.taskId !== taskId);
        goal.updatedAt = new Date().toISOString();
        this.saveGoals();
        this.emit('onGoalUpdated', goal);
        
        return goal;
    }

    // Create predefined goal templates
    getGoalTemplates() {
        return [
            {
                title: "Improve Code Quality",
                description: "Increase code coverage and reduce technical debt",
                type: this.goalTypes.CODE_QUALITY,
                targetValue: 90,
                unit: "% coverage",
                timeframe: this.timeframes.QUARTERLY,
                milestones: [
                    { percentage: 25, title: "Reach 75% coverage" },
                    { percentage: 50, title: "Reach 80% coverage" },
                    { percentage: 75, title: "Reach 85% coverage" }
                ]
            },
            {
                title: "Complete Sprint Goals",
                description: "Successfully complete all sprint commitments",
                type: this.goalTypes.PRODUCTIVITY,
                targetValue: 100,
                unit: "% completion",
                timeframe: this.timeframes.WEEKLY,
                milestones: [
                    { percentage: 50, title: "50% of tasks completed" },
                    { percentage: 80, title: "80% of tasks completed" }
                ]
            },
            {
                title: "Learn New Technology",
                description: "Master a new programming language or framework",
                type: this.goalTypes.LEARNING,
                targetValue: 40,
                unit: "hours studied",
                timeframe: this.timeframes.MONTHLY,
                milestones: [
                    { percentage: 25, title: "Complete basics (10h)" },
                    { percentage: 50, title: "Build first project (20h)" },
                    { percentage: 75, title: "Advanced concepts (30h)" }
                ]
            },
            {
                title: "Increase Team Collaboration",
                description: "Participate more in code reviews and team discussions",
                type: this.goalTypes.COLLABORATION,
                targetValue: 50,
                unit: "interactions",
                timeframe: this.timeframes.MONTHLY,
                milestones: [
                    { percentage: 30, title: "15 code reviews" },
                    { percentage: 60, title: "30 code reviews" },
                    { percentage: 80, title: "40 code reviews" }
                ]
            }
        ];
    }

    // Validate goal data
    validateGoal(goal) {
        if (!goal.title || goal.title.trim() === '') return false;
        if (goal.targetValue <= 0) return false;
        if (!goal.timeframe || !Object.values(this.timeframes).includes(goal.timeframe)) return false;
        return true;
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Storage methods
    saveGoals() {
        localStorage.setItem('engineerGoals', JSON.stringify(this.goals));
    }

    // Export goals data
    exportGoals(format = 'json') {
        const data = {
            goals: this.goals,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        if (format === 'csv') {
            return this.convertToCSV(this.goals);
        }

        return JSON.stringify(data, null, 2);
    }

    convertToCSV(goals) {
        const headers = ['ID', 'Title', 'Description', 'Type', 'Priority', 'Status', 'Progress', 'Target Value', 'Current Value', 'Unit', 'Start Date', 'Target Date', 'Completed Date'];
        const rows = goals.map(goal => [
            goal.id,
            goal.title,
            goal.description,
            goal.type,
            goal.priority,
            goal.status,
            this.calculateProgress(goal) + '%',
            goal.targetValue,
            goal.currentValue,
            goal.unit,
            goal.startDate,
            goal.targetDate || '',
            goal.completedDate || ''
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    // Clear all goals
    clearAllGoals() {
        this.goals = [];
        localStorage.removeItem('engineerGoals');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoalsManager;
} else {
    window.GoalsManager = GoalsManager;
}