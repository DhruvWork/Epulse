/**
 * Search Widget for EngineerPulse
 * UI component for advanced search and filtering
 */

class SearchWidget {
    constructor(container, searchFilterManager) {
        this.container = container;
        this.searchManager = searchFilterManager;
        this.currentResults = [];
        this.currentQuery = '';
        this.isAdvancedMode = false;
        this.debounceTimeout = null;
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.render();
        this.setupDefaultFilters();
        this.bindSearchEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="search-widget">
                <!-- Search Header -->
                <div class="search-header flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-lg">Search & Filter</h3>
                    <div class="flex items-center space-x-2">
                        <button id="clearAllBtn" class="btn btn-outline text-sm" title="Clear All">
                            <i data-feather="x" class="w-4 h-4 mr-1"></i>
                            Clear
                        </button>
                        <button id="advancedToggle" class="btn btn-outline text-sm" title="Advanced Search">
                            <i data-feather="sliders" class="w-4 h-4 mr-1"></i>
                            Advanced
                        </button>
                    </div>
                </div>

                <!-- Search Input -->
                <div class="search-input-container mb-4">
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i data-feather="search" class="w-5 h-5 text-gray-400"></i>
                        </div>
                        <input 
                            type="text" 
                            id="searchInput" 
                            class="form-input pl-10 pr-4 w-full" 
                            placeholder="Search tasks, projects, team members..."
                            autocomplete="off"
                        >
                        <div class="absolute inset-y-0 right-0 flex items-center">
                            <button id="searchClearBtn" class="p-2 text-gray-400 hover:text-gray-600 hidden">
                                <i data-feather="x" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Search Suggestions Dropdown -->
                    <div id="searchSuggestions" class="search-suggestions hidden absolute bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full z-50 max-h-96 overflow-y-auto">
                        <!-- Suggestions will be populated here -->
                    </div>
                </div>

                <!-- Quick Filters -->
                <div class="quick-filters mb-4">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-sm font-medium text-gray-700">Quick Filters:</span>
                        <div class="flex flex-wrap gap-2" id="quickFilters">
                            <button class="filter-tag" data-filter="contentType" data-value="task">
                                <i data-feather="check-square" class="w-3 h-3 mr-1"></i>
                                Tasks
                            </button>
                            <button class="filter-tag" data-filter="contentType" data-value="member">
                                <i data-feather="users" class="w-3 h-3 mr-1"></i>
                                People
                            </button>
                            <button class="filter-tag" data-filter="contentType" data-value="project">
                                <i data-feather="folder" class="w-3 h-3 mr-1"></i>
                                Projects
                            </button>
                            <button class="filter-tag" data-filter="contentType" data-value="goal">
                                <i data-feather="target" class="w-3 h-3 mr-1"></i>
                                Goals
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Advanced Filters Panel -->
                <div id="advancedFilters" class="advanced-filters hidden mb-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-3">Advanced Filters</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Status Filter -->
                            <div class="filter-group">
                                <label class="form-label text-sm">Status</label>
                                <select id="statusFilter" class="form-input text-sm">
                                    <option value="">All Status</option>
                                    <option value="backlog">Backlog</option>
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>

                            <!-- Priority Filter -->
                            <div class="filter-group">
                                <label class="form-label text-sm">Priority</label>
                                <select id="priorityFilter" class="form-input text-sm">
                                    <option value="">All Priorities</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>

                            <!-- Assignee Filter -->
                            <div class="filter-group">
                                <label class="form-label text-sm">Assignee</label>
                                <select id="assigneeFilter" class="form-input text-sm">
                                    <option value="">All Assignees</option>
                                    <option value="Alex Johnson">Alex Johnson</option>
                                    <option value="Sarah Chen">Sarah Chen</option>
                                    <option value="Mike Rodriguez">Mike Rodriguez</option>
                                    <option value="Emma Thompson">Emma Thompson</option>
                                    <option value="David Park">David Park</option>
                                </select>
                            </div>

                            <!-- Date Range Filter -->
                            <div class="filter-group">
                                <label class="form-label text-sm">Date Range</label>
                                <div class="flex items-center space-x-2">
                                    <input type="date" id="dateFrom" class="form-input text-sm flex-1">
                                    <span class="text-gray-500">to</span>
                                    <input type="date" id="dateTo" class="form-input text-sm flex-1">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Active Filters Display -->
                <div id="activeFilters" class="active-filters mb-4 hidden">
                    <div class="flex items-center flex-wrap gap-2">
                        <span class="text-sm font-medium text-gray-700">Active filters:</span>
                        <div id="activeFilterTags" class="flex flex-wrap gap-2">
                            <!-- Active filter tags will be populated here -->
                        </div>
                    </div>
                </div>

                <!-- Search Results -->
                <div id="searchResults" class="search-results">
                    <div id="resultsHeader" class="results-header hidden mb-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <span id="resultsCount" class="text-sm text-gray-600"></span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <select id="sortBy" class="form-input text-sm">
                                    <option value="relevance">Sort by Relevance</option>
                                    <option value="date">Sort by Date</option>
                                    <option value="name">Sort by Name</option>
                                    <option value="type">Sort by Type</option>
                                </select>
                                <button id="exportResults" class="btn btn-outline text-sm" title="Export Results">
                                    <i data-feather="download" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="resultsContainer" class="results-container">
                        ${this.renderEmptyState()}
                    </div>
                </div>

                <!-- Saved Searches -->
                <div id="savedSearches" class="saved-searches mt-6">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-medium text-gray-900">Saved Searches</h4>
                        <button id="saveCurrentSearch" class="btn btn-outline text-sm hidden">
                            <i data-feather="bookmark" class="w-4 h-4 mr-1"></i>
                            Save
                        </button>
                    </div>
                    <div id="savedSearchesList" class="space-y-2">
                        ${this.renderSavedSearches()}
                    </div>
                </div>
            </div>
        `;

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderEmptyState() {
        return `
            <div class="text-center py-12">
                <i data-feather="search" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Search Everything</h3>
                <p class="text-gray-500 mb-4">Find tasks, projects, team members, and more</p>
                <div class="text-sm text-gray-400">
                    <p>Try searching for:</p>
                    <div class="flex items-center justify-center space-x-4 mt-2">
                        <button class="search-example text-indigo-600 hover:text-indigo-800" data-query="authentication">authentication</button>
                        <button class="search-example text-indigo-600 hover:text-indigo-800" data-query="alex">alex</button>
                        <button class="search-example text-indigo-600 hover:text-indigo-800" data-query="high priority">high priority</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSavedSearches() {
        const savedSearches = this.searchManager.getSavedSearches().slice(0, 5);
        
        if (savedSearches.length === 0) {
            return `
                <div class="text-center py-4 text-gray-500 text-sm">
                    No saved searches yet. Perform a search and save it for quick access.
                </div>
            `;
        }

        return savedSearches.map(search => `
            <div class="saved-search-item flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer" data-search-id="${search.id}">
                <div class="flex-1">
                    <div class="flex items-center space-x-2">
                        <h5 class="font-medium text-sm">${search.name}</h5>
                        <span class="text-xs text-gray-500">• ${search.useCount} uses</span>
                    </div>
                    <p class="text-xs text-gray-600 mt-1">"${search.query}"</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="load-saved-search text-indigo-600 hover:text-indigo-800 p-1" data-search-id="${search.id}" title="Load Search">
                        <i data-feather="play" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-saved-search text-red-600 hover:text-red-800 p-1" data-search-id="${search.id}" title="Delete">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderSearchResults(results) {
        if (results.length === 0) {
            return `
                <div class="text-center py-8">
                    <i data-feather="search" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                    <p class="text-gray-500">Try adjusting your search terms or filters</p>
                </div>
            `;
        }

        return results.map(result => this.renderSearchResultItem(result)).join('');
    }

    renderSearchResultItem(result) {
        const { type, data, highlights, score } = result;
        
        switch (type) {
            case 'task':
                return this.renderTaskResult(data, highlights);
            case 'member':
                return this.renderMemberResult(data, highlights);
            case 'project':
                return this.renderProjectResult(data, highlights);
            case 'goal':
                return this.renderGoalResult(data, highlights);
            case 'comment':
                return this.renderCommentResult(data, highlights);
            default:
                return this.renderGenericResult(result);
        }
    }

    renderTaskResult(task, highlights) {
        return `
            <div class="search-result-item task-result p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer mb-3" data-type="task" data-id="${task.data?.id || 'unknown'}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <i data-feather="check-square" class="w-4 h-4 text-indigo-600"></i>
                            <h4 class="font-medium text-gray-900">${this.highlightText(task.title || 'Untitled Task', highlights)}</h4>
                            <span class="text-xs px-2 py-1 rounded-full ${this.getStatusClass(task.status)}">${task.status}</span>
                        </div>
                        ${task.description ? `<p class="text-sm text-gray-600 mb-2">${this.highlightText(task.description, highlights)}</p>` : ''}
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Priority: ${task.priority}</span>
                            <span>Assignee: ${task.assignee}</span>
                            <span>Project: ${task.project}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMemberResult(member, highlights) {
        return `
            <div class="search-result-item member-result p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer mb-3" data-type="member" data-id="${member.data?.id || 'unknown'}">
                <div class="flex items-center space-x-3">
                    <img src="${member.data?.avatar || 'http://static.photos/people/200x200/1'}" alt="${member.name}" class="w-10 h-10 rounded-full">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2">
                            <i data-feather="user" class="w-4 h-4 text-green-600"></i>
                            <h4 class="font-medium text-gray-900">${this.highlightText(member.name, highlights)}</h4>
                        </div>
                        <p class="text-sm text-gray-600">${this.highlightText(member.role, highlights)}</p>
                        <p class="text-xs text-gray-500">${this.highlightText(member.email, highlights)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderProjectResult(project, highlights) {
        return `
            <div class="search-result-item project-result p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer mb-3" data-type="project" data-id="${project.data?.id || 'unknown'}">
                <div class="flex items-start space-x-3">
                    <i data-feather="folder" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <h4 class="font-medium text-gray-900">${this.highlightText(project.name, highlights)}</h4>
                            <span class="text-xs px-2 py-1 rounded-full ${this.getStatusClass(project.status)}">${project.status}</span>
                        </div>
                        ${project.description ? `<p class="text-sm text-gray-600 mb-2">${this.highlightText(project.description, highlights)}</p>` : ''}
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Type: ${project.type}</span>
                            <span>Owner: ${project.owner}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderGoalResult(goal, highlights) {
        return `
            <div class="search-result-item goal-result p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer mb-3" data-type="goal" data-id="${goal.data?.id || 'unknown'}">
                <div class="flex items-start space-x-3">
                    <i data-feather="target" class="w-5 h-5 text-purple-600 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                            <h4 class="font-medium text-gray-900">${this.highlightText(goal.title, highlights)}</h4>
                            <span class="text-xs px-2 py-1 rounded-full ${this.getPriorityClass(goal.priority)}">${goal.priority}</span>
                        </div>
                        ${goal.description ? `<p class="text-sm text-gray-600 mb-2">${this.highlightText(goal.description, highlights)}</p>` : ''}
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Type: ${goal.type}</span>
                            <span>Timeframe: ${goal.timeframe}</span>
                            <span>Status: ${goal.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCommentResult(comment, highlights) {
        return `
            <div class="search-result-item comment-result p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer mb-3" data-type="comment" data-id="${comment.data?.id || 'unknown'}">
                <div class="flex items-start space-x-3">
                    <i data-feather="message-circle" class="w-5 h-5 text-orange-600 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <h4 class="font-medium text-gray-900">Comment by ${comment.author}</h4>
                            <span class="text-xs text-gray-500">${new Date(comment.created).toLocaleDateString()}</span>
                        </div>
                        <p class="text-sm text-gray-700 mb-2">${this.highlightText(comment.content, highlights)}</p>
                        <div class="text-xs text-gray-500">
                            In ${comment.entityType}: ${comment.entityId}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderGenericResult(result) {
        return `
            <div class="search-result-item p-4 border border-gray-200 rounded-lg hover:shadow-sm cursor-pointer mb-3">
                <div class="flex items-center space-x-2">
                    <i data-feather="file-text" class="w-4 h-4 text-gray-600"></i>
                    <h4 class="font-medium text-gray-900">${result.type} Result</h4>
                </div>
                <pre class="text-xs text-gray-600 mt-2">${JSON.stringify(result.data, null, 2)}</pre>
            </div>
        `;
    }

    bindEvents() {
        // Search input events
        const searchInput = this.container.querySelector('#searchInput');
        const searchClearBtn = this.container.querySelector('#searchClearBtn');
        
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(e.target.value);
            }
        });

        searchInput.addEventListener('focus', () => {
            this.showSearchSuggestions();
        });

        searchClearBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Advanced toggle
        this.container.querySelector('#advancedToggle').addEventListener('click', () => {
            this.toggleAdvancedMode();
        });

        // Clear all button
        this.container.querySelector('#clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });

        // Quick filters
        this.container.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleQuickFilter(e.target.closest('.filter-tag'));
            });
        });

