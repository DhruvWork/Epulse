/**
 * Data Manager for EngineerPulse
 * Handles export/import functionality for all data types
 */

class DataManager {
    constructor() {
        this.listeners = {};
        this.supportedFormats = ['json', 'csv', 'xlsx'];
        this.dataTypes = {
            tasks: 'Tasks and Project Data',
            timeTracking: 'Time Tracking Sessions',
            goals: 'Goals and Progress',
            collaboration: 'Comments and Notifications',
            charts: 'Chart Data and Metrics',
            settings: 'User Settings and Preferences',
            all: 'Complete Data Export'
        };
        
        this.init();
    }

    init() {
        this.setupEventHandlers();
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

    // Export Functions
    async exportData(dataType = 'all', format = 'json', options = {}) {
        try {
            const data = await this.gatherData(dataType);
            const exportData = this.prepareExportData(data, dataType, options);
            
            let blob;
            let filename;
            
            switch (format.toLowerCase()) {
                case 'json':
                    blob = this.exportToJSON(exportData);
                    filename = this.generateFilename(dataType, 'json');
                    break;
                case 'csv':
                    blob = this.exportToCSV(exportData, dataType);
                    filename = this.generateFilename(dataType, 'csv');
                    break;
                case 'xlsx':
                    blob = await this.exportToXLSX(exportData, dataType);
                    filename = this.generateFilename(dataType, 'xlsx');
                    break;
                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
            
            this.downloadBlob(blob, filename);
            
            this.emit('onExportComplete', {
                dataType,
                format,
                filename,
                size: blob.size
            });
            
            return { success: true, filename, size: blob.size };
            
        } catch (error) {
            console.error('Export failed:', error);
            this.emit('onExportError', { error, dataType, format });
            throw error;
        }
    }

    // Import Functions
    async importData(file, options = {}) {
        try {
            const { mergeStrategy = 'replace', validateData = true } = options;
            
            // Validate file
            const validation = this.validateImportFile(file);
            if (!validation.valid) {
                throw new Error(`Invalid file: ${validation.error}`);
            }
            
            // Read file data
            const fileData = await this.readImportFile(file);
            
            // Validate data structure if requested
            if (validateData) {
                const dataValidation = this.validateImportData(fileData);
                if (!dataValidation.valid) {
                    throw new Error(`Invalid data structure: ${dataValidation.error}`);
                }
            }
            
            // Process import based on merge strategy
            const result = await this.processImport(fileData, mergeStrategy);
            
            this.emit('onImportComplete', {
                filename: file.name,
                size: file.size,
                result,
                mergeStrategy
            });
            
            return result;
            
        } catch (error) {
            console.error('Import failed:', error);
            this.emit('onImportError', { error, filename: file?.name });
            throw error;
        }
    }

    // Data Gathering
    async gatherData(dataType) {
        const data = {};
        
        switch (dataType) {
            case 'tasks':
                data.tasks = this.getTaskData();
                data.projects = this.getProjectData();
                break;
                
            case 'timeTracking':
                data.sessions = this.getTimeTrackingData();
                data.statistics = this.getTimeStatistics();
                break;
                
            case 'goals':
                data.goals = this.getGoalsData();
                data.progress = this.getGoalsProgress();
                break;
                
            case 'collaboration':
                data.comments = this.getCollaborationData();
                data.notifications = this.getNotificationsData();
                break;
                
            case 'charts':
                data.chartData = this.getChartsData();
                data.metrics = this.getMetricsData();
                break;
                
            case 'settings':
                data.userSettings = this.getUserSettings();
                data.preferences = this.getUserPreferences();
                break;
                
            case 'all':
                data.tasks = this.getTaskData();
                data.projects = this.getProjectData();
                data.sessions = this.getTimeTrackingData();
                data.goals = this.getGoalsData();
                data.comments = this.getCollaborationData();
                data.chartData = this.getChartsData();
                data.userSettings = this.getUserSettings();
                data.exportMetadata = this.getExportMetadata();
                break;
                
            default:
                throw new Error(`Unknown data type: ${dataType}`);
        }
        
        return data;
    }

    // Export Format Handlers
    exportToJSON(data) {
        const jsonString = JSON.stringify(data, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }

    exportToCSV(data, dataType) {
        let csvContent = '';
        
        switch (dataType) {
            case 'tasks':
                csvContent = this.tasksToCSV(data.tasks);
                break;
            case 'timeTracking':
                csvContent = this.timeTrackingToCSV(data.sessions);
                break;
            case 'goals':
                csvContent = this.goalsToCSV(data.goals);
                break;
            default:
                // For complex data types, flatten to key-value pairs
                csvContent = this.flattenToCSV(data);
        }
        
        return new Blob([csvContent], { type: 'text/csv' });
    }

    async exportToXLSX(data, dataType) {
        // This would require a library like SheetJS
        // For now, we'll create a simple workbook structure
        const workbook = {
            sheets: {},
            metadata: {
                created: new Date().toISOString(),
                application: 'EngineerPulse',
                version: '1.0.0'
            }
        };
        
        switch (dataType) {
            case 'tasks':
                workbook.sheets['Tasks'] = this.tasksToSheet(data.tasks);
                if (data.projects) {
                    workbook.sheets['Projects'] = this.projectsToSheet(data.projects);
                }
                break;
                
            case 'timeTracking':
                workbook.sheets['Sessions'] = this.timeTrackingToSheet(data.sessions);
                if (data.statistics) {
                    workbook.sheets['Statistics'] = this.statisticsToSheet(data.statistics);
                }
                break;
                
            case 'all':
                Object.keys(data).forEach(key => {
                    if (key !== 'exportMetadata') {
                        workbook.sheets[this.capitalizeFirst(key)] = this.dataToSheet(data[key]);
                    }
                });
                break;
                
            default:
                workbook.sheets['Data'] = this.dataToSheet(data);
        }
        
        // Convert to blob (simplified - would need actual XLSX library)
        const xlsxContent = JSON.stringify(workbook, null, 2);
        return new Blob([xlsxContent], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
    }

    // Import File Handling
    validateImportFile(file) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }
        
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return { valid: false, error: 'File too large (max 50MB)' };
        }
        
        const allowedTypes = [
            'application/json',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(json|csv|xlsx|xls)$/i)) {
            return { valid: false, error: 'Unsupported file type' };
        }
        
        return { valid: true };
    }

