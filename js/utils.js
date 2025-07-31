/* =================================================================
   SOFUN TRACKER - UTILITIES
   Helper functions, constants, and utility methods
   ================================================================= */

/* ---------- Constants & Configuration ---------- */

// Valid Military Platoons
const VALID_PLATOONS = [
    "COY HQ",
    "Platoon 1",
    "Platoon 2", 
    "Platoon 3",
    "Platoon 4",
    "Support Platoon",
    "Admin",
    "Medical",
    "Signals",
    "Transport"
];

// Assessment Grades
const IPPT_GRADES = ['Gold', 'Silver', 'Pass', 'Fail'];
const VOC_GRADES = ['Pass', 'Fail'];
const SKILL_GRADES = ['Marksman', 'Sharpshooter', 'Pass', 'Fail'];
const MEDICAL_STATUS_OPTIONS = ['Fit', 'Light Duty', 'Excused IPPT', 'Medical Board'];

// Application Configuration
const APP_CONFIG = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedFormats: ['.xlsx', '.xls'],
    autoSaveInterval: 30000, // 30 seconds
    maxAuditEntries: 100,
    version: '2.0'
};

// Sample Names for Data Generation
const SAMPLE_NAMES = [
    'TAY JIA QING', 'TAN KAI EN TERENCE', 'QUEK ZHEN BENG', 'TAN JUN YUAN RYAN',
    'JOSHUA JOSEPH JOHN', 'LOH JIA WEI', 'BENOIT JEROME CHIA', 'CHUA SIEW TING VIVIAN',
    'AMANDA THEA TAN HUI XUAN', 'LEE JING SHENG', 'LEROY NEO EU XIANG', 'ERVIN LEE JIA LIANG',
    'WONG WEI MING', 'LIM SHENG HONG', 'CHEN YONG HAO', 'DAVID TAN WEI JIAN'
];

const RANKS = ['CPL', 'SGT', 'SSG', '1SG', '2LT', 'LTA', 'CPT'];

/* ---------- Date & Time Utilities ---------- */

/**
 * Format date string to Singapore locale
 * @param {string|Date} dateStr - Date to format
 * @returns {string} Formatted date or '-' if invalid
 */
function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-SG');
    } catch (error) {
        console.warn('Invalid date format:', dateStr);
        return '-';
    }
}

/**
 * Get current timestamp string
 * @returns {string} Current timestamp in locale string
 */
function getCurrentTimestamp() {
    return new Date().toLocaleString();
}

/**
 * Check if a date is overdue (older than 3 months)
 * @param {string} dateStr - Date string to check
 * @returns {boolean} True if overdue
 */
function isDateOverdue(dateStr) {
    if (!dateStr) return true; // No date means overdue
    try {
        const date = new Date(dateStr);
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return date < threeMonthsAgo;
    } catch (error) {
        return true; // Invalid date considered overdue
    }
}

/* ---------- Status & Grade Utilities ---------- */

/**
 * Get CSS class for status badge based on grade
 * @param {string} grade - Grade or status
 * @returns {string} CSS class name
 */
function getStatusClass(grade) {
    if (!grade || grade === '' || grade === 'Pending') return 'pending';
    return grade.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Display grade with fallback text
 * @param {string} grade - Grade to display
 * @param {string} defaultText - Fallback text
 * @returns {string} Grade or default text
 */
function displayGrade(grade, defaultText = 'Pending') {
    if (!grade || grade === '') return defaultText;
    return grade;
}

/**
 * Check if personnel has overdue assessments
 * @param {Object} person - Personnel record
 * @returns {boolean} True if any Y2 assessment is overdue
 */
function isOverdue(person) {
    if (!person || !person.y2) return false;
    
    return isDateOverdue(person.y2.ipptDate) ||
           isDateOverdue(person.y2.vocDate) ||
           isDateOverdue(person.y2.rangeDate);
}

/**
 * Get overall status of personnel based on assessment completion
 * @param {Object} person - Personnel record
 * @returns {Object} Status object with text and class
 */
function getPersonStatus(person) {
    if (!person) {
        return { text: 'Unknown', class: 'status-pending' };
    }

    const y1Complete = person.y1?.ippt && person.y1?.voc && person.y1?.atp;
    const y2Tests = [person.y2?.ippt, person.y2?.voc, person.y2?.range];
    const y2Completed = y2Tests.filter(test => test && test !== 'Pending').length;
    const isRegular = person.category === 'Regular';
    
    if (y2Completed === 3) {
        return { text: 'Y2 Completed', class: 'status-pass' };
    } else if (y2Completed > 0) {
        return { text: 'Y2 In progress', class: 'status-pending' };
    } else if (isRegular) {
        // Regular personnel skip Y1 and go directly to Y2
        return { text: 'Y2 Not started', class: 'status-silver' };
    } else if (y1Complete || (person.y1?.ippt || person.y1?.voc || person.y1?.atp)) {
        return { text: 'Y2 Not started', class: 'status-silver' };
    } else {
        return { text: 'Y1 In progress', class: 'status-exempt' };
    }
}

/* ---------- Validation Utilities ---------- */

/**
 * Validate if platoon name is valid
 * @param {string} platoonName - Platoon name to validate
 * @returns {boolean} True if valid
 */
function isValidPlatoon(platoonName) {
    return VALID_PLATOONS.includes(platoonName);
}

/**
 * Validate IPPT grade
 * @param {string} grade - IPPT grade to validate
 * @returns {boolean} True if valid
 */
function isValidIpptGrade(grade) {
    return IPPT_GRADES.includes(grade);
}

/**
 * Validate VOC result
 * @param {string} result - VOC result to validate
 * @returns {boolean} True if valid
 */
function isValidVocResult(result) {
    return VOC_GRADES.includes(result);
}

/**
 * Validate range/marksmanship result
 * @param {string} result - Range result to validate
 * @returns {boolean} True if valid
 */
function isValidRangeResult(result) {
    return SKILL_GRADES.includes(result);
}

/**
 * Sanitize personnel name for safety
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizePersonnelName(name) {
    if (!name) return '';
    return name
        .trim()
        .replace(/[<>\"']/g, '') // Remove potential HTML/script chars
        .substring(0, 100) // Limit length
        .toUpperCase(); // Military standard
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Validate date input
 * @param {string} dateString - Date string to validate
 * @param {boolean} allowFuture - Whether to allow future dates (default: false)
 * @returns {Date|null} Valid date object or null
 */
function validateDateInput(dateString, allowFuture = false) {
    if (!dateString) return null;
    
    try {
        let date;
        
        // Handle DD-MM-YY format
        if (typeof dateString === 'string' && dateString.match(/^\d{1,2}-\d{1,2}-\d{2}$/)) {
            const [day, month, year] = dateString.split('-');
            // Convert 2-digit year to 4-digit year (assuming 20xx for years 00-29, 19xx for 30-99)
            const fullYear = parseInt(year) < 30 ? 2000 + parseInt(year) : 1900 + parseInt(year);
            date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
        } else {
            date = new Date(dateString);
        }
        
        const now = new Date();
        const minDate = new Date('2020-01-01');
        
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }
        
        if (!allowFuture && date > now) {
            throw new Error('Date cannot be in the future');
        }
        
        if (date < minDate) {
            throw new Error('Date is too far in the past');
        }
        
        return date;
    } catch (error) {
        console.warn('Date validation failed:', error.message);
        return null;
    }
}

