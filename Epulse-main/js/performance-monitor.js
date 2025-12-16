/**
 * Performance Monitoring and Optimization System
 * Tracks page performance, user interactions, and system health
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            userInteractions: [],
            resourceUsage: {},
            errors: [],
            customMetrics: {}
        };
        this.config = {
            trackingInterval: 5000, // 5 seconds
            maxInteractions: 1000,
            enableAutoOptimization: true,
            reportingEndpoint: null
        };
        this.observers = {};
        this.startTime = performance.now();
        this.init();
    }

    init() {
        this.trackPageLoad();
        this.setupObservers();
        this.trackUserInteractions();
        this.monitorResourceUsage();
        this.setupErrorTracking();
        this.startPeriodicMonitoring();
        console.log('Performance Monitor initialized');
    }

    // Page Load Performance Tracking
    trackPageLoad() {
        if (typeof performance !== 'undefined' && performance.timing) {
            const timing = performance.timing;
            const navigation = performance.getEntriesByType('navigation')[0];
            
            this.metrics.pageLoad = {
                // Navigation Timing API metrics
                domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
                loadComplete: timing.loadEventEnd - timing.loadEventStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
                pageLoad: timing.loadEventEnd - timing.navigationStart,
                
                // Resource timing
                dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
                tcpConnect: timing.connectEnd - timing.connectStart,
                serverResponse: timing.responseEnd - timing.requestStart,
                
                // Navigation API metrics (if available)
                ...(navigation && {
                    transferSize: navigation.transferSize,
                    encodedBodySize: navigation.encodedBodySize,
                    decodedBodySize: navigation.decodedBodySize,
                    renderBlockingTime: navigation.renderBlockingStatus
                })
            };

            // Track Core Web Vitals
            this.trackCoreWebVitals();
        }
    }

    // Core Web Vitals Tracking
    trackCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.pageLoad.lcp = lastEntry.startTime;
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                
                // First Input Delay (FID)
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.metrics.pageLoad.fid = entry.processingStart - entry.startTime;
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });

                // Cumulative Layout Shift (CLS)
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.metrics.pageLoad.cls = clsValue;
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });

                this.observers.coreWebVitals = { lcpObserver, fidObserver, clsObserver };
            } catch (error) {
                console.warn('Core Web Vitals tracking not supported:', error);
            }
        }
    }

    // User Interaction Tracking
    trackUserInteractions() {
        const interactionTypes = ['click', 'keydown', 'scroll', 'resize', 'focus', 'blur'];
        
        interactionTypes.forEach(type => {
            document.addEventListener(type, (event) => {
                this.recordInteraction({
                    type: type,
                    timestamp: performance.now(),
                    target: this.getElementSelector(event.target),
                    page: window.location.pathname
                });
            }, { passive: true });
        });

        // Track form submissions
        document.addEventListener('submit', (event) => {
            this.recordInteraction({
                type: 'form_submit',
                timestamp: performance.now(),
                target: this.getElementSelector(event.target),
                page: window.location.pathname
            });
        });
    }

    recordInteraction(interaction) {
        this.metrics.userInteractions.push(interaction);
        
        // Prevent memory bloat by keeping only recent interactions
        if (this.metrics.userInteractions.length > this.config.maxInteractions) {
            this.metrics.userInteractions = this.metrics.userInteractions.slice(-this.config.maxInteractions / 2);
        }
    }

    // Resource Usage Monitoring
    monitorResourceUsage() {
        // Memory usage (if available)
        if ('memory' in performance) {
            this.metrics.resourceUsage.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }

        // Network connection info
        if ('connection' in navigator) {
            this.metrics.resourceUsage.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }

        // Battery API (if available)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.metrics.resourceUsage.battery = {
                    level: battery.level,
                    charging: battery.charging,
                    dischargingTime: battery.dischargingTime
                };
            });
        }
    }

    // Performance Observers Setup
    setupObservers() {
        if ('PerformanceObserver' in window) {
            // Long Tasks Observer
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.metrics.customMetrics.longTasks = this.metrics.customMetrics.longTasks || [];
                        this.metrics.customMetrics.longTasks.push({
                            duration: entry.duration,
                            startTime: entry.startTime,
                            name: entry.name
                        });
                    }
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.longTask = longTaskObserver;
            } catch (error) {
                console.warn('Long task observer not supported:', error);
            }

            // Resource Observer
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    const resources = list.getEntries().map(entry => ({
                        name: entry.name,
                        duration: entry.duration,
                        transferSize: entry.transferSize,
                        encodedBodySize: entry.encodedBodySize,
                        decodedBodySize: entry.decodedBodySize,
                        initiatorType: entry.initiatorType
                    }));
                    
                    this.metrics.customMetrics.resources = resources;
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.resource = resourceObserver;
            } catch (error) {
                console.warn('Resource observer not supported:', error);
            }
        }
    }

    // Error Tracking
    setupErrorTracking() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error ? event.error.stack : null,
                timestamp: performance.now()
            });
        });

        // Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise_rejection',
                message: event.reason,
                timestamp: performance.now()
            });
        });

        // Resource loading errors
        document.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.recordError({
                    type: 'resource_error',
                    element: event.target.tagName,
                    source: event.target.src || event.target.href,
                    timestamp: performance.now()
                });
            }
        }, true);
    }

    recordError(error) {
        this.metrics.errors.push(error);
        console.error('Performance Monitor - Error recorded:', error);
    }

    // Periodic Monitoring
    startPeriodicMonitoring() {
        setInterval(() => {
            this.updateResourceUsage();
            this.checkPerformanceThresholds();
            if (this.config.enableAutoOptimization) {
                this.autoOptimize();
            }
        }, this.config.trackingInterval);
    }

    updateResourceUsage() {
        // Update memory usage
        if ('memory' in performance) {
            this.metrics.resourceUsage.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: performance.now()
            };
        }

        // Update connection info
        if ('connection' in navigator) {
            this.metrics.resourceUsage.connection = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData,
                timestamp: performance.now()
            };
        }
    }

    // Performance Analysis and Optimization
    checkPerformanceThresholds() {
        const thresholds = {
            lcp: 2500, // 2.5s
            fid: 100,  // 100ms
            cls: 0.1,  // 0.1
            memoryUsage: 0.8, // 80% of heap limit
            longTaskDuration: 50 // 50ms
        };

        const issues = [];

        // Check Core Web Vitals
        if (this.metrics.pageLoad.lcp > thresholds.lcp) {
            issues.push({
                type: 'lcp',
                severity: 'high',
                message: `LCP (${this.metrics.pageLoad.lcp}ms) exceeds threshold`,
                recommendation: 'Optimize images, reduce server response time, eliminate render-blocking resources'
            });
        }

        if (this.metrics.pageLoad.fid > thresholds.fid) {
            issues.push({
                type: 'fid',
                severity: 'medium',
                message: `FID (${this.metrics.pageLoad.fid}ms) exceeds threshold`,
                recommendation: 'Reduce JavaScript execution time, split long tasks'
            });
        }

        if (this.metrics.pageLoad.cls > thresholds.cls) {
            issues.push({
                type: 'cls',
                severity: 'medium',
                message: `CLS (${this.metrics.pageLoad.cls}) exceeds threshold`,
                recommendation: 'Set size attributes for media, avoid inserting content above existing content'
            });
        }

        // Check memory usage
        if (this.metrics.resourceUsage.memory) {
            const memoryUsage = this.metrics.resourceUsage.memory.used / this.metrics.resourceUsage.memory.limit;
            if (memoryUsage > thresholds.memoryUsage) {
                issues.push({
                    type: 'memory',
                    severity: 'high',
                    message: `Memory usage (${(memoryUsage * 100).toFixed(1)}%) is high`,
                    recommendation: 'Check for memory leaks, optimize data structures'
                });
            }
        }

        this.metrics.customMetrics.performanceIssues = issues;
        
        if (issues.length > 0) {
            console.warn('Performance issues detected:', issues);
        }
    }

    // Auto-optimization suggestions
    autoOptimize() {
        const optimizations = [];

        // Image optimization
        const images = document.querySelectorAll('img:not([loading])');
        if (images.length > 0) {
            optimizations.push({
                type: 'lazy_loading',
                action: () => {
                    images.forEach(img => {
                        if (!img.loading) {
                            img.loading = 'lazy';
                        }
                    });
                },
                description: 'Enable lazy loading for images'
            });
        }

        // Prefetch critical resources
        if (this.metrics.resourceUsage.connection && this.metrics.resourceUsage.connection.effectiveType === '4g') {
            optimizations.push({
                type: 'prefetch',
                action: () => this.prefetchCriticalResources(),
                description: 'Prefetch critical resources on fast connection'
            });
        }

        // Apply optimizations
        optimizations.forEach(opt => {
            try {
                opt.action();
                console.log('Applied optimization:', opt.description);
            } catch (error) {
                console.error('Failed to apply optimization:', opt.description, error);
            }
        });
    }

    prefetchCriticalResources() {
        const criticalResources = [
            '/js/charts-manager.js',
            '/js/collaboration-manager.js',
            '/js/help-system.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    // Utility Functions
    getElementSelector(element) {
        if (!element) return null;
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    // Public API Methods
    getMetrics() {
        return {
            ...this.metrics,
            uptime: performance.now() - this.startTime,
            timestamp: Date.now()
        };
    }

    getPerformanceScore() {
        const weights = { lcp: 0.25, fid: 0.25, cls: 0.25, errors: 0.25 };
        let score = 100;

        // Deduct points for Core Web Vitals
        if (this.metrics.pageLoad.lcp > 2500) score -= (weights.lcp * 100);
        if (this.metrics.pageLoad.fid > 100) score -= (weights.fid * 100);
        if (this.metrics.pageLoad.cls > 0.1) score -= (weights.cls * 100);
        if (this.metrics.errors.length > 0) score -= (weights.errors * 100);

        return Math.max(0, Math.round(score));
    }

    exportMetrics() {
        const data = {
            ...this.getMetrics(),
            performanceScore: this.getPerformanceScore(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Cleanup
    destroy() {
        Object.values(this.observers).forEach(observer => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        console.log('Performance Monitor destroyed');
    }
}

// Initialize performance monitor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
    
    // Add performance metrics to global context for debugging
    window.getPerformanceMetrics = () => window.performanceMonitor.getMetrics();
    window.exportPerformanceMetrics = () => window.performanceMonitor.exportMetrics();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}