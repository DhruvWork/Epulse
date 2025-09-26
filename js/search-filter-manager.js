/**
 * Search and Filter Manager for EngineerPulse
 * Advanced search, filtering, and data management capabilities
 */

class SearchFilterManager {
    constructor() {
        this.searchIndex = new Map();
        this.filters = new Map();
        this.savedSearches = JSON.parse(localStorage.getItem('epulse_saved_searches') || '[]');
        this.searchHistory = JSON.parse(localStorage.getItem('epulse_search_history') || '[]');
        this.activeFilters = {};
        this.listeners = {};
        this.debounceTimeout = null;
        
        this.init();
    }

    init() {
        this.buildSearchIndex();
        this.setupGlobalSearch();
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

    // Search Index Management
    buildSearchIndex() {
        // Clear existing index
        this.searchIndex.clear();

        // Index tasks
        this.indexTasks();
        
        // Index team members
        this.indexTeamMembers();
        
        // Index projects
        this.indexProjects();
        
        // Index goals
        this.indexGoals();
        
        // Index comments
        this.indexComments();

        this.emit('onIndexBuilt', { size: this.searchIndex.size });
    }

    indexTasks() {
        const tasks = this.getAllTasks();
        tasks.forEach(task => {
            this.addToIndex('task', task.id, {
                title: task.name || task.title,
                description: task.description || '',
                status: task.status || 'backlog',
                priority: task.priority || 'medium',
                assignee: task.assignee || 'unassigned',
                tags: task.tags || [],
                project: task.project || 'default',
                created: task.createdDate || new Date().toISOString(),
                updated: task.updatedDate || new Date().toISOString(),
                data: task
            });
        });
    }

    indexTeamMembers() {
        const members = this.getAllTeamMembers();
        members.forEach(member => {
            this.addToIndex('member', member.id, {
                name: member.name,
                email: member.email,
                role: member.role,
                department: member.department || '',
                skills: member.skills || [],
                status: member.status || 'active',
                data: member
            });
        });
    }

    indexProjects() {
        const projects = this.getAllProjects();
        projects.forEach(project => {
            this.addToIndex('project', project.id, {
                name: project.name,
                description: project.description || '',
                status: project.status || 'active',
                type: project.type || 'development',
                owner: project.owner || '',
                tags: project.tags || [],
                data: project
            });
        });
    }

    indexGoals() {
        try {
            const goalsManager = window.goalsManager || new GoalsManager();
            const goals = goalsManager.getGoals();
            goals.forEach(goal => {
                this.addToIndex('goal', goal.id, {
                    title: goal.title,
                    description: goal.description || '',
                    type: goal.type,
                    status: goal.status,
                    priority: goal.priority,
                    timeframe: goal.timeframe,
                    data: goal
                });
            });
        } catch (error) {
            console.log('Goals indexing skipped - manager not available');
        }
    }

    indexComments() {
        try {
            const collaborationManager = window.collaborationManager || new CollaborationManager();
            const comments = collaborationManager.comments;
            comments.forEach(comment => {
                this.addToIndex('comment', comment.id, {
                    content: comment.content,
                    author: comment.author.name,
                    entityType: comment.entityType,
                    entityId: comment.entityId,
                    created: comment.createdAt,
                    data: comment
                });
            });
        } catch (error) {
            console.log('Comments indexing skipped - manager not available');
        }
    }

    addToIndex(type, id, searchableData) {
        const key = `${type}:${id}`;
        
        // Create searchable text
        const searchableText = Object.values(searchableData)
            .filter(value => typeof value === 'string')
            .join(' ')
            .toLowerCase();

        this.searchIndex.set(key, {
            type,
            id,
            searchableText,
            data: searchableData
        });
    }

    // Search Methods
    search(query, options = {}) {
        if (!query || query.length < 2) {
            return [];
        }

        const {
            types = ['task', 'member', 'project', 'goal', 'comment'],
            limit = 50,
            fuzzy = false,
            includeHighlights = true
        } = options;

        const normalizedQuery = query.toLowerCase();
        const results = [];

        // Add to search history
        this.addToSearchHistory(query);

        for (const [key, item] of this.searchIndex) {
            if (!types.includes(item.type)) continue;

            const score = this.calculateSearchScore(normalizedQuery, item, fuzzy);
            if (score > 0) {
                const result = {
                    ...item,
                    score,
                    highlights: includeHighlights ? this.getHighlights(normalizedQuery, item) : null
                };
                results.push(result);
            }
        }

        // Sort by relevance score
        results.sort((a, b) => b.score - a.score);

        // Apply active filters
        const filteredResults = this.applyFilters(results);

        // Limit results
        const finalResults = filteredResults.slice(0, limit);

        this.emit('onSearchComplete', {
            query,
            results: finalResults,
            totalMatches: filteredResults.length,
            options
        });

        return finalResults;
    }

    calculateSearchScore(query, item, fuzzy = false) {
        const text = item.searchableText;
        let score = 0;

        // Exact match gets highest score
        if (text.includes(query)) {
            score += 100;
            
            // Boost for matches at start of text
            if (text.startsWith(query)) {
                score += 50;
            }
        }

        // Word boundary matches
        const words = query.split(/\s+/);
        words.forEach(word => {
            if (text.includes(word)) {
                score += 25;
            }
        });

        // Fuzzy matching (simple implementation)
        if (fuzzy && score === 0) {
            score += this.fuzzyScore(query, text);
        }

        // Type-specific scoring
        switch (item.type) {
            case 'task':
                if (item.data.title && item.data.title.toLowerCase().includes(query)) {
                    score += 30;
                }
                break;
            case 'member':
                if (item.data.name && item.data.name.toLowerCase().includes(query)) {
                    score += 40;
                }
                break;
            case 'project':
                if (item.data.name && item.data.name.toLowerCase().includes(query)) {
                    score += 35;
                }
                break;
        }

        return score;
    }

    fuzzyScore(query, text) {
        // Simple fuzzy matching implementation
        const queryChars = query.split('');
        let textIndex = 0;
        let matches = 0;

        for (const char of queryChars) {
            const found = text.indexOf(char, textIndex);
            if (found !== -1) {
                matches++;
                textIndex = found + 1;
            }
        }

        return (matches / query.length) * 10;
    }

    getHighlights(query, item) {
        const highlights = [];
        const text = item.searchableText;
        
        // Find all matches
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            highlights.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }

        return highlights;
    }

