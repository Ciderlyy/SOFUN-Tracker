# SOFUN Tracker - Technical Documentation

## Project Overview
SOFUN Tracker v2.0 - Enhanced NSF & Regular Personnel Assessment Tracking System
A comprehensive web-based solution for military unit commanders to track and manage personnel assessments.

## Architecture & Technology Stack

### Frontend Architecture
- **Pure JavaScript ES6+**: No framework dependencies for maximum compatibility
- **Modular Design**: Separated concerns with dedicated modules
- **Client-side Processing**: All operations performed locally for security
- **Responsive CSS Grid/Flexbox**: Mobile-first responsive design

### Core Modules
```javascript
// Main Application Modules
- SofunApp (app.js)           // Central controller and lifecycle management
- PersonnelManager            // Table management, CRUD operations
- SofunDataProcessor         // Excel file processing and data transformation
- SofunDashboard            // Statistics, reporting, and analytics
- SofunStorage              // Local storage management and persistence
```

## Database Schema (LocalStorage)

### Personnel Record Structure
```javascript
{
  name: String,                    // Full name (UPPERCASE)
  category: 'NSF' | 'Regular',    // Personnel category
  platoon: String,                // Valid platoon assignment
  rank: String,                   // Military rank
  medicalStatus: String,          // Fit, Light Duty, Excused IPPT, Medical Board
  ordDate: Date | null,          // ORD date for NSF personnel
  isORD: Boolean,                // Whether personnel has completed service
  
  // Y1 Assessment Phase (NSF only)
  y1: {
    ippt: String,               // Gold, Silver, Pass, Fail, or empty
    ipptDate: Date | null,      // Test completion date
    voc: String,                // Pass, Fail, or empty
    vocDate: Date | null,       // Test completion date
    atp: String,                // Pass, Fail, or empty (ATP = Y1 Range equivalent)
    atpDate: Date | null        // Test completion date
  },
  
  // Y2 Assessment Phase (All personnel)
  y2: {
    ippt: String,               // Gold, Silver, Pass, Fail, or empty
    ipptDate: Date | null,      // Test completion date
    voc: String,                // Pass, Fail, or empty
    vocDate: Date | null,       // Test completion date
    range: String,              // Marksman, Sharpshooter, Pass, Fail, or empty
    rangeDate: Date | null      // Test completion date
  },
  
  // Metadata
  lastUpdated: Date,            // Last modification timestamp
  remedialTraining: Array       // Remedial training records (future use)
}
```

### Application State Schema
```javascript
// Main Application Data
personnelData: Array<PersonnelRecord>    // All personnel records
filteredData: Array<PersonnelRecord>     // Currently filtered/displayed records
auditLog: Array<AuditEntry>              // Change history tracking

// UI State
currentCategory: 'nsf' | 'regular'       // Currently displayed category
bulkSelectMode: Boolean                   // Whether bulk selection is active
selectedPersonnel: Set<String>           // Selected personnel for bulk operations
searchTerm: String                       // Current search filter
statusFilter: String                     // Current status filter
platoonFilter: String                    // Current platoon filter
```

### Audit Log Schema
```javascript
{
  timestamp: String,            // ISO timestamp of change
  user: String,                // User identifier (default: 'Admin')
  action: String,              // Description of action performed
  personnelName: String,       // Affected personnel (if applicable)
  changes: Object             // Before/after values (detailed logging)
}
```

## Status Calculation Logic

### Status Progression Flow
```
NSF Personnel:
Empty → Y1 In progress → Y2 Not started → Y2 In progress → Y2 Completed

Regular Personnel:
Empty → Y2 Not started → Y2 In progress → Y2 Completed
```

### Status Determination Algorithm
```javascript
function getPersonStatus(person) {
  const y2Completed = countCompletedY2Tests(person);
  const isRegular = person.category === 'Regular';
  
  if (y2Completed === 3) return 'Y2 Completed';
  if (y2Completed > 0) return 'Y2 In progress';
  if (isRegular) return 'Y2 Not started';  // Skip Y1 for Regular
  if (hasAnyY1Tests(person)) return 'Y2 Not started';
  return 'Y1 In progress';
}
```

## Data Processing Pipeline

### Excel Import Process
1. **File Validation**: Check file format (.xlsx/.xls) and size limits
2. **Sheet Detection**: Locate required sheets (IPPT, VOC, RANGE)
3. **Data Extraction**: Parse each sheet with row/column mapping
4. **Personnel Merging**: Combine test results by personnel name
5. **Validation & Cleaning**: Normalize data and flag inconsistencies
6. **Status Calculation**: Determine current status for each person
7. **Storage**: Persist to localStorage with audit logging

### Sheet Processing Rules
```javascript
// Column Mapping (0-indexed)
IPPT Sheet:
- Column B (1): Personnel Name
- Column D (3): Assessment Phase (NSF/REG)
- Column E (4): Platoon
- Column I (8): Y2 Result | Column L (11): Regular Result
- Column J (9): Y2 Date | Column M (12): Regular Date

VOC Sheet:
- Similar structure with different result columns
- Column G (6): ORD Date extraction

RANGE Sheet:
- Column J (9): Y2 Result | Column L (11): Regular Result
- Column K (10): Y2 Date | Column M (12): Regular Date
```

## Configuration Constants

