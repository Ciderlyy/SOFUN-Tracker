/* =================================================================
   SOFUN TRACKER - ADVANCED AUDIT SYSTEM
   Comprehensive technical logging for developers and system monitoring
   ================================================================= */

/**
 * Advanced Audit Logger
 * Provides detailed technical logging similar to console logs
 * for developers and system administrators
 */
class AdvancedAuditLogger {
    constructor() {
        this.logLevel = 'DEBUG'; // DEBUG, INFO, WARN, ERROR
        this.maxEntries = 1000;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.logCategories = {
            SYSTEM: '🖥️',
            DATA: '📊',
            USER: '👤',
            PERFORMANCE: '⚡',
            SECURITY: '🔒',
            ERROR: '❌',
            NETWORK: '🌐',
            STORAGE: '💾',
            UI: '🎨',
            VALIDATION: '✅'
        };
        this.performanceMetrics = new Map();
        this.errorTracking = new Map();
        
        this.init();
    }

    init() {
        this.log('SYSTEM', 'INFO', 'Advanced Audit Logger initialized', {
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            version: '2.0.0'
        });
        
        // Track page load performance
        this.trackPageLoad();
        
        // Monitor unhandled errors
        this.setupErrorTracking();
        
        // Track memory usage periodically
        this.startPerformanceMonitoring();
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Main logging method
     */
    log(category, level, message, details = {}, stackTrace = null) {
        const timestamp = new Date().toISOString();
        const relativeTime = Date.now() - this.startTime;
        
        const entry = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sessionId: this.sessionId,
            timestamp: timestamp,
            relativeTime: `+${relativeTime}ms`,
            category: category,
            level: level,
            message: message,
            details: this.sanitizeDetails(details),
            stackTrace: stackTrace || this.getStackTrace(),
            performance: this.getCurrentPerformanceSnapshot(),
            url: window.location.href,
            userAgent: navigator.userAgent.substr(0, 100)
        };

        // Add to audit log
        this.addToAuditLog(entry);
        
        // Console output for development
        this.outputToConsole(entry);
        
        // Track errors for analysis
        if (level === 'ERROR') {
            this.trackError(entry);
        }
        
        return entry.id;
    }

    /**
     * Quick logging methods for different categories
     */
    logSystem(level, message, details = {}) {
        return this.log('SYSTEM', level, message, details);
    }

    logData(level, message, details = {}) {
        return this.log('DATA', level, message, details);
    }

    logUser(level, message, details = {}) {
        return this.log('USER', level, message, details);
    }

    logPerformance(level, message, details = {}) {
        return this.log('PERFORMANCE', level, message, details);
    }

    logSecurity(level, message, details = {}) {
        return this.log('SECURITY', level, message, details);
    }

    logError(message, error, details = {}) {
        const errorDetails = {
            ...details,
            errorName: error?.name,
            errorMessage: error?.message,
            errorStack: error?.stack
        };
        return this.log('ERROR', 'ERROR', message, errorDetails, error?.stack);
    }

    logNetwork(level, message, details = {}) {
        return this.log('NETWORK', level, message, details);
    }

    logStorage(level, message, details = {}) {
        return this.log('STORAGE', level, message, details);
    }

    logUI(level, message, details = {}) {
        return this.log('UI', level, message, details);
    }

    logValidation(level, message, details = {}) {
        return this.log('VALIDATION', level, message, details);
    }

    /**
     * Performance tracking
     */
    startTimer(name) {
        this.performanceMetrics.set(name, {
            startTime: performance.now(),
            name: name
        });
        this.logPerformance('DEBUG', `Timer started: ${name}`);
    }

    endTimer(name, details = {}) {
        const metric = this.performanceMetrics.get(name);
        if (metric) {
            const duration = performance.now() - metric.startTime;
            this.performanceMetrics.delete(name);
            
            this.logPerformance('INFO', `Timer ended: ${name}`, {
                ...details,
                duration: `${duration.toFixed(2)}ms`,
                startTime: metric.startTime
            });
            
            return duration;
        }
        this.logPerformance('WARN', `Timer not found: ${name}`);
        return null;
    }

    /**
     * Memory and performance monitoring
     */
    getCurrentPerformanceSnapshot() {
        const nav = performance.getEntriesByType('navigation')[0];
        const memory = (performance as any).memory;
        
        return {
            memoryUsed: memory ? `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB` : 'N/A',
            memoryLimit: memory ? `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB` : 'N/A',
            domLoadTime: nav ? `${nav.domContentLoadedEventEnd - nav.navigationStart}ms` : 'N/A',
            pageLoadTime: nav ? `${nav.loadEventEnd - nav.navigationStart}ms` : 'N/A',
            connectionType: (navigator as any).connection?.effectiveType || 'Unknown'
        };
    }

