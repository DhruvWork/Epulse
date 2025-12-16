/**
 * Time Tracker Widget for EngineerPulse
 * UI component for time tracking functionality
 */

class TimeTrackerWidget {
    constructor(container, timeTracker) {
        this.container = container;
        this.timeTracker = timeTracker;
        this.currentTaskId = null;
        this.currentTaskName = null;
        this.updateInterval = null;
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.render();
        
        // Check if there's an active session
        const currentSession = this.timeTracker.getCurrentSession();
        if (currentSession) {
            this.currentTaskId = currentSession.taskId;
            this.currentTaskName = currentSession.taskName;
            this.updateUI();
            this.startUpdateLoop();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="time-tracker-widget bg-white rounded-lg shadow-sm p-4 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold flex items-center">
                        <i data-feather="clock" class="w-5 h-5 mr-2 text-indigo-600"></i>
                        Time Tracker
                    </h3>
                    <div class="flex items-center space-x-2">
                        <button id="timeHistoryBtn" class="text-sm text-gray-600 hover:text-indigo-600 flex items-center">
                            <i data-feather="history" class="w-4 h-4 mr-1"></i>
                            History
                        </button>
                        <button id="timeStatsBtn" class="text-sm text-gray-600 hover:text-indigo-600 flex items-center">
                            <i data-feather="bar-chart-2" class="w-4 h-4 mr-1"></i>
                            Stats
                        </button>
                    </div>
                </div>
                
                <div id="timeTrackerContent">
                    <div id="noActiveTask" class="text-center py-6">
                        <i data-feather="play-circle" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
                        <p class="text-gray-500 mb-4">No active time tracking</p>
                        <p class="text-sm text-gray-400">Click on a task to start tracking time</p>
                    </div>
                    
                    <div id="activeTask" class="hidden">
                        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center space-x-2">
                                    <div class="w-3 h-3 bg-green-500 rounded-full pulse-animation"></div>
                                    <span class="text-sm font-medium text-indigo-900">Tracking Time</span>
                                </div>
                                <div id="currentTime" class="text-lg font-bold text-indigo-900">00:00:00</div>
                            </div>
                            <div id="currentTaskInfo" class="text-sm text-indigo-700"></div>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <button id="pauseBtn" class="btn btn-outline text-sm flex-1">
                                <i data-feather="pause" class="w-4 h-4 mr-1"></i>
                                Pause
                            </button>
                            <button id="stopBtn" class="btn btn-secondary text-sm flex-1">
                                <i data-feather="stop-circle" class="w-4 h-4 mr-1"></i>
                                Stop
                            </button>
                        </div>
                        
                        <div class="mt-4">
                            <label class="form-label text-sm">Session Notes (optional)</label>
                            <textarea id="sessionNotes" class="form-input text-sm" rows="2" placeholder="Add notes about your work session..."></textarea>
                        </div>
                    </div>
                    
                    <div id="pausedTask" class="hidden">
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center space-x-2">
                                    <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <span class="text-sm font-medium text-yellow-900">Paused</span>
                                </div>
                                <div id="pausedTime" class="text-lg font-bold text-yellow-900">00:00:00</div>
                            </div>
                            <div id="pausedTaskInfo" class="text-sm text-yellow-700"></div>
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <button id="resumeBtn" class="btn btn-primary text-sm flex-1">
                                <i data-feather="play" class="w-4 h-4 mr-1"></i>
                                Resume
                            </button>
                            <button id="stopPausedBtn" class="btn btn-secondary text-sm flex-1">
                                <i data-feather="stop-circle" class="w-4 h-4 mr-1"></i>
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Today's Summary -->
                <div class="mt-6 pt-4 border-t border-gray-200">
                    <h4 class="font-medium mb-3 text-sm">Today's Summary</h4>
                    <div id="todaySummary" class="grid grid-cols-2 gap-4 text-sm">
                        <div class="text-center">
                            <div id="todayTotal" class="font-bold text-lg text-gray-900">0h 0m</div>
                            <div class="text-gray-500">Total Time</div>
                        </div>
                        <div class="text-center">
                            <div id="todaySessions" class="font-bold text-lg text-gray-900">0</div>
                            <div class="text-gray-500">Sessions</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    bindEvents() {
        // Pause button
        const pauseBtn = this.container.querySelector('#pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseTracking());
        }

        // Resume button
        const resumeBtn = this.container.querySelector('#resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeTracking());
        }

        // Stop buttons
        const stopBtn = this.container.querySelector('#stopBtn');
        const stopPausedBtn = this.container.querySelector('#stopPausedBtn');
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTracking());
        }
        if (stopPausedBtn) {
            stopPausedBtn.addEventListener('click', () => this.stopTracking());
        }

        // History button
        const historyBtn = this.container.querySelector('#timeHistoryBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistory());
        }

        // Stats button
        const statsBtn = this.container.querySelector('#timeStatsBtn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => this.showStats());
        }

        // Time tracker events
        this.timeTracker.on('onStart', (session) => {
            this.currentTaskId = session.taskId;
            this.currentTaskName = session.taskName;
            this.updateUI();
            this.startUpdateLoop();
        });

        this.timeTracker.on('onStop', (session) => {
            this.currentTaskId = null;
            this.currentTaskName = null;
            this.updateUI();
            this.stopUpdateLoop();
            this.updateTodaySummary();
            this.showSessionComplete(session);
        });

        this.timeTracker.on('onUpdate', (data) => {
            this.updateTimeDisplay(data.totalTime);
        });
    }