    // Filter Methods
    addFilter(name, filterFunction, options = {}) {
        this.filters.set(name, {
            function: filterFunction,
            active: false,
            options,
            ...options
        });

        this.emit('onFilterAdded', { name, options });
    }

    activateFilter(name, value = true) {
        const filter = this.filters.get(name);
        if (filter) {
            filter.active = true;
            filter.value = value;
            this.activeFilters[name] = { ...filter, value };
            
            this.emit('onFilterActivated', { name, value });
            return true;
        }
        return false;
    }

    deactivateFilter(name) {
        const filter = this.filters.get(name);
        if (filter) {
            filter.active = false;
            delete this.activeFilters[name];
            
            this.emit('onFilterDeactivated', { name });
            return true;
        }
        return false;
    }

    applyFilters(results) {
        if (Object.keys(this.activeFilters).length === 0) {
            return results;
        }

        return results.filter(result => {
            for (const [name, filter] of Object.entries(this.activeFilters)) {
                if (!filter.function(result, filter.value)) {
                    return false;
                }
            }
            return true;
        });
    }

    clearAllFilters() {
        Object.keys(this.activeFilters).forEach(name => {
            this.deactivateFilter(name);
        });
        
        this.emit('onFiltersCleared');
    }

    // Pre-built filters
    setupDefaultFilters() {
        // Task status filter
        this.addFilter('taskStatus', (result, status) => {
            return result.type === 'task' && result.data.status === status;
        }, { label: 'Task Status', type: 'select' });

        // Task priority filter
        this.addFilter('taskPriority', (result, priority) => {
            return result.type === 'task' && result.data.priority === priority;
        }, { label: 'Priority', type: 'select' });

        // Task assignee filter
        this.addFilter('taskAssignee', (result, assignee) => {
            return result.type === 'task' && result.data.assignee === assignee;
        }, { label: 'Assignee', type: 'select' });

        // Date range filter
        this.addFilter('dateRange', (result, range) => {
            const itemDate = new Date(result.data.created || result.data.createdAt);
            const startDate = new Date(range.start);
            const endDate = new Date(range.end);
            return itemDate >= startDate && itemDate <= endDate;
        }, { label: 'Date Range', type: 'daterange' });

        // Type filter
        this.addFilter('contentType', (result, types) => {
            return types.includes(result.type);
        }, { label: 'Content Type', type: 'multiselect' });

        // Team member role filter
        this.addFilter('memberRole', (result, role) => {
            return result.type === 'member' && result.data.role === role;
        }, { label: 'Role', type: 'select' });

        // Project status filter
        this.addFilter('projectStatus', (result, status) => {
            return result.type === 'project' && result.data.status === status;
        }, { label: 'Project Status', type: 'select' });
    }