        // Advanced filters
        this.container.querySelectorAll('#advancedFilters select, #advancedFilters input').forEach(input => {
            input.addEventListener('change', () => {
                this.handleAdvancedFilterChange();
            });
        });

        // Search examples
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.search-example')) {
                const query = e.target.dataset.query;
                this.performSearch(query);
            }
        });

        // Saved searches
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.load-saved-search')) {
                const searchId = e.target.closest('.load-saved-search').dataset.searchId;
                this.loadSavedSearch(searchId);
            }
            
            if (e.target.closest('.delete-saved-search')) {
                const searchId = e.target.closest('.delete-saved-search').dataset.searchId;
                this.deleteSavedSearch(searchId);
            }
        });

        // Save current search
        this.container.querySelector('#saveCurrentSearch').addEventListener('click', () => {
            this.saveCurrentSearch();
        });

        // Export results
        this.container.querySelector('#exportResults').addEventListener('click', () => {
            this.exportResults();
        });

        // Result item clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.search-result-item')) {
                this.handleResultClick(e.target.closest('.search-result-item'));
            }
        });

        // Click outside to hide suggestions
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideSearchSuggestions();
            }
        });
    }

    setupDefaultFilters() {
        this.searchManager.setupDefaultFilters();
    }

    bindSearchEvents() {
        this.searchManager.on('onSearchComplete', (data) => {
            this.displaySearchResults(data.results);
            this.updateResultsHeader(data.totalMatches, data.query);
        });

        this.searchManager.on('onFilterActivated', (data) => {
            this.updateActiveFilters();
            this.refreshSearch();
        });

        this.searchManager.on('onFilterDeactivated', (data) => {
            this.updateActiveFilters();
            this.refreshSearch();
        });
    }

    // Event Handlers
    handleSearchInput(value) {
        clearTimeout(this.debounceTimeout);
        
        const searchClearBtn = this.container.querySelector('#searchClearBtn');
        if (value.trim()) {
            searchClearBtn.classList.remove('hidden');
        } else {
            searchClearBtn.classList.add('hidden');
        }

        this.debounceTimeout = setTimeout(() => {
            if (value.trim().length >= 2) {
                this.performSearch(value);
            } else if (value.trim().length === 0) {
                this.clearResults();
            }
        }, 300);
    }

    performSearch(query) {
        this.currentQuery = query;
        const searchInput = this.container.querySelector('#searchInput');
        searchInput.value = query;
        
        const results = this.searchManager.search(query, {
            types: this.getSelectedTypes(),
            limit: 50,
            fuzzy: true,
            includeHighlights: true
        });

        this.currentResults = results;
        this.displaySearchResults(results);
        this.updateResultsHeader(results.length, query);
        this.showSaveButton();
        this.hideSearchSuggestions();
    }

    displaySearchResults(results) {
        const container = this.container.querySelector('#resultsContainer');
        container.innerHTML = this.renderSearchResults(results);
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    updateResultsHeader(count, query) {
        const header = this.container.querySelector('#resultsHeader');
        const countSpan = this.container.querySelector('#resultsCount');
        
        if (count > 0) {
            header.classList.remove('hidden');
            countSpan.textContent = `${count} result${count !== 1 ? 's' : ''} for "${query}"`;
        } else {
            header.classList.add('hidden');
        }
    }

    getSelectedTypes() {
        const activeTypeFilters = this.container.querySelectorAll('.filter-tag.active[data-filter="contentType"]');
        if (activeTypeFilters.length === 0) {
            return ['task', 'member', 'project', 'goal', 'comment'];
        }
        return Array.from(activeTypeFilters).map(btn => btn.dataset.value);
    }

    toggleQuickFilter(filterBtn) {
        filterBtn.classList.toggle('active');
        
        const filterName = filterBtn.dataset.filter;
        const filterValue = filterBtn.dataset.value;
        
        if (filterBtn.classList.contains('active')) {
            // Activate filter
            if (filterName === 'contentType') {
                const activeValues = Array.from(
                    this.container.querySelectorAll('.filter-tag.active[data-filter="contentType"]')
                ).map(btn => btn.dataset.value);
                this.searchManager.activateFilter('contentType', activeValues);
            } else {
                this.searchManager.activateFilter(filterName, filterValue);
            }
        } else {
            // Deactivate filter
            if (filterName === 'contentType') {
                const activeValues = Array.from(
                    this.container.querySelectorAll('.filter-tag.active[data-filter="contentType"]')
                ).map(btn => btn.dataset.value);
                if (activeValues.length === 0) {
                    this.searchManager.deactivateFilter('contentType');
                } else {
                    this.searchManager.activateFilter('contentType', activeValues);
                }
            } else {
                this.searchManager.deactivateFilter(filterName);
            }
        }
    }

    toggleAdvancedMode() {
        this.isAdvancedMode = !this.isAdvancedMode;
        const panel = this.container.querySelector('#advancedFilters');
        const toggleBtn = this.container.querySelector('#advancedToggle');
        
        if (this.isAdvancedMode) {
            panel.classList.remove('hidden');
            toggleBtn.classList.add('active');
        } else {
            panel.classList.add('hidden');
            toggleBtn.classList.remove('active');
        }
    }

    handleAdvancedFilterChange() {
        const statusFilter = this.container.querySelector('#statusFilter').value;
        const priorityFilter = this.container.querySelector('#priorityFilter').value;
        const assigneeFilter = this.container.querySelector('#assigneeFilter').value;
        const dateFrom = this.container.querySelector('#dateFrom').value;
        const dateTo = this.container.querySelector('#dateTo').value;

        // Apply filters
        if (statusFilter) {
            this.searchManager.activateFilter('taskStatus', statusFilter);
        } else {
            this.searchManager.deactivateFilter('taskStatus');
        }

        if (priorityFilter) {
            this.searchManager.activateFilter('taskPriority', priorityFilter);
        } else {
            this.searchManager.deactivateFilter('taskPriority');
        }

        if (assigneeFilter) {
            this.searchManager.activateFilter('taskAssignee', assigneeFilter);
        } else {
            this.searchManager.deactivateFilter('taskAssignee');
        }

        if (dateFrom && dateTo) {
            this.searchManager.activateFilter('dateRange', { start: dateFrom, end: dateTo });
        } else {
            this.searchManager.deactivateFilter('dateRange');
        }
    }

    updateActiveFilters() {
        const activeFilters = this.searchManager.activeFilters;
        const container = this.container.querySelector('#activeFilters');
        const tagsContainer = this.container.querySelector('#activeFilterTags');
        
        if (Object.keys(activeFilters).length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        
        const tags = Object.entries(activeFilters).map(([name, filter]) => {
            return `
                <span class="active-filter-tag bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                    <span>${name}: ${this.formatFilterValue(filter.value)}</span>
                    <button class="remove-filter hover:text-indigo-600" data-filter="${name}">
                        <i data-feather="x" class="w-3 h-3"></i>
                    </button>
                </span>
            `;
        });

        tagsContainer.innerHTML = tags.join('');

        // Bind remove filter events
        tagsContainer.querySelectorAll('.remove-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterName = e.target.closest('.remove-filter').dataset.filter;
                this.searchManager.deactivateFilter(filterName);
            });
        });

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    refreshSearch() {
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        }
    }

    clearSearch() {
        const searchInput = this.container.querySelector('#searchInput');
        searchInput.value = '';
        this.currentQuery = '';
        this.clearResults();
        this.hideSearchSuggestions();
        
        const searchClearBtn = this.container.querySelector('#searchClearBtn');
        searchClearBtn.classList.add('hidden');
    }

    clearResults() {
        const container = this.container.querySelector('#resultsContainer');
        container.innerHTML = this.renderEmptyState();
        
        const header = this.container.querySelector('#resultsHeader');
        header.classList.add('hidden');
        
        this.hideSaveButton();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    clearAll() {
        this.clearSearch();
        this.searchManager.clearAllFilters();
        
        // Clear UI filters
        this.container.querySelectorAll('.filter-tag.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.container.querySelectorAll('#advancedFilters select, #advancedFilters input').forEach(input => {
            input.value = '';
        });
    }

    showSearchSuggestions() {
        // Implementation for search suggestions
        const suggestions = this.container.querySelector('#searchSuggestions');
        suggestions.classList.remove('hidden');
        
        // Load popular searches, history, etc.
        this.populateSuggestions();
    }

    hideSearchSuggestions() {
        const suggestions = this.container.querySelector('#searchSuggestions');
        suggestions.classList.add('hidden');
    }

    populateSuggestions() {
        const suggestions = this.container.querySelector('#searchSuggestions');
        const history = this.searchManager.getSearchHistory(5);
        const popular = this.searchManager.getPopularSearches(3);

        let content = '';

        if (popular.length > 0) {
            content += `
                <div class="p-3 border-b border-gray-200">
                    <h5 class="text-xs font-medium text-gray-500 mb-2">Popular Searches</h5>
                    ${popular.map(item => `
                        <button class="suggestion-item block w-full text-left py-1 text-sm hover:text-indigo-600" data-query="${item.query}">
                            ${item.query}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        if (history.length > 0) {
            content += `
                <div class="p-3">
                    <h5 class="text-xs font-medium text-gray-500 mb-2">Recent Searches</h5>
                    ${history.map(item => `
                        <button class="suggestion-item block w-full text-left py-1 text-sm hover:text-indigo-600" data-query="${item.query}">
                            ${item.query}
                        </button>
                    `).join('')}
                </div>
            `;
        }

        suggestions.innerHTML = content || '<div class="p-3 text-sm text-gray-500">No suggestions available</div>';

        // Bind suggestion click events
        suggestions.querySelectorAll('.suggestion-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.performSearch(e.target.dataset.query);
            });
        });
    }

    showSaveButton() {
        this.container.querySelector('#saveCurrentSearch').classList.remove('hidden');
    }

    hideSaveButton() {
        this.container.querySelector('#saveCurrentSearch').classList.add('hidden');
    }

    saveCurrentSearch() {
        if (!this.currentQuery) return;
        
        const name = prompt('Enter a name for this search:', this.currentQuery);
        if (name) {
            this.searchManager.saveSearch(this.currentQuery, name);
            this.refreshSavedSearches();
            this.showToast('Search saved successfully!', 'success');
        }
    }

    loadSavedSearch(searchId) {
        const results = this.searchManager.loadSavedSearch(searchId);
        if (results) {
            this.currentResults = results;
            this.displaySearchResults(results);
            this.updateResultsHeader(results.length, this.searchManager.savedSearches.find(s => s.id === searchId)?.query || '');
            this.updateActiveFilters();
            this.showSaveButton();
        }
    }

    deleteSavedSearch(searchId) {
        if (confirm('Are you sure you want to delete this saved search?')) {
            this.searchManager.deleteSavedSearch(searchId);
            this.refreshSavedSearches();
            this.showToast('Search deleted', 'info');
        }
    }

    refreshSavedSearches() {
        const container = this.container.querySelector('#savedSearchesList');
        container.innerHTML = this.renderSavedSearches();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    exportResults() {
        if (this.currentResults.length === 0) return;
        
        const csv = this.convertResultsToCSV(this.currentResults);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Results exported successfully!', 'success');
    }

    convertResultsToCSV(results) {
        const headers = ['Type', 'Title', 'Description', 'Status', 'Priority', 'Assignee', 'Score'];
        const rows = results.map(result => {
            const data = result.data;
            return [
                result.type,
                data.title || data.name || 'N/A',
                data.description || 'N/A',
                data.status || 'N/A',
                data.priority || 'N/A',
                data.assignee || data.author || 'N/A',
                result.score || 0
            ].map(field => `"${String(field).replace(/"/g, '""')}"`);
        });

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    handleResultClick(resultItem) {
        const type = resultItem.dataset.type;
        const id = resultItem.dataset.id;
        
        // Emit event for other components to handle
        this.emit('onResultClick', { type, id, element: resultItem });
        
        // Default behavior based on type
        switch (type) {
            case 'task':
                this.handleTaskClick(id, resultItem);
                break;
            case 'member':
                this.handleMemberClick(id, resultItem);
                break;
            case 'project':
                this.handleProjectClick(id, resultItem);
                break;
            default:
                console.log(`Clicked on ${type}:${id}`);
        }
    }

    handleTaskClick(taskId, element) {
        // Find and highlight the task in the Kanban board if on tasks page
        const taskCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (taskCard) {
            taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            taskCard.classList.add('highlight');
            setTimeout(() => taskCard.classList.remove('highlight'), 2000);
        }
    }

    handleMemberClick(memberId, element) {
        // Show team member details or filter by member
        this.showToast(`Viewing details for member: ${memberId}`, 'info');
    }

    handleProjectClick(projectId, element) {
        // Navigate to project details or filter by project
        this.showToast(`Viewing project: ${projectId}`, 'info');
    }

    // Utility Methods
    highlightText(text, highlights) {
        if (!highlights || highlights.length === 0) return text;
        
        // Simple highlighting implementation
        let highlightedText = text;
        highlights.forEach(highlight => {
            const regex = new RegExp(`(${highlight.text})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
        });
        
        return highlightedText;
    }

    getStatusClass(status) {
        const classes = {
            backlog: 'bg-gray-100 text-gray-800',
            todo: 'bg-blue-100 text-blue-800',
            'in-progress': 'bg-yellow-100 text-yellow-800',
            done: 'bg-green-100 text-green-800',
            active: 'bg-green-100 text-green-800',
            completed: 'bg-green-100 text-green-800',
            planning: 'bg-blue-100 text-blue-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getPriorityClass(priority) {
        const classes = {
            low: 'bg-gray-100 text-gray-800',
            medium: 'bg-blue-100 text-blue-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800'
        };
        return classes[priority] || 'bg-gray-100 text-gray-800';
    }

    formatFilterValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object' && value !== null) {
            return `${value.start} to ${value.end}`;
        }
        return String(value);
    }

    emit(event, data) {
        // Simple event emission
        const customEvent = new CustomEvent(event, { detail: data });
        this.container.dispatchEvent(customEvent);
    }

    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const toast = document.createElement('div');
        toast.className = `fixed top-20 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
        toast.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-feather="info" class="w-5 h-5"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);
        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchWidget;
} else {
    window.SearchWidget = SearchWidget;
}