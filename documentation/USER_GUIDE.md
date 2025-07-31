# SOFUN Tracker - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Importing Data](#importing-data)
4. [Managing Personnel](#managing-personnel)
5. [Search and Filtering](#search-and-filtering)
6. [Bulk Operations](#bulk-operations)
7. [Reports and Export](#reports-and-export)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Accessing SOFUN Tracker
1. Open your web browser (Chrome, Firefox, Safari, or Edge recommended)
2. Navigate to the SOFUN Tracker application
3. The dashboard will load automatically

### First Time Setup
1. **Import Your Data**: Click "Upload SOFUN Tracker Excel File" to import existing assessment data
2. **Or Use Sample Data**: Click "Use Sample Data" to explore features with test data
3. **Familiarize Yourself**: Review the dashboard statistics and personnel tables

## Dashboard Overview

### Main Sections
- **Header**: Application title and dark mode toggle
- **Import Section**: File upload and data management controls
- **Search & Filter**: Real-time search and filtering options
- **Statistics Cards**: Key metrics and progress indicators
- **Personnel Tables**: Separate tabs for NSF and Regular personnel

### Understanding Statistics Cards
- **Total NSF/Regular**: Count of active personnel in each category
- **Y2 Complete**: Personnel who have completed all Y2 assessments
- **Y2 In Progress**: Personnel with partial Y2 completion
- **Y2 Not Started**: Personnel ready to begin Y2 assessments
- **Y1 In Progress**: NSF personnel completing initial assessments

### Status Color Coding
- 🟢 **Green (Y2 Completed)**: All assessments complete
- 🟡 **Yellow (Y2 In Progress)**: Partially complete
- 🔵 **Blue (Y2 Not Started)**: Ready to start Y2
- ⚪ **Gray (Y1 In Progress)**: NSF initial assessments

## Importing Data

### Excel File Requirements
Your Excel file must contain three sheets:
- **IPPT**: Individual Physical Proficiency Test results
- **VOC**: Vocational assessment results
- **RANGE**: Marksmanship test results

### Import Process
1. Click **"Upload SOFUN Tracker Excel File"**
2. Select your Excel file (.xlsx or .xls format)
3. Click **"Process Data"** to import
4. Review the import summary for any errors
5. Check dashboard statistics to verify import success

### Data Validation
After import, the system will:
- Merge data by personnel name
- Calculate current status for each person
- Flag any inconsistencies or missing data
- Generate platoon assignments based on data

### Common Import Issues
- **Missing Sheets**: Ensure sheets are named exactly "IPPT", "VOC", "RANGE"
- **Empty Data**: Check that personnel names are in the correct columns
- **Date Formats**: Various date formats are supported, but dd-mm-yyyy is preferred
- **File Size**: Maximum file size is 50MB

## Managing Personnel

### Viewing Personnel Records
- **NSF Tab**: National Service personnel with Y1 and Y2 assessments
- **Regular Tab**: Regular personnel with Y2 assessments only
- **Sort Options**: Click column headers to sort data
- **Details**: Each row shows name, unit, rank, assessments, medical status, and current status

### Editing Individual Records
1. Click the **"Edit"** button next to any personnel record
2. Update any field in the form:
   - Personal details (name, rank, platoon)
   - Y1 assessments (NSF only): IPPT, VOC, ATP
   - Y2 assessments: IPPT, VOC, Range
   - Test dates for tracking
   - Medical status
   - ORD date (NSF only)
3. Click **"Save Changes"** to confirm
4. Changes are automatically logged in the audit trail

### Adding New Personnel
1. Scroll to the bottom of either personnel table
2. Click **"Add New Personnel"**
3. Fill in all required fields
4. Select appropriate category (NSF or Regular)
5. Save to add to the system

### Medical Status Options
- **Fit**: Normal assessment requirements
- **Light Duty**: Modified assessment requirements
- **Excused IPPT**: Excused from fitness testing
- **Medical Board**: Under medical review

## Search and Filtering

### Real-time Search
- Type in the search box to find personnel by:
  - Name (partial matching supported)
  - Platoon assignment
  - Medical status
- Search updates results immediately
- Clear search box to show all personnel

### Filter Options

#### Category Filter
- **All Categories**: Show both NSF and Regular
- **NSF Only**: Show only National Service personnel
- **Regular Only**: Show only Regular personnel

#### Status Filter
- **All Status**: Show all personnel regardless of progress
- **Y1 In progress**: NSF personnel completing initial assessments
- **Y2 Not started**: Personnel ready for Y2 phase
- **Y2 In progress**: Personnel with partial Y2 completion
- **Y2 Completed**: Personnel with all assessments complete

#### Platoon Filter
- **All Platoons**: Show personnel from all units
- Select specific platoon to focus on one unit
- Platoon list is automatically populated from your data

### Combining Filters
- Use multiple filters simultaneously for precise results
- Example: Search for "TAN" + "NSF Only" + "Platoon 1" + "Y2 In progress"
- Filters work together to narrow down results

## Bulk Operations

### Selecting Multiple Personnel
1. Click **"Select Multiple"** to enter bulk selection mode
2. Check boxes next to personnel you want to update
3. Selected count appears at the top
4. Use **"Select All"** to choose all visible personnel

### Bulk Platoon Updates
1. Select personnel using checkboxes
2. Click **"Update Platoon"** in the bulk actions section
3. Choose new platoon from dropdown
4. Confirm the change
5. All selected personnel will be updated simultaneously

### Bulk Status Updates
1. Select personnel using checkboxes
2. Click **"Update Status"** in the bulk actions section
3. Choose which assessment to update (IPPT, VOC, Range)
4. Select the new result (Gold, Silver, Pass, Fail, etc.)
5. Confirm to apply to all selected personnel

### Clearing Selection
- Click **"Clear Selection"** to deselect all personnel
- Or click **"Select Multiple"** again to exit bulk mode

## Reports and Export

### Downloading Excel Reports
1. Click **"Download Excel"** to export current data
2. File includes:
   - All personnel data with current assessments
   - Dashboard statistics summary
   - Audit log of recent changes
3. File is saved with timestamp in filename

### Print Reports
1. Click **"🖨️ Print Report"** to generate printable version
2. System automatically switches to light mode for printing
3. Report includes:
   - Summary statistics
   - Personnel tables formatted for command briefings
   - Professional layout suitable for presentations

### Print Tips
- Use Chrome or Edge browsers for best print results
- Check print preview before printing
- Adjust margins and scaling in print settings if needed
- Dark mode is automatically disabled for printing

## Advanced Features

### Dark Mode
- Click **"🌙 Dark Mode"** in the header to toggle
- Saves your preference for future sessions
- Automatically switches to light mode for printing
- Useful for night operations or prolonged use

### Audit Trail
- All changes are automatically logged
- View recent actions in the system
- Includes timestamps and user information
- Useful for tracking data modifications

### Data Persistence
- All data is saved automatically to your browser
- No internet connection required after initial load
- Data persists between browser sessions
- Regular backups via Excel export recommended

## Troubleshooting

### Common Issues and Solutions

#### Excel File Won't Import
**Problem**: Error message when trying to import Excel file
**Solutions**:
- Verify file format is .xlsx or .xls
- Check file size is under 50MB
- Ensure sheets are named exactly "IPPT", "VOC", "RANGE"
- Try opening file in Excel to check for corruption

#### Data Not Saving
**Problem**: Changes don't persist after refreshing browser
**Solutions**:
- Check if browser has localStorage enabled
- Clear browser cache and try again
- Ensure sufficient storage space on device
- Try using a different browser

#### Personnel Not Showing Correct Status
**Problem**: Status doesn't match expected progression
**Solutions**:
- Verify assessment data is entered correctly
- Check if personnel category (NSF/Regular) is correct
- Review test completion dates
- Use edit function to update any missing assessments

#### Print Layout Issues
**Problem**: Printed reports don't format correctly
**Solutions**:
- Use Chrome or Edge browser for printing
- Check print settings (margins, scale)
- Ensure dark mode is disabled
- Try print preview to adjust settings

#### Search Not Finding Personnel
**Problem**: Personnel exists but doesn't appear in search
**Solutions**:
- Check spelling of name or platoon
- Clear all filters and try search again
- Verify personnel isn't filtered out by category/status
- Try partial name matching

#### Mobile Display Issues
**Problem**: Interface difficult to use on mobile device
**Solutions**:
- Rotate device to landscape mode for tables
- Use zoom controls to adjust text size
- Scroll horizontally on tables if needed
- Consider using desktop/tablet for data entry

### Getting Additional Help

#### Documentation Resources
- **Technical Documentation**: See `sofun-tracker.md` for detailed system information
- **Contributing Guide**: See `CONTRIBUTING.md` for development information
- **Changelog**: See `CHANGELOG.md` for version history

#### Support Channels
- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions or share feedback
- **Documentation**: Check this guide and other documentation files

#### Best Practices
- **Regular Backups**: Export Excel files regularly
- **Data Validation**: Review imported data for accuracy
- **Browser Updates**: Keep browser updated for best performance
- **File Organization**: Maintain organized folder structure for exports

---

**Remember**: SOFUN Tracker processes all data locally in your browser for security. No information is transmitted to external servers, ensuring your personnel data remains confidential and secure. 