/* =================================================================
   SOFUN TRACKER - MAIN APPLICATION CONTROLLER
   Coordinates all modules and manages application lifecycle
   ================================================================= */

/**
 * SOFUN Main Application
 * Central controller that coordinates all modules and manages application state
 */
class SofunApp {
    constructor() {
        this.personnelData = [];
        this.filteredData = [];
        this.auditLog = [];
        this.currentCategory = 'nsf';
        this.initialized = false;
        this.version = APP_CONFIG.version;
    }

    /* ---------- Application Lifecycle ---------- */

    /**
     * Initialize the entire SOFUN application
     */
    async init() {
        try {
            console.log(`🚀 Initializing SOFUN Tracker v${this.version}...`);
            
            // Load saved data
            this.loadData();
            
            // Initialize all modules
            await this.initializeModules();
            
            // Setup global event handlers
            this.setupEventHandlers();
            
            // Load initial data or generate sample data
            if (this.personnelData.length === 0) {
                this.generateSampleData();
            }
            
            // Initial UI update
            this.updateAll();
            
            // Load user preferences
            this.loadUserPreferences();
            
            this.initialized = true;
            storage.addAuditEntry(`SOFUN Tracker v${this.version} initialized`);
            
            console.log('✅ SOFUN Tracker fully initialized and ready');
            showSuccessMessage('SOFUN Tracker loaded successfully!');
            
        } catch (error) {
            logError('Application initialization failed', error);
            showErrorMessage('Failed to initialize SOFUN Tracker. Please refresh the page.');
        }
    }

    /**
     * Initialize all application modules
     */
    async initializeModules() {
        try {
            // Initialize dashboard (charts)
            dashboard.init();
            
            // Initialize personnel manager
            personnelManager.init();
            
            console.log('✅ All modules initialized');
        } catch (error) {
            logError('Module initialization failed', error);
            throw error;
        }
    }