    async readImportFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    
                    if (file.type === 'application/json' || file.name.endsWith('.json')) {
                        resolve(JSON.parse(content));
                    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        resolve(this.parseCSV(content));
                    } else {
                        // For XLSX files, we'd need a library to parse
                        resolve({ rawContent: content, type: 'xlsx' });
                    }
                } catch (error) {
                    reject(new Error('Failed to parse file content'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
        });
    }

    validateImportData(data) {
        if (typeof data !== 'object' || data === null) {
            return { valid: false, error: 'Data must be an object' };
        }
        
        // Check for required structure based on data type
        if (data.exportMetadata) {
            // Complete export - validate structure
            const requiredFields = ['tasks', 'sessions', 'goals'];
            const missingFields = requiredFields.filter(field => !data[field]);
            
            if (missingFields.length > 0) {
                return { 
                    valid: false, 
                    error: `Missing required fields: ${missingFields.join(', ')}` 
                };
            }
        }
        
        return { valid: true };
    }

    async processImport(data, mergeStrategy) {
        const result = {
            imported: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };
        
        try {
            // Import tasks
            if (data.tasks) {
                const taskResult = await this.importTasks(data.tasks, mergeStrategy);
                result.imported += taskResult.imported;
                result.updated += taskResult.updated;
                result.skipped += taskResult.skipped;
                result.errors = result.errors.concat(taskResult.errors);
            }
            
            // Import time tracking data
            if (data.sessions) {
                const sessionResult = await this.importTimeSessions(data.sessions, mergeStrategy);
                result.imported += sessionResult.imported;
                result.updated += sessionResult.updated;
                result.skipped += sessionResult.skipped;
                result.errors = result.errors.concat(sessionResult.errors);
            }
            
            // Import goals
            if (data.goals) {
                const goalsResult = await this.importGoals(data.goals, mergeStrategy);
                result.imported += goalsResult.imported;
                result.updated += goalsResult.updated;
                result.skipped += goalsResult.skipped;
                result.errors = result.errors.concat(goalsResult.errors);
            }
            
            // Import collaboration data
            if (data.comments) {
                const commentsResult = await this.importComments(data.comments, mergeStrategy);
                result.imported += commentsResult.imported;
                result.updated += commentsResult.updated;
                result.skipped += commentsResult.skipped;
                result.errors = result.errors.concat(commentsResult.errors);
            }
            
            // Import settings
            if (data.userSettings) {
                const settingsResult = await this.importSettings(data.userSettings, mergeStrategy);
                result.imported += settingsResult.imported;
                result.updated += settingsResult.updated;
                result.skipped += settingsResult.skipped;
                result.errors = result.errors.concat(settingsResult.errors);
            }
            
        } catch (error) {
            result.errors.push(`Import process error: ${error.message}`);
        }
        
        return result;
    }

    // Data Source Methods (these would integrate with existing systems)
    getTaskData() {
        // Get tasks from DOM or localStorage
        const tasks = [];
        document.querySelectorAll('.task-card').forEach(card => {
            tasks.push({
                id: card.dataset.taskId,
                name: card.dataset.taskName,
                status: this.getTaskStatus(card),
                priority: this.getTaskPriority(card),
                assignee: this.getTaskAssignee(card),
                created: card.dataset.created || new Date().toISOString(),
                element: card.outerHTML
            });
        });
        return tasks;
    }

    getProjectData() {
        return [{
            id: 'sprint-12-auth-security',
            name: 'Sprint 12 - Authentication & Security',
            startDate: '2024-12-18',
            endDate: '2025-01-01',
            progress: 83,
            totalTasks: 18,
            completedTasks: 15
        }];
    }

    getTimeTrackingData() {
        // Get from TimeTracker if available
        if (typeof TimeTracker !== 'undefined') {
            const timeTracker = new TimeTracker();
            return timeTracker.getAllSessions();
        }
        return JSON.parse(localStorage.getItem('timeTrackingSessions') || '[]');
    }

    getTimeStatistics() {
        const sessions = this.getTimeTrackingData();
        return {
            totalTime: sessions.reduce((sum, s) => sum + s.duration, 0),
            sessionCount: sessions.length,
            averageSession: sessions.length > 0 ? 
                sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0,
            taskCounts: sessions.reduce((counts, s) => {
                counts[s.taskId] = (counts[s.taskId] || 0) + 1;
                return counts;
            }, {})
        };
    }

    getGoalsData() {
        return JSON.parse(localStorage.getItem('goals') || '[]');
    }

    getGoalsProgress() {
        const goals = this.getGoalsData();
        return goals.map(goal => ({
            id: goal.id,
            progress: goal.progress || 0,
            milestones: goal.milestones || [],
            lastUpdated: goal.lastUpdated || new Date().toISOString()
        }));
    }

    getCollaborationData() {
        return JSON.parse(localStorage.getItem('comments') || '[]');
    }

    getNotificationsData() {
        return JSON.parse(localStorage.getItem('notifications') || '[]');
    }

    getChartsData() {
        return {
            velocityData: JSON.parse(localStorage.getItem('velocityData') || '[]'),
            burndownData: JSON.parse(localStorage.getItem('burndownData') || '[]'),
            codeQualityData: JSON.parse(localStorage.getItem('codeQualityData') || '[]')
        };
    }

    getMetricsData() {
        return {
            productivity: JSON.parse(localStorage.getItem('productivityMetrics') || '{}'),
            performance: JSON.parse(localStorage.getItem('performanceMetrics') || '{}'),
            quality: JSON.parse(localStorage.getItem('qualityMetrics') || '{}')
        };
    }

    getUserSettings() {
        return {
            theme: document.body.classList.contains('dark-mode') ? 'dark' : 'light',
            notifications: JSON.parse(localStorage.getItem('notificationSettings') || '{}'),
            preferences: JSON.parse(localStorage.getItem('userPreferences') || '{}'),
            layout: JSON.parse(localStorage.getItem('layoutSettings') || '{}')
        };
    }

    getUserPreferences() {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
    }

    getExportMetadata() {
        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            application: 'EngineerPulse',
            dataTypes: Object.keys(this.dataTypes),
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // CSV Conversion Methods
    tasksToCSV(tasks) {
        const headers = ['ID', 'Name', 'Status', 'Priority', 'Assignee', 'Created'];
        const rows = tasks.map(task => [
            task.id,
            `"${task.name}"`,
            task.status,
            task.priority,
            task.assignee,
            task.created
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    timeTrackingToCSV(sessions) {
        const headers = ['Task ID', 'Task Name', 'Start Time', 'End Time', 'Duration (minutes)', 'Date'];
        const rows = sessions.map(session => [
            session.taskId,
            `"${session.taskName}"`,
            session.startTime,
            session.endTime,
            Math.round(session.duration / 60000),
            new Date(session.startTime).toDateString()
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    goalsToCSV(goals) {
        const headers = ['ID', 'Title', 'Description', 'Progress %', 'Target Date', 'Status'];
        const rows = goals.map(goal => [
            goal.id,
            `"${goal.title}"`,
            `"${goal.description || ''}"`,
            goal.progress || 0,
            goal.targetDate || '',
            goal.status || 'active'
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    flattenToCSV(data) {
        // Convert nested object to flat key-value CSV
        const flattened = this.flattenObject(data);
        const headers = ['Key', 'Value'];
        const rows = Object.entries(flattened).map(([key, value]) => [
            key,
            `"${String(value)}"`
        ]);
        
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    // Sheet Conversion Methods (simplified)
    tasksToSheet(tasks) {
        return {
            headers: ['ID', 'Name', 'Status', 'Priority', 'Assignee', 'Created'],
            rows: tasks.map(task => [
                task.id, task.name, task.status, task.priority, task.assignee, task.created
            ])
        };
    }

    timeTrackingToSheet(sessions) {
        return {
            headers: ['Task ID', 'Task Name', 'Start Time', 'End Time', 'Duration (minutes)', 'Date'],
            rows: sessions.map(session => [
                session.taskId,
                session.taskName,
                session.startTime,
                session.endTime,
                Math.round(session.duration / 60000),
                new Date(session.startTime).toDateString()
            ])
        };
    }

    dataToSheet(data) {
        if (Array.isArray(data)) {
            if (data.length === 0) return { headers: [], rows: [] };
            
            const headers = Object.keys(data[0]);
            const rows = data.map(item => headers.map(h => item[h]));
            return { headers, rows };
        }
        
        // Convert object to key-value sheet
        return {
            headers: ['Key', 'Value'],
            rows: Object.entries(data).map(([key, value]) => [key, JSON.stringify(value)])
        };
    }

    // Import Methods
    async importTasks(tasks, mergeStrategy) {
        const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
        
        tasks.forEach(task => {
            try {
                const existingTask = document.querySelector(`[data-task-id="${task.id}"]`);
                
                if (existingTask && mergeStrategy === 'skip') {
                    result.skipped++;
                } else if (existingTask && mergeStrategy === 'update') {
                    this.updateTask(existingTask, task);
                    result.updated++;
                } else {
                    this.createTask(task);
                    result.imported++;
                }
            } catch (error) {
                result.errors.push(`Task ${task.id}: ${error.message}`);
            }
        });
        
        return result;
    }

    async importTimeSessions(sessions, mergeStrategy) {
        const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
        
        sessions.forEach(session => {
            try {
                // Store in localStorage or integrate with TimeTracker
                const existingSessions = JSON.parse(localStorage.getItem('timeTrackingSessions') || '[]');
                const exists = existingSessions.find(s => s.id === session.id);
                
                if (exists && mergeStrategy === 'skip') {
                    result.skipped++;
                } else if (exists && mergeStrategy === 'update') {
                    const index = existingSessions.findIndex(s => s.id === session.id);
                    existingSessions[index] = session;
                    localStorage.setItem('timeTrackingSessions', JSON.stringify(existingSessions));
                    result.updated++;
                } else {
                    existingSessions.push(session);
                    localStorage.setItem('timeTrackingSessions', JSON.stringify(existingSessions));
                    result.imported++;
                }
            } catch (error) {
                result.errors.push(`Session ${session.id}: ${error.message}`);
            }
        });
        
        return result;
    }

    async importGoals(goals, mergeStrategy) {
        const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
        
        goals.forEach(goal => {
            try {
                const existingGoals = JSON.parse(localStorage.getItem('goals') || '[]');
                const existingIndex = existingGoals.findIndex(g => g.id === goal.id);
                
                if (existingIndex !== -1 && mergeStrategy === 'skip') {
                    result.skipped++;
                } else if (existingIndex !== -1 && mergeStrategy === 'update') {
                    existingGoals[existingIndex] = goal;
                    localStorage.setItem('goals', JSON.stringify(existingGoals));
                    result.updated++;
                } else {
                    existingGoals.push(goal);
                    localStorage.setItem('goals', JSON.stringify(existingGoals));
                    result.imported++;
                }
            } catch (error) {
                result.errors.push(`Goal ${goal.id}: ${error.message}`);
            }
        });
        
        return result;
    }

    async importComments(comments, mergeStrategy) {
        const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
        
        comments.forEach(comment => {
            try {
                const existingComments = JSON.parse(localStorage.getItem('comments') || '[]');
                const exists = existingComments.find(c => c.id === comment.id);
                
                if (exists && mergeStrategy === 'skip') {
                    result.skipped++;
                } else if (exists && mergeStrategy === 'update') {
                    const index = existingComments.findIndex(c => c.id === comment.id);
                    existingComments[index] = comment;
                    localStorage.setItem('comments', JSON.stringify(existingComments));
                    result.updated++;
                } else {
                    existingComments.push(comment);
                    localStorage.setItem('comments', JSON.stringify(existingComments));
                    result.imported++;
                }
            } catch (error) {
                result.errors.push(`Comment ${comment.id}: ${error.message}`);
            }
        });
        
        return result;
    }

    async importSettings(settings, mergeStrategy) {
        const result = { imported: 0, updated: 0, skipped: 0, errors: [] };
        
        try {
            Object.entries(settings).forEach(([key, value]) => {
                const existingValue = localStorage.getItem(key);
                
                if (existingValue && mergeStrategy === 'skip') {
                    result.skipped++;
                } else {
                    localStorage.setItem(key, JSON.stringify(value));
                    if (existingValue) {
                        result.updated++;
                    } else {
                        result.imported++;
                    }
                }
            });
            
            // Apply theme if imported
            if (settings.theme) {
                if (settings.theme === 'dark') {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
            }
            
        } catch (error) {
            result.errors.push(`Settings import error: ${error.message}`);
        }
        
        return result;
    }

    // Utility Methods
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }
        
        return data;
    }

    flattenObject(obj, prefix = '') {
        const flattened = {};
        
        Object.keys(obj).forEach(key => {
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                Object.assign(flattened, this.flattenObject(obj[key], newKey));
            } else {
                flattened[newKey] = obj[key];
            }
        });
        
        return flattened;
    }

    generateFilename(dataType, format) {
        const timestamp = new Date().toISOString().split('T')[0];
        const typeLabel = dataType === 'all' ? 'complete-data' : dataType;
        return `engineerpulse-${typeLabel}-${timestamp}.${format}`;
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    prepareExportData(data, dataType, options) {
        const { includeMetadata = true, anonymize = false } = options;
        
        if (anonymize) {
            data = this.anonymizeData(data);
        }
        
        if (includeMetadata && dataType === 'all') {
            data.exportMetadata = this.getExportMetadata();
        }
        
        return data;
    }

    anonymizeData(data) {
        // Remove or hash sensitive information
        const anonymized = JSON.parse(JSON.stringify(data));
        
        // This is a simplified anonymization - in production you'd want more sophisticated handling
        if (anonymized.userSettings) {
            delete anonymized.userSettings.email;
            delete anonymized.userSettings.personalInfo;
        }
        
        return anonymized;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getTaskStatus(taskCard) {
        const column = taskCard.closest('.kanban-column');
        if (column) {
            const header = column.querySelector('h3').textContent.toLowerCase();
            if (header.includes('backlog')) return 'backlog';
            if (header.includes('to do')) return 'todo';
            if (header.includes('progress')) return 'in-progress';
            if (header.includes('done')) return 'done';
        }
        return 'unknown';
    }

    getTaskPriority(taskCard) {
        const prioritySpan = taskCard.querySelector('.priority-high, .priority-medium, .priority-low');
        if (prioritySpan) {
            if (prioritySpan.classList.contains('priority-high')) return 'high';
            if (prioritySpan.classList.contains('priority-medium')) return 'medium';
            if (prioritySpan.classList.contains('priority-low')) return 'low';
        }
        return 'medium';
    }

    getTaskAssignee(taskCard) {
        const avatar = taskCard.querySelector('img[alt]');
        return avatar ? avatar.alt : 'Unassigned';
    }

    updateTask(taskElement, taskData) {
        // Update task element with new data
        if (taskData.name) {
            const nameSpan = taskElement.querySelector('.font-medium');
            if (nameSpan) nameSpan.textContent = taskData.name;
        }
        
        if (taskData.priority) {
            const prioritySpan = taskElement.querySelector('[class*="priority-"]');
            if (prioritySpan) {
                prioritySpan.className = prioritySpan.className.replace(/priority-\w+/, `priority-${taskData.priority}`);
                prioritySpan.textContent = this.capitalizeFirst(taskData.priority);
            }
        }
    }

    createTask(taskData) {
        // This would create a new task element - simplified for demo
        console.log('Creating new task:', taskData);
    }

    // Event Handlers
    setupEventHandlers() {
        // Handle drag and drop for import files
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (this.validateImportFile(file).valid) {
                    this.emit('onFileDropped', { file });
                }
            });
        });
    }

    // Public API Methods
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    getDataTypes() {
        return { ...this.dataTypes };
    }

    getExportPreview(dataType = 'all') {
        return this.gatherData(dataType);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
} else {
    window.DataManager = DataManager;
}