    startTracking(taskId, taskName, projectId = null) {
        this.timeTracker.startTracking(taskId, taskName, projectId);
    }

    pauseTracking() {
        if (this.timeTracker.pauseTracking()) {
            this.updateUI();
            this.stopUpdateLoop();
        }
    }

    resumeTracking() {
        if (this.timeTracker.resumeTracking()) {
            this.updateUI();
            this.startUpdateLoop();
        }
    }

    stopTracking() {
        const notes = this.container.querySelector('#sessionNotes')?.value || '';
        this.timeTracker.stopTracking(notes);
    }

    updateUI() {
        const noActiveTask = this.container.querySelector('#noActiveTask');
        const activeTask = this.container.querySelector('#activeTask');
        const pausedTask = this.container.querySelector('#pausedTask');
        
        const currentSession = this.timeTracker.getCurrentSession();
        
        if (!currentSession) {
            // No active session
            noActiveTask?.classList.remove('hidden');
            activeTask?.classList.add('hidden');
            pausedTask?.classList.add('hidden');
        } else if (this.timeTracker.isRunning) {
            // Active session running
            noActiveTask?.classList.add('hidden');
            activeTask?.classList.remove('hidden');
            pausedTask?.classList.add('hidden');
            
            const taskInfo = this.container.querySelector('#currentTaskInfo');
            if (taskInfo) {
                taskInfo.textContent = `${currentSession.taskName} • Started ${new Date(currentSession.startTime).toLocaleTimeString()}`;
            }
        } else {
            // Session paused
            noActiveTask?.classList.add('hidden');
            activeTask?.classList.add('hidden');
            pausedTask?.classList.remove('hidden');
            
            const taskInfo = this.container.querySelector('#pausedTaskInfo');
            const timeDisplay = this.container.querySelector('#pausedTime');
            
            if (taskInfo) {
                taskInfo.textContent = `${currentSession.taskName} • Started ${new Date(currentSession.startTime).toLocaleTimeString()}`;
            }
            if (timeDisplay) {
                timeDisplay.textContent = currentSession.formattedDuration;
            }
        }
        
        this.updateTodaySummary();
    }

    updateTimeDisplay(formattedTime) {
        const timeDisplay = this.container.querySelector('#currentTime');
        if (timeDisplay) {
            timeDisplay.textContent = formattedTime;
        }
    }

    updateTodaySummary() {
        const summary = this.timeTracker.getDailySummary();
        
        const totalDisplay = this.container.querySelector('#todayTotal');
        const sessionsDisplay = this.container.querySelector('#todaySessions');
        
        if (totalDisplay) {
            totalDisplay.textContent = summary.formattedTotal;
        }
        if (sessionsDisplay) {
            sessionsDisplay.textContent = summary.sessionCount.toString();
        }
    }

    startUpdateLoop() {
        this.stopUpdateLoop(); // Clear any existing interval
        this.updateInterval = setInterval(() => {
            const currentSession = this.timeTracker.getCurrentSession();
            if (currentSession && this.timeTracker.isRunning) {
                this.updateTimeDisplay(currentSession.formattedDuration);
            }
        }, 1000);
    }