    // Advanced Search Features
    searchWithSuggestions(query) {
        const results = this.search(query);
        const suggestions = this.generateSuggestions(query, results);
        
        return {
            results,
            suggestions,
            query
        };
    }

    generateSuggestions(query, results) {
        const suggestions = [];
        
        // Popular searches
        const popularSearches = this.getPopularSearches().slice(0, 3);
        suggestions.push({
            type: 'popular',
            title: 'Popular Searches',
            items: popularSearches
        });

        // Similar queries from history
        const similarQueries = this.getSimilarQueries(query).slice(0, 3);
        if (similarQueries.length > 0) {
            suggestions.push({
                type: 'similar',
                title: 'Similar Searches',
                items: similarQueries
            });
        }

        // Auto-complete suggestions
        const autoComplete = this.getAutoCompleteSuggestions(query).slice(0, 5);
        if (autoComplete.length > 0) {
            suggestions.push({
                type: 'autocomplete',
                title: 'Suggestions',
                items: autoComplete
            });
        }

        return suggestions;
    }

    getAutoCompleteSuggestions(query) {
        const suggestions = new Set();
        const normalizedQuery = query.toLowerCase();

        // Extract common terms from search index
        for (const [key, item] of this.searchIndex) {
            const words = item.searchableText.split(/\s+/);
            words.forEach(word => {
                if (word.length > 2 && word.startsWith(normalizedQuery) && word !== normalizedQuery) {
                    suggestions.add(word);
                }
            });
        }

        return Array.from(suggestions);
    }

    // Saved Searches
    saveSearch(query, name, filters = {}) {
        const savedSearch = {
            id: this.generateId(),
            name: name || query,
            query,
            filters: { ...this.activeFilters },
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            useCount: 1
        };

        this.savedSearches.push(savedSearch);
        this.saveSavedSearches();
        
        this.emit('onSearchSaved', savedSearch);
        return savedSearch;
    }

    getSavedSearches() {
        return [...this.savedSearches].sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
    }

    loadSavedSearch(searchId) {
        const savedSearch = this.savedSearches.find(s => s.id === searchId);
        if (savedSearch) {
            // Clear current filters
            this.clearAllFilters();
            
            // Apply saved filters
            Object.entries(savedSearch.filters).forEach(([name, filter]) => {
                this.activateFilter(name, filter.value);
            });

            // Update usage
            savedSearch.lastUsed = new Date().toISOString();
            savedSearch.useCount++;
            this.saveSavedSearches();

            this.emit('onSavedSearchLoaded', savedSearch);
            
            // Return search results
            return this.search(savedSearch.query);
        }
        return null;
    }

    deleteSavedSearch(searchId) {
        const index = this.savedSearches.findIndex(s => s.id === searchId);
        if (index > -1) {
            const deleted = this.savedSearches.splice(index, 1)[0];
            this.saveSavedSearches();
            this.emit('onSearchDeleted', deleted);
            return true;
        }
        return false;
    }

    // Search History
    addToSearchHistory(query) {
        if (query.length < 2) return;

        // Remove existing entry
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // Add to front
        this.searchHistory.unshift({
            query,
            timestamp: new Date().toISOString(),
            count: (this.searchHistory.find(h => h.query === query)?.count || 0) + 1
        });

        // Keep only last 100 searches
        this.searchHistory = this.searchHistory.slice(0, 100);
        
        this.saveSearchHistory();
    }

    getSearchHistory(limit = 10) {
        return this.searchHistory.slice(0, limit);
    }

    getPopularSearches(limit = 10) {
        return [...this.searchHistory]
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getSimilarQueries(query, limit = 5) {
        const normalizedQuery = query.toLowerCase();
        return this.searchHistory
            .filter(item => 
                item.query.toLowerCase() !== normalizedQuery &&
                (item.query.toLowerCase().includes(normalizedQuery) || 
                 normalizedQuery.includes(item.query.toLowerCase()))
            )
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)
            .map(item => item.query);
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.emit('onHistoryCleared');
    }

