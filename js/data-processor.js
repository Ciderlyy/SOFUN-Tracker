/* =================================================================
   SOFUN TRACKER - DATA PROCESSOR
   Excel import/export, data validation, and sample data generation
   ================================================================= */

/**
 * SOFUN Data Processor
 * Handles Excel files, data transformation, and validation
 */
class SofunDataProcessor {
    constructor() {
        this.supportedFormats = APP_CONFIG.supportedFormats;
        this.maxFileSize = APP_CONFIG.maxFileSize;
        this.processedCount = 0;
        this.errorCount = 0;
    }

    /* ---------- Excel File Processing ---------- */

    /**
     * Process uploaded Excel file (now only from 'All in one view')
     * @param {File} file - Excel file to process
     * @returns {Promise<Object>} Processing result
     */
    async processExcelFile(file) {
        try {
            console.log('Starting Excel file processing...');
            this.validateFile(file);
            const data = await file.arrayBuffer();
            // Try Web Worker if available for non-blocking parse
            let workbook;
            try {
                if (window.Worker) {
                    const worker = new Worker('js/excel-worker.js');
                    const result = await new Promise((resolve, reject) => {
                        worker.onmessage = (e) => { try { worker.terminate(); } catch(_){} resolve(e.data); };
                        worker.onerror = (e) => { try { worker.terminate(); } catch(_){} reject(e); };
                        // Clone the ArrayBuffer so transferring it to the worker does NOT detach our original copy
                        const transferableCopy = data.slice(0);
                        try {
                            worker.postMessage({ arrayBuffer: transferableCopy }, [transferableCopy]);
                        } catch (postErr) {
                            // Fallback: send without transfer list to avoid detachment in stricter environments
                            worker.postMessage({ arrayBuffer: transferableCopy });
                        }
                    });
                    if (result?.ok && (result.result.allInOneData || result.result.vocData)) {
                        // Rehydrate workbook-like minimal structure for our flow
                        workbook = { Sheets: {} };
                        if (result.result.allInOneData) workbook.Sheets['All in one view'] = XLSX.utils.aoa_to_sheet(result.result.allInOneData);
                        if (result.result.vocData) workbook.Sheets['VOC'] = XLSX.utils.aoa_to_sheet(result.result.vocData);
                    }
                }
            } catch (_) { /* fallback below */ }
            if (!workbook) {
                workbook = XLSX.read(data, { type: 'array', cellDates: true });
            }
            
            // Find the 'All in one view' sheet (case-insensitive)
            const availableSheets = Object.keys(workbook.Sheets);
            const allInOneSheetName = availableSheets.find(
                name => name.trim().toLowerCase() === 'all in one view'
            );
            if (!allInOneSheetName) {
                throw new Error('Missing required sheet: "All in one view". Please ensure your Excel file has a sheet named "All in one view".');
            }
            console.log('Found "All in one view" sheet:', allInOneSheetName);
            const sheet = workbook.Sheets[allInOneSheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // --- Extract ORD dates, Y1 window dates, and Y2 window dates from VOC sheet ---
            let ordDateMap = new Map();
            let y1WindowMap = new Map();
            let y2WindowMap = new Map();
            const vocSheetName = availableSheets.find(
                name => name.trim().toLowerCase() === 'voc'
            );
            if (vocSheetName) {
                const vocSheet = workbook.Sheets[vocSheetName];
                const vocData = XLSX.utils.sheet_to_json(vocSheet, { header: 1 });
                // Find data start row in VOC (skip headers)
                let vocDataStartRow = 4;
                for (let i = 0; i < Math.min(10, vocData.length); i++) {
                    const row = vocData[i];
                    if (row && row.length > 2) {
                        const rank = row[1]?.toString().trim();
                        const name = row[2]?.toString().trim();
                        if (rank && name && rank.length > 0 && name.length > 2 && !rank.toUpperCase().includes('RANK') && !name.toUpperCase().includes('NAME')) {
                            vocDataStartRow = i;
                            break;
                        }
                    }
                }
                for (let i = vocDataStartRow; i < vocData.length; i++) {
                    const row = vocData[i];
                    const name = row[2]?.toString().trim();
                    const y1WindowRaw = row[5]; // Column F (index 5) - Y1 Last Window
                    const ordRaw = row[6]; // Column G (index 6) - ORD Date
                    const y2WindowRaw = row[6]; // For this dataset, Y2 Last Window aligns with ORD Date
                    
                    if (name) {
                        const nameKey = sanitizePersonnelName(name);
                        if (y1WindowRaw) {
                            y1WindowMap.set(nameKey, this.parseDate(y1WindowRaw));
                        }
                        if (ordRaw) {
                            ordDateMap.set(nameKey, this.parseDate(ordRaw));
                        }
                        if (y2WindowRaw) {
                            y2WindowMap.set(nameKey, this.parseDate(y2WindowRaw));
                        }
                    }
                }
                console.log(`VOC sheet: Extracted ${y1WindowMap.size} Y1 window dates and ${ordDateMap.size} ORD dates`);
            }

            // Process the single sheet using new logic
            const personnelMap = new Map();
            const errors = [];
            const warnings = [];
            let currentPlatoon = '';
            let processed = 0;
            let personnelCount = 0;
            let skippedRows = 0;

            // Find the actual data starting row (skip metadata rows)
            let dataStartRow = 4; // Default: after header rows (A1:A4)
            for (let i = 0; i < Math.min(10, rawData.length); i++) {
                const row = rawData[i];
                if (row && row.length > 2) {
                    const rank = row[1]?.toString().trim();
                    const name = row[2]?.toString().trim();
                    if (rank && name && rank.length > 0 && name.length > 2 && !rank.toUpperCase().includes('RANK') && !name.toUpperCase().includes('NAME')) {
                        dataStartRow = i;
                        break;
                    }
                }
            }
            console.log(`'All in one view' sheet: Data starts at row ${dataStartRow + 1}`);

            for (let i = dataStartRow; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
                    skippedRows++;
                    continue;
                }
                // Platoon header in column A (hardened detection)
                const platoonHeaderRaw = row[0]?.toString().trim();
                let platoonHeader = '';
                if (platoonHeaderRaw) {
                    // Strict match: "PLATOON X" (X = 1-4)
                    const platoonMatch = platoonHeaderRaw.match(/^PLATOON\s*(\d)$/i);
                    if (platoonMatch) {
                        platoonHeader = `Platoon ${platoonMatch[1]}`;
                    } else {
                        // Support units (COY HQ, Support Platoon, etc.)
                        const supportUnits = [
                            'COY HQ', 'Support Platoon', 'Admin', 'Medical', 'Signals', 'Transport'
                        ];
                        for (const unit of supportUnits) {
                            if (platoonHeaderRaw.replace(/\s+/g, '').toUpperCase() === unit.replace(/\s+/g, '').toUpperCase()) {
                                platoonHeader = unit;
                                break;
                            }
                        }
                    }
                }
                if (platoonHeader) {
                    currentPlatoon = platoonHeader;
                    console.log(`Row ${i + 1}: Found platoon header (strict) "${platoonHeaderRaw}" -> "${currentPlatoon}"`);
                    continue;
                } else if (platoonHeaderRaw && platoonHeaderRaw.length > 0 && (platoonHeaderRaw.toUpperCase().includes('PLATOON') || platoonHeaderRaw.toUpperCase().includes('COY') || platoonHeaderRaw.toUpperCase().includes('HQ'))) {
                    warnings.push(`Row ${i + 1}: Ambiguous or unrecognized platoon header: "${platoonHeaderRaw}". Skipping header.`);
                    continue;
                }
                // Personnel row: must have rank (B) and name (C)
                const rank = row[1]?.toString().trim();
                const name = row[2]?.toString().trim();
                if (!rank || !name) {
                    warnings.push(`Row ${i + 1}: Missing name or rank, skipping`);
                    skippedRows++;
                    continue;
                }
                const pes = row[3]?.toString().trim();
                const service = row[4]?.toString().trim();
                // Results columns (F-O):
                const y1Ippt = row[5]?.toString().trim();
                const y1Voc = row[6]?.toString().trim();
                const y1Atp = row[7]?.toString().trim();
                const y2Ippt = row[8]?.toString().trim();
                const y2Voc = row[9]?.toString().trim();
                const y2Range = row[10]?.toString().trim();
                const workYearIppt = row[11]?.toString().trim();
                const workYearVoc = row[12]?.toString().trim();
                const workYearAtp = row[13]?.toString().trim();
                const workYearCs = row[14]?.toString().trim();
                // Build/merge personnel record
                const key = sanitizePersonnelName(name);
                // Default to NSF unless explicitly marked Regular
                const serviceUpper = (service || '').toUpperCase();
                const personnelCategory = serviceUpper.includes('REG') ? 'Regular' : 'NSF';
                if (!personnelMap.has(key)) {
                    const baseRecord = {
                        name: key,
                        category: personnelCategory,
                        platoon: currentPlatoon || 'Unassigned',
                        unit: currentPlatoon || 'Unassigned',
                        rank: rank,
                        pes: pes,
                        lastUpdated: new Date(),
                        ordDate: null,
                        isORD: false,
                        medicalStatus: 'Fit',
                        remedialTraining: []
                    };
                    
                    if (personnelCategory === 'Regular') {
                        // Regular personnel use Work Year assessments
                        baseRecord.workYear = { ippt: '', ipptDate: null, voc: '', vocDate: null, atp: '', atpDate: null, cs: '', csDate: null };
                    } else {
                        // NSF personnel use Y1/Y2 assessments  
                        baseRecord.y1 = { ippt: '', ipptDate: null, voc: '', vocDate: null, atp: '', atpDate: null };
                        baseRecord.y2 = { ippt: '', ipptDate: null, voc: '', vocDate: null, range: '', rangeDate: null };
                        baseRecord.y1WindowEndDate = null; // Y1 assessment window end date
                    }
                    
                    personnelMap.set(key, baseRecord);
                    personnelCount++;
                }
                const person = personnelMap.get(key);
                // Always update platoon, rank, pes, service
                if (currentPlatoon && person.platoon !== currentPlatoon) person.platoon = currentPlatoon;
                if (rank && person.rank !== rank) person.rank = rank;
                if (pes && person.pes !== pes) person.pes = pes;
                if (service && person.category !== personnelCategory) person.category = personnelCategory;
                // --- Assign ORD date and Y1 window date from VOC sheet if NSF ---
                if (person.category === 'NSF') {
                    if (ordDateMap.has(key)) {
                        person.ordDate = ordDateMap.get(key);
                    }
                    if (y1WindowMap.has(key)) {
                        person.y1WindowEndDate = y1WindowMap.get(key);
                    }
                    if (y2WindowMap.has(key)) {
                        person.y2WindowEndDate = y2WindowMap.get(key);
                    } else if (!person.y2WindowEndDate && person.ordDate) {
                        // Fallback: mirror ORD date if Y2 window not present
                        person.y2WindowEndDate = person.ordDate;
                    }
                }
                // Assign results based on personnel category
                if (person.category === 'Regular') {
                    // Regular personnel use Work Year assessments (columns L-O)
                    if (workYearIppt && workYearIppt.toUpperCase() !== 'MISSING' && workYearIppt.toUpperCase() !== 'NA') {
                        person.workYear.ippt = workYearIppt;
                    }
                    if (workYearVoc && workYearVoc.toUpperCase() !== 'MISSING' && workYearVoc.toUpperCase() !== 'NA') {
                        person.workYear.voc = workYearVoc;
                    }
                    if (workYearAtp && workYearAtp.toUpperCase() !== 'MISSING' && workYearAtp.toUpperCase() !== 'NA') {
                        person.workYear.atp = workYearAtp;
                    }
                    if (workYearCs && workYearCs.toUpperCase() !== 'MISSING' && workYearCs.toUpperCase() !== 'NA') {
                        person.workYear.cs = workYearCs;
                    }
                } else {
                    // NSF personnel use Y1/Y2 assessments (columns F-K)
                    if (y1Ippt && y1Ippt.toUpperCase() !== 'MISSING' && y1Ippt.toUpperCase() !== 'NA') {
                        person.y1.ippt = y1Ippt;
                    }
                    if (y1Voc && y1Voc.toUpperCase() !== 'MISSING' && y1Voc.toUpperCase() !== 'NA') {
                        person.y1.voc = y1Voc;
                    }
                    if (y1Atp && y1Atp.toUpperCase() !== 'MISSING' && y1Atp.toUpperCase() !== 'NA') {
                        person.y1.atp = y1Atp;
                    }
                    if (y2Ippt && y2Ippt.toUpperCase() !== 'MISSING' && y2Ippt.toUpperCase() !== 'NA') {
                        person.y2.ippt = y2Ippt;
                    }
                    if (y2Voc && y2Voc.toUpperCase() !== 'MISSING' && y2Voc.toUpperCase() !== 'NA') {
                        person.y2.voc = y2Voc;
                    }
                    if (y2Range && y2Range.toUpperCase() !== 'MISSING' && y2Range.toUpperCase() !== 'NA') {
                        person.y2.range = y2Range;
                    }
                }
                processed++;
            }
            const personnel = Array.from(personnelMap.values());
            personnel.forEach(person => {
                this.validateAndCleanPersonnelRecord(person, warnings);
            });
            console.log(`✅ Excel processing completed: ${personnel.length} total personnel records`);
            return {
                success: true,
                data: personnel,
                recordCount: personnel.length,
                errors: errors,
                warnings: warnings,
                originalWorkbook: workbook // Include original workbook for modified exports
            };
        } catch (error) {
            logError('Excel processing failed', error);
            return {
                success: false,
                data: [],
                recordCount: 0,
                errors: [error.message],
                warnings: []
            };
        }
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @throws {Error} If file is invalid
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (file.size > this.maxFileSize) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1);
            throw new Error(`File too large: ${sizeMB}MB. Maximum allowed: ${(this.maxFileSize / 1024 / 1024)}MB`);
        }
        
        const hasValidExtension = this.supportedFormats.some(format => 
            file.name.toLowerCase().endsWith(format)
        );
        
        if (!hasValidExtension) {
            throw new Error(`Unsupported file format. Please use: ${this.supportedFormats.join(', ')}`);
        }
    }

    /**
     * Process raw Excel data into personnel records
     * @param {Array<Array>} rawData - 2D array from Excel
     * @returns {Object} Processing result with personnel data and errors
     */
    processRawData(rawData) {
        const personnelMap = new Map();
        const errors = [];
        const warnings = [];
        let successCount = 0;
        let errorCount = 0;
        
        console.log(`Processing ${rawData.length} rows of raw data...`);
        
        // Debug: Log first few rows to understand structure
        if (rawData.length > 1) {
            console.log('Excel structure (first 3 rows):');
            for (let i = 0; i < Math.min(3, rawData.length); i++) {
                console.log(`Row ${i}:`, rawData[i]);
            }
        }
        
        for (let i = 1; i < rawData.length; i++) { // Skip header row
            const row = rawData[i];
            if (!row || row.length < 6) {
                warnings.push(`Row ${i + 1}: Insufficient data, skipping`);
                continue;
            }
            
            try {
                const result = this.processDataRow(row, i + 1);
                if (result.error) {
                    errors.push(`Row ${i + 1}: ${result.error}`);
                    errorCount++;
                    continue;
                }
                
                const { personName, personnelCategory, assessmentPhase, testType, testResult, testDate } = result;
                
                const key = personName;
                
                if (!personnelMap.has(key)) {
                    personnelMap.set(key, this.createPersonnelRecord(personName, personnelCategory, row));
                }
                
                const person = personnelMap.get(key);
                this.updatePersonnelAssessment(person, assessmentPhase, testType, testResult, testDate);
                
                successCount++;
                
            } catch (error) {
                errors.push(`Row ${i + 1}: ${error.message}`);
                errorCount++;
            }
        }
        
        const personnel = Array.from(personnelMap.values());
        
        // Post-processing validation and cleanup
        personnel.forEach(person => {
            this.validateAndCleanPersonnelRecord(person, warnings);
        });
        
        console.log(`Data processing completed: ${personnel.length} personnel, ${successCount} entries processed, ${errorCount} errors`);
        
        return {
            personnel: personnel,
            errors: errors,
            warnings: warnings,
            stats: {
                totalRows: rawData.length - 1,
                personnelCreated: personnel.length,
                entriesProcessed: successCount,
                errors: errorCount,
                warnings: warnings.length
            }
        };
    }

    /**
     * Process individual data row
     * @param {Array} row - Excel row data
     * @param {number} rowNum - Row number for error reporting
     * @returns {Object} Processed row data or error
     */
    processDataRow(row, rowNum) {
        try {
            const personName = row[2]?.toString().trim();
            const assessmentPhase = row[3]?.toString().trim();
            const platoon = row[4]?.toString().trim();
            const testType = row[5]?.toString().trim();
            
            if (!personName) {
                return { error: 'Missing personnel name' };
            }
            
            if (!assessmentPhase) {
                return { error: 'Missing assessment phase' };
            }
            
            if (!testType) {
                return { error: 'Missing test type' };
            }
            
            const isRegular = assessmentPhase.toUpperCase() === 'REG';
            const personnelCategory = isRegular ? 'Regular' : 'NSF';
            
            // Extract test result and date based on test type
            let testResult = '';
            let testDate = null;
            
            switch(testType.toUpperCase()) {
                case 'IPPT':
                    testResult = row[6]?.toString().trim() || '';
                    testDate = this.parseDate(row[7]);
                    break;
                case 'VOC':
                    testResult = row[9]?.toString().trim() || '';
                    testDate = this.parseDate(row[10]);
                    break;
                case 'CS':
                case 'RANGE':
                    testResult = row[13]?.toString().trim() || '';
                    testDate = this.parseDate(row[14]);
                    break;
                case 'ATP':
                    testResult = row[11]?.toString().trim() || '';
                    testDate = this.parseDate(row[12]);
                    break;
                default:
                    return { error: `Unknown test type: ${testType}` };
            }
            
            return {
                personName: sanitizePersonnelName(personName),
                personnelCategory,
                assessmentPhase: assessmentPhase.toUpperCase(),
                testType: testType.toUpperCase(),
                testResult,
                testDate,
                platoon: platoon || 'Unassigned'
            };
            
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Process data from a specific sheet (IPPT, RANGE, or VOC)
     * @param {Array<Array>} rawData - 2D array from Excel sheet
     * @param {string} sheetName - Name of the sheet being processed
     * @param {Map} personnelMap - Map to store personnel records
     * @returns {Object} Processing result
     */
    processSheetData(rawData, sheetName, personnelMap) {
        const errors = [];
        const warnings = [];
        let processed = 0;
        let personnelCount = 0;
        let skippedRows = 0;
        
        console.log(`Processing ${rawData.length} rows from ${sheetName} sheet...`);
        
        // Debug: Log first few rows to understand structure
        if (rawData.length > 1) {
            console.log(`${sheetName} sheet structure (first 8 rows):`);
            for (let i = 0; i < Math.min(8, rawData.length); i++) {
                console.log(`Row ${i + 1}:`, rawData[i]);
            }
        }
        
        // Find the actual data starting row (skip metadata rows)
        let dataStartRow = this.findDataStartRow(rawData, sheetName);
        console.log(`${sheetName} sheet: Data starts at row ${dataStartRow + 1}`);
        
        // Track current platoon as we process rows
        let currentPlatoon = 'Unassigned';
        
        for (let i = dataStartRow; i < rawData.length; i++) {
            const row = rawData[i];
            
            // Skip completely empty rows
            if (!row || row.length === 0 || row.every(cell => !cell || cell.toString().trim() === '')) {
                skippedRows++;
                continue;
            }
            
            // Skip rows that are mostly empty (less than 2 meaningful cells)
            const meaningfulCells = row.filter(cell => cell && cell.toString().trim().length > 0);
            if (meaningfulCells.length < 2) {
                warnings.push(`${sheetName} Row ${i + 1}: Insufficient data, skipping`);
                skippedRows++;
                continue;
            }
            
            // Check if this is a platoon header row (Column A has platoon name)
            const platoonHeader = row[0]?.toString().trim();
            if (platoonHeader && platoonHeader.length > 0 && 
                (platoonHeader.toUpperCase().includes('PLATOON') || 
                 platoonHeader.toUpperCase().includes('COY') || 
                 platoonHeader.toUpperCase().includes('HQ'))) {
                currentPlatoon = this.validatePlatoon(platoonHeader);
                console.log(`${sheetName} Row ${i + 1}: Found platoon header "${platoonHeader}" -> "${currentPlatoon}"`);
                continue; // Skip this header row
            }
            
            // Skip rows that look like formatting or metadata (no name or rank)
            const hasName = row[2] && row[2].toString().trim().length > 2; // Column C
            const hasRank = row[1] && row[1].toString().trim().length > 0; // Column B
            if (!hasName || !hasRank) {
                warnings.push(`${sheetName} Row ${i + 1}: Missing name or rank, skipping`);
                skippedRows++;
                continue;
            }
            
            try {
                const result = this.processComplexSheetRow(row, i + 1, sheetName, currentPlatoon);
                if (result.error && (result.error.startsWith('Missing'))) {
                    // Only skip if missing name or rank
                    errors.push(`${sheetName} Row ${i + 1}: ${result.error}`);
                    continue;
                }
                const { personName, personnelCategory, testResult, testDate, platoon, ordDate, rank } = result;
                // Always add the person if not already present
                const key = personName;
                if (!personnelMap.has(key)) {
                    personnelMap.set(key, this.createPersonnelRecordFromSheet(personName, personnelCategory, platoon, ordDate, rank));
                    personnelCount++;
                }
                // Always update platoon, ordDate, and rank if new info is available
                const person = personnelMap.get(key);
                if (platoon && person.platoon !== platoon) person.platoon = platoon;
                if (ordDate && person.ordDate !== ordDate) person.ordDate = ordDate;
                if (rank && person.rank !== rank) person.rank = rank;
                // Only update test results if valid
                if (testResult && testResult !== 'NA' && testResult !== 'MISSING') {
                    this.updatePersonnelFromSheet(person, sheetName, testResult, testDate);
                    processed++;
                }
            } catch (error) {
                errors.push(`${sheetName} Row ${i + 1}: ${error.message}`);
            }
        }
        
        console.log(`${sheetName} sheet: Processed ${processed} rows, skipped ${skippedRows} rows`);
        
        return {
            processed,
            personnelCount,
            errors,
            warnings
        };
    }
    
    /**
     * Find the row where actual data starts (after metadata rows)
     * @param {Array<Array>} rawData - 2D array from Excel sheet
     * @param {string} sheetName - Name of the sheet
     * @returns {number} Row index where data starts
     */
    findDataStartRow(rawData, sheetName) {
        // Look for a row that has meaningful data (rank in column B, name in column C)
        for (let i = 3; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i];
            if (row && row.length > 2) {
                const rank = row[1]?.toString().trim(); // Column B
                const name = row[2]?.toString().trim(); // Column C
                
                // Check if this looks like a data row (has rank and name)
                if (rank && name && 
                    rank.length > 0 && name.length > 2 && 
                    !rank.toUpperCase().includes('RANK') && 
                    !name.toUpperCase().includes('NAME')) {
                    return i;
                }
            }
        }
        return 4; // Default fallback
    }
    
    /**
     * Process a single row from the complex sheet format
     * @param {Array} row - Array of cell values
     * @param {number} rowNumber - Row number for error reporting
     * @param {string} sheetName - Name of the sheet
     * @param {string} currentPlatoon - Current platoon assignment
     * @returns {Object} Processed row data or error
     */
    processComplexSheetRow(row, rowNumber, sheetName, currentPlatoon) {
        // Clean and validate row data
        const cleanRow = row.map(cell => {
            if (cell === null || cell === undefined) return '';
            return cell.toString().trim();
        });
        
        // Extract data based on the complex format
        const rank = cleanRow[1] || ''; // Column B
        const name = cleanRow[2] || ''; // Column C
        const pes = cleanRow[3] || ''; // Column D
        const service = cleanRow[4] || ''; // Column E
        
        // Debug logging for data extraction
        console.log(`Row ${rowNumber} - ${sheetName}: Rank="${rank}", Name="${name}", Service="${service}", Platoon="${currentPlatoon}"`);
        
        // Validate required fields
        if (!name || name.length < 2) {
            return { error: 'Missing or invalid name' };
        }
        
        if (!rank || rank.length < 1) {
            return { error: 'Missing rank' };
        }
        
        // Determine personnel category
        const personnelCategory = service.toUpperCase() === 'NSF' ? 'NSF' : 'Regular';
        
        // Extract test result and date based on sheet type
        let testResult = '';
        let testDate = null;
        let ordDate = null;
        
        switch(sheetName.toUpperCase()) {
            case 'IPPT':
                // Column I (index 8) for Y2 result, Column L (index 11) for Regular score
                testResult = cleanRow[8] || cleanRow[11] || '';
                testDate = this.parseDate(cleanRow[9] || cleanRow[12] || ''); // Date columns
                break;
                
            case 'RANGE':
                // Column J (index 9) for Y2 result, Column L (index 11) for Regular score
                testResult = cleanRow[9] || cleanRow[11] || '';
                testDate = this.parseDate(cleanRow[10] || cleanRow[12] || ''); // Date columns
                break;
                
            case 'VOC':
                // Column K (index 10) for Y2 result, Column N (index 13) for Regular score
                testResult = cleanRow[10] || cleanRow[13] || '';
                testDate = this.parseDate(cleanRow[11] || cleanRow[14] || ''); // Date columns
                // Column G (index 6) for ORD date (Y2 last date)
                ordDate = this.parseDate(cleanRow[6] || '');
                break;
                
            default:
                return { error: `Unknown sheet type: ${sheetName}` };
        }
        
        // Always return the processed row, even if testResult is 'NA' or 'MISSING'
        console.log(`Processed ${name}: ${testResult} on ${testDate ? testDate.toISOString().split('T')[0] : 'no date'}, Platoon: ${currentPlatoon}`);
        
        return {
            personName: name.toUpperCase(),
            personnelCategory,
            testResult: testResult ? testResult.toUpperCase() : '',
            testDate,
            platoon: currentPlatoon,
            ordDate: ordDate,
            rank: rank // Include rank information
        };
    }

    /**
     * Find column index by looking for keywords in the row
     * @param {Array} row - Array of cell values
     * @param {Array} keywords - Keywords to search for
     * @returns {number} Column index or -1 if not found
     */
    findColumnIndex(row, keywords) {
        for (let i = 0; i < row.length; i++) {
            const cell = row[i].toLowerCase();
            if (keywords.some(keyword => cell.includes(keyword))) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Determine personnel category (NSF vs Regular)
     * @param {string} platoon - Platoon information
     * @param {Array} row - Full row data for additional context
     * @returns {string} 'NSF' or 'Regular'
     */
    determinePersonnelCategory(platoon, row) {
        // You can customize this logic based on your data
        // For now, assume NSF unless there's a clear indicator of Regular
        if (platoon && platoon.toUpperCase().includes('REG')) {
            return 'Regular';
        }
        return 'NSF';
    }

    /**
     * Create new personnel record from sheet data
     * @param {string} name - Personnel name
     * @param {string} category - Personnel category (NSF/Regular)
     * @param {string} platoon - Platoon assignment
     * @param {Date} ordDate - ORD date (for NSF)
     * @param {string} rank - Rank (optional)
     * @returns {Object} Personnel record
     */
    createPersonnelRecordFromSheet(name, category, platoon, ordDate, rank = null) {
        const record = {
            name: name,
            category: category,
            platoon: platoon || 'Unassigned',
            unit: platoon || 'Unassigned', // Keep unit in sync with platoon
            rank: rank || (category === 'Regular' ? null : null),
            y1: {
                ippt: '', ipptDate: null,
                voc: '', vocDate: null,
                atp: '', atpDate: null
            },
            y2: {
                ippt: '', ipptDate: null,
                voc: '', vocDate: null,
                range: '', rangeDate: null
            },
            lastUpdated: new Date(),
            ordDate: ordDate,
            isORD: false,
            medicalStatus: 'Fit',
            remedialTraining: []
        };
        
        // Validate platoon assignment
        if (!this.validatePlatoon(record.platoon)) {
            // Assign valid platoon based on category
            if (category === 'NSF') {
                record.platoon = 'Platoon 1';
            } else {
                record.platoon = 'COY HQ';
            }
        }
        
        return record;
    }

    /**
     * Update personnel record with data from sheet
     * @param {Object} person - Personnel record
     * @param {string} sheetName - Name of the sheet (IPPT, RANGE, VOC)
     * @param {string} testResult - Test result
     * @param {Date} testDate - Test date
     */
    updatePersonnelFromSheet(person, sheetName, testResult, testDate) {
        if (!testResult || !testDate) return;
        
        // Determine assessment phase based on test date
        const assessmentPhase = this.determineAssessmentPhase(testDate);
        const phaseKey = assessmentPhase.toLowerCase();
        
        // Map sheet names to test types
        let testType = '';
        switch(sheetName.toUpperCase()) {
            case 'IPPT':
                testType = 'IPPT';
                break;
            case 'RANGE':
                testType = 'RANGE';
                break;
            case 'VOC':
                testType = 'VOC';
                break;
            default:
                console.warn(`Unknown sheet type: ${sheetName}`);
                return;
        }
        
        // Update the appropriate field based on test type and phase
        switch(testType) {
            case 'IPPT':
                if (assessmentPhase === 'Y1') {
                    person.y1.ippt = testResult;
                    person.y1.ipptDate = testDate;
                } else if (assessmentPhase === 'Y2') {
                    person.y2.ippt = testResult;
                    person.y2.ipptDate = testDate;
                }
                break;
                
            case 'VOC':
                if (assessmentPhase === 'Y1') {
                    person.y1.voc = testResult;
                    person.y1.vocDate = testDate;
                } else if (assessmentPhase === 'Y2') {
                    person.y2.voc = testResult;
                    person.y2.vocDate = testDate;
                }
                break;
                
            case 'RANGE':
                if (assessmentPhase === 'Y1') {
                    person.y1.atp = testResult;
                    person.y1.atpDate = testDate;
                } else if (assessmentPhase === 'Y2') {
                    person.y2.range = testResult;
                    person.y2.rangeDate = testDate;
                }
                break;
        }
        
        person.lastUpdated = new Date();
    }

    /**
     * Validate platoon assignment
     * @param {string} platoon - Platoon name to validate
     * @returns {string} Valid platoon name
     */
    validatePlatoon(platoon) {
        if (!platoon || platoon.trim() === '') {
            return 'Unassigned';
        }
        
        const validPlatoons = [
            'Platoon 1', 'Platoon 2', 'Platoon 3', 'Platoon 4',
            'COY HQ', 'Support Platoon', 'Admin', 'Medical', 
            'Signals', 'Transport', 'Unassigned'
        ];
        
        const normalizedPlatoon = platoon.trim();
        
        // Check for exact match
        if (validPlatoons.includes(normalizedPlatoon)) {
            return normalizedPlatoon;
        }
        
        // Check for common variations
        const lowerPlatoon = normalizedPlatoon.toLowerCase();
        
        // Handle "COY HQ" variations
        if (lowerPlatoon.includes('coy') || lowerPlatoon.includes('hq') || lowerPlatoon.includes('headquarters')) {
            return 'COY HQ';
        }
        
        // Handle "Platoon" variations
        if (lowerPlatoon.includes('platoon') || lowerPlatoon.includes('plt')) {
            if (lowerPlatoon.includes('1') || lowerPlatoon.includes('one')) {
                return 'Platoon 1';
            } else if (lowerPlatoon.includes('2') || lowerPlatoon.includes('two')) {
                return 'Platoon 2';
            } else if (lowerPlatoon.includes('3') || lowerPlatoon.includes('three')) {
                return 'Platoon 3';
            } else if (lowerPlatoon.includes('4') || lowerPlatoon.includes('four')) {
                return 'Platoon 4';
            } else {
                return 'Platoon 1'; // Default to Platoon 1
            }
        }
        
        // Handle support unit variations
        if (lowerPlatoon.includes('support')) {
            return 'Support Platoon';
        } else if (lowerPlatoon.includes('admin')) {
            return 'Admin';
        } else if (lowerPlatoon.includes('medical') || lowerPlatoon.includes('med')) {
            return 'Medical';
        } else if (lowerPlatoon.includes('signal')) {
            return 'Signals';
        } else if (lowerPlatoon.includes('transport') || lowerPlatoon.includes('trans')) {
            return 'Transport';
        }
        
        // Check for partial matches
        for (const valid of validPlatoons) {
            if (valid.toLowerCase().includes(lowerPlatoon) || 
                lowerPlatoon.includes(valid.toLowerCase())) {
                return valid;
            }
        }
        
        // Default fallback
        return 'Unassigned';
    }

    /**
     * Determine assessment phase (Y1/Y2) based on test date
     * @param {Date} testDate - Test date
     * @returns {string} Assessment phase (Y1 or Y2)
     */
    determineAssessmentPhase(testDate) {
        if (!testDate) return 'Y2'; // Default to Y2 if no date
        
        const currentYear = new Date().getFullYear();
        const testYear = testDate.getFullYear();
        const testMonth = testDate.getMonth() + 1; // 0-indexed to 1-indexed
        
        // If test is from previous year, it's likely Y1
        if (testYear < currentYear) {
            return 'Y1';
        }
        
        // If test is from current year, use month to determine
        // Y1 tests typically happen in first half of year (Jan-Jun)
        // Y2 tests typically happen in second half of year (Jul-Dec)
        if (testMonth <= 6) {
            return 'Y1';
        } else {
            return 'Y2';
        }
    }

    /**
     * Parse date from various formats
     * @param {string} dateStr - Date string to parse
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseDate(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') {
            return null;
        }
        
        const cleanDate = dateStr.toString().trim();
        if (!cleanDate || cleanDate === '') {
            return null;
        }
        
        // If input is a number
        if (typeof dateStr === 'number') {
            // If it's a 6-digit number, treat as DDMMYY string
            if (dateStr >= 100000 && dateStr <= 999999) {
                dateStr = dateStr.toString();
            } else {
                // Otherwise, treat as Excel serial date
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                const date = new Date(excelEpoch.getTime() + dateStr * 86400000);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        
        // Handle DD-MM-YY format
        const ddMmYyMatch = cleanDate.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
        if (ddMmYyMatch) {
            const [, day, month, year] = ddMmYyMatch;
            const fullYear = year.length === 2 ? `20${year}` : year;
            const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Handle DD/MM/YY format
        const ddMmYySlashMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (ddMmYySlashMatch) {
            const [, day, month, year] = ddMmYySlashMatch;
            const fullYear = year.length === 2 ? `20${year}` : year;
            const date = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Handle YYYY-MM-DD format
        const isoMatch = cleanDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (isoMatch) {
            const [, year, month, day] = isoMatch;
            const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Handle compact DDMMYY format (e.g., 141125 for 14-Nov-2025)
        const compactMatch = cleanDate.match(/^(\d{2})(\d{2})(\d{2})$/);
        if (compactMatch) {
            const [, day, month, year] = compactMatch;
            // Assume 00-49 = 2000s, 50-99 = 1900s
            const fullYear = parseInt(year, 10) < 50 ? '20' + year : '19' + year;
            const date = new Date(`${fullYear}-${month}-${day}`);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Try direct Date constructor
        try {
            const date = new Date(cleanDate);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            // Continue
        }
        
        return null;
    }

    /**
     * Create new personnel record
     * @param {string} name - Personnel name
     * @param {string} category - Personnel category (NSF/Regular)
     * @param {Array} row - Original Excel row for additional data
     * @returns {Object} Personnel record
     */
    createPersonnelRecord(name, category, row) {
        // Try to extract ORD date from various possible columns
        let ordDate = null;
        if (category === 'NSF') {
            // Check common columns where ORD date might be stored
            for (let i = 7; i < Math.min(row.length, 20); i++) {
                if (row[i] && typeof row[i] === 'string' && row[i].match(/^\d{1,2}-\d{1,2}-\d{2}$/)) {
                    ordDate = this.parseDate(row[i]);
                    if (ordDate) break;
                }
            }
            // If no ORD date found, generate one
            if (!ordDate) {
                ordDate = generateRandomOrdDate();
            }
        }
        
        const record = {
            name: name,
            category: category,
            platoon: row[4]?.toString().trim() || 'Unassigned',
            unit: row[4]?.toString().trim() || 'Unassigned', // Keep unit in sync with platoon
            rank: category === 'Regular' ? getRandomElement(RANKS) : null,
            y1: {
                ippt: '', ipptDate: null,
                voc: '', vocDate: null,
                atp: '', atpDate: null
            },
            y2: {
                ippt: '', ipptDate: null,
                voc: '', vocDate: null,
                range: '', rangeDate: null
            },
            lastUpdated: new Date(),
            ordDate: ordDate,
            isORD: false,
            medicalStatus: 'Fit',
            remedialTraining: []
        };
        
        // Validate platoon assignment
        if (!isValidPlatoon(record.platoon)) {
            // Assign valid platoon based on category
            if (category === 'NSF') {
                record.platoon = getRandomElement(['Platoon 1', 'Platoon 2', 'Platoon 3']);
            } else {
                record.platoon = 'COY HQ';
            }
        }
        
        return record;
    }

    /**
     * Update personnel assessment data
     * @param {Object} person - Personnel record
     * @param {string} phase - Assessment phase (Y1/Y2)
     * @param {string} testType - Type of test
     * @param {string} result - Test result
     * @param {string} date - Test date
     */
    updatePersonnelAssessment(person, phase, testType, result, date) {
        const phaseKey = phase.toUpperCase() === 'Y1' ? 'y1' : 'y2';
        
        switch(testType.toUpperCase()) {
            case 'IPPT':
                if (result && isValidIpptGrade(result)) {
                    person[phaseKey].ippt = result;
                    person[phaseKey].ipptDate = date;
                }
                break;
            case 'VOC':
                if (result && isValidVocResult(result)) {
                    person[phaseKey].voc = result;
                    person[phaseKey].vocDate = date;
                }
                break;
            case 'CS':
            case 'RANGE':
                if (phaseKey === 'y2' && result && isValidRangeResult(result)) {
                    person[phaseKey].range = result;
                    person[phaseKey].rangeDate = date;
                }
                break;
            case 'ATP':
                if (phaseKey === 'y1' && result && isValidRangeResult(result)) {
                    person[phaseKey].atp = result;
                    person[phaseKey].atpDate = date;
                }
                break;
        }
        
        person.lastUpdated = new Date();
    }

    /**
     * Validate and clean personnel record
     * @param {Object} person - Personnel record
     * @param {Array} warnings - Warnings array to add to
     */
    validateAndCleanPersonnelRecord(person, warnings) {
        // Validate platoon
        if (!isValidPlatoon(person.platoon)) {
            warnings.push(`${person.name}: Invalid platoon "${person.platoon}", assigned to ${person.category === 'NSF' ? 'Platoon 1' : 'COY HQ'}`);
            person.platoon = person.category === 'NSF' ? 'Platoon 1' : 'COY HQ';
        }
        
        // Validate medical status
        if (!MEDICAL_STATUS_OPTIONS.includes(person.medicalStatus)) {
            person.medicalStatus = 'Fit';
        }
        
        // Validate dates - allow future dates for ORD dates
        if (person.ordDate && !validateDateInput(person.ordDate, true)) {
            warnings.push(`${person.name}: Invalid ORD date, using generated date`);
            person.ordDate = person.category === 'NSF' ? generateRandomOrdDate() : null;
        }
    }

    /* ---------- Sample Data Generation ---------- */

    /**
     * Generate sample SOFUN data for testing
     * @param {number} nsfCount - Number of NSF personnel
     * @param {number} regularCount - Number of Regular personnel
     * @returns {Array} Array of sample personnel records
     */
    // Sample data generation removed for security reasons

    // Sample person creation removed for security reasons

    /* ---------- Excel Export ---------- */

    /**
     * Download modified original Excel file (preserves original structure)
     * @param {Array} personnelData - Updated personnel data
     * @param {Object} originalWorkbook - Original Excel workbook
     * @param {string} originalFileName - Original filename
     */
    downloadModifiedExcel(personnelData, originalWorkbook, originalFileName) {
        try {
            console.log('Generating modified Excel export (preserving original structure)...');
            
            if (!originalWorkbook) {
                throw new Error('No original workbook available. Please import an Excel file first.');
            }
            
            // Clone the original workbook to avoid modifying the stored copy
            const wb = XLSX.utils.book_new();
            Object.keys(originalWorkbook.Sheets).forEach(sheetName => {
                const originalSheet = originalWorkbook.Sheets[sheetName];
                const clonedSheet = XLSX.utils.aoa_to_sheet(XLSX.utils.sheet_to_json(originalSheet, { header: 1 }));
                wb.SheetNames.push(sheetName);
                wb.Sheets[sheetName] = clonedSheet;
            });
            
            // Update the 'All in one view' sheet with current data
            this.updateAllInOneViewSheet(wb, personnelData);
            
            // Update individual assessment sheets with current data
            this.updateAssessmentSheets(wb, personnelData);
            
            // Generate filename with "Modified" prefix and timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const fileBaseName = originalFileName.replace(/\.[^/.]+$/, ""); // Remove extension
            const filename = `Modified_${fileBaseName}_${timestamp}.xlsx`;
            
            // Download the modified file
            XLSX.writeFile(wb, filename);
            
            console.log(`✅ Modified Excel export completed: ${filename}`);
            storage.addAuditEntry(`Downloaded modified Excel file: ${filename}`);
            
            return filename;
            
        } catch (error) {
            logError('Modified Excel export failed', error);
            showErrorMessage('Failed to generate modified Excel file: ' + error.message);
            return null;
        }
    }

    /**
     * Update the 'All in one view' sheet with current personnel data
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Current personnel data
     */
    updateAllInOneViewSheet(wb, personnelData) {
        const sheetName = wb.SheetNames.find(name => 
            name.trim().toLowerCase() === 'all in one view'
        );
        
        if (!sheetName) {
            console.warn('All in one view sheet not found for update');
            return;
        }
        
        const sheet = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        // Find header row (should contain 'Name' or similar)
        const headerRowIndex = data.findIndex(row => 
            row.some(cell => cell && cell.toString().toLowerCase().includes('name'))
        );
        
        if (headerRowIndex === -1) {
            console.warn('Could not find header row in All in one view sheet');
            return;
        }
        
        const headers = data[headerRowIndex];
        
        // Map column indices
        const columnMap = {};
        headers.forEach((header, index) => {
            if (header) {
                const headerStr = header.toString().toLowerCase().trim();
                if (headerStr.includes('name')) columnMap.name = index;
                if (headerStr.includes('platoon')) columnMap.platoon = index;
                if (headerStr.includes('pes')) columnMap.pes = index;
                if (headerStr.includes('ord')) columnMap.ordDate = index;
                if (headerStr.includes('medical')) columnMap.medicalStatus = index;
            }
        });
        
        // Update data rows with current personnel data
        const newData = [...data];
        
        // Clear existing data rows (keep headers)
        newData.splice(headerRowIndex + 1);
        
        // Add updated personnel data
        personnelData.forEach(person => {
            const row = new Array(headers.length).fill('');
            if (columnMap.name !== undefined) row[columnMap.name] = person.name || '';
            if (columnMap.platoon !== undefined) row[columnMap.platoon] = person.platoon || '';
            if (columnMap.pes !== undefined) row[columnMap.pes] = person.pes || '';
            if (columnMap.ordDate !== undefined) row[columnMap.ordDate] = person.ordDate || '';
            if (columnMap.medicalStatus !== undefined) row[columnMap.medicalStatus] = person.medicalStatus || 'Fit';
            newData.push(row);
        });
        
        // Replace the sheet with updated data
        wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(newData);
        console.log(`Updated 'All in one view' sheet with ${personnelData.length} personnel records`);
    }

    /**
     * Update individual assessment sheets (IPPT, VOC, RANGE) with current data
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Current personnel data
     */
    updateAssessmentSheets(wb, personnelData) {
        const assessmentSheets = ['ippt', 'voc', 'range'];
        
        assessmentSheets.forEach(assessmentType => {
            const sheetName = wb.SheetNames.find(name => 
                name.trim().toLowerCase() === assessmentType
            );
            
            if (sheetName) {
                this.updateAssessmentSheet(wb, sheetName, assessmentType, personnelData);
            }
        });
    }

    /**
     * Update a specific assessment sheet
     * @param {Object} wb - Workbook object
     * @param {string} sheetName - Sheet name
     * @param {string} assessmentType - Type of assessment (ippt, voc, range)
     * @param {Array} personnelData - Current personnel data
     */
    updateAssessmentSheet(wb, sheetName, assessmentType, personnelData) {
        try {
            const sheet = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            // Find header row
            const headerRowIndex = data.findIndex(row => 
                row.some(cell => cell && cell.toString().toLowerCase().includes('name'))
            );
            
            if (headerRowIndex === -1) {
                console.warn(`Could not find header row in ${sheetName} sheet`);
                return;
            }
            
            const headers = data[headerRowIndex];
            const nameColumnIndex = headers.findIndex(header => 
                header && header.toString().toLowerCase().includes('name')
            );
            
            if (nameColumnIndex === -1) {
                console.warn(`Could not find name column in ${sheetName} sheet`);
                return;
            }
            
            // Update existing rows with current data
            for (let rowIndex = headerRowIndex + 1; rowIndex < data.length; rowIndex++) {
                const row = data[rowIndex];
                if (!row || !row[nameColumnIndex]) continue;
                
                const personName = row[nameColumnIndex].toString().trim();
                const person = personnelData.find(p => p.name === personName);
                
                if (person) {
                    // Update assessment data based on type
                    this.updateAssessmentRowData(row, headers, person, assessmentType);
                }
            }
            
            // Replace the sheet with updated data
            wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(data);
            console.log(`Updated ${sheetName} sheet`);
            
        } catch (error) {
            console.warn(`Failed to update ${sheetName} sheet:`, error);
        }
    }

    /**
     * Update assessment row data based on assessment type
     * @param {Array} row - Row data
     * @param {Array} headers - Header row
     * @param {Object} person - Personnel data
     * @param {string} assessmentType - Type of assessment
     */
    updateAssessmentRowData(row, headers, person, assessmentType) {
        headers.forEach((header, columnIndex) => {
            if (!header) return;
            
            const headerStr = header.toString().toLowerCase().trim();
            
            // Update based on assessment type and header content
            if (assessmentType === 'ippt') {
                if (headerStr.includes('y1') && headerStr.includes('result')) {
                    row[columnIndex] = person.y1?.ippt || '';
                } else if (headerStr.includes('y2') && headerStr.includes('result')) {
                    row[columnIndex] = person.y2?.ippt || '';
                } else if (headerStr.includes('y1') && headerStr.includes('date')) {
                    row[columnIndex] = person.y1?.ipptDate || '';
                } else if (headerStr.includes('y2') && headerStr.includes('date')) {
                    row[columnIndex] = person.y2?.ipptDate || '';
                }
            } else if (assessmentType === 'voc') {
                if (headerStr.includes('y1') && headerStr.includes('result')) {
                    row[columnIndex] = person.y1?.voc || '';
                } else if (headerStr.includes('y2') && headerStr.includes('result')) {
                    row[columnIndex] = person.y2?.voc || '';
                } else if (headerStr.includes('y1') && headerStr.includes('date')) {
                    row[columnIndex] = person.y1?.vocDate || '';
                } else if (headerStr.includes('y2') && headerStr.includes('date')) {
                    row[columnIndex] = person.y2?.vocDate || '';
                }
            } else if (assessmentType === 'range') {
                if (headerStr.includes('y2') && headerStr.includes('result')) {
                    row[columnIndex] = person.y2?.range || '';
                } else if (headerStr.includes('y2') && headerStr.includes('date')) {
                    row[columnIndex] = person.y2?.rangeDate || '';
                }
            }
            
            // Update common fields
            if (headerStr.includes('platoon')) {
                row[columnIndex] = person.platoon || '';
            } else if (headerStr.includes('pes')) {
                row[columnIndex] = person.pes || '';
            } else if (headerStr.includes('medical')) {
                row[columnIndex] = person.medicalStatus || 'Fit';
            }
        });
    }

    /**
     * Download enhanced Excel report (creates new format)
     * @param {Array} personnelData - Personnel data to export
     * @param {Array} auditLog - Audit log data
     */
    downloadExcel(personnelData, auditLog = []) {
        try {
            console.log('Generating comprehensive Excel export with dashboard data...');
            
            const wb = XLSX.utils.book_new();
            
            // Create comprehensive dashboard sheets
            this.createMainDashboardSheet(wb, personnelData);
            this.createStatisticsSheet(wb, personnelData);
            this.createPlatoonAnalysisSheet(wb, personnelData);
            this.createAssessmentProgressSheet(wb, personnelData);
            this.createOverdueAssessmentsSheet(wb, personnelData);
            this.createCompletionRatesSheet(wb, personnelData);
            this.createTrendAnalysisSheet(wb, personnelData);
            
            // Create detailed personnel sheets
            this.createPersonnelSheets(wb, personnelData);
            
            // Create audit log sheet
            this.createAuditSheet(wb, auditLog);
            
            // Download the file
            const filename = `SOFUN_Tracker_Complete_Dashboard_v${APP_CONFIG.version}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);
            
            console.log(`✅ Comprehensive Excel export completed: ${filename}`);
            storage.addAuditEntry(`Downloaded comprehensive Excel report with dashboard data: ${filename}`);
            
        } catch (error) {
            logError('Excel export failed', error);
            showErrorMessage('Failed to generate Excel file. Please try again.');
        }
    }

    /**
     * Create main dashboard summary sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createMainDashboardSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        
        const dashboardData = [
            ['SOFUN Tracker - Main Dashboard Summary v' + APP_CONFIG.version, '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['Enhanced with comprehensive dashboard data and analytics', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Category', 'Total', 'Y2 IPPT Gold', 'Y2 IPPT Silver', 'Y2 VOC Pass', 'Y2 Range Qualified', 'Y1 Complete', 'Y2 Complete'],
            ...this.generateCategorySummary(activePersonnel)
        ];
        
        const dashboardWS = XLSX.utils.aoa_to_sheet(dashboardData);
        XLSX.utils.book_append_sheet(wb, dashboardWS, 'Main_Dashboard');
    }

    /**
     * Create comprehensive statistics sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createStatisticsSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        const nsfPersonnel = activePersonnel.filter(p => p.category === 'NSF');
        const regularPersonnel = activePersonnel.filter(p => p.category === 'Regular');
        
        const statsData = [
            ['SOFUN Tracker - Comprehensive Statistics', '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Overall Statistics', '', '', '', '', '', '', ''],
            ['Total Active Personnel', activePersonnel.length, '', '', '', '', '', ''],
            ['NSF Personnel', nsfPersonnel.length, '', '', '', '', '', ''],
            ['Regular Personnel', regularPersonnel.length, '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Y2 Assessment Statistics', '', '', '', '', '', '', ''],
            ['Y2 IPPT Gold', activePersonnel.filter(p => p.y2?.ippt === 'Gold').length, '', '', '', '', '', ''],
            ['Y2 IPPT Silver', activePersonnel.filter(p => p.y2?.ippt === 'Silver').length, '', '', '', '', '', ''],
            ['Y2 IPPT Pass', activePersonnel.filter(p => p.y2?.ippt === 'Pass').length, '', '', '', '', '', ''],
            ['Y2 IPPT Fail', activePersonnel.filter(p => p.y2?.ippt === 'Fail').length, '', '', '', '', '', ''],
            ['Y2 IPPT Pending', activePersonnel.filter(p => !p.y2?.ippt).length, '', '', '', '', '', ''],
            ['Y2 VOC Pass', activePersonnel.filter(p => p.y2?.voc === 'Pass').length, '', '', '', '', '', ''],
            ['Y2 VOC Fail', activePersonnel.filter(p => p.y2?.voc === 'Fail').length, '', '', '', '', '', ''],
            ['Y2 VOC Pending', activePersonnel.filter(p => !p.y2?.voc).length, '', '', '', '', '', ''],
            ['Y2 Range Marksman', activePersonnel.filter(p => p.y2?.range === 'Marksman').length, '', '', '', '', '', ''],
            ['Y2 Range Sharpshooter', activePersonnel.filter(p => p.y2?.range === 'Sharpshooter').length, '', '', '', '', '', ''],
            ['Y2 Range Pass', activePersonnel.filter(p => p.y2?.range === 'Pass').length, '', '', '', '', '', ''],
            ['Y2 Range Fail', activePersonnel.filter(p => p.y2?.range === 'Fail').length, '', '', '', '', '', ''],
            ['Y2 Range Pending', activePersonnel.filter(p => !p.y2?.range).length, '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Y1 Assessment Statistics', '', '', '', '', '', '', ''],
            ['Y1 IPPT Gold', activePersonnel.filter(p => p.y1?.ippt === 'Gold').length, '', '', '', '', '', ''],
            ['Y1 IPPT Silver', activePersonnel.filter(p => p.y1?.ippt === 'Silver').length, '', '', '', '', '', ''],
            ['Y1 IPPT Pass', activePersonnel.filter(p => p.y1?.ippt === 'Pass').length, '', '', '', '', '', ''],
            ['Y1 IPPT Fail', activePersonnel.filter(p => p.y1?.ippt === 'Fail').length, '', '', '', '', '', ''],
            ['Y1 IPPT Pending', activePersonnel.filter(p => !p.y1?.ippt).length, '', '', '', '', '', ''],
            ['Y1 VOC Pass', activePersonnel.filter(p => p.y1?.voc === 'Pass').length, '', '', '', '', '', ''],
            ['Y1 VOC Fail', activePersonnel.filter(p => p.y1?.voc === 'Fail').length, '', '', '', '', '', ''],
            ['Y1 VOC Pending', activePersonnel.filter(p => !p.y1?.voc).length, '', '', '', '', '', ''],
            ['Y1 ATP Pass', activePersonnel.filter(p => p.y1?.atp === 'Pass').length, '', '', '', '', '', ''],
            ['Y1 ATP Fail', activePersonnel.filter(p => p.y1?.atp === 'Fail').length, '', '', '', '', '', ''],
            ['Y1 ATP Pending', activePersonnel.filter(p => !p.y1?.atp).length, '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Completion Statistics', '', '', '', '', '', '', ''],
            ['Y1 Complete', activePersonnel.filter(p => p.y1?.ippt && p.y1?.voc && p.y1?.atp).length, '', '', '', '', '', ''],
            ['Y2 Complete', activePersonnel.filter(p => p.y2?.ippt && p.y2?.voc && p.y2?.range).length, '', '', '', '', '', ''],
            ['Overall Complete', activePersonnel.filter(p => 
                (p.y1?.ippt && p.y1?.voc && p.y1?.atp) && (p.y2?.ippt && p.y2?.voc && p.y2?.range)
            ).length, '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Medical Status Statistics', '', '', '', '', '', '', ''],
            ['Fit', activePersonnel.filter(p => p.medicalStatus === 'Fit').length, '', '', '', '', '', ''],
            ['Light Duty', activePersonnel.filter(p => p.medicalStatus === 'Light Duty').length, '', '', '', '', '', ''],
            ['Excused IPPT', activePersonnel.filter(p => p.medicalStatus === 'Excused IPPT').length, '', '', '', '', '', ''],
            ['Medical Board', activePersonnel.filter(p => p.medicalStatus === 'Medical Board').length, '', '', '', '', '', ''],
            ['Not Specified', activePersonnel.filter(p => !p.medicalStatus).length, '', '', '', '', '', '']
        ];
        
        const statsWS = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, statsWS, 'Statistics');
    }

    /**
     * Create platoon analysis sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createPlatoonAnalysisSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        const platoons = [...new Set(activePersonnel.map(p => p.platoon).filter(Boolean))];
        
        const platoonData = [
            ['SOFUN Tracker - Platoon Analysis', '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Platoon', 'Total Personnel', 'NSF', 'Regular', 'Y1 Complete', 'Y2 Complete', 'Overall Complete', 'Medical Issues'],
            ...platoons.map(platoon => {
                const platoonPersonnel = activePersonnel.filter(p => p.platoon === platoon);
                const nsfCount = platoonPersonnel.filter(p => p.category === 'NSF').length;
                const regularCount = platoonPersonnel.filter(p => p.category === 'Regular').length;
                const y1Complete = platoonPersonnel.filter(p => p.y1?.ippt && p.y1?.voc && p.y1?.atp).length;
                const y2Complete = platoonPersonnel.filter(p => p.y2?.ippt && p.y2?.voc && p.y2?.range).length;
                const overallComplete = platoonPersonnel.filter(p => 
                    (p.y1?.ippt && p.y1?.voc && p.y1?.atp) && (p.y2?.ippt && p.y2?.voc && p.y2?.range)
                ).length;
                const medicalIssues = platoonPersonnel.filter(p => 
                    p.medicalStatus && p.medicalStatus !== 'Fit'
                ).length;
                
                return [
                    platoon,
                    platoonPersonnel.length,
                    nsfCount,
                    regularCount,
                    y1Complete,
                    y2Complete,
                    overallComplete,
                    medicalIssues
                ];
            })
        ];
        
        const platoonWS = XLSX.utils.aoa_to_sheet(platoonData);
        XLSX.utils.book_append_sheet(wb, platoonWS, 'Platoon_Analysis');
    }

    /**
     * Create assessment progress sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createAssessmentProgressSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        
        const progressData = [
            ['SOFUN Tracker - Assessment Progress Analysis', '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Assessment Type', 'Total Personnel', 'Completed', 'Pending', 'Pass Rate', 'Gold/Silver Rate', 'Average Grade', 'Notes'],
            ['Y2 IPPT', activePersonnel.length, 
             activePersonnel.filter(p => p.y2?.ippt).length,
             activePersonnel.filter(p => !p.y2?.ippt).length,
             this.calculatePassRate(activePersonnel, 'y2', 'ippt') + '%',
             this.calculateGoldSilverRate(activePersonnel, 'y2', 'ippt') + '%',
             this.calculateAverageGrade(activePersonnel, 'y2', 'ippt'),
             'Fitness assessment'
            ],
            ['Y2 VOC', activePersonnel.length,
             activePersonnel.filter(p => p.y2?.voc).length,
             activePersonnel.filter(p => !p.y2?.voc).length,
             this.calculatePassRate(activePersonnel, 'y2', 'voc') + '%',
             'N/A',
             this.calculateAverageGrade(activePersonnel, 'y2', 'voc'),
             'Vocational assessment'
            ],
            ['Y2 Range', activePersonnel.length,
             activePersonnel.filter(p => p.y2?.range).length,
             activePersonnel.filter(p => !p.y2?.range).length,
             this.calculatePassRate(activePersonnel, 'y2', 'range') + '%',
             this.calculateMarksmanRate(activePersonnel, 'y2', 'range') + '%',
             this.calculateAverageGrade(activePersonnel, 'y2', 'range'),
             'Marksmanship assessment'
            ],
            ['Y1 IPPT', activePersonnel.length,
             activePersonnel.filter(p => p.y1?.ippt).length,
             activePersonnel.filter(p => !p.y1?.ippt).length,
             this.calculatePassRate(activePersonnel, 'y1', 'ippt') + '%',
             this.calculateGoldSilverRate(activePersonnel, 'y1', 'ippt') + '%',
             this.calculateAverageGrade(activePersonnel, 'y1', 'ippt'),
             'Initial fitness assessment'
            ],
            ['Y1 VOC', activePersonnel.length,
             activePersonnel.filter(p => p.y1?.voc).length,
             activePersonnel.filter(p => !p.y1?.voc).length,
             this.calculatePassRate(activePersonnel, 'y1', 'voc') + '%',
             'N/A',
             this.calculateAverageGrade(activePersonnel, 'y1', 'voc'),
             'Initial vocational assessment'
            ],
            ['Y1 ATP', activePersonnel.length,
             activePersonnel.filter(p => p.y1?.atp).length,
             activePersonnel.filter(p => !p.y1?.atp).length,
             this.calculatePassRate(activePersonnel, 'y1', 'atp') + '%',
             'N/A',
             this.calculateAverageGrade(activePersonnel, 'y1', 'atp'),
             'Advanced training assessment'
            ]
        ];
        
        const progressWS = XLSX.utils.aoa_to_sheet(progressData);
        XLSX.utils.book_append_sheet(wb, progressWS, 'Assessment_Progress');
    }

    /**
     * Create overdue assessments sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createOverdueAssessmentsSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        
        const overdueData = [
            ['SOFUN Tracker - Overdue Assessments Report', '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Name', 'Platoon', 'Category', 'Assessment Type', 'Last Test Date', 'Days Overdue', 'Status', 'Priority']
        ];
        
        // Check for overdue assessments
        const overdueAssessments = [];
        
        activePersonnel.forEach(person => {
            // Check Y2 assessments
            if (!person.y2?.ippt) {
                overdueAssessments.push([
                    person.name,
                    person.platoon || '',
                    person.category,
                    'Y2 IPPT',
                    person.y2?.ipptDate || 'Not taken',
                    'Overdue',
                    'Pending',
                    'High'
                ]);
            }
            
            if (!person.y2?.voc) {
                overdueAssessments.push([
                    person.name,
                    person.platoon || '',
                    person.category,
                    'Y2 VOC',
                    person.y2?.vocDate || 'Not taken',
                    'Overdue',
                    'Pending',
                    'High'
                ]);
            }
            
            if (!person.y2?.range) {
                overdueAssessments.push([
                    person.name,
                    person.platoon || '',
                    person.category,
                    'Y2 Range',
                    person.y2?.rangeDate || 'Not taken',
                    'Overdue',
                    'Pending',
                    'High'
                ]);
            }
            
            // Check Y1 assessments for NSF
            if (person.category === 'NSF') {
                if (!person.y1?.ippt) {
                    overdueAssessments.push([
                        person.name,
                        person.platoon || '',
                        person.category,
                        'Y1 IPPT',
                        person.y1?.ipptDate || 'Not taken',
                        'Overdue',
                        'Pending',
                        'Medium'
                    ]);
                }
                
                if (!person.y1?.voc) {
                    overdueAssessments.push([
                        person.name,
                        person.platoon || '',
                        person.category,
                        'Y1 VOC',
                        person.y1?.vocDate || 'Not taken',
                        'Overdue',
                        'Pending',
                        'Medium'
                    ]);
                }
                
                if (!person.y1?.atp) {
                    overdueAssessments.push([
                        person.name,
                        person.platoon || '',
                        person.category,
                        'Y1 ATP',
                        person.y1?.atpDate || 'Not taken',
                        'Overdue',
                        'Pending',
                        'Medium'
                    ]);
                }
            }
        });
        
        overdueData.push(...overdueAssessments);
        
        const overdueWS = XLSX.utils.aoa_to_sheet(overdueData);
        XLSX.utils.book_append_sheet(wb, overdueWS, 'Overdue_Assessments');
    }

    /**
     * Create completion rates sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createCompletionRatesSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        
        const completionData = [
            ['SOFUN Tracker - Completion Rates Analysis', '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Category', 'Total Personnel', 'Y1 Complete', 'Y2 Complete', 'Overall Complete', 'Y1 Rate', 'Y2 Rate', 'Overall Rate'],
            ...['NSF', 'Regular'].map(category => {
                const catPersonnel = activePersonnel.filter(p => p.category === category);
                const y1Complete = catPersonnel.filter(p => p.y1?.ippt && p.y1?.voc && p.y1?.atp).length;
                const y2Complete = catPersonnel.filter(p => p.y2?.ippt && p.y2?.voc && p.y2?.range).length;
                const overallComplete = catPersonnel.filter(p => 
                    (p.y1?.ippt && p.y1?.voc && p.y1?.atp) && (p.y2?.ippt && p.y2?.voc && p.y2?.range)
                ).length;
                
                return [
                    category,
                    catPersonnel.length,
                    y1Complete,
                    y2Complete,
                    overallComplete,
                    catPersonnel.length > 0 ? ((y1Complete / catPersonnel.length) * 100).toFixed(1) + '%' : '0%',
                    catPersonnel.length > 0 ? ((y2Complete / catPersonnel.length) * 100).toFixed(1) + '%' : '0%',
                    catPersonnel.length > 0 ? ((overallComplete / catPersonnel.length) * 100).toFixed(1) + '%' : '0%'
                ];
            }),
            ['', '', '', '', '', '', '', ''],
            ['Overall Unit', activePersonnel.length,
             activePersonnel.filter(p => p.y1?.ippt && p.y1?.voc && p.y1?.atp).length,
             activePersonnel.filter(p => p.y2?.ippt && p.y2?.voc && p.y2?.range).length,
             activePersonnel.filter(p => 
                 (p.y1?.ippt && p.y1?.voc && p.y1?.atp) && (p.y2?.ippt && p.y2?.voc && p.y2?.range)
             ).length,
             activePersonnel.length > 0 ? ((activePersonnel.filter(p => p.y1?.ippt && p.y1?.voc && p.y1?.atp).length / activePersonnel.length) * 100).toFixed(1) + '%' : '0%',
             activePersonnel.length > 0 ? ((activePersonnel.filter(p => p.y2?.ippt && p.y2?.voc && p.y2?.range).length / activePersonnel.length) * 100).toFixed(1) + '%' : '0%',
             activePersonnel.length > 0 ? ((activePersonnel.filter(p => 
                 (p.y1?.ippt && p.y1?.voc && p.y1?.atp) && (p.y2?.ippt && p.y2?.voc && p.y2?.range)
             ).length / activePersonnel.length) * 100).toFixed(1) + '%' : '0%'
            ]
        ];
        
        const completionWS = XLSX.utils.aoa_to_sheet(completionData);
        XLSX.utils.book_append_sheet(wb, completionWS, 'Completion_Rates');
    }

    /**
     * Create trend analysis sheet
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createTrendAnalysisSheet(wb, personnelData) {
        const activePersonnel = personnelData.filter(p => !p.isORD);
        
        const trendData = [
            ['SOFUN Tracker - Trend Analysis', '', '', '', '', '', '', ''],
            ['Generated on:', new Date().toLocaleDateString(), '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['Assessment Type', 'Gold/Marksman', 'Silver/Sharpshooter', 'Pass', 'Fail', 'Pending', 'Total', 'Success Rate'],
            ['Y2 IPPT', 
             activePersonnel.filter(p => p.y2?.ippt === 'Gold').length,
             activePersonnel.filter(p => p.y2?.ippt === 'Silver').length,
             activePersonnel.filter(p => p.y2?.ippt === 'Pass').length,
             activePersonnel.filter(p => p.y2?.ippt === 'Fail').length,
             activePersonnel.filter(p => !p.y2?.ippt).length,
             activePersonnel.length,
             this.calculateSuccessRate(activePersonnel, 'y2', 'ippt') + '%'
            ],
            ['Y2 VOC',
             'N/A',
             'N/A',
             activePersonnel.filter(p => p.y2?.voc === 'Pass').length,
             activePersonnel.filter(p => p.y2?.voc === 'Fail').length,
             activePersonnel.filter(p => !p.y2?.voc).length,
             activePersonnel.length,
             this.calculateSuccessRate(activePersonnel, 'y2', 'voc') + '%'
            ],
            ['Y2 Range',
             activePersonnel.filter(p => p.y2?.range === 'Marksman').length,
             activePersonnel.filter(p => p.y2?.range === 'Sharpshooter').length,
             activePersonnel.filter(p => p.y2?.range === 'Pass').length,
             activePersonnel.filter(p => p.y2?.range === 'Fail').length,
             activePersonnel.filter(p => !p.y2?.range).length,
             activePersonnel.length,
             this.calculateSuccessRate(activePersonnel, 'y2', 'range') + '%'
            ],
            ['Y1 IPPT',
             activePersonnel.filter(p => p.y1?.ippt === 'Gold').length,
             activePersonnel.filter(p => p.y1?.ippt === 'Silver').length,
             activePersonnel.filter(p => p.y1?.ippt === 'Pass').length,
             activePersonnel.filter(p => p.y1?.ippt === 'Fail').length,
             activePersonnel.filter(p => !p.y1?.ippt).length,
             activePersonnel.length,
             this.calculateSuccessRate(activePersonnel, 'y1', 'ippt') + '%'
            ],
            ['Y1 VOC',
             'N/A',
             'N/A',
             activePersonnel.filter(p => p.y1?.voc === 'Pass').length,
             activePersonnel.filter(p => p.y1?.voc === 'Fail').length,
             activePersonnel.filter(p => !p.y1?.voc).length,
             activePersonnel.length,
             this.calculateSuccessRate(activePersonnel, 'y1', 'voc') + '%'
            ],
            ['Y1 ATP',
             'N/A',
             'N/A',
             activePersonnel.filter(p => p.y1?.atp === 'Pass').length,
             activePersonnel.filter(p => p.y1?.atp === 'Fail').length,
             activePersonnel.filter(p => !p.y1?.atp).length,
             activePersonnel.length,
             this.calculateSuccessRate(activePersonnel, 'y1', 'atp') + '%'
            ]
        ];
        
        const trendWS = XLSX.utils.aoa_to_sheet(trendData);
        XLSX.utils.book_append_sheet(wb, trendWS, 'Trend_Analysis');
    }

    /**
     * Calculate pass rate for an assessment
     * @param {Array} personnel - Personnel data
     * @param {string} phase - Assessment phase (y1/y2)
     * @param {string} type - Assessment type (ippt/voc/range/atp)
     * @returns {string} Pass rate percentage
     */
    calculatePassRate(personnel, phase, type) {
        const completed = personnel.filter(p => p[phase]?.[type]);
        if (completed.length === 0) return '0';
        
        const passed = completed.filter(p => {
            const result = p[phase]?.[type];
            return result === 'Pass' || result === 'Gold' || result === 'Silver' || 
                   result === 'Marksman' || result === 'Sharpshooter';
        }).length;
        
        return ((passed / completed.length) * 100).toFixed(1);
    }

    /**
     * Calculate gold/silver rate for IPPT
     * @param {Array} personnel - Personnel data
     * @param {string} phase - Assessment phase (y1/y2)
     * @param {string} type - Assessment type (ippt)
     * @returns {string} Gold/silver rate percentage
     */
    calculateGoldSilverRate(personnel, phase, type) {
        const completed = personnel.filter(p => p[phase]?.[type]);
        if (completed.length === 0) return '0';
        
        const goldSilver = completed.filter(p => {
            const result = p[phase]?.[type];
            return result === 'Gold' || result === 'Silver';
        }).length;
        
        return ((goldSilver / completed.length) * 100).toFixed(1);
    }

    /**
     * Calculate marksman rate for range
     * @param {Array} personnel - Personnel data
     * @param {string} phase - Assessment phase (y1/y2)
     * @param {string} type - Assessment type (range)
     * @returns {string} Marksman rate percentage
     */
    calculateMarksmanRate(personnel, phase, type) {
        const completed = personnel.filter(p => p[phase]?.[type]);
        if (completed.length === 0) return '0';
        
        const marksman = completed.filter(p => {
            const result = p[phase]?.[type];
            return result === 'Marksman' || result === 'Sharpshooter';
        }).length;
        
        return ((marksman / completed.length) * 100).toFixed(1);
    }

    /**
     * Calculate average grade for an assessment
     * @param {Array} personnel - Personnel data
     * @param {string} phase - Assessment phase (y1/y2)
     * @param {string} type - Assessment type (ippt/voc/range/atp)
     * @returns {string} Average grade
     */
    calculateAverageGrade(personnel, phase, type) {
        const completed = personnel.filter(p => p[phase]?.[type]);
        if (completed.length === 0) return 'N/A';
        
        const gradeValues = {
            'Gold': 4, 'Marksman': 4,
            'Silver': 3, 'Sharpshooter': 3,
            'Pass': 2,
            'Fail': 1
        };
        
        const total = completed.reduce((sum, p) => {
            const grade = p[phase]?.[type];
            return sum + (gradeValues[grade] || 0);
        }, 0);
        
        const average = total / completed.length;
        
        if (average >= 3.5) return 'Excellent';
        if (average >= 2.5) return 'Good';
        if (average >= 1.5) return 'Average';
        return 'Needs Improvement';
    }

    /**
     * Calculate success rate for an assessment
     * @param {Array} personnel - Personnel data
     * @param {string} phase - Assessment phase (y1/y2)
     * @param {string} type - Assessment type (ippt/voc/range/atp)
     * @returns {string} Success rate percentage
     */
    calculateSuccessRate(personnel, phase, type) {
        const completed = personnel.filter(p => p[phase]?.[type]);
        if (completed.length === 0) return '0';
        
        const successful = completed.filter(p => {
            const result = p[phase]?.[type];
            return result !== 'Fail';
        }).length;
        
        return ((successful / completed.length) * 100).toFixed(1);
    }

    /**
     * Generate category summary data
     * @param {Array} activePersonnel - Active personnel data
     * @returns {Array} Summary data rows
     */
    generateCategorySummary(activePersonnel) {
        const categories = ['NSF', 'Regular'];
        
        return categories.map(cat => {
            const catPersonnel = activePersonnel.filter(p => p.category === cat);
            return [
                `${cat} Personnel`,
                catPersonnel.length,
                catPersonnel.filter(p => p.y2.ippt === 'Gold').length,
                catPersonnel.filter(p => p.y2.ippt === 'Silver').length,
                catPersonnel.filter(p => p.y2.voc === 'Pass').length,
                catPersonnel.filter(p => p.y2.range === 'Marksman' || p.y2.range === 'Sharpshooter').length,
                catPersonnel.filter(p => p.y1.ippt && p.y1.voc && p.y1.atp).length,
                catPersonnel.filter(p => p.y2.ippt && p.y2.voc && p.y2.range).length
            ];
        });
    }

    /**
     * Create detailed personnel sheets
     * @param {Object} wb - Workbook object
     * @param {Array} personnelData - Personnel data
     */
    createPersonnelSheets(wb, personnelData) {
        const categories = {
            'NSF_Personnel': personnelData.filter(p => !p.isORD && p.category === 'NSF'),
            'Regular_Personnel': personnelData.filter(p => !p.isORD && p.category === 'Regular')
        };
        
        Object.entries(categories).forEach(([sheetName, data]) => {
                            const headers = [
                    'Name', 'Platoon', 'PES Status', 'ORD Date', 'Medical Status',
                    'Y1 IPPT', 'Y1 IPPT Date', 'Y1 VOC', 'Y1 VOC Date', 'Y1 ATP', 'Y1 ATP Date',
                    'Y2 IPPT', 'Y2 IPPT Date', 'Y2 VOC', 'Y2 VOC Date', 'Y2 Range', 'Y2 Range Date',
                    'Y1 Complete', 'Y2 Complete', 'Overall Status'
                ];
            
            const rows = data.map(person => {
                const y1Complete = person.y1.ippt && person.y1.voc && person.y1.atp ? 'Yes' : 'No';
                const y2Complete = person.y2.ippt && person.y2.voc && person.y2.range ? 'Yes' : 'No';
                const status = getPersonStatus(person);
                
                                    return [
                        person.name,
                        person.platoon || '',
                        person.pes || '',
                        person.ordDate || '',
                        person.medicalStatus || 'Fit',
                    person.y1.ippt || '',
                    person.y1.ipptDate || '',
                    person.y1.voc || '',
                    person.y1.vocDate || '',
                    person.y1.atp || '',
                    person.y1.atpDate || '',
                    person.y2.ippt || '',
                    person.y2.ipptDate || '',
                    person.y2.voc || '',
                    person.y2.vocDate || '',
                    person.y2.range || '',
                    person.y2.rangeDate || '',
                    y1Complete,
                    y2Complete,
                    status.text
                ];
            });
            
            const wsData = [headers, ...rows];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
    }

    /**
     * Create audit log sheet
     * @param {Object} wb - Workbook object
     * @param {Array} auditLog - Audit log data
     */
    createAuditSheet(wb, auditLog) {
        const auditHeaders = ['Timestamp', 'User', 'Action'];
        const auditRows = auditLog.map(entry => [
            entry.timestamp,
            entry.user,
            entry.action
        ]);
        
        const auditWS = XLSX.utils.aoa_to_sheet([auditHeaders, ...auditRows]);
        XLSX.utils.book_append_sheet(wb, auditWS, 'Audit_Log');
    }

    /* ---------- Platoon Fixing Utility ---------- */

    /**
     * Fix existing invalid platoon names
     * @param {Array} personnelData - Personnel data to fix
     * @returns {Object} Fix results
     */
    fixExistingPlatoonNames(personnelData) {
        console.log('Starting platoon name fixes...');
        
        let fixedCount = 0;
        const invalidPlatoons = ['Retry', 'First Attempt', 'retry', 'first attempt', '-', '', null, undefined];
        
        personnelData.forEach(person => {
            if (!person.platoon || 
                invalidPlatoons.includes(person.platoon) || 
                !isValidPlatoon(person.platoon)) {
                
                // Assign based on category
                if (person.category === 'NSF') {
                    const nsfPlatoons = ['Platoon 1', 'Platoon 2', 'Platoon 3'];
                    person.platoon = getRandomElement(nsfPlatoons);
                } else {
                    person.platoon = 'COY HQ';
                }
                
                // Keep unit in sync
                person.unit = person.platoon;
                fixedCount++;
                console.log(`Fixed platoon for ${person.name}: ${person.platoon}`);
            }
        });
        
        console.log(`✅ Fixed ${fixedCount} invalid platoon assignments`);
        
        return {
            fixedCount: fixedCount,
            totalPersonnel: personnelData.length
        };
    }
}

/* ---------- Global Data Processor Instance ---------- */

// Create global data processor instance
const dataProcessor = new SofunDataProcessor();

/* ---------- Global Functions (for backward compatibility) ---------- */

// Sample data generation removed for security reasons

/**
 * Global function to process Excel file
 * @param {File} file - Excel file to process
 * @returns {Promise} Processing result
 */
function processExcelFile(file) {
    return dataProcessor.processExcelFile(file);
}

/**
 * Global function to download Excel
 * @param {Array} personnelData - Personnel data
 * @param {Array} auditLog - Audit log
 */
function downloadImprovedExcel(personnelData, auditLog) {
    dataProcessor.downloadExcel(personnelData, auditLog);
}

/**
 * Global function to download modified Excel (preserves original structure)
 * @param {Array} personnelData - Personnel data
 * @param {Object} originalWorkbook - Original workbook
 * @param {string} originalFileName - Original filename
 */
function downloadModifiedExcel(personnelData, originalWorkbook, originalFileName) {
    return dataProcessor.downloadModifiedExcel(personnelData, originalWorkbook, originalFileName);
}

/**
 * Global function to fix platoon names
 * @param {Array} personnelData - Personnel data
 * @returns {Object} Fix results
 */
function fixExistingPlatoonNames(personnelData) {
    return dataProcessor.fixExistingPlatoonNames(personnelData);
}

console.log('✅ SOFUN Data Processor loaded - Excel processing ready');