### Valid Values
```javascript
// Platoon Assignments
VALID_PLATOONS = [
  "COY HQ", "Platoon 1", "Platoon 2", "Platoon 3", "Platoon 4",
  "Support Platoon", "Admin", "Medical", "Signals", "Transport"
]

// Assessment Grades
IPPT_GRADES = ['Gold', 'Silver', 'Pass', 'Fail']
VOC_GRADES = ['Pass', 'Fail'] 
SKILL_GRADES = ['Marksman', 'Sharpshooter', 'Pass', 'Fail']
MEDICAL_STATUS_OPTIONS = ['Fit', 'Light Duty', 'Excused IPPT', 'Medical Board']

// Application Limits
APP_CONFIG = {
  maxFileSize: 50MB,
  supportedFormats: ['.xlsx', '.xls'],
  autoSaveInterval: 30000ms,
  maxAuditEntries: 100,
  version: '2.0'
}
```

## Feature Implementation Details

### Search & Filter System
- **Real-time Search**: Debounced input with 300ms delay
- **Multi-field Matching**: Name, platoon, medical status
- **Combined Filters**: Search + Category + Status + Platoon
- **Case-insensitive**: Automatic normalization

### Bulk Operations
- **Selection Management**: Set-based tracking for performance
- **Batch Updates**: Single audit entry per bulk operation
- **Validation**: Pre-check all operations before execution
- **Rollback Capability**: Error handling with partial rollback

### Dark Mode Implementation
- **CSS Custom Properties**: Centralized theme management
- **System Preference Detection**: Automatic dark mode detection
- **Persistent Settings**: localStorage theme preference
- **Print Compatibility**: Light mode forced for printing

## Performance Optimizations

### Data Management
- **Lazy Loading**: Tables render only visible rows
- **Debounced Operations**: Search, filter, and save operations
- **Efficient Filtering**: Single-pass algorithms with early termination
- **Memory Management**: Periodic cleanup of large datasets

### UI Responsiveness
- **Virtual Scrolling**: For large personnel lists (>500 records)
- **Batch DOM Updates**: Minimize reflow/repaint operations
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Responsive Breakpoints**: Mobile-first responsive design

## Security Considerations

### Data Protection
- **Client-side Only**: No external server communication
- **Local Storage**: Data remains on user's device
- **No Sensitive Data**: Military operational details excluded
- **Audit Trail**: Complete change tracking for accountability

### Input Validation
- **File Type Validation**: Strict Excel format checking
- **Data Sanitization**: XSS prevention in user inputs
- **Size Limits**: Prevent memory overflow attacks
- **Error Handling**: Graceful degradation with user feedback

## Testing Strategy

### Manual Testing Checklist
- [ ] Excel import with valid/invalid files
- [ ] CRUD operations on personnel records
- [ ] Search and filter combinations
- [ ] Bulk update operations
- [ ] Print functionality across browsers
- [ ] Dark/light mode transitions
- [ ] Mobile responsiveness
- [ ] Data persistence across sessions

### Browser Compatibility
- **Primary**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallbacks**: Graceful degradation for older browsers

## Deployment & Maintenance

### File Structure for Deployment
```
production/
├── assets/
│   ├── index.html          # Application entry point
│   ├── js/                 # Minified JavaScript modules
│   ├── css/                # Compressed stylesheets
│   └── images/             # Optimized assets
├── documentation/          # User guides and API docs
└── examples/              # Sample data files
```

### Maintenance Tasks
- **Monthly**: Review audit logs for usage patterns
- **Quarterly**: Update browser compatibility matrix
- **Annually**: Review and update validation rules
- **As Needed**: Update platoon/rank configurations

## Change Log

### Version 2.0 (Current)
- **NEW**: Enhanced status tracking (4 status progression)
- **NEW**: Regular personnel workflow support
- **NEW**: Dark mode implementation
- **NEW**: Bulk operations with audit trail
- **NEW**: Advanced search and filtering
- **NEW**: Print-optimized reporting
- **NEW**: Serial numbers for personnel lists
- **NEW**: Total personnel count on dashboard
- **NEW**: Modern glassmorphism design with animations
- **NEW**: Enhanced visual feedback and micro-interactions
- **NEW**: Gradient backgrounds and smooth transitions
- **SECURITY**: Removed all sample data generation for security compliance
- **IMPROVED**: Excel processing reliability
- **IMPROVED**: Mobile responsiveness
- **IMPROVED**: Visual design and user experience
- **FIXED**: Status calculation for Regular personnel

### Future Enhancements (Planned)
- **API Integration**: External system connectivity
- **Advanced Analytics**: Trend analysis and predictions
- **Multi-unit Support**: Company-level aggregation
- **Mobile App**: Native mobile application
- **Real-time Sync**: Multi-user collaboration features

## Troubleshooting Guide

### Common Issues
1. **Excel Import Failures**
   - Verify sheet names exactly match: "IPPT", "VOC", "RANGE"
   - Check file isn't corrupted or password-protected
   - Ensure file size under 50MB limit

2. **Data Not Persisting**
   - Check browser localStorage isn't disabled
   - Verify sufficient storage space available
   - Clear browser cache if corruption suspected

3. **Performance Issues**
   - Large datasets (>1000 personnel) may need optimization
   - Close other browser tabs to free memory
   - Consider splitting into multiple units

4. **Print Layout Problems**
   - Use Chrome or Edge for best results
   - Check print settings (margins, scale)
   - Disable dark mode before printing

### Error Codes
- **E001**: Invalid Excel file format
- **E002**: Required sheets missing
- **E003**: Insufficient browser storage
- **E004**: Data validation failure
- **E005**: Network/CORS issues (when using local server)

---

**Last Updated**: [Current Date]
**Version**: 2.0
**Maintainer**: [Your Name/Team] 