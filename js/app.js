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
            
            // Start initialization timer
            window.advancedAudit.startTimer('appInitialization');
            
            // Log detailed system information
            window.advancedAudit.logSystem('INFO', 'SOFUN Tracker application initialization started', {
                version: this.version,
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
                language: navigator.language,
                platform: navigator.platform,
                connectionType: (navigator as any).connection?.effectiveType || 'unknown',
                cookieEnabled: navigator.cookieEnabled,
                onlineStatus: navigator.onLine,
                timestamp: new Date().toISOString()
            });
            
            // Load saved data
            window.advancedAudit.logStorage('DEBUG', 'Loading persisted data from storage');
            this.loadData();
            
            // Initialize all modules
            window.advancedAudit.logSystem('DEBUG', 'Initializing application modules');
            await this.initializeModules();
            
            // Setup global event handlers
            window.advancedAudit.logSystem('DEBUG', 'Setting up global event handlers');
            this.setupEventHandlers();
            
            // Load initial data (no sample data for security)
            if (this.personnelData.length === 0) {
                console.log('No existing data found - starting with empty dataset');
                window.advancedAudit.logStorage('INFO', 'No existing personnel data found - clean start', {
                    isFirstRun: true,
                    storageUsage: getStorageUsage()
                });
            } else {
                window.advancedAudit.logStorage('INFO', 'Personnel data loaded successfully', {
                    recordCount: this.personnelData.length,
                    categories: {
                        nsf: this.personnelData.filter(p => p.category === 'NSF').length,
                        regular: this.personnelData.filter(p => p.category === 'Regular').length
                    },
                    storageUsage: getStorageUsage()
                });
            }
            
            // Initial UI update
            window.advancedAudit.logUI('DEBUG', 'Performing initial UI update');
            this.updateAll();
            
            // Load user preferences
            window.advancedAudit.logUser('DEBUG', 'Loading user preferences');
            this.loadUserPreferences();
            
            this.initialized = true;
            storage.addAuditEntry(`SOFUN Tracker v${this.version} initialized`);
            
            const initTime = window.advancedAudit.endTimer('appInitialization');
            
            window.advancedAudit.logSystem('INFO', 'SOFUN Tracker initialization completed successfully', {
                initializationTime: `${initTime.toFixed(2)}ms`,
                totalPersonnel: this.personnelData.length,
                modulesLoaded: ['dashboard', 'storage', 'dataProcessor', 'personnelManager', 'advancedAudit'],
                memoryUsage: getMemorySnapshot(),
                storageUsage: getStorageUsage()
            });
            
            console.log('✅ SOFUN Tracker fully initialized and ready');
            showSuccessMessage('SOFUN Tracker loaded successfully!');
            
        } catch (error) {
            logError('Application initialization failed', error);
            showErrorMessage('Failed to initialize SOFUN Tracker. Please refresh the page.');
            window.advancedAudit.logError('Critical application initialization failure', error, {
                step: 'Application initialization',
                version: this.version,
                timestamp: new Date().toISOString(),
                browser: navigator.userAgent
            });
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
                window.advancedAudit.logUser('WARN', 'File upload attempted without selecting file');
                return;
            }

            // Start performance timer
            window.advancedAudit.startTimer('excelProcessing');
            
            window.advancedAudit.logData('INFO', 'Excel file processing initiated', {
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(2)}KB`,
                fileType: file.type,
                lastModified: new Date(file.lastModified).toISOString()
            });

            showSuccessMessage('Processing Excel file...');
            
            const result = await dataProcessor.processExcelFile(file);
            
            const processingTime = window.advancedAudit.endTimer('excelProcessing');
            
            if (result.success) {
                this.personnelData = result.data;
                this.filteredData = [...this.personnelData];
                this.saveData();
                this.updateAll();
                this.addAuditEntry(`Imported Excel file: ${result.recordCount} records processed`);
                
                window.advancedAudit.logData('INFO', 'Excel import completed successfully', {
                    fileName: file.name,
                    recordCount: result.recordCount,
                    processingTime: `${processingTime.toFixed(2)}ms`,
                    warningCount: result.warnings?.length || 0,
                    dataSize: `${JSON.stringify(result.data).length} chars`,
                    categories: {
                        nsf: result.data.filter(p => p.category === 'NSF').length,
                        regular: result.data.filter(p => p.category === 'Regular').length
                    }
                });
                
                let message = `✅ Import successful!\n${result.recordCount} personnel records imported.`;
                if (result.warnings && result.warnings.length > 0) {
                    message += `\n⚠️ ${result.warnings.length} warnings (check console for details)`;
                    console.warn('Import warnings:', result.warnings);
                    
                    window.advancedAudit.logValidation('WARN', 'Excel import completed with validation warnings', {
                        warningCount: result.warnings.length,
                        sampleWarnings: result.warnings.slice(0, 3),
                        fileName: file.name
                    });
                }
                
                showSuccessMessage(message);
            } else {
                const errorMsg = `❌ Import failed:\n${result.errors.join('\n')}`;
                showErrorMessage(errorMsg);
                this.addAuditEntry(`Excel import failed: ${result.errors.length} errors`);
                
                window.advancedAudit.logError('Excel import failed with errors', new Error('Import validation failed'), {
                    fileName: file.name,
                    errorCount: result.errors.length,
                    errors: result.errors,
                    processingTime: `${processingTime.toFixed(2)}ms`,
                    fileSize: file.size
                });
            }
            
            // Clear file input
            fileInput.value = '';
            
        } catch (error) {
            logError('Excel processing error', error);
            window.advancedAudit.logError('Critical Excel processing failure', error, {
                step: 'File processing',
                hasFile: !!document.getElementById('excelFile')?.files[0],
                timestamp: new Date().toISOString()
            });
            showErrorMessage('Failed to process Excel file. Please check the file format.');
        }
    }

    /**
     * Generate sample data
     */
    // Sample data generation removed for security reasons

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
// Sample data generation removed for security reasons

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
    if (window.app && window.app.applyFilters) {
        window.app.applyFilters();
    } else {
        console.warn('App not ready for filtering');
        // Retry after a short delay if app isn't ready
        setTimeout(() => {
            if (window.app && window.app.applyFilters) {
                window.app.applyFilters();
            }
        }, 100);
    }
}

/**
 * Test filter functionality (debugging helper)
 */
function testFilters() {
    console.log('=== FILTER TEST ===');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const platoonFilter = document.getElementById('platoonFilter');
    
    console.log('Filter elements found:', {
        category: !!categoryFilter,
        status: !!statusFilter,
        platoon: !!platoonFilter
    });
    
    console.log('Current filter values:', {
        category: categoryFilter?.value,
        status: statusFilter?.value,
        platoon: platoonFilter?.value
    });
    
    if (window.app) {
        console.log('App state:', {
            initialized: window.app.initialized,
            personnelCount: window.app.personnelData?.length || 0,
            filteredCount: window.app.filteredData?.length || 0
        });
        
        // Show platoon data for debugging
        if (window.app.personnelData) {
            const platoonData = window.app.personnelData.map(p => ({
                name: p.name,
                platoon: p.platoon || '(undefined/null)',
                category: p.category
            }));
            console.log('Personnel platoon data:', platoonData);
        }
        
        // Test applying filters
        console.log('Testing filter application...');
        window.app.applyFilters();
        console.log('Filter test complete');
    } else {
        console.error('window.app not available');
    }
}

/**
 * Test platoon filter specifically
 */
function testPlatoonFilter() {
    console.log('=== PLATOON FILTER TEST ===');
    const platoonFilter = document.getElementById('platoonFilter');
    
    if (!platoonFilter) {
        console.error('Platoon filter element not found');
        return;
    }
    
    console.log('Platoon filter value:', `"${platoonFilter.value}"`);
    console.log('Available platoon options:');
    
    for (let i = 0; i < platoonFilter.options.length; i++) {
        const option = platoonFilter.options[i];
        console.log(`  ${i}: value="${option.value}", text="${option.text}"`);
    }
    
    if (window.app?.personnelData) {
        console.log('Personnel by platoon:');
        const platoonCounts = {};
        window.app.personnelData.forEach(p => {
            const platoon = p.platoon || 'undefined/null';
            platoonCounts[platoon] = (platoonCounts[platoon] || 0) + 1;
        });
        console.table(platoonCounts);
    }
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

/* ---------- System Utilities ---------- */

/**
 * Get current storage usage
 */
function getStorageUsage() {
    try {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return `${(total / 1024).toFixed(2)}KB`;
    } catch (error) {
        return 'Unable to calculate';
    }
}

/**
 * Get memory usage snapshot
 */
function getMemorySnapshot() {
    try {
        const memory = (performance as any).memory;
        if (memory) {
            return {
                used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
                limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
            };
        }
        return { status: 'Memory API not available' };
    } catch (error) {
        return { error: 'Unable to get memory info' };
    }
}

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