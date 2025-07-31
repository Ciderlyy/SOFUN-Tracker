/* =================================================================
   SOFUN TRACKER - STORAGE MANAGEMENT
   LocalStorage operations, data persistence, and storage utilities
   ================================================================= */

/**
 * SOFUN Storage Manager
 * Handles all data persistence operations
 */
class SofunStorage {
    constructor() {
        this.keys = {
            PERSONNEL_DATA: 'sofunData',
            AUDIT_LOG: 'auditLog', 
            USER_PREFERENCES: 'userPrefs',
            LAST_UPDATED: 'lastUpdated',
            DARK_MODE: 'darkMode',
            APP_VERSION: 'appVersion'
        };
        
        this.version = APP_CONFIG.version;
        this.initialized = false;
        this.init();
    }

    /**
     * Initialize storage system
     */
    init() {
        try {
            if (!isLocalStorageAvailable()) {
                console.warn('LocalStorage not available - data will not persist');
                return;
            }

            // Check for version migrations
            this.checkVersionMigration();
            this.initialized = true;
            
            console.log('✅ SOFUN Storage initialized');
        } catch (error) {
            logError('Storage initialization failed', error);
        }
    }

    /**
     * Check if version migration is needed
     */
    checkVersionMigration() {
        const savedVersion = localStorage.getItem(this.keys.APP_VERSION);
        
        if (!savedVersion) {
            // First time user - set current version
            localStorage.setItem(this.keys.APP_VERSION, this.version);
            return;
        }
        
        if (savedVersion !== this.version) {
            console.log(`Migrating data from version ${savedVersion} to ${this.version}`);
            this.migrateData(savedVersion, this.version);
            localStorage.setItem(this.keys.APP_VERSION, this.version);
        }
    }

    /**
     * Migrate data between versions
     * @param {string} fromVersion - Previous version
     * @param {string} toVersion - Target version
     */
    migrateData(fromVersion, toVersion) {
        try {
            // Add migration logic here for future versions
            console.log(`Data migration completed: ${fromVersion} → ${toVersion}`);
        } catch (error) {
            logError('Data migration failed', error);
        }
    }

    /* ---------- Personnel Data Operations ---------- */

