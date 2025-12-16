/**
 * Collaboration Widget for EngineerPulse
 * UI components for comments, notifications, and team interactions
 */

class CollaborationWidget {
    constructor(container, collaborationManager, entityType, entityId) {
        this.container = container;
        this.collaborationManager = collaborationManager;
        this.entityType = entityType;
        this.entityId = entityId;
        this.currentView = 'comments'; // comments, notifications, activity
        
        this.init();
        this.bindEvents();
    }

    init() {
        this.render();
        this.bindCollaborationEvents();
    }

    render() {
        this.container.innerHTML = `
            <div class="collaboration-widget">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <h3 class="font-semibold text-lg">Team Collaboration</h3>
                        <div class="flex items-center space-x-1">
                            <button id="commentsTab" class="tab-button ${this.currentView === 'comments' ? 'active' : ''}" data-view="comments">
                                <i data-feather="message-circle" class="w-4 h-4 mr-1"></i>
                                Comments
                                <span class="ml-1 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">${this.getCommentsCount()}</span>
                            </button>
                            <button id="activityTab" class="tab-button ${this.currentView === 'activity' ? 'active' : ''}" data-view="activity">
                                <i data-feather="activity" class="w-4 h-4 mr-1"></i>
                                Activity
                            </button>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button id="teamMembersBtn" class="btn btn-outline text-sm">
                            <i data-feather="users" class="w-4 h-4 mr-1"></i>
                            Team
                        </button>
                        <div class="relative">
                            <button id="notificationsBtn" class="btn btn-outline text-sm relative">
                                <i data-feather="bell" class="w-4 h-4 mr-1"></i>
                                Notifications
                                ${this.getUnreadNotificationsCount() > 0 ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">${this.getUnreadNotificationsCount()}</span>` : ''}
                            </button>
                            <div id="notificationsDropdown" class="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 hidden">
                                ${this.renderNotificationsDropdown()}
                            </div>
                        </div>
                    </div>
                </div>

