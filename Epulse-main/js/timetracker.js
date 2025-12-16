/**
 * Time Tracking Module for EngineerPulse
 * Provides time tracking functionality for tasks and projects
 */

class TimeTracker {
    constructor() {
        this.sessions = JSON.parse(localStorage.getItem('timeSessions') || '[]');
        this.currentSession = JSON.parse(localStorage.getItem('currentSession') || 'null');
        this.isRunning = false;
        this.startTime = null;
        this.timer = null;
        this.callbacks = {
            onStart: [],
            onStop: [],
            onUpdate: []
        };
        
        // Resume session if one was running
        if (this.currentSession && this.currentSession.isRunning) {
            this.resumeSession();
        }
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

    // Start tracking time for a task
    startTracking(taskId, taskName, projectId = null) {
        if (this.isRunning) {
            this.stopTracking();
        }

        const session = {
            id: this.generateId(),
            taskId,
            taskName,
            projectId,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: 0,
            isRunning: true,
            breaks: [],
            notes: ''
        };

        this.currentSession = session;
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Start the timer
        this.timer = setInterval(() => {
            this.updateCurrentSession();
        }, 1000);

        this.saveCurrentSession();
        this.emit('onStart', session);
        
        return session;
    }

    // Stop tracking time
    stopTracking(notes = '') {
        if (!this.isRunning || !this.currentSession) {
            return null;
        }

        const endTime = new Date().toISOString();
        const duration = Date.now() - this.startTime;

        this.currentSession.endTime = endTime;
        this.currentSession.duration += duration;
        this.currentSession.isRunning = false;
        this.currentSession.notes = notes;

        // Add to sessions history
        this.sessions.push({...this.currentSession});
        this.saveSessions();

        const completedSession = {...this.currentSession};
        
        // Clear current session
        this.currentSession = null;
        this.isRunning = false;
        this.startTime = null;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.saveCurrentSession();
        this.emit('onStop', completedSession);
        
        return completedSession;
    }

    // Pause/Resume functionality
    pauseTracking() {
        if (!this.isRunning || !this.currentSession) {
            return false;
        }

        const pauseTime = Date.now();
        const sessionDuration = pauseTime - this.startTime;
        
        this.currentSession.duration += sessionDuration;
        this.currentSession.breaks.push({
            startTime: new Date().toISOString(),
            endTime: null,
            reason: 'manual_pause'
        });

        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        this.saveCurrentSession();
        return true;
    }

    resumeTracking() {
        if (this.isRunning || !this.currentSession) {
            return false;
        }

        // End the current break
        const currentBreak = this.currentSession.breaks[this.currentSession.breaks.length - 1];
        if (currentBreak && !currentBreak.endTime) {
            currentBreak.endTime = new Date().toISOString();
        }

        this.isRunning = true;
        this.startTime = Date.now();
        
        // Restart the timer
        this.timer = setInterval(() => {
            this.updateCurrentSession();
        }, 1000);

        this.saveCurrentSession();
        return true;
    }

    // Resume session from localStorage
    resumeSession() {
        if (this.currentSession && this.currentSession.isRunning) {
            this.isRunning = true;
            this.startTime = Date.now();
            
            this.timer = setInterval(() => {
                this.updateCurrentSession();
            }, 1000);
        }
    }

    // Update current session duration
    updateCurrentSession() {
        if (this.currentSession && this.isRunning) {
            const currentTime = Date.now();
            const sessionDuration = currentTime - this.startTime;
            
            this.emit('onUpdate', {
                session: this.currentSession,
                currentDuration: this.currentSession.duration + sessionDuration,
                totalTime: this.formatDuration(this.currentSession.duration + sessionDuration)
            });
        }
    }

    // Get current session info
    getCurrentSession() {
        if (!this.currentSession) {
            return null;
        }

        const currentDuration = this.isRunning 
            ? this.currentSession.duration + (Date.now() - this.startTime)
            : this.currentSession.duration;

        return {
            ...this.currentSession,
            currentDuration,
            formattedDuration: this.formatDuration(currentDuration)
        };
    }

    // Get sessions for a specific date
    getSessionsForDate(date) {
        const targetDate = new Date(date).toDateString();
        return this.sessions.filter(session => {
            const sessionDate = new Date(session.startTime).toDateString();
            return sessionDate === targetDate;
        });
    }

    // Get sessions for a specific task
    getSessionsForTask(taskId) {
        return this.sessions.filter(session => session.taskId === taskId);
    }

    // Get total time for a task
    getTotalTimeForTask(taskId) {
        const taskSessions = this.getSessionsForTask(taskId);
        const totalDuration = taskSessions.reduce((total, session) => total + session.duration, 0);
        return {
            duration: totalDuration,
            formatted: this.formatDuration(totalDuration),
            sessionCount: taskSessions.length
        };
    }

    // Get daily summary
    getDailySummary(date = new Date()) {
        const sessions = this.getSessionsForDate(date);
        const totalDuration = sessions.reduce((total, session) => total + session.duration, 0);
        
        const taskBreakdown = {};
        sessions.forEach(session => {
            if (!taskBreakdown[session.taskId]) {
                taskBreakdown[session.taskId] = {
                    taskName: session.taskName,
                    duration: 0,
                    sessionCount: 0
                };
            }
            taskBreakdown[session.taskId].duration += session.duration;
            taskBreakdown[session.taskId].sessionCount++;
        });

        return {
            date: date.toDateString(),
            totalDuration,
            formattedTotal: this.formatDuration(totalDuration),
            sessionCount: sessions.length,
            taskBreakdown
        };
    }

    // Get weekly summary
    getWeeklySummary(startDate = null) {
        if (!startDate) {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        }

        const weekSessions = [];
        const dailySummaries = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dailySummary = this.getDailySummary(date);
            dailySummaries.push(dailySummary);
            
            const sessions = this.getSessionsForDate(date);
            weekSessions.push(...sessions);
        }

        const totalDuration = weekSessions.reduce((total, session) => total + session.duration, 0);

        return {
            startDate: startDate.toDateString(),
            endDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000).toDateString(),
            totalDuration,
            formattedTotal: this.formatDuration(totalDuration),
            dailySummaries,
            sessionCount: weekSessions.length
        };
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Storage methods
    saveSessions() {
        localStorage.setItem('timeSessions', JSON.stringify(this.sessions));
    }

    saveCurrentSession() {
        localStorage.setItem('currentSession', JSON.stringify(this.currentSession));
    }

    // Export data
    exportData(format = 'json') {
        const data = {
            sessions: this.sessions,
            currentSession: this.currentSession,
            exportDate: new Date().toISOString()
        };

        if (format === 'csv') {
            return this.convertToCSV(this.sessions);
        }

        return JSON.stringify(data, null, 2);
    }

    convertToCSV(sessions) {
        const headers = ['Task ID', 'Task Name', 'Project ID', 'Start Time', 'End Time', 'Duration (ms)', 'Duration (formatted)', 'Notes'];
        const rows = sessions.map(session => [
            session.taskId,
            session.taskName,
            session.projectId || '',
            session.startTime,
            session.endTime || '',
            session.duration,
            this.formatDuration(session.duration),
            session.notes || ''
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    // Clear all data
    clearAllData() {
        this.sessions = [];
        this.currentSession = null;
        this.isRunning = false;
        this.startTime = null;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        localStorage.removeItem('timeSessions');
        localStorage.removeItem('currentSession');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeTracker;
} else {
    window.TimeTracker = TimeTracker;
}