    // Global Search Setup
    setupGlobalSearch() {
        // Add keyboard shortcut (Ctrl/Cmd + K)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showGlobalSearchModal();
            }
        });
    }

    showGlobalSearchModal() {
        this.emit('onGlobalSearchRequested');
    }

    // Data Sources
    getAllTasks() {
        // Extract tasks from DOM or data sources
        const tasks = [];
        document.querySelectorAll('.task-card').forEach(card => {
            const taskId = card.dataset.taskId;
            const taskName = card.dataset.taskName;
            if (taskId && taskName) {
                tasks.push({
                    id: taskId,
                    name: taskName,
                    title: taskName,
                    status: this.getTaskStatusFromCard(card),
                    priority: this.getTaskPriorityFromCard(card),
                    assignee: this.getTaskAssigneeFromCard(card),
                    project: 'current-sprint'
                });
            }
        });
        return tasks;
    }

    getAllTeamMembers() {
        // Get team members from collaboration manager or create sample data
        try {
            const collaborationManager = window.collaborationManager || new CollaborationManager();
            return collaborationManager.getTeamMembers();
        } catch (error) {
            return [
                { id: 'user1', name: 'Alex Johnson', email: 'alex@company.com', role: 'Senior Software Engineer' },
                { id: 'user2', name: 'Sarah Chen', email: 'sarah@company.com', role: 'Product Manager' },
                { id: 'user3', name: 'Mike Rodriguez', email: 'mike@company.com', role: 'DevOps Engineer' },
                { id: 'user4', name: 'Emma Thompson', email: 'emma@company.com', role: 'UI/UX Designer' },
                { id: 'user5', name: 'David Park', email: 'david@company.com', role: 'Backend Developer' }
            ];
        }
    }

    getAllProjects() {
        return [
            { id: 'proj1', name: 'Authentication & Security', status: 'active', type: 'development' },
            { id: 'proj2', name: 'Mobile App', status: 'planning', type: 'development' },
            { id: 'proj3', name: 'Performance Optimization', status: 'active', type: 'improvement' },
            { id: 'proj4', name: 'API Documentation', status: 'completed', type: 'documentation' }
        ];
    }

    // Utility Methods
    getTaskStatusFromCard(card) {
        const column = card.closest('.kanban-column');
        if (!column) return 'unknown';
        
        const header = column.querySelector('h3');
        if (!header) return 'unknown';
        
        const status = header.textContent.toLowerCase();
        if (status.includes('backlog')) return 'backlog';
        if (status.includes('to do')) return 'todo';
        if (status.includes('progress')) return 'in-progress';
        if (status.includes('done')) return 'done';
        
        return 'unknown';
    }

    getTaskPriorityFromCard(card) {
        const priorityEl = card.querySelector('[class*="priority-"]');
        if (!priorityEl) return 'medium';
        
        const classList = Array.from(priorityEl.classList);
        const priorityClass = classList.find(cls => cls.startsWith('priority-'));
        
        return priorityClass ? priorityClass.replace('priority-', '') : 'medium';
    }

    getTaskAssigneeFromCard(card) {
        const avatar = card.querySelector('img[alt]');
        return avatar ? avatar.alt : 'unassigned';
    }

    generateId() {
        return 'search_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Data Persistence
    saveSavedSearches() {
        localStorage.setItem('epulse_saved_searches', JSON.stringify(this.savedSearches));
    }

    saveSearchHistory() {
        localStorage.setItem('epulse_search_history', JSON.stringify(this.searchHistory));
    }

    // Export functionality
    exportSearchData(format = 'json') {
        const data = {
            savedSearches: this.savedSearches,
            searchHistory: this.searchHistory,
            activeFilters: this.activeFilters,
            exportedAt: new Date().toISOString()
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }

        throw new Error('Unsupported export format');
    }

    importSearchData(data, options = { merge: true }) {
        try {
            const importData = typeof data === 'string' ? JSON.parse(data) : data;

            if (options.merge) {
                if (importData.savedSearches) {
                    this.savedSearches = [...this.savedSearches, ...importData.savedSearches];
                }
                if (importData.searchHistory) {
                    this.searchHistory = [...this.searchHistory, ...importData.searchHistory];
                }
            } else {
                if (importData.savedSearches) this.savedSearches = importData.savedSearches;
                if (importData.searchHistory) this.searchHistory = importData.searchHistory;
            }

            this.saveSavedSearches();
            this.saveSearchHistory();

            this.emit('onDataImported', { importData, options });
            return true;
        } catch (error) {
            throw new Error('Invalid import data: ' + error.message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchFilterManager;
} else {
    window.SearchFilterManager = SearchFilterManager;
}