    /**
     * Data operations logging
     */
    logDataOperation(operation, details = {}) {
        this.logData('INFO', `Data operation: ${operation}`, {
            operation: operation,
            recordCount: details.recordCount || 0,
            dataSize: details.dataSize || 'Unknown',
            processingTime: details.processingTime || 'N/A',
            ...details
        });
    }

    /**
     * Excel file processing logging
     */
    logExcelProcessing(phase, details = {}) {
        this.logData('DEBUG', `Excel processing: ${phase}`, {
            phase: phase,
            fileName: details.fileName,
            fileSize: details.fileSize ? `${(details.fileSize / 1024).toFixed(2)}KB` : 'Unknown',
            sheetCount: details.sheetCount,
            recordCount: details.recordCount,
            errors: details.errors || [],
            warnings: details.warnings || [],
            processingTime: details.processingTime,
            ...details
        });
    }

    /**
     * User interaction logging
     */
    logUserInteraction(action, element, details = {}) {
        this.logUser('DEBUG', `User interaction: ${action}`, {
            action: action,
            element: element,
            elementId: details.elementId,
            elementClass: details.elementClass,
            pageX: details.pageX,
            pageY: details.pageY,
            timestamp: Date.now(),
            ...details
        });
    }

    /**
     * Storage operation logging
     */
    logStorageOperation(operation, key, details = {}) {
        this.logStorage('DEBUG', `Storage operation: ${operation}`, {
            operation: operation,
            key: key,
            dataSize: details.dataSize ? `${(JSON.stringify(details.data || '').length / 1024).toFixed(2)}KB` : 'N/A',
            success: details.success !== false,
            storageUsed: this.getStorageUsage(),
            ...details
        });
    }

    /**
     * Chart operations logging
     */
    logChartOperation(operation, chartType, details = {}) {
        this.logUI('DEBUG', `Chart operation: ${operation}`, {
            operation: operation,
            chartType: chartType,
            dataPoints: details.dataPoints,
            renderTime: details.renderTime,
            chartConfig: details.chartConfig,
            ...details
        });
    }

    /**
     * Security event logging
     */
    logSecurityEvent(event, severity, details = {}) {
        this.logSecurity(severity, `Security event: ${event}`, {
            event: event,
            severity: severity,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            ip: details.ip || 'Unknown',
            ...details
        });
    }