    stopUpdateLoop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    showHistory() {
        const sessions = this.timeTracker.sessions.slice(-10); // Last 10 sessions
        
        let historyHTML = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-lg">Time Tracking History</h3>
                        <button id="closeHistory" class="text-gray-400 hover:text-gray-600">
                            <i data-feather="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="space-y-3">
        `;

        if (sessions.length === 0) {
            historyHTML += `
                <div class="text-center py-8">
                    <i data-feather="clock" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
                    <p class="text-gray-500">No time tracking history yet</p>
                </div>
            `;
        } else {
            sessions.forEach(session => {
                const startTime = new Date(session.startTime);
                const formattedDuration = this.timeTracker.formatDuration(session.duration);
                
                historyHTML += `
                    <div class="border border-gray-200 rounded-lg p-3">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-medium text-sm">${session.taskName}</span>
                            <span class="text-sm font-mono text-indigo-600">${formattedDuration}</span>
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-500">
                            <span>${startTime.toLocaleDateString()} • ${startTime.toLocaleTimeString()}</span>
                            <span>${session.taskId}</span>
                        </div>
                        ${session.notes ? `<div class="mt-2 text-xs text-gray-600">${session.notes}</div>` : ''}
                    </div>
                `;
            });
        }

        historyHTML += `
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.innerHTML = historyHTML;
        document.body.appendChild(modal);

        // Close button
        const closeBtn = modal.querySelector('#closeHistory');
        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal.firstElementChild?.parentElement) {
                document.body.removeChild(modal);
            }
        });

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    showStats() {
        const weeklySummary = this.timeTracker.getWeeklySummary();
        const dailySummary = this.timeTracker.getDailySummary();
        
        let statsHTML = `
            <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-lg">Time Tracking Stats</h3>
                        <button id="closeStats" class="text-gray-400 hover:text-gray-600">
                            <i data-feather="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="text-center p-4 bg-indigo-50 rounded-lg">
                            <div class="text-2xl font-bold text-indigo-900">${dailySummary.formattedTotal}</div>
                            <div class="text-sm text-indigo-700">Today's Total</div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <div class="font-bold text-gray-900">${weeklySummary.formattedTotal}</div>
                                <div class="text-xs text-gray-600">This Week</div>
                            </div>
                            <div class="text-center p-3 bg-gray-50 rounded-lg">
                                <div class="font-bold text-gray-900">${dailySummary.sessionCount}</div>
                                <div class="text-xs text-gray-600">Sessions Today</div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="font-medium mb-2">Weekly Breakdown</h4>
                            <div class="space-y-2">
        `;

        weeklySummary.dailySummaries.forEach(day => {
            const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
            const barWidth = weeklySummary.totalDuration > 0 
                ? (day.totalDuration / weeklySummary.totalDuration) * 100 
                : 0;
                
            statsHTML += `
                <div class="flex items-center justify-between text-sm">
                    <span class="w-8">${dayName}</span>
                    <div class="flex-1 mx-2">
                        <div class="bg-gray-200 rounded-full h-2">
                            <div class="bg-indigo-500 h-2 rounded-full" style="width: ${barWidth}%"></div>
                        </div>
                    </div>
                    <span class="w-16 text-right text-xs text-gray-600">${day.formattedTotal}</span>
                </div>
            `;
        });

        statsHTML += `
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.innerHTML = statsHTML;
        document.body.appendChild(modal);

        // Close button
        const closeBtn = modal.querySelector('#closeStats');
        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal.firstElementChild?.parentElement) {
                document.body.removeChild(modal);
            }
        });

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    showSessionComplete(session) {
        const formattedDuration = this.timeTracker.formatDuration(session.duration);
        
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        toast.innerHTML = `
            <div class="flex items-center space-x-3">
                <i data-feather="check-circle" class="w-5 h-5"></i>
                <div>
                    <div class="font-medium">Session Complete!</div>
                    <div class="text-sm opacity-90">${session.taskName} • ${formattedDuration}</div>
                </div>
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

        // Remove after 5 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    destroy() {
        this.stopUpdateLoop();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeTrackerWidget;
} else {
    window.TimeTrackerWidget = TimeTrackerWidget;
}