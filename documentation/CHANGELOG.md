# Changelog

## v2.1 (2025-08-12)
- Added Foxtrot black/gold theme, logo support, and optional chart watermark
- Integrated import-once UX with backup export/import
- NSF windows: show `Y1 Last Window` (VOC col F) and `Y2 Last Window` (mirrors ORD)
- Edit modal redesign with collapsible sections and grid layout
- Date inputs accept DD-MM-YY, DD-MM-YYYY, DD/MM/YY, YYYY-MM-DD; normalize to YYYY-MM-DD
- Fixed rank/PES edit issues and stable row numbering
- Removed animated background

## v2.0
- Initial public release
# Changelog

All notable changes to SOFUN Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-19

### 🎉 Major Release - Enhanced Personnel Tracking

#### Added
- **Enhanced Status Tracking**: 4-stage progression system
  - Y1 In progress → Y2 Not started → Y2 In progress → Y2 Completed
- **Regular Personnel Support**: Dedicated workflow for Regular personnel
  - Skip Y1 assessments, go directly to Y2
  - Separate status calculation logic
- **Advanced Search & Filtering**
  - Real-time search by name, platoon, status
  - Multi-criteria filtering (Category + Status + Platoon)
  - Debounced input for performance
- **Dark Mode Implementation**
  - System preference detection
  - Manual toggle capability
  - Print-friendly light mode override
- **Bulk Operations**
  - Multi-select personnel records
  - Bulk platoon updates
  - Bulk status updates with validation
- **Enhanced Dashboard**
  - Real-time statistics calculation
  - Category breakdown (NSF vs Regular)
  - Overdue assessment alerts
  - Platoon-wise progress tracking
- **Comprehensive Audit Trail**
  - All changes logged with timestamps
  - User action tracking
  - Detailed before/after change records
- **Print-Optimized Reports**
  - Command briefing layouts
  - Professional formatting
  - Summary statistics included

#### Improved
- **Excel Processing Reliability**
  - Enhanced error handling
  - Better column detection
  - Improved date parsing
  - Support for various Excel formats
- **Mobile Responsiveness**
  - Touch-friendly interface
  - Responsive table design
  - Mobile-optimized forms
  - Swipe gestures support
- **Performance Optimization**
  - Lazy loading for large datasets
  - Efficient filtering algorithms
  - Debounced operations
  - Memory management improvements
- **User Experience**
  - Intuitive navigation
  - Clear status indicators
  - Better error messages
  - Consistent military terminology

#### Fixed
- **Status Calculation for Regular Personnel**
  - Fixed incorrect "Y1 In progress" status
  - Proper Regular personnel workflow
  - Category-specific status logic
- **Data Persistence Issues**
  - Improved localStorage reliability
  - Better error recovery
  - Data validation on load
- **Excel Import Edge Cases**
  - Handle empty rows/columns
  - Better name normalization
  - Improved date format detection
- **UI Rendering Issues**
  - Fixed table overflow on mobile
  - Corrected dark mode styling
  - Improved print layouts

#### Security
- **Enhanced Input Validation**
  - XSS prevention measures
  - File upload security
  - Data sanitization
- **Client-side Processing**
  - All operations remain local
  - No external data transmission
  - Secure localStorage usage

## [1.0.0] - 2024-01-15

### 🚀 Initial Release

#### Added
- **Core Personnel Management**
  - Individual personnel record tracking
  - Y1 and Y2 assessment phases
  - IPPT, VOC, and Range/ATP test tracking
- **Excel Integration**
  - Import from standard military Excel formats
  - Export updated records
  - Support for IPPT, VOC, RANGE sheets
- **Basic Dashboard**
  - Personnel count statistics
  - Simple progress indicators
  - Category breakdown
- **Search Functionality**
  - Basic name search
  - Category filtering (NSF/Regular)
- **Data Management**
  - localStorage persistence
  - Manual data entry forms
  - Basic validation

#### Known Issues
- Limited mobile responsiveness
- Basic status tracking (only 2 states)
- No dark mode support
- Manual operations only (no bulk actions)

## [Unreleased] - Future Enhancements

### Planned Features
- **API Integration**
  - External system connectivity
  - Real-time data sync
  - Multi-user collaboration
- **Advanced Analytics**
  - Trend analysis and predictions
  - Performance metrics
  - Historical data comparison
- **Mobile Application**
  - Native iOS/Android apps
  - Offline capability
  - Push notifications
- **Multi-unit Support**
  - Company-level aggregation
  - Cross-unit reporting
  - Hierarchical data management
- **Enhanced Reporting**
  - Custom report builder
  - Automated scheduling
  - Advanced visualizations

### Under Consideration
- **Integration Features**
  - Calendar integration for test scheduling
  - Email notifications
  - SMS alerts for overdue assessments
- **AI/ML Features**
  - Predictive analytics
  - Anomaly detection
  - Automated insights
- **Collaboration Features**
  - Multi-user editing
  - Comment system
  - Approval workflows

## Version History Summary

| Version | Release Date | Key Features |
|---------|-------------|--------------|
| 2.0.0   | 2024-12-19  | Enhanced status tracking, Regular personnel support, Dark mode, Bulk operations |
| 1.0.0   | 2024-01-15  | Initial release with basic personnel tracking |

## Migration Notes

### Upgrading from v1.0.0 to v2.0.0

#### Data Migration
- **Automatic**: Existing localStorage data will be automatically migrated
- **Status Updates**: Personnel statuses will be recalculated using new logic
- **Backup Recommended**: Export your data before upgrading as precaution

#### New Requirements
- **Browser Support**: Modern browser required for new features
- **Storage**: Increased localStorage usage due to audit trail
- **Performance**: Better performance on datasets >100 personnel

#### Breaking Changes
- **Status Values**: Status text has changed (update any external integrations)
- **Data Structure**: Additional fields added to personnel records
- **Export Format**: Excel export format has been enhanced

## Support Information

### Compatibility
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **File Formats**: Excel .xlsx, .xls (Office 2010+)
- **Data Size**: Tested up to 1000+ personnel records

### Getting Help
- **Documentation**: Check the [User Guide](USER_GUIDE.md)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-username/sofun-tracker/issues)
- **Features**: Request features through GitHub Discussions

---

**Changelog Conventions:**
- 🎉 Major releases
- ✨ New features  
- 🔧 Improvements
- 🐛 Bug fixes
- 🛡️ Security updates
- 📚 Documentation
- ⚠️ Deprecations 