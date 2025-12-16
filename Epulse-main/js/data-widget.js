/**
 * Data Management Widget for EngineerPulse
 * Provides UI for export/import functionality
 */

class DataWidget {
    constructor(container, dataManager) {
        this.container = container;
        this.dataManager = dataManager;
        this.isVisible = false;
        this.currentView = 'export';
        this.exportProgress = null;
        this.importProgress = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Listen to data manager events
        this.dataManager.on('onExportComplete', (data) => {
            this.handleExportComplete(data);
        });

        this.dataManager.on('onExportError', (error) => {
            this.handleExportError(error);
        });

        this.dataManager.on('onImportComplete', (data) => {
            this.handleImportComplete(data);
        });

        this.dataManager.on('onImportError', (error) => {
            this.handleImportError(error);
        });

        this.dataManager.on('onFileDropped', (data) => {
            this.handleFileDropped(data);
        });
    }

    render() {
        this.container.innerHTML = `
            <div class="data-widget bg-white rounded-lg shadow-sm">
                <div class="border-b border-gray-200">
                    <div class="flex items-center justify-between p-4">
                        <div class="flex items-center space-x-2">
                            <i data-feather="database" class="w-5 h-5 text-indigo-600"></i>
                            <h3 class="text-lg font-semibold text-gray-900">Data Management</h3>
                        </div>
                        <button class="toggle-widget-btn text-gray-400 hover:text-gray-600 transition-colors duration-200">
                            <i data-feather="chevron-${this.isVisible ? 'up' : 'down'}" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                
                <div class="widget-content ${this.isVisible ? '' : 'hidden'}">
                    ${this.renderTabs()}
                    ${this.renderContent()}
                </div>
            </div>
        `;

        this.attachEventHandlers();
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderTabs() {
        return `
            <div class="border-b border-gray-200">
                <nav class="flex space-x-8 px-4" aria-label="Tabs">
                    <button class="tab-btn py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        this.currentView === 'export' 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }" data-tab="export">
                        <div class="flex items-center space-x-2">
                            <i data-feather="download" class="w-4 h-4"></i>
                            <span>Export Data</span>
                        </div>
                    </button>
                    <button class="tab-btn py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        this.currentView === 'import' 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }" data-tab="import">
                        <div class="flex items-center space-x-2">
                            <i data-feather="upload" class="w-4 h-4"></i>
                            <span>Import Data</span>
                        </div>
                    </button>
                    <button class="tab-btn py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        this.currentView === 'backup' 
                            ? 'border-indigo-500 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }" data-tab="backup">
                        <div class="flex items-center space-x-2">
                            <i data-feather="shield" class="w-4 h-4"></i>
                            <span>Auto Backup</span>
                        </div>
                    </button>
                </nav>
            </div>
        `;
    }

    renderContent() {
        switch (this.currentView) {
            case 'export':
                return this.renderExportView();
            case 'import':
                return this.renderImportView();
            case 'backup':
                return this.renderBackupView();
            default:
                return this.renderExportView();
        }
    }

    renderExportView() {
        const dataTypes = this.dataManager.getDataTypes();
        const supportedFormats = this.dataManager.getSupportedFormats();

        return `
            <div class="p-6 space-y-6">
                <div class="export-section">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Select Data to Export</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${Object.entries(dataTypes).map(([key, label]) => `
                            <label class="export-option flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                                <input type="checkbox" class="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                       value="${key}" ${key === 'all' ? 'checked' : ''}>
                                <div class="flex-1">
                                    <div class="text-sm font-medium text-gray-900">${label}</div>
                                    <div class="text-xs text-gray-500">${this.getDataTypeDescription(key)}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="format-section">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Export Format</h4>
                    <div class="flex space-x-4">
                        ${supportedFormats.map(format => `
                            <label class="format-option flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="exportFormat" value="${format}" 
                                       class="text-indigo-600 focus:ring-indigo-500" ${format === 'json' ? 'checked' : ''}>
                                <span class="text-sm text-gray-700">${format.toUpperCase()}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="options-section">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Export Options</h4>
                    <div class="space-y-2">
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" class="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                   id="includeMetadata" checked>
                            <span class="text-sm text-gray-700">Include export metadata</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" class="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                   id="anonymizeData">
                            <span class="text-sm text-gray-700">Anonymize sensitive data</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" class="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                   id="compressExport">
                            <span class="text-sm text-gray-700">Compress export file</span>
                        </label>
                    </div>
                </div>

                <div class="preview-section">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="text-sm font-medium text-gray-900">Export Preview</h4>
                        <button class="preview-btn text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                            <i data-feather="eye" class="w-4 h-4 mr-1"></i>
                            Preview Data
                        </button>
                    </div>
                    <div class="preview-container hidden bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre class="text-xs text-gray-800 whitespace-pre-wrap"></pre>
                    </div>
                </div>

                <div class="export-actions">
                    <div class="flex items-center justify-between">
                        <div class="export-info text-sm text-gray-600">
                            <span class="estimated-size">Estimated size: calculating...</span>
                        </div>
                        <div class="flex space-x-3">
                            <button class="schedule-export-btn btn btn-outline">
                                <i data-feather="clock" class="w-4 h-4 mr-2"></i>
                                Schedule Export
                            </button>
                            <button class="start-export-btn btn btn-primary">
                                <i data-feather="download" class="w-4 h-4 mr-2"></i>
                                Export Now
                            </button>
                        </div>
                    </div>
                </div>

                <div class="export-progress hidden">
                    <div class="bg-gray-200 rounded-full h-2 mb-2">
                        <div class="progress-bar bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span class="progress-text">Preparing export...</span>
                        <span class="progress-percentage">0%</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderImportView() {
        return `
            <div class="p-6 space-y-6">
                <div class="import-drop-zone border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors duration-200">
                    <div class="space-y-4">
                        <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <i data-feather="upload-cloud" class="w-8 h-8 text-gray-400"></i>
                        </div>
                        <div>
                            <h4 class="text-lg font-medium text-gray-900 mb-2">Import Your Data</h4>
                            <p class="text-sm text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
                            <input type="file" class="file-input hidden" accept=".json,.csv,.xlsx,.xls" multiple>
                            <button class="browse-files-btn btn btn-outline">
                                <i data-feather="folder" class="w-4 h-4 mr-2"></i>
                                Choose Files
                            </button>
                        </div>
                        <div class="text-xs text-gray-500">
                            Supported formats: JSON, CSV, XLSX<br>
                            Maximum file size: 50MB
                        </div>
                    </div>
                </div>

                <div class="import-options">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Import Options</h4>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Merge Strategy</label>
                            <select class="merge-strategy-select form-input">
                                <option value="replace">Replace existing data</option>
                                <option value="update">Update existing, add new</option>
                                <option value="skip">Skip existing, add new only</option>
                            </select>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" class="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                   id="validateImport" checked>
                            <label for="validateImport" class="text-sm text-gray-700">Validate data before import</label>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" class="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                   id="backupBeforeImport" checked>
                            <label for="backupBeforeImport" class="text-sm text-gray-700">Create backup before import</label>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" class="text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" 
                                   id="dryRunImport">
                            <label for="dryRunImport" class="text-sm text-gray-700">Dry run (preview changes only)</label>
                        </div>
                    </div>
                </div>

                <div class="import-preview hidden">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Import Preview</h4>
                    <div class="preview-stats bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div class="text-lg font-semibold text-green-600 new-items">0</div>
                                <div class="text-xs text-gray-600">New Items</div>
                            </div>
                            <div>
                                <div class="text-lg font-semibold text-blue-600 updated-items">0</div>
                                <div class="text-xs text-gray-600">Updates</div>
                            </div>
                            <div>
                                <div class="text-lg font-semibold text-yellow-600 skipped-items">0</div>
                                <div class="text-xs text-gray-600">Skipped</div>
                            </div>
                            <div>
                                <div class="text-lg font-semibold text-red-600 error-items">0</div>
                                <div class="text-xs text-gray-600">Errors</div>
                            </div>
                        </div>
                    </div>
                    <div class="preview-details max-h-48 overflow-y-auto bg-white border border-gray-200 rounded p-3">
                        <div class="preview-content text-sm text-gray-800"></div>
                    </div>
                </div>

                <div class="import-progress hidden">
                    <div class="bg-gray-200 rounded-full h-2 mb-2">
                        <div class="progress-bar bg-indigo-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-600">
                        <span class="progress-text">Processing import...</span>
                        <span class="progress-percentage">0%</span>
                    </div>
                </div>

                <div class="import-actions">
                    <div class="flex justify-end space-x-3">
                        <button class="cancel-import-btn btn btn-outline hidden">Cancel</button>
                        <button class="start-import-btn btn btn-primary hidden">
                            <i data-feather="upload" class="w-4 h-4 mr-2"></i>
                            Start Import
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderBackupView() {
        return `
            <div class="p-6 space-y-6">
                <div class="backup-settings">
                    <h4 class="text-sm font-medium text-gray-900 mb-4">Automatic Backup Settings</h4>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="text-sm font-medium text-gray-700">Enable Auto Backup</label>
                                <p class="text-xs text-gray-500">Automatically export data on a schedule</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" class="auto-backup-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="backup-frequency">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                            <select class="backup-frequency-select form-input">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="custom">Custom Interval</option>
                            </select>
                        </div>
                        
                        <div class="backup-time">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Backup Time</label>
                            <input type="time" class="backup-time-input form-input" value="02:00">
                        </div>
                        
                        <div class="backup-location">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Backup Location</label>
                            <select class="backup-location-select form-input">
                                <option value="local">Local Downloads</option>
                                <option value="cloud" disabled>Cloud Storage (Coming Soon)</option>
                                <option value="email" disabled>Email (Coming Soon)</option>
                            </select>
                        </div>
                        
                        <div class="retention-policy">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Keep Backups For</label>
                            <select class="retention-select form-input">
                                <option value="7">7 Days</option>
                                <option value="30">30 Days</option>
                                <option value="90">90 Days</option>
                                <option value="365">1 Year</option>
                                <option value="-1">Forever</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="backup-history">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-sm font-medium text-gray-900">Backup History</h4>
                        <button class="manual-backup-btn btn btn-outline btn-sm">
                            <i data-feather="save" class="w-4 h-4 mr-2"></i>
                            Create Backup Now
                        </button>
                    </div>
                    <div class="backup-list space-y-2 max-h-64 overflow-y-auto">
                        ${this.renderBackupHistory()}
                    </div>
                </div>

                <div class="backup-status">
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-start space-x-3">
                            <i data-feather="info" class="w-5 h-5 text-blue-500 mt-0.5"></i>
                            <div>
                                <h5 class="text-sm font-medium text-blue-900">Backup Status</h5>
                                <p class="text-sm text-blue-700 mt-1">
                                    <span class="backup-status-text">Last backup: Never</span><br>
                                    <span class="next-backup-text">Next backup: Not scheduled</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBackupHistory() {
        // This would fetch actual backup history from localStorage or server
        const backups = [
            { date: '2024-12-19T10:30:00Z', size: '2.4 MB', status: 'success', type: 'automatic' },
            { date: '2024-12-18T10:30:00Z', size: '2.3 MB', status: 'success', type: 'automatic' },
            { date: '2024-12-17T14:15:00Z', size: '2.1 MB', status: 'success', type: 'manual' }
        ];

        if (backups.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <i data-feather="archive" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    <p class="text-sm">No backups yet</p>
                </div>
            `;
        }

        return backups.map(backup => `
            <div class="backup-item flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full ${backup.status === 'success' ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center">
                        <i data-feather="${backup.status === 'success' ? 'check' : 'x'}" class="w-4 h-4 ${backup.status === 'success' ? 'text-green-600' : 'text-red-600'}"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">
                            ${new Date(backup.date).toLocaleDateString()} ${new Date(backup.date).toLocaleTimeString()}
                        </div>
                        <div class="text-xs text-gray-500">
                            ${backup.size} • ${backup.type} backup
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button class="download-backup-btn text-sm text-indigo-600 hover:text-indigo-800">
                        <i data-feather="download" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-backup-btn text-sm text-red-600 hover:text-red-800">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    attachEventHandlers() {
        // Widget toggle
        const toggleBtn = this.container.querySelector('.toggle-widget-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleWidget();
            });
        }

        // Tab switching
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Export functionality
        this.attachExportHandlers();
        
        // Import functionality
        this.attachImportHandlers();
        
        // Backup functionality
        this.attachBackupHandlers();
    }

    attachExportHandlers() {
        // Preview button
        const previewBtn = this.container.querySelector('.preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.showExportPreview();
            });
        }

        // Export button
        const exportBtn = this.container.querySelector('.start-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.startExport();
            });
        }

        // Data type selection changes
        this.container.querySelectorAll('.export-option input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateExportEstimate();
            });
        });

        // Format selection changes
        this.container.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateExportEstimate();
            });
        });

        // Schedule export button
        const scheduleBtn = this.container.querySelector('.schedule-export-btn');
        if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
                this.showScheduleModal();
            });
        }
    }

    attachImportHandlers() {
        // File input and drop zone
        const dropZone = this.container.querySelector('.import-drop-zone');
        const fileInput = this.container.querySelector('.file-input');
        const browseBtn = this.container.querySelector('.browse-files-btn');

        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(Array.from(e.target.files));
            });
        }

        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-indigo-400', 'bg-indigo-50');
            });

            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-indigo-400', 'bg-indigo-50');
                this.handleFiles(Array.from(e.dataTransfer.files));
            });
        }

        // Import button
        const importBtn = this.container.querySelector('.start-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.startImport();
            });
        }
    }

    attachBackupHandlers() {
        // Auto backup toggle
        const autoBackupToggle = this.container.querySelector('.auto-backup-toggle');
        if (autoBackupToggle) {
            autoBackupToggle.addEventListener('change', (e) => {
                this.toggleAutoBackup(e.target.checked);
            });
        }

        // Manual backup button
        const manualBackupBtn = this.container.querySelector('.manual-backup-btn');
        if (manualBackupBtn) {
            manualBackupBtn.addEventListener('click', () => {
                this.createManualBackup();
            });
        }

        // Backup settings changes
        ['backup-frequency-select', 'backup-time-input', 'backup-location-select', 'retention-select'].forEach(className => {
            const element = this.container.querySelector(`.${className}`);
            if (element) {
                element.addEventListener('change', () => {
                    this.saveBackupSettings();
                });
            }
        });
    }

    // Widget Methods
    toggleWidget() {
        this.isVisible = !this.isVisible;
        const content = this.container.querySelector('.widget-content');
        const icon = this.container.querySelector('.toggle-widget-btn i');
        
        if (this.isVisible) {
            content.classList.remove('hidden');
            icon.setAttribute('data-feather', 'chevron-up');
        } else {
            content.classList.add('hidden');
            icon.setAttribute('data-feather', 'chevron-down');
        }
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    switchTab(tab) {
        this.currentView = tab;
        this.render();
    }

    // Export Methods
    async showExportPreview() {
        const selectedTypes = this.getSelectedDataTypes();
        const previewContainer = this.container.querySelector('.preview-container');
        const previewContent = previewContainer.querySelector('pre');
        
        try {
            previewContainer.classList.remove('hidden');
            previewContent.textContent = 'Loading preview...';
            
            const data = await this.dataManager.getExportPreview(selectedTypes[0] || 'all');
            const preview = JSON.stringify(data, null, 2);
            
            // Limit preview size
            const maxLength = 2000;
            if (preview.length > maxLength) {
                previewContent.textContent = preview.substring(0, maxLength) + '\n... (truncated)';
            } else {
                previewContent.textContent = preview;
            }
        } catch (error) {
            previewContent.textContent = `Error generating preview: ${error.message}`;
        }
    }

    async startExport() {
        const selectedTypes = this.getSelectedDataTypes();
        const format = this.getSelectedFormat();
        const options = this.getExportOptions();
        
        if (selectedTypes.length === 0) {
            this.showNotification('Please select at least one data type to export', 'error');
            return;
        }
        
        const exportBtn = this.container.querySelector('.start-export-btn');
        const progressContainer = this.container.querySelector('.export-progress');
        
        try {
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i>Exporting...';
            progressContainer.classList.remove('hidden');
            
            this.updateExportProgress(0, 'Preparing export...');
            
            for (let i = 0; i < selectedTypes.length; i++) {
                const dataType = selectedTypes[i];
                this.updateExportProgress((i / selectedTypes.length) * 90, `Exporting ${dataType}...`);
                
                await this.dataManager.exportData(dataType, format, options);
                
                // Small delay for UI feedback
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            this.updateExportProgress(100, 'Export complete!');
            
        } catch (error) {
            this.handleExportError({ error });
        } finally {
            setTimeout(() => {
                exportBtn.disabled = false;
                exportBtn.innerHTML = '<i data-feather="download" class="w-4 h-4 mr-2"></i>Export Now';
                progressContainer.classList.add('hidden');
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }, 2000);
        }
    }

    updateExportProgress(percentage, text) {
        const progressBar = this.container.querySelector('.export-progress .progress-bar');
        const progressText = this.container.querySelector('.export-progress .progress-text');
        const progressPercentage = this.container.querySelector('.export-progress .progress-percentage');
        
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = text;
        if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
    }

    updateExportEstimate() {
        // This would calculate estimated file size based on selected data types
        const sizeElement = this.container.querySelector('.estimated-size');
        if (sizeElement) {
            const selectedTypes = this.getSelectedDataTypes();
            const format = this.getSelectedFormat();
            
            // Rough estimation logic
            let estimatedKB = 0;
            selectedTypes.forEach(type => {
                switch (type) {
                    case 'tasks': estimatedKB += 50; break;
                    case 'timeTracking': estimatedKB += 100; break;
                    case 'goals': estimatedKB += 25; break;
                    case 'collaboration': estimatedKB += 75; break;
                    case 'charts': estimatedKB += 150; break;
                    case 'settings': estimatedKB += 10; break;
                    case 'all': estimatedKB = 500; break;
                }
            });
            
            // Format multiplier
            if (format === 'csv') estimatedKB *= 0.7;
            if (format === 'xlsx') estimatedKB *= 1.2;
            
            const sizeText = estimatedKB < 1024 ? 
                `${Math.round(estimatedKB)} KB` : 
                `${(estimatedKB / 1024).toFixed(1)} MB`;
                
            sizeElement.textContent = `Estimated size: ${sizeText}`;
        }
    }

    // Import Methods
    handleFiles(files) {
        const validFiles = files.filter(file => 
            this.dataManager.validateImportFile(file).valid
        );
        
        if (validFiles.length === 0) {
            this.showNotification('No valid files selected', 'error');
            return;
        }
        
        // Show import preview
        this.showImportPreview(validFiles[0]); // Handle first file for now
        
        // Show import button
        const importBtn = this.container.querySelector('.start-import-btn');
        if (importBtn) {
            importBtn.classList.remove('hidden');
        }
        
        this.selectedImportFile = validFiles[0];
    }

    async showImportPreview(file) {
        const previewContainer = this.container.querySelector('.import-preview');
        
        try {
            previewContainer.classList.remove('hidden');
            
            // Read and validate file
            const fileData = await this.dataManager.readImportFile(file);
            
            // Show preview stats
            this.updateImportStats({
                newItems: Object.keys(fileData).length,
                updatedItems: 0,
                skippedItems: 0,
                errorItems: 0
            });
            
            // Show preview content
            const previewContent = this.container.querySelector('.preview-content');
            if (previewContent) {
                const preview = JSON.stringify(fileData, null, 2);
                const maxLength = 1000;
                previewContent.textContent = preview.length > maxLength ? 
                    preview.substring(0, maxLength) + '\n... (truncated)' : 
                    preview;
            }
            
        } catch (error) {
            this.showNotification(`Error reading file: ${error.message}`, 'error');
        }
    }

    async startImport() {
        if (!this.selectedImportFile) {
            this.showNotification('No file selected for import', 'error');
            return;
        }
        
        const options = this.getImportOptions();
        const importBtn = this.container.querySelector('.start-import-btn');
        const progressContainer = this.container.querySelector('.import-progress');
        
        try {
            importBtn.disabled = true;
            importBtn.innerHTML = '<i data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i>Importing...';
            progressContainer.classList.remove('hidden');
            
            this.updateImportProgress(0, 'Starting import...');
            
            // Create backup if requested
            if (options.backupBeforeImport) {
                this.updateImportProgress(20, 'Creating backup...');
                await this.dataManager.exportData('all', 'json', { 
                    includeMetadata: true 
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            this.updateImportProgress(50, 'Processing import...');
            const result = await this.dataManager.importData(this.selectedImportFile, options);
            
            this.updateImportProgress(100, 'Import complete!');
            this.updateImportStats(result);
            
            this.showNotification(
                `Import successful! ${result.imported} new items, ${result.updated} updated`, 
                'success'
            );
            
        } catch (error) {
            this.handleImportError({ error });
        } finally {
            setTimeout(() => {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i data-feather="upload" class="w-4 h-4 mr-2"></i>Start Import';
                progressContainer.classList.add('hidden');
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }, 2000);
        }
    }

    updateImportProgress(percentage, text) {
        const progressBar = this.container.querySelector('.import-progress .progress-bar');
        const progressText = this.container.querySelector('.import-progress .progress-text');
        const progressPercentage = this.container.querySelector('.import-progress .progress-percentage');
        
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = text;
        if (progressPercentage) progressPercentage.textContent = `${Math.round(percentage)}%`;
    }

    updateImportStats(stats) {
        const { newItems = 0, updatedItems = 0, skippedItems = 0, errorItems = 0 } = stats;
        
        const newElement = this.container.querySelector('.new-items');
        const updatedElement = this.container.querySelector('.updated-items');
        const skippedElement = this.container.querySelector('.skipped-items');
        const errorElement = this.container.querySelector('.error-items');
        
        if (newElement) newElement.textContent = newItems;
        if (updatedElement) updatedElement.textContent = updatedItems;
        if (skippedElement) skippedElement.textContent = skippedItems;
        if (errorElement) errorElement.textContent = errorItems;
    }

    // Backup Methods
    toggleAutoBackup(enabled) {
        localStorage.setItem('autoBackupEnabled', enabled.toString());
        
        if (enabled) {
            this.scheduleNextBackup();
            this.showNotification('Auto backup enabled', 'success');
        } else {
            this.cancelScheduledBackup();
            this.showNotification('Auto backup disabled', 'info');
        }
        
        this.updateBackupStatus();
    }

    async createManualBackup() {
        const btn = this.container.querySelector('.manual-backup-btn');
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i data-feather="loader" class="w-4 h-4 mr-2 animate-spin"></i>Creating...';
            
            await this.dataManager.exportData('all', 'json', {
                includeMetadata: true
            });
            
            this.showNotification('Backup created successfully', 'success');
            this.render(); // Refresh to show new backup in history
            
        } catch (error) {
            this.showNotification(`Backup failed: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i data-feather="save" class="w-4 h-4 mr-2"></i>Create Backup Now';
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    }

    saveBackupSettings() {
        const settings = {
            frequency: this.container.querySelector('.backup-frequency-select')?.value,
            time: this.container.querySelector('.backup-time-input')?.value,
            location: this.container.querySelector('.backup-location-select')?.value,
            retention: this.container.querySelector('.retention-select')?.value
        };
        
        localStorage.setItem('backupSettings', JSON.stringify(settings));
        this.scheduleNextBackup();
        this.updateBackupStatus();
    }

    scheduleNextBackup() {
        // This would integrate with a scheduler in a real implementation
        console.log('Scheduling next backup...');
    }

    cancelScheduledBackup() {
        // Cancel any scheduled backup
        console.log('Canceling scheduled backup...');
    }

    updateBackupStatus() {
        const statusText = this.container.querySelector('.backup-status-text');
        const nextText = this.container.querySelector('.next-backup-text');
        
        if (statusText) {
            statusText.textContent = 'Last backup: Today at 2:30 AM';
        }
        
        if (nextText) {
            const enabled = localStorage.getItem('autoBackupEnabled') === 'true';
            nextText.textContent = enabled ? 
                'Next backup: Tomorrow at 2:00 AM' : 
                'Next backup: Not scheduled';
        }
    }

    // Helper Methods
    getSelectedDataTypes() {
        const checkboxes = this.container.querySelectorAll('.export-option input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    getSelectedFormat() {
        const radio = this.container.querySelector('input[name="exportFormat"]:checked');
        return radio ? radio.value : 'json';
    }

    getExportOptions() {
        return {
            includeMetadata: this.container.querySelector('#includeMetadata')?.checked ?? true,
            anonymize: this.container.querySelector('#anonymizeData')?.checked ?? false,
            compress: this.container.querySelector('#compressExport')?.checked ?? false
        };
    }

    getImportOptions() {
        return {
            mergeStrategy: this.container.querySelector('.merge-strategy-select')?.value ?? 'replace',
            validateData: this.container.querySelector('#validateImport')?.checked ?? true,
            backupBeforeImport: this.container.querySelector('#backupBeforeImport')?.checked ?? true,
            dryRun: this.container.querySelector('#dryRunImport')?.checked ?? false
        };
    }

    getDataTypeDescription(type) {
        const descriptions = {
            tasks: 'Task data, projects, and Kanban board state',
            timeTracking: 'Time tracking sessions and statistics',
            goals: 'Goals, milestones, and progress tracking',
            collaboration: 'Comments, notifications, and team activity',
            charts: 'Chart data, metrics, and visualizations',
            settings: 'User preferences and configuration',
            all: 'Complete data export with metadata'
        };
        return descriptions[type] || 'Data export';
    }

    // Event Handlers
    handleExportComplete(data) {
        this.showNotification(
            `Export completed: ${data.filename} (${this.formatFileSize(data.size)})`, 
            'success'
        );
    }

    handleExportError(error) {
        this.showNotification(`Export failed: ${error.error.message}`, 'error');
        console.error('Export error:', error);
    }

    handleImportComplete(data) {
        this.showNotification(
            `Import completed: ${data.result.imported} items imported`, 
            'success'
        );
    }

    handleImportError(error) {
        this.showNotification(`Import failed: ${error.error.message}`, 'error');
        console.error('Import error:', error);
    }

    handleFileDropped(data) {
        this.handleFiles([data.file]);
    }

    // Utility Methods
    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transform transition-transform duration-300 translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'info' ? 'bg-blue-500 text-white' :
            'bg-gray-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-feather="${
                    type === 'success' ? 'check-circle' :
                    type === 'error' ? 'alert-circle' :
                    type === 'info' ? 'info' : 'bell'
                }" class="w-5 h-5"></i>
                <span class="text-sm">${message}</span>
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
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    showScheduleModal() {
        // This would show a modal for scheduling exports
        this.showNotification('Scheduled export feature coming soon!', 'info');
    }

    show() {
        this.isVisible = true;
        this.render();
    }

    hide() {
        this.isVisible = false;
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataWidget;
} else {
    window.DataWidget = DataWidget;
}