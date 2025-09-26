/**
 * Collaboration Manager for EngineerPulse
 * Handles comments, mentions, notifications, and team interactions
 */

class CollaborationManager {
    constructor() {
        this.comments = JSON.parse(localStorage.getItem('epulse_comments') || '[]');
        this.notifications = JSON.parse(localStorage.getItem('epulse_notifications') || '[]');
        this.teamMembers = JSON.parse(localStorage.getItem('epulse_team_members') || '[]');
        this.currentUser = this.getCurrentUser();
        this.listeners = {};
        
        this.init();
    }

    init() {
        // Initialize with default team members if empty
        if (this.teamMembers.length === 0) {
            this.initializeDefaultTeam();
        }
        
        // Clean up old notifications (older than 30 days)
        this.cleanupOldNotifications();
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

    // User Management
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('epulse_current_user') || '{"id": "user1", "name": "Alex Johnson", "email": "alex@company.com", "avatar": "http://static.photos/people/200x200/42", "role": "Senior Software Engineer"}');
    }

    getTeamMembers() {
        return [...this.teamMembers];
    }

    addTeamMember(member) {
        const newMember = {
            id: this.generateId(),
            name: member.name,
            email: member.email,
            avatar: member.avatar || `http://static.photos/people/200x200/${Math.floor(Math.random() * 100)}`,
            role: member.role || 'Developer',
            status: 'active',
            joinedDate: new Date().toISOString(),
            ...member
        };

        this.teamMembers.push(newMember);
        this.saveTeamMembers();
        this.emit('onTeamMemberAdded', newMember);
        return newMember;
    }

    // Comment Management
    addComment(entityType, entityId, content, parentId = null) {
        const comment = {
            id: this.generateId(),
            entityType, // 'task', 'project', 'goal', etc.
            entityId,
            content,
            parentId,
            author: this.currentUser,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            edited: false,
            mentions: this.extractMentions(content),
            reactions: {},
            attachments: []
        };

        this.comments.push(comment);
        this.saveComments();

        // Create notifications for mentions
        this.processMentions(comment);

        this.emit('onCommentAdded', comment);
        return comment;
    }

    updateComment(commentId, content) {
        const comment = this.comments.find(c => c.id === commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.author.id !== this.currentUser.id) {
            throw new Error('You can only edit your own comments');
        }

        comment.content = content;
        comment.updatedAt = new Date().toISOString();
        comment.edited = true;
        comment.mentions = this.extractMentions(content);

        this.saveComments();
        this.processMentions(comment);
        this.emit('onCommentUpdated', comment);
        return comment;
    }

    deleteComment(commentId) {
        const commentIndex = this.comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) {
            throw new Error('Comment not found');
        }

        const comment = this.comments[commentIndex];
        if (comment.author.id !== this.currentUser.id) {
            throw new Error('You can only delete your own comments');
        }

        this.comments.splice(commentIndex, 1);
        this.saveComments();
        this.emit('onCommentDeleted', { commentId, comment });
    }

    getComments(entityType, entityId) {
        return this.comments
            .filter(c => c.entityType === entityType && c.entityId === entityId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    getComment(commentId) {
        return this.comments.find(c => c.id === commentId);
    }

    // Reactions
    toggleReaction(commentId, emoji) {
        const comment = this.getComment(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (!comment.reactions[emoji]) {
            comment.reactions[emoji] = [];
        }

        const userIndex = comment.reactions[emoji].findIndex(u => u.id === this.currentUser.id);
        if (userIndex > -1) {
            // Remove reaction
            comment.reactions[emoji].splice(userIndex, 1);
            if (comment.reactions[emoji].length === 0) {
                delete comment.reactions[emoji];
            }
        } else {
            // Add reaction
            comment.reactions[emoji].push({
                id: this.currentUser.id,
                name: this.currentUser.name,
                timestamp: new Date().toISOString()
            });
        }

        this.saveComments();
        this.emit('onReactionToggled', { commentId, emoji, comment });
        return comment;
    }

    // Mentions
    extractMentions(content) {
        const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            const username = match[1];
            const user = this.teamMembers.find(m => 
                m.name.toLowerCase().replace(/\s+/g, '.') === username.toLowerCase() ||
                m.email.split('@')[0] === username.toLowerCase()
            );
            
            if (user) {
                mentions.push({
                    username,
                    user,
                    position: match.index
                });
            }
        }

        return mentions;
    }

    processMentions(comment) {
        comment.mentions.forEach(mention => {
            this.createNotification({
                type: 'mention',
                title: 'You were mentioned',
                message: `${comment.author.name} mentioned you in a comment`,
                data: {
                    commentId: comment.id,
                    entityType: comment.entityType,
                    entityId: comment.entityId,
                    mentionedBy: comment.author
                },
                recipientId: mention.user.id,
                priority: 'normal'
            });
        });
    }

    // Notifications
    createNotification(notificationData) {
        const notification = {
            id: this.generateId(),
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            recipientId: notificationData.recipientId,
            senderId: this.currentUser.id,
            priority: notificationData.priority || 'normal',
            read: false,
            createdAt: new Date().toISOString(),
            expiresAt: notificationData.expiresAt || this.getDefaultExpiry()
        };

        this.notifications.push(notification);
        this.saveNotifications();
        this.emit('onNotificationCreated', notification);
        return notification;
    }

    getNotifications(userId = this.currentUser.id, unreadOnly = false) {
        let notifications = this.notifications.filter(n => n.recipientId === userId);
        
        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }

        return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    markNotificationAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.recipientId === this.currentUser.id) {
            notification.read = true;
            this.saveNotifications();
            this.emit('onNotificationRead', notification);
        }
    }

    markAllNotificationsAsRead(userId = this.currentUser.id) {
        let updated = 0;
        this.notifications.forEach(n => {
            if (n.recipientId === userId && !n.read) {
                n.read = true;
                updated++;
            }
        });

        if (updated > 0) {
            this.saveNotifications();
            this.emit('onAllNotificationsRead', { userId, count: updated });
        }

        return updated;
    }

    deleteNotification(notificationId) {
        const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
        if (notificationIndex > -1) {
            const notification = this.notifications[notificationIndex];
            if (notification.recipientId === this.currentUser.id) {
                this.notifications.splice(notificationIndex, 1);
                this.saveNotifications();
                this.emit('onNotificationDeleted', notification);
            }
        }
    }

    // Activity Feed
    getActivityFeed(entityType = null, entityId = null, limit = 50) {
        let activities = [];

        // Add comments as activities
        let comments = [...this.comments];
        if (entityType && entityId) {
            comments = comments.filter(c => c.entityType === entityType && c.entityId === entityId);
        }

        comments.forEach(comment => {
            activities.push({
                id: comment.id,
                type: 'comment',
                action: 'added_comment',
                actor: comment.author,
                target: {
                    type: comment.entityType,
                    id: comment.entityId
                },
                content: comment.content,
                timestamp: comment.createdAt,
                data: comment
            });
        });

        // Sort by timestamp and limit
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Statistics
    getCollaborationStats(timeframe = 'week') {
        const now = new Date();
        const startDate = this.getTimeframeStart(now, timeframe);

        const comments = this.comments.filter(c => new Date(c.createdAt) >= startDate);
        const notifications = this.notifications.filter(n => new Date(n.createdAt) >= startDate);

        return {
            totalComments: comments.length,
            totalMentions: comments.reduce((sum, c) => sum + c.mentions.length, 0),
            totalNotifications: notifications.length,
            activeUsers: [...new Set(comments.map(c => c.author.id))].length,
            averageCommentsPerUser: comments.length / Math.max([...new Set(comments.map(c => c.author.id))].length, 1),
            topCommenters: this.getTopCommenters(comments),
            engagementByDay: this.getEngagementByDay(comments, startDate, now)
        };
    }

    getTopCommenters(comments, limit = 5) {
        const commentCounts = {};
        
        comments.forEach(comment => {
            const userId = comment.author.id;
            if (!commentCounts[userId]) {
                commentCounts[userId] = {
                    user: comment.author,
                    count: 0
                };
            }
            commentCounts[userId].count++;
        });

        return Object.values(commentCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getEngagementByDay(comments, startDate, endDate) {
        const days = {};
        const current = new Date(startDate);
        
        while (current <= endDate) {
            const dateKey = current.toISOString().split('T')[0];
            days[dateKey] = 0;
            current.setDate(current.getDate() + 1);
        }

        comments.forEach(comment => {
            const dateKey = comment.createdAt.split('T')[0];
            if (days.hasOwnProperty(dateKey)) {
                days[dateKey]++;
            }
        });

        return Object.entries(days).map(([date, count]) => ({
            date,
            count
        }));
    }

    // Utility Methods
    generateId() {
        return 'collab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getTimeframeStart(endDate, timeframe) {
        const start = new Date(endDate);
        switch (timeframe) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setDate(start.getDate() - 7);
        }
        return start;
    }

    getDefaultExpiry() {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30); // 30 days from now
        return expiry.toISOString();
    }

    cleanupOldNotifications() {
        const now = new Date();
        const beforeCount = this.notifications.length;
        
        this.notifications = this.notifications.filter(n => 
            !n.expiresAt || new Date(n.expiresAt) > now
        );

        if (this.notifications.length < beforeCount) {
            this.saveNotifications();
        }
    }

    initializeDefaultTeam() {
        const defaultMembers = [
            {
                name: 'Alex Johnson',
                email: 'alex@company.com',
                avatar: 'http://static.photos/people/200x200/42',
                role: 'Senior Software Engineer',
                id: 'user1'
            },
            {
                name: 'Sarah Chen',
                email: 'sarah@company.com',
                avatar: 'http://static.photos/people/200x200/25',
                role: 'Product Manager',
                id: 'user2'
            },
            {
                name: 'Mike Rodriguez',
                email: 'mike@company.com',
                avatar: 'http://static.photos/people/200x200/67',
                role: 'DevOps Engineer',
                id: 'user3'
            },
            {
                name: 'Emma Thompson',
                email: 'emma@company.com',
                avatar: 'http://static.photos/people/200x200/89',
                role: 'UI/UX Designer',
                id: 'user4'
            },
            {
                name: 'David Park',
                email: 'david@company.com',
                avatar: 'http://static.photos/people/200x200/12',
                role: 'Backend Developer',
                id: 'user5'
            }
        ];

        defaultMembers.forEach(member => {
            const fullMember = {
                ...member,
                status: 'active',
                joinedDate: new Date().toISOString()
            };
            this.teamMembers.push(fullMember);
        });

        this.saveTeamMembers();
    }

    // Search and filtering
    searchComments(query, filters = {}) {
        let results = [...this.comments];

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(comment => 
                comment.content.toLowerCase().includes(searchTerm) ||
                comment.author.name.toLowerCase().includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.entityType) {
            results = results.filter(c => c.entityType === filters.entityType);
        }

        if (filters.entityId) {
            results = results.filter(c => c.entityId === filters.entityId);
        }

        if (filters.authorId) {
            results = results.filter(c => c.author.id === filters.authorId);
        }

        if (filters.dateFrom) {
            results = results.filter(c => new Date(c.createdAt) >= new Date(filters.dateFrom));
        }

        if (filters.dateTo) {
            results = results.filter(c => new Date(c.createdAt) <= new Date(filters.dateTo));
        }

        return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Data persistence
    saveComments() {
        localStorage.setItem('epulse_comments', JSON.stringify(this.comments));
    }

    saveNotifications() {
        localStorage.setItem('epulse_notifications', JSON.stringify(this.notifications));
    }

    saveTeamMembers() {
        localStorage.setItem('epulse_team_members', JSON.stringify(this.teamMembers));
    }

    // Export/Import
    exportData(format = 'json') {
        const data = {
            comments: this.comments,
            notifications: this.notifications,
            teamMembers: this.teamMembers,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }

        throw new Error('Unsupported export format');
    }

    importData(data, options = { merge: true }) {
        try {
            const importData = typeof data === 'string' ? JSON.parse(data) : data;

            if (options.merge) {
                // Merge with existing data
                if (importData.comments) {
                    this.comments = [...this.comments, ...importData.comments];
                }
                if (importData.notifications) {
                    this.notifications = [...this.notifications, ...importData.notifications];
                }
                if (importData.teamMembers) {
                    // Avoid duplicates
                    importData.teamMembers.forEach(member => {
                        if (!this.teamMembers.find(m => m.id === member.id)) {
                            this.teamMembers.push(member);
                        }
                    });
                }
            } else {
                // Replace existing data
                if (importData.comments) this.comments = importData.comments;
                if (importData.notifications) this.notifications = importData.notifications;
                if (importData.teamMembers) this.teamMembers = importData.teamMembers;
            }

            this.saveComments();
            this.saveNotifications();
            this.saveTeamMembers();

            this.emit('onDataImported', { importData, options });
            return true;
        } catch (error) {
            throw new Error('Invalid import data: ' + error.message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborationManager;
} else {
    window.CollaborationManager = CollaborationManager;
}