/* ---------- Data Processing Utilities ---------- */

/**
 * Generate random ORD date for NSF (3-12 months from now)
 * @returns {string} ISO date string
 */
function generateRandomOrdDate() {
    const today = new Date();
    const monthsToAdd = Math.floor(Math.random() * 9) + 3; // 3-12 months
    const ordDate = new Date(today);
    ordDate.setMonth(ordDate.getMonth() + monthsToAdd);
    return ordDate.toISOString().split('T')[0];
}

/**
 * Generate random past date within specified days
 * @param {number} maxDaysAgo - Maximum days in the past
 * @returns {string} ISO date string
 */
function generateRandomPastDate(maxDaysAgo = 180) {
    const today = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - daysAgo);
    return pastDate.toISOString().split('T')[0];
}

/**
 * Get random element from array
 * @param {Array} array - Array to select from
 * @returns {*} Random element
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Calculate completion percentage for personnel
 * @param {Array} personnelData - Array of personnel records
 * @returns {number} Completion percentage (0-100)
 */
function calculateCompletionPercentage(personnelData) {
    if (!personnelData || personnelData.length === 0) return 0;
    
    const activePersonnel = personnelData.filter(p => !p.isORD);
    const totalTests = activePersonnel.length * 6; // 6 tests per person (3 Y1 + 3 Y2)
    
    const completedTests = activePersonnel.reduce((sum, p) => {
        return sum + 
            (p.y1?.ippt ? 1 : 0) + (p.y1?.voc ? 1 : 0) + (p.y1?.atp ? 1 : 0) +
            (p.y2?.ippt ? 1 : 0) + (p.y2?.voc ? 1 : 0) + (p.y2?.range ? 1 : 0);
    }, 0);
    
    return totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;
}

/* ---------- Search & Filter Utilities ---------- */

/**
 * Check if person matches search criteria
 * @param {Object} person - Personnel record
 * @param {string} searchTerm - Search term
 * @returns {boolean} True if matches
 */
function matchesSearchTerm(person, searchTerm) {
    if (!searchTerm) return true;
    
    const searchableText = [
        person.name || '',
        person.platoon || '',
        person.unit || '',
        person.medicalStatus || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(searchTerm.toLowerCase());
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/* ---------- Error Handling Utilities ---------- */

/**
 * Log error with context
 * @param {string} context - Error context
 * @param {Error|string} error - Error object or message
 */
function logError(context, error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ${context}:`, error);
    
    // In production, you might want to send this to an error tracking service
    // Example: sendToErrorService({ context, error, timestamp });
}

/**
 * Show user-friendly error message
 * @param {string} message - Error message to display
 */
function showErrorMessage(message) {
    alert(`❌ Error: ${message}`);
    logError('User Error', message);
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccessMessage(message) {
    alert(`✅ ${message}`);
}

/* ---------- Storage Utilities ---------- */

/**
 * Check if localStorage is available
 * @returns {boolean} True if localStorage is available
 */
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Get storage size usage
 * @returns {Object} Storage usage information
 */
function getStorageUsage() {
    if (!isLocalStorageAvailable()) {
        return { used: 0, total: 0, percentage: 0 };
    }
    
    let used = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length;
        }
    }
    
    // Estimate total available (usually around 5-10MB)
    const total = 5 * 1024 * 1024; // 5MB estimate
    const percentage = Math.round((used / total) * 100);
    
    return { used, total, percentage };
}

/* ---------- Export for Module Usage (if needed) ---------- */
// If you ever convert to ES6 modules, uncomment these:
// export {
//     VALID_PLATOONS, IPPT_GRADES, VOC_GRADES, SKILL_GRADES,
//     formatDate, getStatusClass, displayGrade, isOverdue, getPersonStatus,
//     isValidPlatoon, sanitizePersonnelName, validateDateInput,
//     generateRandomOrdDate, getRandomElement, calculateCompletionPercentage,
//     matchesSearchTerm, debounce, logError, showErrorMessage, showSuccessMessage
// };

console.log('✅ SOFUN Utils loaded - Helper functions ready');