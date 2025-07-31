# SOFUN Tracker v2.0

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/your-username/sofun-tracker)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web-orange.svg)]()

**Enhanced NSF & Regular Personnel Assessment Tracking System**

A comprehensive web-based solution for military unit commanders to track and manage personnel assessments, designed specifically for Singapore Armed Forces (SAF) units managing both National Service (NSF) and Regular personnel.

## 🎯 Overview

SOFUN Tracker is a modern, responsive web application that streamlines the complex process of tracking military personnel assessments. It provides real-time visibility into individual and unit-wide progress across multiple assessment phases, helping commanders make informed decisions about training priorities and resource allocation.

## ✨ Key Features

### 📊 **Comprehensive Assessment Tracking**
- **Y1 Phase**: IPPT, VOC, ATP assessments for NSF personnel
- **Y2 Phase**: IPPT, VOC, Range assessments for all personnel
- **Status Progression**: Y1 In progress → Y2 Not started → Y2 In progress → Y2 Completed
- **Test Date Management**: Track completion dates and overdue assessments

### 🎛️ **Advanced Data Management**
- **Excel Integration**: Import/export with military-standard Excel formats
- **Real-time Search & Filtering**: By name, platoon, status, category
- **Bulk Operations**: Update multiple personnel records simultaneously
- **Data Validation**: Automatic platoon name correction and validation

### 👥 **Personnel Management**
- **Dual Category Support**: NSF and Regular personnel workflows
- **Medical Status Tracking**: Fit, Light Duty, Excused IPPT, Medical Board
- **Platoon Assignment**: COY HQ, Platoons 1-4, Support units
- **ORD Management**: Automatic handling of personnel completing service

### 📈 **Dashboard & Analytics**
- **Real-time Statistics**: Completion rates, overdue assessments, platoon breakdown
- **Visual Progress Indicators**: Color-coded status system
- **Print-ready Reports**: Command briefing formats
- **Audit Trail**: Complete change history with timestamps

### 🎨 **User Experience**
- **Dark Mode**: Night-friendly interface for duty operations
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Intuitive Interface**: Military-standard workflows and terminology
- **Error Prevention**: Built-in validation and confirmation dialogs

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server installation required - runs entirely in browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sofun-tracker.git
   cd sofun-tracker
   ```

2. **Open the application**
   ```bash
   # Option 1: Open directly in browser
   open assets/index.html
   
   # Option 2: Use local server (recommended)
   python -m http.server 8000
   # Then visit: http://localhost:8000/assets/
   ```

3. **Load your data**
   - Upload existing Excel file with IPPT, VOC, RANGE sheets
   - Or click "Use Sample Data" to explore features

## 📖 Usage Guide

### Basic Workflow

1. **Import Data**: Upload your unit's Excel assessment file
2. **Review Dashboard**: Check overall unit progress and priorities
3. **Filter & Search**: Find specific personnel or platoons
4. **Update Records**: Edit individual assessments or use bulk operations
5. **Generate Reports**: Export updated Excel or print command briefings

### File Format Requirements

Your Excel file must contain these sheets:
- **IPPT**: Personnel fitness test results
- **VOC**: Vocational assessment results  
- **RANGE**: Marksmanship test results

See [Data Format Guide](documentation/data-format.md) for detailed column specifications.

### Status Definitions

| Status | Description |
|--------|-------------|
| **Y1 In progress** | NSF personnel completing initial assessments |
| **Y2 Not started** | Completed Y1 or Regular personnel ready for Y2 |
| **Y2 In progress** | Partially completed Y2 assessments |
| **Y2 Completed** | All assessments complete |

## 🏗️ Architecture

### Frontend Stack
- **HTML5/CSS3**: Responsive, military-standard UI
- **Vanilla JavaScript**: No framework dependencies for maximum compatibility
- **SheetJS**: Excel file processing
- **LocalStorage**: Client-side data persistence

### Module Structure
```
assets/
├── js/
│   ├── app.js              # Main application controller
│   ├── personnel-manager.js # Personnel CRUD operations
│   ├── data-processor.js   # Excel file processing
│   ├── dashboard.js        # Statistics and reporting
│   ├── storage.js          # Data persistence
│   └── utils.js            # Helper functions
├── css/
│   ├── main.css           # Core styles
│   ├── components.css     # UI components
│   └── themes.css         # Dark mode themes
└── index.html             # Application entry point
```

## 🔧 Configuration

### Supported Platoons
- COY HQ, Platoon 1-4, Support Platoon
- Admin, Medical, Signals, Transport

### Assessment Grades
- **IPPT**: Gold, Silver, Pass, Fail
- **VOC**: Pass, Fail  
- **Range**: Marksman, Sharpshooter, Pass, Fail

### Customization
Edit `assets/js/utils.js` to modify:
- Valid platoon names
- Assessment grade options
- Application configuration

## 📊 Reporting Features

### Dashboard Statistics
- Total personnel count by category
- Assessment completion percentages
- Overdue assessment alerts
- Platoon-wise breakdown

### Export Options
- **Excel Format**: Military-standard spreadsheet
- **Print Reports**: Command briefing layouts
- **Audit Logs**: Complete change history

## 🔒 Security & Privacy

- **Client-side Only**: No data transmitted to external servers
- **Local Storage**: Data stays on your device
- **No Dependencies**: Self-contained application
- **Audit Trail**: Complete change tracking

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/your-username/sofun-tracker.git

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
# Open assets/index.html in browser

# Commit and push
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **Excel not importing**: Ensure sheets are named exactly "IPPT", "VOC", "RANGE"
- **Data not saving**: Check browser localStorage isn't disabled
- **Print layout issues**: Use Chrome/Edge for best print results

### Getting Help
- Check [Documentation](documentation/)
- Review [FAQ](documentation/FAQ.md)
- Open an [Issue](https://github.com/your-username/sofun-tracker/issues)

## 🏆 Acknowledgments

- Singapore Armed Forces for operational requirements
- Military unit commanders for feedback and testing
- Open source community for tools and libraries

## 📈 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Built with ❤️ for SAF units by military personnel, for military personnel.** 