    /**
     * Setup global event handlers
     */
    setupEventHandlers() {
        try {
            // File upload handler
            const fileInput = document.getElementById('excelFile');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this.processExcelFile();
                    }
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });

            // Auto-save interval
            setInterval(() => {
                if (this.initialized && this.personnelData.length > 0) {
                    this.saveData();
                }
            }, APP_CONFIG.autoSaveInterval);

            // Window beforeunload (save data before page closes)
            window.addEventListener('beforeunload', () => {
                this.saveData();
            });

            // Storage events from other tabs
            document.addEventListener('sofun:externalUpdate', (e) => {
                console.log('Data updated in another tab, refreshing...');
                this.loadData();
                this.updateAll();
            });

            console.log('✅ Event handlers setup complete');
        } catch (error) {
            logError('Event handler setup failed', error);
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save (prevent default and trigger our save)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveData();
            showSuccessMessage('Data saved');
        }
        
        // Ctrl/Cmd + D: Toggle dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleDarkMode();
        }
        
        // Escape: Close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('editModal');
            if (modal && modal.style.display === 'block') {
                personnelManager.closeEditModal();
            }
        }
    }

    /* ---------- Data Management ---------- */

    /**
     * Load data from storage
     */
    loadData() {
        try {
            this.personnelData = storage.loadPersonnelData() || [];
            
            // Ensure auditLog is always an array
            const loadedAuditLog = storage.loadAuditLog();
            this.auditLog = Array.isArray(loadedAuditLog) ? loadedAuditLog : [];
            
            this.filteredData = [...this.personnelData];
            
            console.log(`Loaded ${this.personnelData.length} personnel records`);
        } catch (error) {
            logError('Data loading failed', error);
            this.personnelData = [];
            this.auditLog = [];
            this.filteredData = [];
        }
    }

    /**
     * Save data to storage
     */
    saveData() {
        try {
            const success = storage.savePersonnelData(this.personnelData);
            if (success) {
                storage.saveAuditLog(this.auditLog);
            }
            return success;
        } catch (error) {
            logError('Data saving failed', error);
            return false;
        }
    }

    /**
     * Add audit log entry
     * @param {string} action - Action description
     */
    addAuditEntry(action) {
        try {
            // Ensure auditLog is an array
            if (!Array.isArray(this.auditLog)) {
                console.warn('auditLog is not an array, initializing as empty array');
                this.auditLog = [];
            }
            
            const entry = {
                timestamp: getCurrentTimestamp(),
                action: action,
                user: 'Current User',
                id: Date.now()
            };
            
            this.auditLog.unshift(entry);
            
            // Limit audit log size
            if (this.auditLog.length > APP_CONFIG.maxAuditEntries) {
                this.auditLog = this.auditLog.slice(0, APP_CONFIG.maxAuditEntries);
            }
            
            // Update audit display if currently visible
            if (personnelManager.currentCategory === 'audit') {
                personnelManager.updateAuditDisplay();
            }
            
        } catch (error) {
            logError('Audit entry failed', error);
        }
    }

    /* ---------- Data Processing ---------- */

    /**
     * Process uploaded Excel file
     */
    async processExcelFile() {
        try {
            const fileInput = document.getElementById('excelFile');
            const file = fileInput?.files[0];
            
            if (!file) {
                showErrorMessage('Please select an Excel file first');
                return;
            }

            showSuccessMessage('Processing Excel file...');
            
            const result = await dataProcessor.processExcelFile(file);
            
            if (result.success) {
                this.personnelData = result.data;
                this.filteredData = [...this.personnelData];
                this.saveData();
                this.updateAll();
                this.addAuditEntry(`Imported Excel file: ${result.recordCount} records processed`);
                
                let message = `✅ Import successful!\n${result.recordCount} personnel records imported.`;
                if (result.warnings && result.warnings.length > 0) {
                    message += `\n⚠️ ${result.warnings.length} warnings (check console for details)`;
                    console.warn('Import warnings:', result.warnings);
                }
                
                showSuccessMessage(message);
            } else {
                const errorMsg = `❌ Import failed:\n${result.errors.join('\n')}`;
                showErrorMessage(errorMsg);
                this.addAuditEntry(`Excel import failed: ${result.errors.length} errors`);
            }
            
            // Clear file input
            fileInput.value = '';
            
        } catch (error) {
            logError('Excel processing error', error);
            showErrorMessage('Failed to process Excel file. Please check the file format.');
        }
    }

    /**
     * Generate sample data
     */
    generateSampleData() {
        try {
            console.log('Generating sample SOFUN data...');
            
            this.personnelData = dataProcessor.generateSampleData();
            this.filteredData = [...this.personnelData];
            this.saveData();
            this.updateAll();
            this.addAuditEntry('Generated sample data for testing');
            
            console.log(`✅ Generated ${this.personnelData.length} sample personnel records`);
        } catch (error) {
            logError('Sample data generation failed', error);
            showErrorMessage('Failed to generate sample data');
        }
    }

    /**
     * Download Excel report
     */
    downloadExcel() {
        try {
            if (this.personnelData.length === 0) {
                showErrorMessage('No personnel data to export');
                return;
            }
            
            dataProcessor.downloadExcel(this.personnelData, this.auditLog);
            this.addAuditEntry(`Downloaded Excel report (${this.personnelData.length} records)`);
        } catch (error) {
            logError('Excel download failed', error);
            showErrorMessage('Failed to generate Excel file');
        }
    }

    /**
     * Fix existing platoon names
     */
    fixExistingPlatoonNames() {
        try {
            if (this.personnelData.length === 0) {
                showErrorMessage('No personnel data found. Please load data first.');
                return;
            }
            
            const result = dataProcessor.fixExistingPlatoonNames(this.personnelData);
            
            if (result.fixedCount > 0) {
                this.saveData();
                this.updateAll();
                this.addAuditEntry(`Fixed ${result.fixedCount} invalid platoon assignments`);
                
                showSuccessMessage(
                    `✅ Success! Fixed ${result.fixedCount} personnel with invalid platoon names.\n\n` +
                    'They have been assigned to valid military platoons.\n\n' +
                    'The platoon filter now shows proper units.'
                );
            } else {
                showSuccessMessage('All platoon assignments are already valid!');
            }
        } catch (error) {
            logError('Platoon fix failed', error);
            showErrorMessage('Failed to fix platoon names');
        }
    }

    /**
     * Clear all data
     */
    clearAllData() {
        try {
            const confirmed = confirm(
                'Are you sure you want to clear all data?\n\n' +
                'This will delete:\n' +
                '• All personnel records\n' +
                '• All audit logs\n' +
                '• All user preferences\n\n' +
                'This action cannot be undone!'
            );
            
            if (!confirmed) return;
            
            this.personnelData = [];
            this.filteredData = [];
            this.auditLog = [];
            
            storage.clearAllData();
            this.updateAll();
            
            showSuccessMessage('All data has been cleared');
            console.log('✅ All SOFUN data cleared');
            
        } catch (error) {
            logError('Data clearing failed', error);
            showErrorMessage('Failed to clear data');
        }
    }

    /* ---------- Filtering & Search ---------- */

    /**
     * Apply all filters to personnel data
     */
    applyFilters() {
        try {
            this.filteredData = personnelManager.applyFilters(this.personnelData);
            this.updateAll();
        } catch (error) {
            logError('Filter application failed', error);
        }
    }

    /* ---------- UI Updates ---------- */

    /**
     * Update all UI components
     */
    updateAll() {
        try {
            if (!this.initialized) return;
            
            // Update dashboard
            dashboard.updateDashboard(this.filteredData);
            
            // Update platoon filter
            personnelManager.updatePlatoonFilter(this.personnelData);
            
            // Update all tables
            personnelManager.updateAllTables(this.filteredData);
            
            // Update audit display if visible
            if (personnelManager.currentCategory === 'audit') {
                personnelManager.updateAuditDisplay();
            }
            
        } catch (error) {
            logError('UI update failed', error);
        }
    }

    /* ---------- Theme Management ---------- */

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        try {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Update button text
            const btn = document.querySelector('.dark-mode-toggle');
            if (btn) {
                btn.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
            }
            
            // Save preference
            storage.saveDarkModePreference(isDarkMode);
            
            // Update charts theme
            dashboard.updateChartsTheme();
            
            this.addAuditEntry(`Switched to ${isDarkMode ? 'dark' : 'light'} mode`);
            
        } catch (error) {
            logError('Dark mode toggle failed', error);
        }
    }

    /**
     * Load user preferences
     */
    loadUserPreferences() {
        try {
            // Load dark mode preference
            const isDarkMode = storage.loadDarkModePreference();
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                const btn = document.querySelector('.dark-mode-toggle');
                if (btn) {
                    btn.textContent = '☀️ Light Mode';
                }
                dashboard.updateChartsTheme();
            }
            
            // Load other preferences
            const preferences = storage.loadUserPreferences();
            if (preferences.defaultCategory) {
                personnelManager.switchCategory(preferences.defaultCategory);
            }
            
        } catch (error) {
            logError('Preference loading failed', error);
        }
    }

    /* ---------- Application Info ---------- */

    /**
     * Get application statistics
     * @returns {Object} Application statistics
     */
    getAppStats() {
        const activePersonnel = this.filteredData.filter(p => !p.isORD);
        const nsfCount = activePersonnel.filter(p => p.category === 'NSF').length;
        const regularCount = activePersonnel.filter(p => p.category === 'Regular').length;
        
        return {
            version: this.version,
            totalPersonnel: this.personnelData.length,
            activePersonnel: activePersonnel.length,
            nsfPersonnel: nsfCount,
            regularPersonnel: regularCount,
            auditEntries: this.auditLog.length,
            dataCompleteness: calculateCompletionPercentage(activePersonnel),
            lastUpdated: storage.getLastUpdated(),
            storageUsage: storage.getStorageUsage()
        };
    }

    /**
     * Print application info to console
     */
    printAppInfo() {
        const stats = this.getAppStats();
        console.log('📊 SOFUN Tracker Statistics:', stats);
        return stats;
    }
}