    /**
     * Get current localStorage usage
     */
    getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return `${(total / 1024).toFixed(2)}KB`;
    }

    /**
     * Sanitize details to prevent circular references
     */
    sanitizeDetails(details) {
        try {
            return JSON.parse(JSON.stringify(details));
        } catch (error) {
            return { error: 'Details could not be serialized', type: typeof details };
        }
    }

    /**
     * Get current stack trace
     */
    getStackTrace() {
        try {
            throw new Error();
        } catch (error) {
            return error.stack?.split('\n').slice(3, 8).join('\n') || 'Stack trace not available';
        }
    }

    /**
     * Add entry to audit log
     */
    addToAuditLog(entry) {
        try {
            let auditLog = JSON.parse(localStorage.getItem('sofun_advanced_audit') || '[]');
            auditLog.unshift(entry);
            
            // Limit size
            if (auditLog.length > this.maxEntries) {
                auditLog = auditLog.slice(0, this.maxEntries);
            }
            
            localStorage.setItem('sofun_advanced_audit', JSON.stringify(auditLog));
            
            // Update display if audit tab is active
            this.updateAdvancedAuditDisplay();
            
        } catch (error) {
            console.error('Failed to add advanced audit entry:', error);
        }
    }

    /**
     * Output to console for development
     */
    outputToConsole(entry) {
        const icon = this.logCategories[entry.category] || '📝';
        const prefix = `${icon} [${entry.category}] ${entry.relativeTime}`;
        
        switch (entry.level) {
            case 'ERROR':
                console.error(prefix, entry.message, entry.details);
                break;
            case 'WARN':
                console.warn(prefix, entry.message, entry.details);
                break;
            case 'INFO':
                console.info(prefix, entry.message, entry.details);
                break;
            case 'DEBUG':
            default:
                console.log(prefix, entry.message, entry.details);
                break;
        }
    }

    /**
     * Track page load performance
     */
    trackPageLoad() {
        window.addEventListener('load', () => {
            const nav = performance.getEntriesByType('navigation')[0];
            this.logPerformance('INFO', 'Page load completed', {
                domContentLoaded: `${nav.domContentLoadedEventEnd - nav.navigationStart}ms`,
                fullLoad: `${nav.loadEventEnd - nav.navigationStart}ms`,
                dnsLookup: `${nav.domainLookupEnd - nav.domainLookupStart}ms`,
                tcpConnect: `${nav.connectEnd - nav.connectStart}ms`,
                serverResponse: `${nav.responseEnd - nav.requestStart}ms`,
                domProcessing: `${nav.domComplete - nav.domLoading}ms`
            });
        });
    }

    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.logError('Unhandled JavaScript error', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                message: event.message
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled promise rejection', event.reason, {
                reason: event.reason,
                promise: 'Promise rejection'
            });
        });
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            const snapshot = this.getCurrentPerformanceSnapshot();
            this.logPerformance('DEBUG', 'Performance snapshot', snapshot);
        }, 30000); // Every 30 seconds
    }

    /**
     * Track errors for analysis
     */
    trackError(entry) {
        const errorKey = `${entry.details.errorName}_${entry.message}`;
        const existing = this.errorTracking.get(errorKey) || { count: 0, firstSeen: entry.timestamp };
        existing.count++;
        existing.lastSeen = entry.timestamp;
        this.errorTracking.set(errorKey, existing);
    }

    /**
     * Get audit log entries
     */
    getAuditLog(filter = {}) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('sofun_advanced_audit') || '[]');
            
            if (!filter.category && !filter.level && !filter.timeRange) {
                return auditLog;
            }
            
            return auditLog.filter(entry => {
                if (filter.category && entry.category !== filter.category) return false;
                if (filter.level && entry.level !== filter.level) return false;
                if (filter.timeRange) {
                    const entryTime = new Date(entry.timestamp).getTime();
                    const now = Date.now();
                    const timeLimit = now - (filter.timeRange * 60 * 1000); // minutes
                    if (entryTime < timeLimit) return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Failed to get audit log:', error);
            return [];
        }
    }

    /**
     * Clear audit log
     */
    clearAuditLog() {
        localStorage.removeItem('sofun_advanced_audit');
        this.logSystem('INFO', 'Advanced audit log cleared');
        this.updateAdvancedAuditDisplay();
    }

    /**
     * Export audit log
     */
    exportAuditLog() {
        const auditLog = this.getAuditLog();
        const dataStr = JSON.stringify(auditLog, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sofun_audit_log_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.logSystem('INFO', 'Audit log exported', {
            fileName: exportFileDefaultName,
            entryCount: auditLog.length
        });
    }

    /**
     * Update advanced audit display
     */
    updateAdvancedAuditDisplay() {
        const auditDiv = document.getElementById('advancedAuditLog');
        if (!auditDiv) return;
        
        const auditLog = this.getAuditLog().slice(0, 100); // Show latest 100 entries
        
        auditDiv.innerHTML = auditLog.map(entry => {
            const icon = this.logCategories[entry.category] || '📝';
            const levelClass = `audit-level-${entry.level.toLowerCase()}`;
            
            return `
                <div class="advanced-audit-entry ${levelClass}" data-category="${entry.category}">
                    <div class="audit-header">
                        <span class="audit-icon">${icon}</span>
                        <span class="audit-category">[${entry.category}]</span>
                        <span class="audit-level">${entry.level}</span>
                        <span class="audit-time">${entry.relativeTime}</span>
                        <span class="audit-timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="audit-message">${this.escapeHtml(entry.message)}</div>
                    ${Object.keys(entry.details).length > 0 ? `
                        <details class="audit-details">
                            <summary>Details</summary>
                            <pre class="audit-details-content">${this.escapeHtml(JSON.stringify(entry.details, null, 2))}</pre>
                        </details>
                    ` : ''}
                    ${entry.stackTrace && entry.level === 'ERROR' ? `
                        <details class="audit-stack">
                            <summary>Stack Trace</summary>
                            <pre class="audit-stack-content">${this.escapeHtml(entry.stackTrace)}</pre>
                        </details>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Escape HTML for safe display
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get system summary
     */
    getSystemSummary() {
        const auditLog = this.getAuditLog();
        const now = Date.now();
        const lastHour = auditLog.filter(e => (now - new Date(e.timestamp).getTime()) < 3600000);
        
        const summary = {
            totalEntries: auditLog.length,
            entriesLastHour: lastHour.length,
            errorCount: auditLog.filter(e => e.level === 'ERROR').length,
            categories: {},
            topErrors: Array.from(this.errorTracking.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
        };
        
        // Count by category
        auditLog.forEach(entry => {
            summary.categories[entry.category] = (summary.categories[entry.category] || 0) + 1;
        });
        
        return summary;
    }
}

/* ---------- Global Instance ---------- */

// Create global advanced audit logger
window.advancedAudit = new AdvancedAuditLogger();

console.log('✅ Advanced Audit Logger initialized - Technical logging enabled');