    /**
     * Save personnel data to localStorage
     * @param {Array} data - Array of personnel records
     * @returns {boolean} Success status
     */
    savePersonnelData(data) {
        try {
            if (!this.initialized) {
                console.warn('Storage not initialized');
                return false;
            }

            const dataToSave = {
                personnel: data,
                version: this.version,
                timestamp: new Date().toISOString(),
                recordCount: data.length
            };

            const serialized = JSON.stringify(dataToSave);
            
            // Check storage space before saving
            if (this.wouldExceedQuota(serialized)) {
                this.handleStorageQuotaExceeded();
                return false;
            }

            localStorage.setItem(this.keys.PERSONNEL_DATA, serialized);
            localStorage.setItem(this.keys.LAST_UPDATED, new Date().toISOString());
            
            console.log(`✅ Saved ${data.length} personnel records`);
            return true;
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.handleStorageQuotaExceeded();
            } else {
                logError('Failed to save personnel data', error);
                showErrorMessage('Failed to save data locally. Please try again.');
            }
            return false;
        }
    }

    /**
     * Load personnel data from localStorage
     * @returns {Array} Array of personnel records
     */
    loadPersonnelData() {
        try {
            if (!this.initialized) {
                console.warn('Storage not initialized');
                return [];
            }

            const stored = localStorage.getItem(this.keys.PERSONNEL_DATA);
            if (!stored) {
                console.log('No personnel data found in storage');
                return [];
            }

            const parsed = JSON.parse(stored);
            
            // Validate stored data structure
            if (!this.validateStoredData(parsed)) {
                console.warn('Invalid stored data format, starting fresh');
                return [];
            }

            console.log(`✅ Loaded ${parsed.personnel.length} personnel records`);
            return parsed.personnel || [];
            
        } catch (error) {
            logError('Failed to load personnel data', error);
            showErrorMessage('Failed to load saved data. Starting with empty dataset.');
            return [];
        }
    }

    /**
     * Validate stored data structure
     * @param {Object} data - Data to validate
     * @returns {boolean} True if valid
     */
    validateStoredData(data) {
        return data && 
               data.personnel && 
               Array.isArray(data.personnel) &&
               data.version &&
               data.timestamp;
    }

    /* ---------- Audit Log Operations ---------- */

    /**
     * Load audit log from localStorage
     * @returns {Array} Array of audit entries
     */
    loadAuditLog() {
        try {
            if (!this.initialized) return [];

            const stored = localStorage.getItem(this.keys.AUDIT_LOG);
            if (!stored) return [];

            const parsed = JSON.parse(stored);
            
            // Ensure we return an array
            if (Array.isArray(parsed)) {
                return parsed;
            } else if (parsed && Array.isArray(parsed.entries)) {
                return parsed.entries;
            } else {
                console.warn('Invalid audit log format, returning empty array');
                return [];
            }
            
        } catch (error) {
            logError('Failed to load audit log', error);
            return [];
        }
    }

    /**
     * Save audit log to localStorage
     * @param {Array} auditLog - Array of audit entries
     * @returns {boolean} Success status
     */
    saveAuditLog(auditLog) {
        try {
            if (!this.initialized) return false;

            // Ensure auditLog is an array
            if (!Array.isArray(auditLog)) {
                console.warn('auditLog is not an array, converting to empty array');
                auditLog = [];
            }

            // Limit audit log size to prevent storage overflow
            const limitedLog = auditLog.slice(0, APP_CONFIG.maxAuditEntries);
            
            const logData = {
                entries: limitedLog,
                lastUpdated: new Date().toISOString(),
                totalEntries: auditLog.length
            };

            localStorage.setItem(this.keys.AUDIT_LOG, JSON.stringify(logData));
            return true;
            
        } catch (error) {
            logError('Failed to save audit log', error);
            return false;
        }
    }

    /**
     * Add single audit entry
     * @param {string} action - Action description
     * @param {string} user - User identifier
     */
    addAuditEntry(action, user = 'Current User') {
        try {
            const auditLog = this.loadAuditLog();
            
            const entry = {
                timestamp: getCurrentTimestamp(),
                action: action,
                user: user,
                id: Date.now() // Simple ID for tracking
            };

            auditLog.unshift(entry); // Add to beginning
            this.saveAuditLog(auditLog);
            
            // Dispatch event for UI updates
            this.dispatchStorageEvent('auditUpdated', { entry, totalEntries: auditLog.length });
            
        } catch (error) {
            logError('Failed to add audit entry', error);
        }
    }

    /* ---------- User Preferences ---------- */

    /**
     * Save user preferences
     * @param {Object} preferences - User preferences object
     */
    saveUserPreferences(preferences) {
        try {
            if (!this.initialized) return false;

            const prefData = {
                ...preferences,
                lastUpdated: new Date().toISOString()
            };

            localStorage.setItem(this.keys.USER_PREFERENCES, JSON.stringify(prefData));
            return true;
            
        } catch (error) {
            logError('Failed to save user preferences', error);
            return false;
        }
    }

    /**
     * Load user preferences
     * @returns {Object} User preferences
     */
    loadUserPreferences() {
        try {
            if (!this.initialized) return {};

            const stored = localStorage.getItem(this.keys.USER_PREFERENCES);
            if (!stored) return {};

            return JSON.parse(stored);
            
        } catch (error) {
            logError('Failed to load user preferences', error);
            return {};
        }
    }

    /**
     * Save dark mode preference
     * @param {boolean} isDarkMode - Dark mode state
     */
    saveDarkModePreference(isDarkMode) {
        try {
            localStorage.setItem(this.keys.DARK_MODE, isDarkMode.toString());
        } catch (error) {
            logError('Failed to save dark mode preference', error);
        }
    }

    /**
     * Load dark mode preference
     * @returns {boolean} Dark mode state
     */
    loadDarkModePreference() {
        try {
            return localStorage.getItem(this.keys.DARK_MODE) === 'true';
        } catch (error) {
            logError('Failed to load dark mode preference', error);
            return false;
        }
    }

    /* ---------- Storage Management ---------- */

    /**
     * Get storage usage statistics
     * @returns {Object} Storage usage info
     */
    getStorageUsage() {
        const usage = getStorageUsage();
        
        const breakdown = {};
        for (const [name, key] of Object.entries(this.keys)) {
            try {
                const data = localStorage.getItem(key);
                breakdown[name] = data ? data.length : 0;
            } catch (error) {
                breakdown[name] = 0;
            }
        }

        return {
            ...usage,
            breakdown: breakdown
        };
    }

    /**
     * Check if saving data would exceed quota
     * @param {string} data - Data to check
     * @returns {boolean} True if would exceed quota
     */
    wouldExceedQuota(data) {
        const usage = this.getStorageUsage();
        const dataSize = data.length;
        
        // Conservative estimate - flag if would use more than 80% of estimated space
        return (usage.used + dataSize) > (usage.total * 0.8);
    }

    /**
     * Handle storage quota exceeded
     */
    handleStorageQuotaExceeded() {
        try {
            console.warn('Storage quota exceeded, attempting cleanup...');
            
            // Clear old audit logs first
            this.clearOldAuditLogs();
            
            // Clear old preferences if needed
            const usage = this.getStorageUsage();
            if (usage.percentage > 90) {
                localStorage.removeItem(this.keys.USER_PREFERENCES);
                console.log('Cleared user preferences to free space');
            }
            
            showErrorMessage('Storage space low. Old data has been cleared to make room.');
            
        } catch (error) {
            logError('Failed to handle storage quota', error);
            showErrorMessage('Storage is full. Please export your data and refresh the page.');
        }
    }

    /**
     * Clear old audit log entries
     */
    clearOldAuditLogs() {
        try {
            const auditLog = this.loadAuditLog();
            const reducedLog = auditLog.slice(0, 50); // Keep only 50 most recent
            this.saveAuditLog(reducedLog);
            
            console.log(`Reduced audit log from ${auditLog.length} to ${reducedLog.length} entries`);
        } catch (error) {
            logError('Failed to clear old audit logs', error);
        }
    }

    /**
     * Export all data for backup
     * @returns {Object} All stored data
     */
    exportAllData() {
        try {
            return {
                personnel: this.loadPersonnelData(),
                auditLog: this.loadAuditLog(),
                preferences: this.loadUserPreferences(),
                exportDate: new Date().toISOString(),
                version: this.version
            };
        } catch (error) {
            logError('Failed to export data', error);
            return null;
        }
    }

    /**
     * Import data from backup
     * @param {Object} importData - Data to import
     * @returns {boolean} Success status
     */
    importData(importData) {
        try {
            if (!importData || !importData.personnel) {
                throw new Error('Invalid import data format');
            }

            // Save imported data
            this.savePersonnelData(importData.personnel);
            
            if (importData.auditLog) {
                this.saveAuditLog(importData.auditLog);
            }
            
            if (importData.preferences) {
                this.saveUserPreferences(importData.preferences);
            }

            this.addAuditEntry(`Imported data from backup (${importData.personnel.length} records)`);
            console.log('✅ Data import completed');
            return true;
            
        } catch (error) {
            logError('Failed to import data', error);
            showErrorMessage('Failed to import data. Please check the file format.');
            return false;
        }
    }

    /**
     * Clear all stored data
     */
    clearAllData() {
        try {
            for (const key of Object.values(this.keys)) {
                localStorage.removeItem(key);
            }
            
            console.log('✅ All SOFUN data cleared');
            this.dispatchStorageEvent('dataCleared');
            
        } catch (error) {
            logError('Failed to clear all data', error);
        }
    }

    /**
     * Get last updated timestamp
     * @returns {string|null} Last updated timestamp
     */
    getLastUpdated() {
        try {
            return localStorage.getItem(this.keys.LAST_UPDATED);
        } catch (error) {
            return null;
        }
    }

    /* ---------- Event System ---------- */

    /**
     * Dispatch storage-related events
     * @param {string} eventType - Type of event
     * @param {Object} data - Event data
     */
    dispatchStorageEvent(eventType, data = {}) {
        try {
            const event = new CustomEvent(`sofun:${eventType}`, {
                detail: { ...data, timestamp: new Date().toISOString() }
            });
            
            document.dispatchEvent(event);
        } catch (error) {
            logError('Failed to dispatch storage event', error);
        }
    }
}

/* ---------- Global Storage Instance ---------- */

// Create global storage instance
const storage = new SofunStorage();

/* ---------- Global Storage Functions (for backward compatibility) ---------- */

/**
 * Global function to save data (legacy support)
 * @param {Array} personnelData - Personnel data
 * @param {Array} auditLog - Audit log
 */
function saveToLocalStorage(personnelData = [], auditLog = []) {
    const success = storage.savePersonnelData(personnelData);
    if (success && auditLog.length > 0) {
        storage.saveAuditLog(auditLog);
    }
    return success;
}

/**
 * Global function to load data (legacy support)
 * @returns {Object} Loaded data
 */
function loadFromLocalStorage() {
    return {
        personnelData: storage.loadPersonnelData(),
        auditLog: storage.loadAuditLog()
    };
}

/* ---------- Storage Event Listeners ---------- */

// Listen for storage events from other tabs
window.addEventListener('storage', function(e) {
    if (Object.values(storage.keys).includes(e.key)) {
        console.log('Storage updated in another tab:', e.key);
        storage.dispatchStorageEvent('externalUpdate', {
            key: e.key,
            oldValue: e.oldValue,
            newValue: e.newValue
        });
    }
});

console.log('✅ SOFUN Storage loaded - Data persistence ready');