/* =================================================================
   SOFUN TRACKER - PERSONNEL MANAGER
   Table management, CRUD operations, filtering, and bulk actions
   ================================================================= */

/**
 * SOFUN Personnel Manager
 * Handles all personnel-related UI operations and data management
 */
class PersonnelManager {
    constructor() {
        this.currentEditIndex = -1;
        this.bulkSelectMode = false;
        this.selectedPersonnel = new Set();
        this.currentCategory = 'nsf';
        this.searchTimeout = null;
        this.initialized = false;
    }

    /* ---------- Initialization ---------- */

    /**
     * Initialize personnel manager
     */
    init() {
        try {
            this.setupEventHandlers();
            this.initialized = true;
            console.log('✅ Personnel Manager initialized');
        } catch (error) {
            logError('Personnel Manager initialization failed', error);
        }
    }

    /**
     * Setup event handlers for personnel management
     */
    setupEventHandlers() {
        // Search functionality with debounce
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', () => this.handleSearch());
        }

        // Filter changes
        ['categoryFilter', 'statusFilter', 'platoonFilter'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });

        // Edit form submission
        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEdit();
            });
        }

        // Modal close on outside click
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                this.closeEditModal();
            }
        });
    }

    /* ---------- Search & Filtering ---------- */

    /**
     * Handle search input with debounce
     */
    handleSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    /**
     * Apply all active filters to personnel data
     * @param {Array} personnelData - Full personnel dataset
     * @returns {Array} Filtered personnel data
     */
    applyFilters(personnelData = []) {
        try {
            const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
            const categoryFilter = document.getElementById('categoryFilter')?.value || '';
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            const platoonFilter = document.getElementById('platoonFilter')?.value || '';
            
            console.log('Filter values:', { searchTerm, categoryFilter, statusFilter, platoonFilter });
            console.log('Personnel data length:', personnelData.length);
            
            const filteredData = personnelData.filter(p => {
                // Search filter
                const matchesSearch = !searchTerm || matchesSearchTerm(p, searchTerm);
                
                // Category filter (empty string means "All Categories")
                const matchesCategory = !categoryFilter || categoryFilter === '' || p.category === categoryFilter;
                
                // Status filter (empty string means "All Status")
                let matchesStatus = true;
                if (statusFilter && statusFilter !== '') {
                    const personStatus = getPersonStatus(p);
                    matchesStatus = personStatus.text === statusFilter;
                }
                
                // Platoon filter (empty string means "All Platoons")
                let matchesPlatoon = true;
                if (platoonFilter && platoonFilter !== '') {
                    // Only filter if a specific platoon is selected
                    const personPlatoon = p.platoon || 'Unassigned';
                    matchesPlatoon = personPlatoon === platoonFilter;
                } else {
                    // "All Platoons" selected - show everyone
                    matchesPlatoon = true;
                }
                
                // Exclude ORD personnel
                const isActive = !p.isORD;
                
                return matchesSearch && matchesCategory && matchesStatus && matchesPlatoon && isActive;
            });
            
            console.log(`✅ Filtered ${filteredData.length} out of ${personnelData.length} personnel`);
            
            // Log some examples of filtered personnel for debugging
            if (filteredData.length > 0 && filteredData.length < 5) {
                console.log('Filtered personnel examples:', filteredData.map(p => ({
                    name: p.name,
                    category: p.category,
                    platoon: p.platoon || '(null/undefined)',
                    status: getPersonStatus(p).text
                })));
            }
            return filteredData;
        } catch (error) {
            logError('Filter application failed', error);
            return personnelData;
        }
    }

    /**
     * Update platoon filter dropdown
     * @param {Array} personnelData - Personnel data
     */
    updatePlatoonFilter(personnelData) {
        try {
            const platoonSelect = document.getElementById('platoonFilter');
            if (!platoonSelect) return;

            const allPlatoons = [...new Set(personnelData
                .map(p => p.platoon || 'Unassigned')
                .filter(platoon => platoon)
            )].sort();
            
            // Put "Unassigned" at the end if it exists
            const platoons = allPlatoons.filter(p => p !== 'Unassigned').concat(
                allPlatoons.includes('Unassigned') ? ['Unassigned'] : []
            );
            
            platoonSelect.innerHTML = '<option value="">All Platoons</option>';
            platoons.forEach(platoon => {
                const option = document.createElement('option');
                option.value = platoon;
                option.textContent = platoon;
                platoonSelect.appendChild(option);
            });
            
            console.log('Platoon filter updated with:', platoons);
            
            // Add debug event listener
            platoonSelect.addEventListener('change', (e) => {
                console.log('Platoon filter changed to:', `"${e.target.value}"`);
            });
        } catch (error) {
            logError('Platoon filter update failed', error);
        }
    }

    /* ---------- Table Management ---------- */

    /**
     * Update all personnel tables
     * @param {Array} filteredData - Filtered personnel data
     */
    updateAllTables(filteredData) {
        this.updateTable('nsf', filteredData);
        this.updateTable('regulars', filteredData);
        this.updateSummaryTable(filteredData);
    }

    /**
     * Update specific category table
     * @param {string} category - Table category (nsf/regulars)
     * @param {Array} filteredData - Filtered personnel data
     */
    updateTable(category, filteredData) {
        try {
            const tbody = document.getElementById(category + 'Body');
            if (!tbody) {
                console.warn(`Table body not found: ${category}Body`);
                return;
            }
            
            let data;
            if (category === 'nsf') {
                data = filteredData.filter(p => p.category === 'NSF');
            } else if (category === 'regulars') {
                data = filteredData.filter(p => p.category === 'Regular');
            } else {
                return;
            }
            
            tbody.innerHTML = data.map((person, index) => {
                const globalIndex = filteredData.indexOf(person);
                const serialNumber = index + 1; // Start from 1
                return this.generateTableRow(person, globalIndex, category, serialNumber);
            }).join('');
            
        } catch (error) {
            logError(`Table update failed for ${category}`, error);
        }
    }

    /**
     * Generate table row HTML
     * @param {Object} person - Personnel record
     * @param {number} globalIndex - Global index in filtered data
     * @param {string} category - Table category
     * @returns {string} HTML row string
     */
    generateTableRow(person, globalIndex, category, serialNumber) {
        const isChecked = this.selectedPersonnel.has(person.name);
        const checkboxDisplay = this.bulkSelectMode ? 'inline' : 'none';
        const status = getPersonStatus(person);
        
        if (category === 'nsf') {
            return `
                <tr>
                    <td><input type="checkbox" style="display: ${checkboxDisplay}" ${isChecked ? 'checked' : ''} onchange="personnelManager.toggleSelection('${escapeHtml(person.name)}')"></td>
                    <td class="serial-number">${serialNumber}.</td>
                    <td>${escapeHtml(person.name)}</td>
                    <td>${escapeHtml(person.platoon || '-')}</td>
                    <td>${formatDate(person.ordDate)}</td>
                    <td><span class="pes-badge">${escapeHtml(person.pes || '-')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.y1?.ippt)}">${displayGrade(person.y1?.ippt, '-')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.y1?.voc)}">${displayGrade(person.y1?.voc, '-')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.y1?.atp)}">${displayGrade(person.y1?.atp, '-')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.y2?.ippt)}">${displayGrade(person.y2?.ippt, 'Pending')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.y2?.voc)}">${displayGrade(person.y2?.voc, 'Pending')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.y2?.range)}">${displayGrade(person.y2?.range, 'Pending')}</span></td>
                    <td>${escapeHtml(person.medicalStatus || 'Fit')}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td><button class="btn btn-edit" onclick="personnelManager.openEditModal(${globalIndex})">Edit</button></td>
                </tr>
            `;
        } else { // regulars
            return `
                <tr>
                    <td><input type="checkbox" style="display: ${checkboxDisplay}" ${isChecked ? 'checked' : ''} onchange="personnelManager.toggleSelection('${escapeHtml(person.name)}')"></td>
                    <td class="serial-number">${serialNumber}.</td>
                    <td>${escapeHtml(person.name)}</td>
                    <td>${escapeHtml(person.unit || person.platoon || '-')}</td>
                    <td>${escapeHtml(person.rank || '-')}</td>
                    <td><span class="pes-badge">${escapeHtml(person.pes || '-')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.workYear?.ippt)}">${displayGrade(person.workYear?.ippt, 'Pending')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.workYear?.voc)}">${displayGrade(person.workYear?.voc, 'Pending')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.workYear?.atp)}">${displayGrade(person.workYear?.atp, 'Pending')}</span></td>
                    <td><span class="status-badge status-${getStatusClass(person.workYear?.cs)}">${displayGrade(person.workYear?.cs, 'Pending')}</span></td>
                    <td>${escapeHtml(person.medicalStatus || 'Fit')}</td>
                    <td><span class="status-badge ${status.class}">${status.text}</span></td>
                    <td><button class="btn btn-edit" onclick="personnelManager.openEditModal(${globalIndex})">Edit</button></td>
                </tr>
            `;
        }
    }

    /**
     * Update summary table
     * @param {Array} filteredData - Filtered personnel data
     */
    updateSummaryTable(filteredData) {
        try {
            const tbody = document.getElementById('summaryBody');
            if (!tbody) return;
            
            const categories = ['NSF', 'Regular'];
            const activePersonnel = filteredData.filter(p => !p.isORD);
            
            tbody.innerHTML = categories.map(cat => {
                const catPersonnel = activePersonnel.filter(p => p.category === cat);
                const y1Complete = catPersonnel.filter(p => p.y1?.ippt && p.y1?.voc && p.y1?.atp).length;
                const y2Complete = catPersonnel.filter(p => p.y2?.ippt && p.y2?.voc && p.y2?.range).length;
                const y2IpptGold = catPersonnel.filter(p => p.y2?.ippt === 'Gold').length;
                const y2VocPass = catPersonnel.filter(p => p.y2?.voc === 'Pass').length;
                const y2RangeQualified = catPersonnel.filter(p => 
                    p.y2?.range === 'Marksman' || p.y2?.range === 'Sharpshooter'
                ).length;
                const completionRate = catPersonnel.length > 0 ? 
                    Math.round((y2Complete / catPersonnel.length) * 100) : 0;
                
                const rateClass = completionRate >= 75 ? 'status-gold' : 
                                completionRate >= 50 ? 'status-silver' : 'status-pending';
                
                return `
                    <tr>
                        <td><strong>${cat}</strong></td>
                        <td>${catPersonnel.length}</td>
                        <td>${y1Complete}</td>
                        <td>${y2Complete}</td>
                        <td>${y2IpptGold}</td>
                        <td>${y2VocPass}</td>
                        <td>${y2RangeQualified}</td>
                        <td><span class="status-badge ${rateClass}">${completionRate}%</span></td>
                    </tr>
                `;
            }).join('');
            
        } catch (error) {
            logError('Summary table update failed', error);
        }
    }

    /* ---------- Category Switching ---------- */

    /**
     * Switch between personnel categories
     * @param {string} category - Category to switch to
     */
    switchCategory(category) {
        try {
            // Update tab buttons
            document.querySelectorAll('.category-tab').forEach(tab => 
                tab.classList.remove('active')
            );
            
            const activeTab = document.querySelector(`[onclick*="'${category}'"]`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
            
            // Update content visibility
            document.querySelectorAll('.category-content').forEach(content => 
                content.classList.remove('active')
            );
            
            const activeContent = document.getElementById(category);
            if (activeContent) {
                activeContent.classList.add('active');
            }
            
            this.currentCategory = category;
            
            // Update audit display if switching to audit tab
            if (category === 'audit') {
                this.updateAuditDisplay();
            }
            
        } catch (error) {
            logError('Category switching failed', error);
        }
    }

    /* ---------- Edit Modal Operations ---------- */

    /**
     * Open edit modal for personnel record
     * @param {number} index - Index in filtered data
     */
    openEditModal(index) {
        try {
            // Get the person from the global filtered data
            const person = window.app?.filteredData?.[index];
            if (!person) {
                showErrorMessage('Personnel record not found');
                return;
            }
            
            // Find the real index in the main personnel data
            this.currentEditIndex = window.app?.personnelData?.indexOf(person) ?? -1;
            
            if (this.currentEditIndex === -1) {
                showErrorMessage('Unable to locate personnel record');
                return;
            }
            
            this.populateEditForm(person);
            
            const modal = document.getElementById('editModal');
            if (modal) {
                modal.style.display = 'block';
                
                // Focus on first input
                const firstInput = modal.querySelector('input, select');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            }
            
        } catch (error) {
            logError('Edit modal opening failed', error);
            showErrorMessage('Failed to open edit form');
        }
    }

    /**
     * Populate edit form with personnel data
     * @param {Object} person - Personnel record
     */
    populateEditForm(person) {
        try {
            // Basic information
            this.setFormValue('editName', person.name);
            this.setFormValue('editPes', person.pes || '');
            this.setFormValue('editPlatoon', person.platoon || '');
            this.setFormValue('editOrdDate', person.ordDate || '');
            this.setFormValue('editMedicalStatus', person.medicalStatus || 'Fit');
            
            if (person.category === 'Regular') {
                // Show Work Year sections, hide Y1/Y2 sections
                this.toggleAssessmentSections(true);
                
                // Work Year Assessment data for Regular personnel
                this.setFormValue('editWorkYearIppt', person.workYear?.ippt || '');
                this.setFormValue('editWorkYearIpptDate', person.workYear?.ipptDate || '');
                this.setFormValue('editWorkYearVoc', person.workYear?.voc || '');
                this.setFormValue('editWorkYearVocDate', person.workYear?.vocDate || '');
                this.setFormValue('editWorkYearAtp', person.workYear?.atp || '');
                this.setFormValue('editWorkYearAtpDate', person.workYear?.atpDate || '');
                this.setFormValue('editWorkYearCs', person.workYear?.cs || '');
                this.setFormValue('editWorkYearCsDate', person.workYear?.csDate || '');
            } else {
                // Show Y1/Y2 sections, hide Work Year sections
                this.toggleAssessmentSections(false);
                
                // Y1 Assessment data for NSF personnel
                this.setFormValue('editY1Ippt', person.y1?.ippt || '');
                this.setFormValue('editY1IpptDate', person.y1?.ipptDate || '');
                this.setFormValue('editY1Voc', person.y1?.voc || '');
                this.setFormValue('editY1VocDate', person.y1?.vocDate || '');
                this.setFormValue('editY1Atp', person.y1?.atp || '');
                this.setFormValue('editY1AtpDate', person.y1?.atpDate || '');
                
                // Y2 Assessment data for NSF personnel
                this.setFormValue('editY2Ippt', person.y2?.ippt || '');
                this.setFormValue('editY2IpptDate', person.y2?.ipptDate || '');
                this.setFormValue('editY2Voc', person.y2?.voc || '');
                this.setFormValue('editY2VocDate', person.y2?.vocDate || '');
                this.setFormValue('editY2Range', person.y2?.range || '');
                this.setFormValue('editY2RangeDate', person.y2?.rangeDate || '');
            }
            
        } catch (error) {
            logError('Form population failed', error);
        }
    }

    /**
     * Toggle assessment sections based on personnel category
     * @param {boolean} isRegular - True for Regular personnel, false for NSF
     */
    toggleAssessmentSections(isRegular) {
        // Work Year sections (for Regular personnel)
        const workYearElements = [
            'workYearHeader', 'workYearIpptGroup', 'workYearVocGroup', 
            'workYearAtpGroup', 'workYearCsGroup'
        ];
        
        workYearElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = isRegular ? 'block' : 'none';
            }
        });
        
        // Y1/Y2 sections (for NSF personnel) - these are always shown for NSF
        // We don't need to hide them since they're the default
    }

    /**
     * Helper to set form field value safely
     * @param {string} id - Element ID
     * @param {string} value - Value to set
     */
    setFormValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        } else {
            console.warn(`Form element not found: ${id}`);
        }
    }

    /**
     * Close edit modal
     */
    closeEditModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEditIndex = -1;
    }

    /**
     * Save edited personnel data
     */
    saveEdit() {
        try {
            if (this.currentEditIndex === -1 || !window.app?.personnelData) {
                showErrorMessage('No personnel record selected for editing');
                return;
            }
            
            const person = window.app.personnelData[this.currentEditIndex];
            if (!person) {
                showErrorMessage('Personnel record not found');
                return;
            }
            
            // Validate and update data
            const updatedData = this.extractFormData();
            if (!this.validatePersonnelData(updatedData)) {
                return; // Validation errors already shown
            }
            
            // Update the person object
            this.updatePersonnelRecord(person, updatedData);
            
            // Save and refresh
            if (window.app.saveData) {
                window.app.saveData();
            }
            
            storage.addAuditEntry(`Updated record for ${person.name}`);
            this.closeEditModal();
            
            // Refresh the display immediately
            if (window.app && window.app.updateAll) {
                window.app.updateAll();
            } else if (window.app && window.app.applyFilters) {
                // Fallback to apply filters which should update everything
                window.app.applyFilters();
            }
            
            showSuccessMessage('Personnel record updated successfully');
            
        } catch (error) {
            logError('Personnel save failed', error);
            showErrorMessage('Failed to save personnel record');
        }
    }

    /**
     * Extract data from edit form
     * @returns {Object} Form data
     */
    extractFormData() {
        return {
            name: document.getElementById('editName')?.value?.trim() || '',
            pes: document.getElementById('editPes')?.value || '',
            platoon: document.getElementById('editPlatoon')?.value || '',
            ordDate: document.getElementById('editOrdDate')?.value || '',
            medicalStatus: document.getElementById('editMedicalStatus')?.value || 'Fit',
            // Assessment data structure depends on personnel category
            ...(document.getElementById('editY1Ippt') ? {
                // NSF personnel - Y1/Y2 assessments
                y1: {
                    ippt: document.getElementById('editY1Ippt')?.value || '',
                    ipptDate: document.getElementById('editY1IpptDate')?.value || '',
                    voc: document.getElementById('editY1Voc')?.value || '',
                    vocDate: document.getElementById('editY1VocDate')?.value || '',
                    atp: document.getElementById('editY1Atp')?.value || '',
                    atpDate: document.getElementById('editY1AtpDate')?.value || ''
                },
                y2: {
                    ippt: document.getElementById('editY2Ippt')?.value || '',
                    ipptDate: document.getElementById('editY2IpptDate')?.value || '',
                    voc: document.getElementById('editY2Voc')?.value || '',
                    vocDate: document.getElementById('editY2VocDate')?.value || '',
                    range: document.getElementById('editY2Range')?.value || '',
                    rangeDate: document.getElementById('editY2RangeDate')?.value || ''
                }
            } : {
                // Regular personnel - Work Year assessments
                workYear: {
                    ippt: document.getElementById('editWorkYearIppt')?.value || '',
                    ipptDate: document.getElementById('editWorkYearIpptDate')?.value || '',
                    voc: document.getElementById('editWorkYearVoc')?.value || '',
                    vocDate: document.getElementById('editWorkYearVocDate')?.value || '',
                    atp: document.getElementById('editWorkYearAtp')?.value || '',
                    atpDate: document.getElementById('editWorkYearAtpDate')?.value || '',
                    cs: document.getElementById('editWorkYearCs')?.value || '',
                    csDate: document.getElementById('editWorkYearCsDate')?.value || ''
                }
            })
        };
    }

    /**
     * Validate personnel data
     * @param {Object} data - Data to validate
     * @returns {boolean} True if valid
     */
    validatePersonnelData(data) {
        if (!data.name) {
            showErrorMessage('Personnel name is required');
            return false;
        }
        
        if (data.platoon && !isValidPlatoon(data.platoon)) {
            showErrorMessage(`Invalid platoon: ${data.platoon}`);
            return false;
        }
        
        // Validate dates
        const dateFields = [
            'ordDate', 'y1.ipptDate', 'y1.vocDate', 'y1.atpDate',
            'y2.ipptDate', 'y2.vocDate', 'y2.rangeDate'
        ];
        
        for (const field of dateFields) {
            const value = field.includes('.') ? 
                data[field.split('.')[0]]?.[field.split('.')[1]] : data[field];
            
            if (value && !validateDateInput(value)) {
                showErrorMessage(`Invalid date format in ${field}`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Update personnel record with new data
     * @param {Object} person - Personnel record to update
     * @param {Object} data - New data
     */
    updatePersonnelRecord(person, data) {
        person.name = sanitizePersonnelName(data.name);
        person.platoon = data.platoon;
        person.unit = data.platoon; // Keep unit in sync
        person.ordDate = data.ordDate;
        person.medicalStatus = data.medicalStatus;
        
        // Update Y1 data
        Object.assign(person.y1, data.y1);
        
        // Update Y2 data
        Object.assign(person.y2, data.y2);
        
        person.lastUpdated = new Date();
    }

    /* ---------- Bulk Operations ---------- */

    /**
     * Enable/disable bulk selection mode
     */
    enableBulkSelect() {
        this.bulkSelectMode = !this.bulkSelectMode;
        
        const bulkActions = document.getElementById('bulkActions');
        if (bulkActions) {
            bulkActions.classList.toggle('active', this.bulkSelectMode);
        }
        
        // Show/hide checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.style.display = this.bulkSelectMode ? 'inline' : 'none';
        });
        
        if (!this.bulkSelectMode) {
            this.clearSelection();
        }
        
        console.log(`Bulk select mode: ${this.bulkSelectMode ? 'enabled' : 'disabled'}`);
    }

    /**
     * Toggle selection of individual personnel
     * @param {string} name - Personnel name
     */
    toggleSelection(name) {
        if (this.selectedPersonnel.has(name)) {
            this.selectedPersonnel.delete(name);
        } else {
            this.selectedPersonnel.add(name);
        }
        this.updateBulkSelection();
    }

    /**
     * Select all personnel in category
     * @param {string} category - Category to select
     */
    selectAll(category) {
        const checkbox = document.getElementById(`selectAll${category.charAt(0).toUpperCase() + category.slice(1)}`);
        if (!checkbox || !window.app?.filteredData) return;
        
        const categoryData = category === 'nsf' ? 
            window.app.filteredData.filter(p => p.category === 'NSF') : 
            window.app.filteredData.filter(p => p.category === 'Regular');
        
        if (checkbox.checked) {
            categoryData.forEach(p => this.selectedPersonnel.add(p.name));
        } else {
            categoryData.forEach(p => this.selectedPersonnel.delete(p.name));
        }
        
        this.updateBulkSelection();
        this.updateAllTables(window.app.filteredData);
    }

    /**
     * Update bulk selection display
     */
    updateBulkSelection() {
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = `${this.selectedPersonnel.size} selected`;
        }
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedPersonnel.clear();
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        this.updateBulkSelection();
    }

    /**
     * Bulk update platoon assignment
     */
    bulkUpdatePlatoon() {
        if (this.selectedPersonnel.size === 0) {
            showErrorMessage('Please select personnel first');
            return;
        }
        
        const platoonChoice = prompt(
            'Select platoon for selected personnel:\n' +
            '1 - COY HQ\n' +
            '2 - Platoon 1\n' +
            '3 - Platoon 2\n' +
            '4 - Platoon 3\n\n' +
            'Enter number (1-4):'
        );
        
        let newPlatoon;
        switch(platoonChoice) {
            case '1': newPlatoon = 'COY HQ'; break;
            case '2': newPlatoon = 'Platoon 1'; break;
            case '3': newPlatoon = 'Platoon 2'; break;
            case '4': newPlatoon = 'Platoon 3'; break;
            default:
                showErrorMessage('Invalid selection. Please enter 1, 2, 3, or 4.');
                return;
        }
        
        if (!window.app?.personnelData) return;
        
        let updateCount = 0;
        this.selectedPersonnel.forEach(name => {
            const person = window.app.personnelData.find(p => p.name === name);
            if (person) {
                person.platoon = newPlatoon;
                person.unit = newPlatoon;
                updateCount++;
                storage.addAuditEntry(`Bulk update: Changed platoon to ${newPlatoon} for ${name}`);
            }
        });
        
        if (window.app.saveData) window.app.saveData();
        this.clearSelection();
        if (window.app.updateAll) window.app.updateAll();
        
        showSuccessMessage(`Updated ${updateCount} personnel to ${newPlatoon}`);
    }

    /**
     * Bulk update medical status
     */
    bulkUpdateStatus() {
        if (this.selectedPersonnel.size === 0) {
            showErrorMessage('Please select personnel first');
            return;
        }
        
        const newStatus = prompt('Enter new medical status:\n1 - Fit\n2 - Light Duty\n3 - Excused IPPT\n4 - Medical Board\n\nEnter number (1-4):');
        
        let statusText;
        switch(newStatus) {
            case '1': statusText = 'Fit'; break;
            case '2': statusText = 'Light Duty'; break;
            case '3': statusText = 'Excused IPPT'; break;
            case '4': statusText = 'Medical Board'; break;
            default:
                showErrorMessage('Invalid selection');
                return;
        }
        
        if (!window.app?.personnelData) return;
        
        let updateCount = 0;
        this.selectedPersonnel.forEach(name => {
            const person = window.app.personnelData.find(p => p.name === name);
            if (person) {
                person.medicalStatus = statusText;
                updateCount++;
                storage.addAuditEntry(`Bulk update: Changed medical status to ${statusText} for ${name}`);
            }
        });
        
        if (window.app.saveData) window.app.saveData();
        this.clearSelection();
        if (window.app.updateAll) window.app.updateAll();
        
        showSuccessMessage(`Updated medical status for ${updateCount} personnel`);
    }

    /* ---------- Audit Display ---------- */

    /**
     * Update audit log display
     */
    updateAuditDisplay() {
        try {
            const auditDiv = document.getElementById('auditLog');
            if (!auditDiv || !window.app?.auditLog) return;
            
            auditDiv.innerHTML = window.app.auditLog.map(entry => 
                `<div class="audit-entry">[${escapeHtml(entry.timestamp)}] ${escapeHtml(entry.user)}: ${escapeHtml(entry.action)}</div>`
            ).join('');
            
            // Scroll to top of audit log
            auditDiv.scrollTop = 0;
            
        } catch (error) {
            logError('Audit display update failed', error);
        }
    }
}