                <div id="collaborationContent">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;

        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'comments':
                return this.renderCommentsView();
            case 'activity':
                return this.renderActivityView();
            default:
                return this.renderCommentsView();
        }
    }

    renderCommentsView() {
        const comments = this.collaborationManager.getComments(this.entityType, this.entityId);
        
        return `
            <div class="comments-view">
                <!-- Comment Input -->
                <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                    <div class="flex items-start space-x-3">
                        <img src="${this.collaborationManager.currentUser.avatar}" alt="${this.collaborationManager.currentUser.name}" class="w-8 h-8 rounded-full">
                        <div class="flex-1">
                            <textarea id="commentInput" class="form-input w-full resize-none" rows="3" placeholder="Add a comment... Use @username to mention team members"></textarea>
                            <div class="flex items-center justify-between mt-3">
                                <div class="flex items-center space-x-2 text-sm text-gray-500">
                                    <button id="mentionBtn" class="flex items-center hover:text-gray-700" title="Mention someone">
                                        <i data-feather="at-sign" class="w-4 h-4 mr-1"></i>
                                        Mention
                                    </button>
                                    <button id="attachBtn" class="flex items-center hover:text-gray-700" title="Attach file">
                                        <i data-feather="paperclip" class="w-4 h-4 mr-1"></i>
                                        Attach
                                    </button>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button id="cancelComment" class="btn btn-outline text-sm">Cancel</button>
                                    <button id="submitComment" class="btn btn-primary text-sm">
                                        <i data-feather="send" class="w-4 h-4 mr-1"></i>
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Comments List -->
                <div class="space-y-4">
                    ${comments.length > 0 ? comments.map(comment => this.renderComment(comment)).join('') : this.renderEmptyComments()}
                </div>

                <!-- Team Members Mention Dropdown -->
                <div id="mentionDropdown" class="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 hidden min-w-[200px]">
                    <div class="p-2">
                        <div class="text-xs font-medium text-gray-500 mb-2">Mention Team Member</div>
                        ${this.renderTeamMembersList()}
                    </div>
                </div>
            </div>
        `;
    }

    renderComment(comment, isReply = false) {
        const timeAgo = this.getTimeAgo(comment.createdAt);
        const reactions = Object.entries(comment.reactions || {});
        
        return `
            <div class="comment ${isReply ? 'ml-12' : ''}" data-comment-id="${comment.id}">
                <div class="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                    <img src="${comment.author.avatar}" alt="${comment.author.name}" class="w-8 h-8 rounded-full">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="font-medium text-gray-900">${comment.author.name}</span>
                            <span class="text-sm text-gray-500">${comment.author.role}</span>
                            <span class="text-sm text-gray-400">•</span>
                            <span class="text-sm text-gray-500">${timeAgo}</span>
                            ${comment.edited ? '<span class="text-xs text-gray-400">(edited)</span>' : ''}
                        </div>
                        
                        <div class="text-gray-800 mb-3 comment-content">
                            ${this.formatCommentContent(comment.content)}
                        </div>

                        <!-- Reactions -->
                        ${reactions.length > 0 ? `
                        <div class="flex items-center space-x-2 mb-3">
                            ${reactions.map(([emoji, users]) => `
                                <button class="reaction-btn flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full text-sm" data-emoji="${emoji}">
                                    <span>${emoji}</span>
                                    <span class="text-xs text-gray-600">${users.length}</span>
                                </button>
                            `).join('')}
                        </div>` : ''}

                        <!-- Actions -->
                        <div class="flex items-center space-x-4 text-sm">
                            <button class="reaction-toggle text-gray-500 hover:text-gray-700" data-comment-id="${comment.id}">
                                <i data-feather="smile" class="w-4 h-4 mr-1"></i>
                                React
                            </button>
                            <button class="reply-btn text-gray-500 hover:text-gray-700" data-comment-id="${comment.id}">
                                <i data-feather="corner-up-left" class="w-4 h-4 mr-1"></i>
                                Reply
                            </button>
                            ${comment.author.id === this.collaborationManager.currentUser.id ? `
                            <button class="edit-comment text-gray-500 hover:text-gray-700" data-comment-id="${comment.id}">
                                <i data-feather="edit-2" class="w-4 h-4 mr-1"></i>
                                Edit
                            </button>
                            <button class="delete-comment text-gray-500 hover:text-red-600" data-comment-id="${comment.id}">
                                <i data-feather="trash-2" class="w-4 h-4 mr-1"></i>
                                Delete
                            </button>` : ''}
                        </div>

                        <!-- Reply Form (initially hidden) -->
                        <div id="replyForm${comment.id}" class="reply-form mt-3 hidden">
                            <div class="flex items-start space-x-3">
                                <img src="${this.collaborationManager.currentUser.avatar}" alt="${this.collaborationManager.currentUser.name}" class="w-6 h-6 rounded-full">
                                <div class="flex-1">
                                    <textarea class="form-input w-full resize-none" rows="2" placeholder="Write a reply..."></textarea>
                                    <div class="flex items-center justify-end space-x-2 mt-2">
                                        <button class="cancel-reply btn btn-outline text-xs">Cancel</button>
                                        <button class="submit-reply btn btn-primary text-xs" data-parent-id="${comment.id}">Reply</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Replies -->
                ${this.renderReplies(comment.id)}
            </div>
        `;
    }

    renderReplies(parentId) {
        const replies = this.collaborationManager.comments.filter(c => c.parentId === parentId);
        if (replies.length === 0) return '';

        return `
            <div class="replies ml-8 mt-2 space-y-2">
                ${replies.map(reply => this.renderComment(reply, true)).join('')}
            </div>
        `;
    }

    renderEmptyComments() {
        return `
            <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
                <i data-feather="message-circle" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p class="text-gray-500 mb-4">Start a conversation with your team</p>
                <button class="btn btn-primary" onclick="document.getElementById('commentInput').focus()">
                    <i data-feather="plus" class="w-4 h-4 mr-2"></i>
                    Add First Comment
                </button>
            </div>
        `;
    }

    renderActivityView() {
        const activities = this.collaborationManager.getActivityFeed(this.entityType, this.entityId);

        return `
            <div class="activity-view">
                <div class="space-y-4">
                    ${activities.length > 0 ? activities.map(activity => this.renderActivity(activity)).join('') : this.renderEmptyActivity()}
                </div>
            </div>
        `;
    }

    renderActivity(activity) {
        const timeAgo = this.getTimeAgo(activity.timestamp);
        const actionText = this.getActivityActionText(activity);

        return `
            <div class="activity-item flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                <img src="${activity.actor.avatar}" alt="${activity.actor.name}" class="w-8 h-8 rounded-full">
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <span class="font-medium text-gray-900">${activity.actor.name}</span>
                        <span class="text-sm text-gray-600">${actionText}</span>
                        <span class="text-sm text-gray-400">•</span>
                        <span class="text-sm text-gray-500">${timeAgo}</span>
                    </div>
                    ${activity.content ? `
                    <div class="text-gray-700 text-sm mt-2 p-3 bg-gray-50 rounded border-l-4 border-indigo-200">
                        ${this.formatCommentContent(activity.content)}
                    </div>` : ''}
                </div>
            </div>
        `;
    }

    renderEmptyActivity() {
        return `
            <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
                <i data-feather="activity" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                <p class="text-gray-500">Activity will appear here as team members interact</p>
            </div>
        `;
    }

    renderNotificationsDropdown() {
        const notifications = this.collaborationManager.getNotifications();
        const unreadCount = notifications.filter(n => !n.read).length;

        return `
            <div class="max-h-96 overflow-y-auto">
                <div class="flex items-center justify-between p-3 border-b border-gray-200">
                    <h4 class="font-medium">Notifications</h4>
                    ${unreadCount > 0 ? `
                    <button id="markAllRead" class="text-sm text-indigo-600 hover:text-indigo-800">
                        Mark all read
                    </button>` : ''}
                </div>
                
                ${notifications.length > 0 ? `
                <div class="divide-y divide-gray-100">
                    ${notifications.slice(0, 10).map(notification => this.renderNotification(notification)).join('')}
                </div>
                ${notifications.length > 10 ? `
                <div class="p-3 text-center border-t border-gray-200">
                    <button class="text-sm text-indigo-600 hover:text-indigo-800">View all notifications</button>
                </div>` : ''}` : `
                <div class="p-8 text-center">
                    <i data-feather="bell" class="w-8 h-8 text-gray-300 mx-auto mb-2"></i>
                    <p class="text-gray-500 text-sm">No notifications</p>
                </div>`}
            </div>
        `;
    }

    renderNotification(notification) {
        const timeAgo = this.getTimeAgo(notification.createdAt);
        
        return `
            <div class="notification-item p-3 hover:bg-gray-50 cursor-pointer ${notification.read ? 'opacity-75' : 'bg-blue-50'}" data-notification-id="${notification.id}">
                <div class="flex items-start space-x-3">
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <h5 class="font-medium text-sm text-gray-900">${notification.title}</h5>
                            ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${notification.message}</p>
                        <div class="text-xs text-gray-500">${timeAgo}</div>
                    </div>
                    <button class="delete-notification text-gray-400 hover:text-gray-600" data-notification-id="${notification.id}">
                        <i data-feather="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderTeamMembersList() {
        const members = this.collaborationManager.getTeamMembers();
        
        return members.map(member => `
            <button class="mention-member w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left" data-username="${member.name.toLowerCase().replace(/\s+/g, '.')}" data-name="${member.name}">
                <img src="${member.avatar}" alt="${member.name}" class="w-6 h-6 rounded-full">
                <div>
                    <div class="text-sm font-medium">${member.name}</div>
                    <div class="text-xs text-gray-500">${member.role}</div>
                </div>
            </button>
        `).join('');
    }

    bindEvents() {
        this.container.addEventListener('click', (e) => {
            // Tab switching
            if (e.target.closest('.tab-button')) {
                const view = e.target.closest('.tab-button').dataset.view;
                this.switchView(view);
            }

            // Submit comment
            if (e.target.closest('#submitComment')) {
                this.handleCommentSubmit();
            }

            // Cancel comment
            if (e.target.closest('#cancelComment')) {
                this.clearCommentInput();
            }

            // Reply button
            if (e.target.closest('.reply-btn')) {
                const commentId = e.target.closest('.reply-btn').dataset.commentId;
                this.showReplyForm(commentId);
            }

            // Cancel reply
            if (e.target.closest('.cancel-reply')) {
                this.hideReplyForm(e.target);
            }

            // Submit reply
            if (e.target.closest('.submit-reply')) {
                const parentId = e.target.closest('.submit-reply').dataset.parentId;
                this.handleReplySubmit(parentId, e.target);
            }

            // Edit comment
            if (e.target.closest('.edit-comment')) {
                const commentId = e.target.closest('.edit-comment').dataset.commentId;
                this.editComment(commentId);
            }

            // Delete comment
            if (e.target.closest('.delete-comment')) {
                const commentId = e.target.closest('.delete-comment').dataset.commentId;
                this.deleteComment(commentId);
            }

            // Reaction toggle
            if (e.target.closest('.reaction-toggle')) {
                const commentId = e.target.closest('.reaction-toggle').dataset.commentId;
                this.showReactionPicker(commentId, e.target);
            }

            // Reaction button
            if (e.target.closest('.reaction-btn')) {
                const emoji = e.target.closest('.reaction-btn').dataset.emoji;
                const commentId = e.target.closest('.comment').dataset.commentId;
                this.toggleReaction(commentId, emoji);
            }

            // Mention button
            if (e.target.closest('#mentionBtn')) {
                this.showMentionDropdown();
            }

            // Mention member selection
            if (e.target.closest('.mention-member')) {
                const username = e.target.closest('.mention-member').dataset.username;
                this.insertMention(username);
            }

            // Notifications button
            if (e.target.closest('#notificationsBtn')) {
                this.toggleNotificationsDropdown();
            }

            // Mark all notifications as read
            if (e.target.closest('#markAllRead')) {
                this.markAllNotificationsAsRead();
            }

            // Notification item click
            if (e.target.closest('.notification-item')) {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                this.handleNotificationClick(notificationId);
            }

            // Delete notification
            if (e.target.closest('.delete-notification')) {
                e.stopPropagation();
                const notificationId = e.target.closest('.delete-notification').dataset.notificationId;
                this.deleteNotification(notificationId);
            }

            // Team members button
            if (e.target.closest('#teamMembersBtn')) {
                this.showTeamMembersModal();
            }
        });

        // Handle keyboard events
        this.container.addEventListener('keydown', (e) => {
            // Submit comment with Ctrl+Enter
            if (e.target.id === 'commentInput' && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                this.handleCommentSubmit();
            }

            // Handle @ mentions
            if (e.target.id === 'commentInput' && e.key === '@') {
                setTimeout(() => this.showMentionDropdown(), 100);
            }
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#notificationsDropdown') && !e.target.closest('#notificationsBtn')) {
                this.hideNotificationsDropdown();
            }
            if (!e.target.closest('#mentionDropdown') && !e.target.closest('#mentionBtn')) {
                this.hideMentionDropdown();
            }
        });
    }

    bindCollaborationEvents() {
        this.collaborationManager.on('onCommentAdded', () => {
            this.refreshView();
        });

        this.collaborationManager.on('onCommentUpdated', () => {
            this.refreshView();
        });

        this.collaborationManager.on('onCommentDeleted', () => {
            this.refreshView();
        });

        this.collaborationManager.on('onNotificationCreated', () => {
            this.updateNotificationsBadge();
        });

        this.collaborationManager.on('onNotificationRead', () => {
            this.updateNotificationsBadge();
        });
    }

    // Event Handlers
    switchView(view) {
        this.currentView = view;
        const content = this.container.querySelector('#collaborationContent');
        content.innerHTML = this.renderCurrentView();
        
        // Update tab states
        this.container.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        this.container.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    handleCommentSubmit() {
        const input = this.container.querySelector('#commentInput');
        const content = input.value.trim();
        
        if (!content) {
            this.showToast('Please enter a comment', 'warning');
            return;
        }

        try {
            this.collaborationManager.addComment(this.entityType, this.entityId, content);
            input.value = '';
            this.showToast('Comment added successfully', 'success');
        } catch (error) {
            this.showToast('Error adding comment: ' + error.message, 'error');
        }
    }

    handleReplySubmit(parentId, button) {
        const replyForm = button.closest('.reply-form');
        const textarea = replyForm.querySelector('textarea');
        const content = textarea.value.trim();
        
        if (!content) {
            this.showToast('Please enter a reply', 'warning');
            return;
        }

        try {
            this.collaborationManager.addComment(this.entityType, this.entityId, content, parentId);
            textarea.value = '';
            this.hideReplyForm(button);
            this.showToast('Reply added successfully', 'success');
        } catch (error) {
            this.showToast('Error adding reply: ' + error.message, 'error');
        }
    }

    clearCommentInput() {
        const input = this.container.querySelector('#commentInput');
        input.value = '';
    }

    showReplyForm(commentId) {
        const replyForm = this.container.querySelector(`#replyForm${commentId}`);
        if (replyForm) {
            replyForm.classList.remove('hidden');
            const textarea = replyForm.querySelector('textarea');
            textarea.focus();
        }
    }

    hideReplyForm(element) {
        const replyForm = element.closest('.reply-form');
        if (replyForm) {
            replyForm.classList.add('hidden');
            const textarea = replyForm.querySelector('textarea');
            textarea.value = '';
        }
    }

    editComment(commentId) {
        // This would show an inline edit form - simplified for now
        const comment = this.collaborationManager.getComment(commentId);
        if (comment) {
            const newContent = prompt('Edit comment:', comment.content);
            if (newContent && newContent.trim() !== comment.content) {
                try {
                    this.collaborationManager.updateComment(commentId, newContent.trim());
                    this.showToast('Comment updated successfully', 'success');
                } catch (error) {
                    this.showToast('Error updating comment: ' + error.message, 'error');
                }
            }
        }
    }

    deleteComment(commentId) {
        if (confirm('Are you sure you want to delete this comment?')) {
            try {
                this.collaborationManager.deleteComment(commentId);
                this.showToast('Comment deleted successfully', 'success');
            } catch (error) {
                this.showToast('Error deleting comment: ' + error.message, 'error');
            }
        }
    }

    toggleReaction(commentId, emoji) {
        try {
            this.collaborationManager.toggleReaction(commentId, emoji);
        } catch (error) {
            this.showToast('Error toggling reaction: ' + error.message, 'error');
        }
    }

    showReactionPicker(commentId, button) {
        // Simple emoji picker - could be enhanced with a proper emoji picker library
        const emojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '👏', '🔥'];
        const picker = document.createElement('div');
        picker.className = 'reaction-picker absolute bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50 flex space-x-1';
        picker.innerHTML = emojis.map(emoji => `
            <button class="reaction-option hover:bg-gray-100 p-1 rounded" data-emoji="${emoji}" data-comment-id="${commentId}">
                ${emoji}
            </button>
        `).join('');

        // Position picker
        const rect = button.getBoundingClientRect();
        picker.style.top = (rect.bottom + 5) + 'px';
        picker.style.left = rect.left + 'px';

        document.body.appendChild(picker);

        // Handle emoji selection
        picker.addEventListener('click', (e) => {
            if (e.target.closest('.reaction-option')) {
                const emoji = e.target.dataset.emoji;
                const commentId = e.target.dataset.commentId;
                this.toggleReaction(commentId, emoji);
                document.body.removeChild(picker);
            }
        });

        // Remove picker on outside click
        setTimeout(() => {
            const removeOnClick = (e) => {
                if (!picker.contains(e.target)) {
                    document.body.removeChild(picker);
                    document.removeEventListener('click', removeOnClick);
                }
            };
            document.addEventListener('click', removeOnClick);
        }, 100);
    }

    showMentionDropdown() {
        const dropdown = this.container.querySelector('#mentionDropdown');
        const input = this.container.querySelector('#commentInput');
        
        if (dropdown && input) {
            dropdown.classList.remove('hidden');
            
            // Position dropdown near cursor
            const rect = input.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 5) + 'px';
            dropdown.style.left = rect.left + 'px';
        }
    }

    hideMentionDropdown() {
        const dropdown = this.container.querySelector('#mentionDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    insertMention(username) {
        const input = this.container.querySelector('#commentInput');
        if (input) {
            const currentValue = input.value;
            const cursorPosition = input.selectionStart;
            
            // Find the @ symbol before cursor
            let atPosition = cursorPosition;
            while (atPosition > 0 && currentValue[atPosition - 1] !== '@') {
                atPosition--;
            }
            
            if (atPosition > 0 && currentValue[atPosition - 1] === '@') {
                const beforeMention = currentValue.substring(0, atPosition);
                const afterMention = currentValue.substring(cursorPosition);
                const newValue = beforeMention + username + ' ' + afterMention;
                
                input.value = newValue;
                input.focus();
                
                // Set cursor after the mention
                const newCursorPosition = atPosition + username.length + 1;
                input.setSelectionRange(newCursorPosition, newCursorPosition);
            }
            
            this.hideMentionDropdown();
        }
    }

    toggleNotificationsDropdown() {
        const dropdown = this.container.querySelector('#notificationsDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            
            if (!dropdown.classList.contains('hidden')) {
                // Refresh notifications content
                dropdown.innerHTML = this.renderNotificationsDropdown();
                
                if (typeof feather !== 'undefined') {
                    feather.replace();
                }
            }
        }
    }

    hideNotificationsDropdown() {
        const dropdown = this.container.querySelector('#notificationsDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }

    markAllNotificationsAsRead() {
        const count = this.collaborationManager.markAllNotificationsAsRead();
        if (count > 0) {
            this.showToast(`Marked ${count} notifications as read`, 'success');
        }
    }

    handleNotificationClick(notificationId) {
        this.collaborationManager.markNotificationAsRead(notificationId);
        // Handle notification action based on type
        const notification = this.collaborationManager.notifications.find(n => n.id === notificationId);
        if (notification && notification.data) {
            // Navigate to relevant content or show details
            console.log('Notification clicked:', notification);
        }
    }

    deleteNotification(notificationId) {
        this.collaborationManager.deleteNotification(notificationId);
        this.toggleNotificationsDropdown(); // Refresh dropdown
    }

    showTeamMembersModal() {
        // This would show a modal with team member management - simplified for now
        const members = this.collaborationManager.getTeamMembers();
        const membersList = members.map(m => `${m.name} (${m.role})`).join('\n');
        alert(`Team Members:\n\n${membersList}`);
    }

    // Utility methods
    getCommentsCount() {
        return this.collaborationManager.getComments(this.entityType, this.entityId).length;
    }

    getUnreadNotificationsCount() {
        return this.collaborationManager.getNotifications(this.collaborationManager.currentUser.id, true).length;
    }

    updateNotificationsBadge() {
        const badge = this.container.querySelector('#notificationsBtn span');
        const count = this.getUnreadNotificationsCount();
        
        if (count > 0) {
            if (!badge) {
                const btn = this.container.querySelector('#notificationsBtn');
                btn.insertAdjacentHTML('beforeend', `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">${count}</span>`);
            } else {
                badge.textContent = count;
            }
        } else if (badge) {
            badge.remove();
        }
    }

    refreshView() {
        const content = this.container.querySelector('#collaborationContent');
        content.innerHTML = this.renderCurrentView();
        
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    formatCommentContent(content) {
        // Format mentions, links, etc.
        let formatted = content;
        
        // Format mentions
        formatted = formatted.replace(/@([a-zA-Z0-9_.]+)/g, '<span class="text-indigo-600 font-medium">@$1</span>');
        
        // Format simple links
        formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-indigo-600 underline">$1</a>');
        
        // Convert line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + 'm ago';
        if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + 'h ago';
        if (diffInSeconds < 604800) return Math.floor(diffInSeconds / 86400) + 'd ago';
        
        return past.toLocaleDateString();
    }

    getActivityActionText(activity) {
        switch (activity.action) {
            case 'added_comment':
                return 'commented';
            case 'mentioned':
                return 'mentioned you';
            case 'reacted':
                return 'reacted to a comment';
            default:
                return activity.action;
        }
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
                <i data-feather="check-circle" class="w-5 h-5"></i>
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

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationWidget;
} else {
    window.CollaborationWidget = CollaborationWidget;
}