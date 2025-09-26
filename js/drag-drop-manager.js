/**
 * Drag and Drop Manager for EngineerPulse
 * Handles drag-and-drop functionality for Kanban boards and task management
 */

class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.draggedData = null;
        this.dropZones = new Map();
        this.dragPreview = null;
        this.isDragging = false;
        this.listeners = {};
        this.config = {
            dragClass: 'dragging',
            dragOverClass: 'drag-over',
            dropZoneClass: 'drop-zone',
            dragPreviewClass: 'drag-preview',
            animationDuration: 300,
            snapBackDuration: 200,
            enableAutoScroll: true,
            scrollSpeed: 5,
            scrollMargin: 50
        };
        
        this.init();
    }

    init() {
        this.setupGlobalEventListeners();
        this.setupTouchEvents();
        this.initializeKanbanBoard();
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

    // Kanban Board Initialization
    initializeKanbanBoard() {
        this.initializeDraggableCards();
        this.initializeDropZones();
        this.setupKeyboardNavigation();
    }

    initializeDraggableCards() {
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            this.makeDraggable(card, {
                type: 'task',
                data: {
                    id: card.dataset.taskId,
                    name: card.dataset.taskName,
                    element: card
                },
                onDragStart: (data) => {
                    this.emit('onTaskDragStart', data);
                },
                onDragEnd: (data, success) => {
                    this.emit('onTaskDragEnd', { ...data, success });
                }
            });
        });
    }

    initializeDropZones() {
        const kanbanColumns = document.querySelectorAll('.kanban-column');
        
        kanbanColumns.forEach(column => {
            const columnBody = column.querySelector('.bg-white');
            if (columnBody) {
                this.makeDropZone(columnBody, {
                    type: 'kanban-column',
                    accepts: ['task'],
                    data: {
                        status: this.getColumnStatus(column),
                        element: column
                    },
                    onDrop: (dragData, dropData) => {
                        this.handleTaskDrop(dragData, dropData);
                    },
                    onDragOver: (dragData, dropData) => {
                        this.handleDragOver(dragData, dropData);
                    }
                });
            }
        });
    }

    // Draggable Implementation
    makeDraggable(element, options = {}) {
        const {
            type = 'generic',
            data = {},
            handle = null,
            onDragStart = null,
            onDragEnd = null,
            disabled = false
        } = options;

        if (disabled) return;

        // Set draggable attribute
        element.setAttribute('draggable', 'true');
        element.classList.add('draggable-item');

        // Store drag data
        element._dragData = {
            type,
            data,
            onDragStart,
            onDragEnd
        };

        // Add drag event listeners
        element.addEventListener('dragstart', (e) => {
            this.handleDragStart(e, element);
        });

        element.addEventListener('dragend', (e) => {
            this.handleDragEnd(e, element);
        });

        // Add visual feedback
        element.addEventListener('mousedown', (e) => {
            if (handle && !e.target.closest(handle)) return;
            element.style.cursor = 'grabbing';
        });

        element.addEventListener('mouseup', () => {
            element.style.cursor = '';
        });

        // Add keyboard support
        element.setAttribute('tabindex', '0');
        element.addEventListener('keydown', (e) => {
            this.handleKeyboardDrag(e, element);
        });
    }

    // Drop Zone Implementation
    makeDropZone(element, options = {}) {
        const {
            type = 'generic',
            accepts = [],
            data = {},
            onDrop = null,
            onDragOver = null,
            onDragEnter = null,
            onDragLeave = null
        } = options;

        element.classList.add(this.config.dropZoneClass);

        // Store drop zone data
        const dropZoneId = this.generateId();
        this.dropZones.set(dropZoneId, {
            element,
            type,
            accepts,
            data,
            onDrop,
            onDragOver,
            onDragEnter,
            onDragLeave
        });

        element._dropZoneId = dropZoneId;

        // Add drop event listeners
        element.addEventListener('dragover', (e) => {
            this.handleDragOver(e, element, dropZoneId);
        });

        element.addEventListener('dragenter', (e) => {
            this.handleDragEnter(e, element, dropZoneId);
        });

        element.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e, element, dropZoneId);
        });

        element.addEventListener('drop', (e) => {
            this.handleDrop(e, element, dropZoneId);
        });
    }

    // Drag Event Handlers
    handleDragStart(e, element) {
        this.isDragging = true;
        this.draggedElement = element;
        this.draggedData = element._dragData;

        // Add dragging class
        element.classList.add(this.config.dragClass);

        // Create drag preview
        this.createDragPreview(element);

        // Set drag effect
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', element.outerHTML);

        // Custom drag image
        if (this.dragPreview) {
            e.dataTransfer.setDragImage(this.dragPreview, 0, 0);
        }

        // Emit drag start event
        if (this.draggedData.onDragStart) {
            this.draggedData.onDragStart(this.draggedData);
        }

        // Add visual feedback to valid drop zones
        this.highlightValidDropZones();

        // Start auto-scroll if enabled
        if (this.config.enableAutoScroll) {
            this.startAutoScroll();
        }

        this.emit('onDragStart', {
            element,
            data: this.draggedData
        });
    }

    handleDragEnd(e, element) {
        this.isDragging = false;

        // Remove dragging class
        element.classList.remove(this.config.dragClass);

        // Clean up drag preview
        this.removeDragPreview();

        // Remove drop zone highlights
        this.removeDropZoneHighlights();

        // Stop auto-scroll
        this.stopAutoScroll();

        // Determine if drop was successful
        const success = e.dataTransfer.dropEffect !== 'none';

        // Emit drag end event
        if (this.draggedData?.onDragEnd) {
            this.draggedData.onDragEnd(this.draggedData, success);
        }

        this.emit('onDragEnd', {
            element,
            data: this.draggedData,
            success
        });

        // Clean up
        this.draggedElement = null;
        this.draggedData = null;
    }

    handleDragOver(e, element, dropZoneId) {
        if (!this.canDrop(dropZoneId)) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const dropZone = this.dropZones.get(dropZoneId);
        if (dropZone?.onDragOver) {
            dropZone.onDragOver(this.draggedData, dropZone);
        }

        // Add visual feedback
        if (!element.classList.contains(this.config.dragOverClass)) {
            element.classList.add(this.config.dragOverClass);
        }

        // Insert placeholder if needed
        this.insertPlaceholder(element, e);
    }

    handleDragEnter(e, element, dropZoneId) {
        if (!this.canDrop(dropZoneId)) return;

        const dropZone = this.dropZones.get(dropZoneId);
        if (dropZone?.onDragEnter) {
            dropZone.onDragEnter(this.draggedData, dropZone);
        }

        element.classList.add(this.config.dragOverClass);
    }

    handleDragLeave(e, element, dropZoneId) {
        // Only remove if really leaving the element
        if (!element.contains(e.relatedTarget)) {
            element.classList.remove(this.config.dragOverClass);
            this.removePlaceholder(element);

            const dropZone = this.dropZones.get(dropZoneId);
            if (dropZone?.onDragLeave) {
                dropZone.onDragLeave(this.draggedData, dropZone);
            }
        }
    }

    handleDrop(e, element, dropZoneId) {
        e.preventDefault();

        if (!this.canDrop(dropZoneId)) return;

        const dropZone = this.dropZones.get(dropZoneId);
        
        // Remove visual feedback
        element.classList.remove(this.config.dragOverClass);
        this.removePlaceholder(element);

        // Handle the drop
        if (dropZone?.onDrop) {
            const result = dropZone.onDrop(this.draggedData, dropZone);
            
            // If drop handler returns false, cancel the drop
            if (result === false) {
                this.animateSnapBack();
                return;
            }
        }

        // Animate the move
        this.animateMove(this.draggedElement, element);

        this.emit('onDrop', {
            dragData: this.draggedData,
            dropData: dropZone,
            element,
            event: e
        });
    }

    // Kanban Specific Handlers
    handleTaskDrop(dragData, dropData) {
        const taskId = dragData.data.id;
        const newStatus = dropData.data.status;
        const taskElement = dragData.data.element;

        // Update task status
        this.updateTaskStatus(taskId, newStatus);

        // Move task element to new column
        this.moveTaskToColumn(taskElement, dropData.data.element);

        // Emit task moved event
        this.emit('onTaskMoved', {
            taskId,
            oldStatus: this.getTaskCurrentStatus(taskElement),
            newStatus,
            taskElement
        });

        // Show success feedback
        this.showMoveNotification(taskId, newStatus);

        return true; // Allow the drop
    }

    // Utility Methods
    canDrop(dropZoneId) {
        if (!this.draggedData) return false;

        const dropZone = this.dropZones.get(dropZoneId);
        if (!dropZone) return false;

        // Check if drop zone accepts this drag type
        if (dropZone.accepts.length > 0 && !dropZone.accepts.includes(this.draggedData.type)) {
            return false;
        }

        return true;
    }

    getColumnStatus(columnElement) {
        const header = columnElement.querySelector('h3');
        if (!header) return 'unknown';

        const headerText = header.textContent.toLowerCase().trim();
        
        if (headerText.includes('backlog')) return 'backlog';
        if (headerText.includes('to do')) return 'todo';
        if (headerText.includes('progress')) return 'in-progress';
        if (headerText.includes('done')) return 'done';
        
        return 'unknown';
    }

    getTaskCurrentStatus(taskElement) {
        const column = taskElement.closest('.kanban-column');
        return column ? this.getColumnStatus(column) : 'unknown';
    }

    updateTaskStatus(taskId, newStatus) {
        // Update in local storage or data source
        // This would integrate with your task management system
        console.log(`Updating task ${taskId} to status: ${newStatus}`);
    }

    moveTaskToColumn(taskElement, targetColumn) {
        const targetBody = targetColumn.querySelector('.bg-white');
        if (targetBody) {
            // Remove from current position
            taskElement.parentNode.removeChild(taskElement);
            
            // Add to new position
            targetBody.appendChild(taskElement);
            
            // Update column counts
            this.updateColumnCounts();
        }
    }

    updateColumnCounts() {
        document.querySelectorAll('.kanban-column').forEach(column => {
            const header = column.querySelector('h3').parentElement;
            const countSpan = header.querySelector('span');
            const tasks = column.querySelectorAll('.task-card');
            
            if (countSpan) {
                countSpan.textContent = tasks.length;
            }
        });
    }

    // Visual Feedback
    createDragPreview(element) {
        this.dragPreview = element.cloneNode(true);
        this.dragPreview.classList.add(this.config.dragPreviewClass);
        this.dragPreview.style.transform = 'rotate(5deg)';
        this.dragPreview.style.opacity = '0.8';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.style.position = 'absolute';
        this.dragPreview.style.top = '-1000px';
        this.dragPreview.style.zIndex = '9999';
        
        document.body.appendChild(this.dragPreview);
    }

    removeDragPreview() {
        if (this.dragPreview) {
            document.body.removeChild(this.dragPreview);
            this.dragPreview = null;
        }
    }

    highlightValidDropZones() {
        this.dropZones.forEach((dropZone, id) => {
            if (this.canDrop(id)) {
                dropZone.element.classList.add('valid-drop-zone');
            }
        });
    }

    removeDropZoneHighlights() {
        this.dropZones.forEach((dropZone) => {
            dropZone.element.classList.remove('valid-drop-zone', this.config.dragOverClass);
        });
    }

    insertPlaceholder(dropZone, e) {
        if (dropZone.querySelector('.drag-placeholder')) return;

        const placeholder = document.createElement('div');
        placeholder.className = 'drag-placeholder';
        placeholder.innerHTML = `
            <div class="border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-lg p-4 mb-3">
                <div class="text-center text-indigo-600 text-sm">
                    <i data-feather="move" class="w-4 h-4 mx-auto mb-1"></i>
                    Drop task here
                </div>
            </div>
        `;

        // Find the best insertion point
        const tasks = Array.from(dropZone.querySelectorAll('.task-card:not(.dragging)'));
        const mouseY = e.clientY;
        
        let insertBefore = null;
        for (const task of tasks) {
            const rect = task.getBoundingClientRect();
            if (mouseY < rect.top + rect.height / 2) {
                insertBefore = task;
                break;
            }
        }

        if (insertBefore) {
            dropZone.insertBefore(placeholder, insertBefore);
        } else {
            dropZone.appendChild(placeholder);
        }

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    removePlaceholder(dropZone) {
        const placeholder = dropZone.querySelector('.drag-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    }

    // Animations
    animateMove(element, targetContainer) {
        const startRect = element.getBoundingClientRect();
        
        // Temporarily position element to get end position
        const tempPlaceholder = document.createElement('div');
        tempPlaceholder.style.visibility = 'hidden';
        targetContainer.appendChild(tempPlaceholder);
        const endRect = tempPlaceholder.getBoundingClientRect();
        tempPlaceholder.remove();

        // Calculate movement
        const deltaX = endRect.left - startRect.left;
        const deltaY = endRect.top - startRect.top;

        // Animate
        element.style.transition = `transform ${this.config.animationDuration}ms ease-out`;
        element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        setTimeout(() => {
            element.style.transition = '';
            element.style.transform = '';
        }, this.config.animationDuration);
    }

    animateSnapBack() {
        if (!this.draggedElement) return;

        this.draggedElement.style.transition = `transform ${this.config.snapBackDuration}ms ease-out`;
        this.draggedElement.style.transform = 'scale(1.1)';

        setTimeout(() => {
            this.draggedElement.style.transform = '';
            setTimeout(() => {
                this.draggedElement.style.transition = '';
            }, this.config.snapBackDuration);
        }, 100);
    }

    // Auto Scroll
    startAutoScroll() {
        this.autoScrollInterval = setInterval(() => {
            if (!this.isDragging) return;

            const mouseY = this.lastMouseY || 0;
            const windowHeight = window.innerHeight;
            const scrollMargin = this.config.scrollMargin;

            if (mouseY < scrollMargin) {
                window.scrollBy(0, -this.config.scrollSpeed);
            } else if (mouseY > windowHeight - scrollMargin) {
                window.scrollBy(0, this.config.scrollSpeed);
            }
        }, 16); // 60fps
    }

    stopAutoScroll() {
        if (this.autoScrollInterval) {
            clearInterval(this.autoScrollInterval);
            this.autoScrollInterval = null;
        }
    }

    // Touch Support
    setupTouchEvents() {
        let touchStartX, touchStartY, touchElement;

        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchElement = e.target.closest('.draggable-item');
        });

        document.addEventListener('touchmove', (e) => {
            if (!touchElement || !this.isDragging) return;

            e.preventDefault();
            const touch = e.touches[0];
            this.lastMouseY = touch.clientY;

            // Update drag preview position
            if (this.dragPreview) {
                this.dragPreview.style.left = (touch.clientX - 50) + 'px';
                this.dragPreview.style.top = (touch.clientY - 25) + 'px';
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!touchElement || !this.isDragging) return;

            const touch = e.changedTouches[0];
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const dropZone = elementBelow?.closest('.drop-zone');

            if (dropZone && dropZone._dropZoneId) {
                // Simulate drop event
                const dropEvent = new Event('drop', { bubbles: true });
                dropZone.dispatchEvent(dropEvent);
            }

            touchElement = null;
        });
    }

    // Keyboard Navigation
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const focusedElement = document.activeElement;
            if (!focusedElement?.classList.contains('draggable-item')) return;

            this.handleKeyboardDrag(e, focusedElement);
        });
    }

    handleKeyboardDrag(e, element) {
        if (!element._dragData) return;

        const currentColumn = element.closest('.kanban-column');
        if (!currentColumn) return;

        let targetColumn = null;

        switch (e.key) {
            case 'ArrowLeft':
                targetColumn = currentColumn.previousElementSibling;
                break;
            case 'ArrowRight':
                targetColumn = currentColumn.nextElementSibling;
                break;
            case 'ArrowUp':
                this.moveTaskUp(element);
                return;
            case 'ArrowDown':
                this.moveTaskDown(element);
                return;
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.showKeyboardDropOptions(element);
                return;
        }

        if (targetColumn?.classList.contains('kanban-column')) {
            e.preventDefault();
            this.moveTaskToColumnKeyboard(element, targetColumn);
        }
    }

    moveTaskUp(element) {
        const prevSibling = element.previousElementSibling;
        if (prevSibling?.classList.contains('task-card')) {
            element.parentNode.insertBefore(element, prevSibling);
            element.focus();
        }
    }

    moveTaskDown(element) {
        const nextSibling = element.nextElementSibling;
        if (nextSibling?.classList.contains('task-card')) {
            element.parentNode.insertBefore(nextSibling, element);
            element.focus();
        }
    }

    moveTaskToColumnKeyboard(element, targetColumn) {
        const targetBody = targetColumn.querySelector('.bg-white');
        if (targetBody) {
            const taskId = element.dataset.taskId;
            const newStatus = this.getColumnStatus(targetColumn);
            
            // Move element
            targetBody.appendChild(element);
            element.focus();
            
            // Update status
            this.updateTaskStatus(taskId, newStatus);
            this.updateColumnCounts();
            
            // Show notification
            this.showMoveNotification(taskId, newStatus);
            
            this.emit('onTaskMoved', {
                taskId,
                newStatus,
                method: 'keyboard'
            });
        }
    }

    showKeyboardDropOptions(element) {
        // Show modal with available drop zones
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="font-semibold mb-4">Move Task</h3>
                <div class="space-y-2">
                    <button class="keyboard-drop-option w-full text-left p-3 hover:bg-gray-100 rounded" data-status="backlog">
                        <div class="font-medium">Backlog</div>
                        <div class="text-sm text-gray-600">Move to backlog</div>
                    </button>
                    <button class="keyboard-drop-option w-full text-left p-3 hover:bg-gray-100 rounded" data-status="todo">
                        <div class="font-medium">To Do</div>
                        <div class="text-sm text-gray-600">Ready to work on</div>
                    </button>
                    <button class="keyboard-drop-option w-full text-left p-3 hover:bg-gray-100 rounded" data-status="in-progress">
                        <div class="font-medium">In Progress</div>
                        <div class="text-sm text-gray-600">Currently being worked on</div>
                    </button>
                    <button class="keyboard-drop-option w-full text-left p-3 hover:bg-gray-100 rounded" data-status="done">
                        <div class="font-medium">Done</div>
                        <div class="text-sm text-gray-600">Completed</div>
                    </button>
                </div>
                <div class="flex justify-end space-x-2 mt-4">
                    <button class="cancel-move btn btn-outline">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle option selection
        modal.querySelectorAll('.keyboard-drop-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.closest('.keyboard-drop-option').dataset.status;
                const targetColumn = this.findColumnByStatus(status);
                if (targetColumn) {
                    this.moveTaskToColumnKeyboard(element, targetColumn);
                }
                document.body.removeChild(modal);
            });
        });

        modal.querySelector('.cancel-move').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    }

    findColumnByStatus(status) {
        const columns = document.querySelectorAll('.kanban-column');
        for (const column of columns) {
            if (this.getColumnStatus(column) === status) {
                return column;
            }
        }
        return null;
    }

    // Global Event Listeners
    setupGlobalEventListeners() {
        // Track mouse position for auto-scroll
        document.addEventListener('dragover', (e) => {
            this.lastMouseY = e.clientY;
        });

        // Prevent default drag behavior on images and links
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG' || e.target.tagName === 'A') {
                if (!e.target.closest('.draggable-item')) {
                    e.preventDefault();
                }
            }
        });
    }

    // Notifications
    showMoveNotification(taskId, newStatus) {
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-y-full transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i data-feather="check" class="w-5 h-5"></i>
                <span>Task moved to ${this.formatStatus(newStatus)}</span>
            </div>
        `;

        document.body.appendChild(notification);

        if (typeof feather !== 'undefined') {
            feather.replace();
        }

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateY(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    formatStatus(status) {
        const statusMap = {
            'backlog': 'Backlog',
            'todo': 'To Do',
            'in-progress': 'In Progress',
            'done': 'Done'
        };
        return statusMap[status] || status;
    }

    // Utility
    generateId() {
        return 'dragdrop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Public API
    enableDragDrop() {
        this.initializeKanbanBoard();
    }

    disableDragDrop() {
        document.querySelectorAll('.draggable-item').forEach(element => {
            element.removeAttribute('draggable');
            element.classList.remove('draggable-item');
        });
    }

    refreshDragDrop() {
        this.disableDragDrop();
        setTimeout(() => this.enableDragDrop(), 100);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DragDropManager;
} else {
    window.DragDropManager = DragDropManager;
}