/* ---------- Global Personnel Manager Instance ---------- */

// Create global personnel manager instance
const personnelManager = new PersonnelManager();

/* ---------- Global Functions (for backward compatibility) ---------- */

/**
 * Switch category tabs
 * @param {string} category - Category to switch to
 */
function switchCategory(category) {
    personnelManager.switchCategory(category);
}

/**
 * Enable bulk selection
 */
function enableBulkSelect() {
    personnelManager.enableBulkSelect();
}

/**
 * Select all in category
 * @param {string} category - Category
 */
function selectAll(category) {
    personnelManager.selectAll(category);
}

/**
 * Open edit modal
 * @param {number} index - Personnel index
 */
function openEditModal(index) {
    personnelManager.openEditModal(index);
}

/**
 * Close edit modal
 */
function closeEditModal() {
    personnelManager.closeEditModal();
}

/**
 * Clear selection
 */
function clearSelection() {
    personnelManager.clearSelection();
}

/**
 * Bulk update platoon
 */
function bulkUpdatePlatoon() {
    personnelManager.bulkUpdatePlatoon();
}

/**
 * Bulk update status
 */
function bulkUpdateStatus() {
    personnelManager.bulkUpdateStatus();
}

/**
 * Handle search
 */
function handleSearch() {
    personnelManager.handleSearch();
}

/**
 * Apply filters
 */
function applyFilters() {
    if (window.app && window.app.applyFilters) {
        window.app.applyFilters();
    }
}

console.log('✅ SOFUN Personnel Manager loaded - Table operations ready');