/* ---------- Global Application Instance ---------- */

// Create global app instance
window.app = new SofunApp();

// Expose to window for global access
window.storage = storage;
window.dashboard = dashboard;
window.personnelManager = personnelManager;
window.dataProcessor = dataProcessor;

/* ---------- Global Functions for HTML onclick handlers ---------- */

/**
 * Process Excel file (global function)
 */
function processExcelFile() {
    window.app.processExcelFile();
}

/**
 * Generate sample data (global function)
 */
function generateSampleData() {
    window.app.generateSampleData();
}

/**
 * Download Excel (global function)
 */
function downloadImprovedExcel() {
    window.app.downloadExcel();
}

/**
 * Fix platoon names (global function)
 */
function fixExistingPlatoonNames() {
    window.app.fixExistingPlatoonNames();
}

/**
 * Clear all data (global function)
 */
function clearAllData() {
    window.app.clearAllData();
}

/**
 * Toggle dark mode (global function)
 */
function toggleDarkMode() {
    window.app.toggleDarkMode();
}

/**
 * Apply filters (global function)
 */
function applyFilters() {
    window.app.applyFilters();
}

/**
 * Delete the currently edited personnel
 */
function deletePersonnel() {
    const name = document.getElementById('editName')?.value?.trim();
    if (!name) {
        showErrorMessage('No personnel selected for deletion.');
        return;
    }
    if (!window.app || !window.app.personnelData) return;
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    const idx = window.app.personnelData.findIndex(p => p.name === name);
    if (idx !== -1) {
        const deleted = window.app.personnelData.splice(idx, 1)[0];
        if (window.app.saveData) window.app.saveData();
        if (window.app.updateAll) window.app.updateAll();
        if (typeof handleSearch === 'function') handleSearch();
        if (window.app.addAuditEntry) window.app.addAuditEntry(`Deleted personnel: ${name}`);
        closeEditModal();
        showSuccessMessage(`Deleted ${name}`);
    } else {
        showErrorMessage('Personnel not found.');
    }
}

/* ---------- Application Initialization ---------- */

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 SOFUN Tracker starting...');
    
    // Small delay to ensure all modules are loaded
    setTimeout(() => {
        window.app.init();
    }, 100);
});

/* ---------- Development Helpers ---------- */

// Make useful functions available in console for debugging
window.sofunDebug = {
    app: window.app,
    storage: storage,
    dashboard: dashboard,
    personnelManager: personnelManager,
    dataProcessor: dataProcessor,
    getStats: () => window.app.getAppStats(),
    printInfo: () => window.app.printAppInfo()
};

console.log('✅ SOFUN Main Application loaded - Ready to initialize!');