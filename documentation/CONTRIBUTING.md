# Contributing to SOFUN Tracker

Thank you for your interest in contributing to SOFUN Tracker! This document provides guidelines and information for contributors.

## 🎯 Project Mission

SOFUN Tracker aims to streamline military personnel assessment tracking while maintaining:
- **Security**: Client-side processing with no data transmission
- **Usability**: Intuitive interface for military personnel
- **Reliability**: Robust data handling and error prevention
- **Compatibility**: Works across different browsers and devices

## 🤝 How to Contribute

### Types of Contributions We Welcome

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest improvements or new functionality
- **Documentation**: Improve guides, README, or code comments
- **Code Contributions**: Submit bug fixes or new features
- **Testing**: Help test new features and report compatibility issues
- **UI/UX Improvements**: Enhance user experience and design

### Getting Started

1. **Fork the Repository**
   ```bash
   git fork https://github.com/your-username/sofun-tracker.git
   cd sofun-tracker
   ```

2. **Set Up Development Environment**
   ```bash
   # No special setup required - it's a static web app!
   # Just open assets/index.html in your browser
   
   # Optional: Use local server for better development experience
   python -m http.server 8000
   # Visit: http://localhost:8000/assets/
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-description
   ```

## 📋 Development Guidelines

### Code Style

#### JavaScript
- Use ES6+ features (const/let, arrow functions, template literals)
- Follow camelCase naming convention
- Add JSDoc comments for functions
- Keep functions small and focused
- Use meaningful variable names

```javascript
/**
 * Calculate person's assessment status
 * @param {Object} person - Personnel record
 * @returns {Object} Status object with text and CSS class
 */
function getPersonStatus(person) {
    // Implementation here
}
```

#### CSS
- Use CSS custom properties for theming
- Follow BEM naming convention where appropriate
- Mobile-first responsive design
- Minimize use of !important

```css
/* Good */
.personnel-table__row--selected {
    background-color: var(--color-selection);
}

/* Avoid */
.selected-row {
    background-color: blue !important;
}
```

#### HTML
- Use semantic HTML elements
- Include proper ARIA labels for accessibility
- Validate markup with W3C validator

### File Organization

```
assets/
├── js/
│   ├── app.js              # Main application controller
│   ├── personnel-manager.js # Personnel operations
│   ├── data-processor.js   # Excel processing
│   ├── dashboard.js        # Statistics & reporting
│   ├── storage.js          # Data persistence
│   └── utils.js            # Helper functions
├── css/
│   ├── main.css           # Core styles
│   ├── components.css     # UI components
│   └── themes.css         # Dark/light themes
└── index.html             # Entry point
```

### Testing Guidelines

#### Manual Testing Checklist
Before submitting a PR, please test:

- [ ] **Basic Functionality**
  - File upload (valid and invalid Excel files)
  - Personnel record CRUD operations
  - Search and filtering
  - Dark/light mode toggle

- [ ] **Cross-browser Testing**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (if available)
  - Edge (latest)

- [ ] **Responsive Design**
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)

- [ ] **Data Integrity**
  - Import large datasets (>100 personnel)
  - Perform bulk operations
  - Verify data persistence across browser sessions
  - Test edge cases (empty fields, special characters)

#### Test Data
Use the included sample data for testing:
```javascript
// In browser console:
generateSampleData(); // Creates test dataset
```

### Accessibility Standards

- Follow WCAG 2.1 AA guidelines
- Ensure keyboard navigation works
- Provide alt text for images
- Use sufficient color contrast ratios
- Test with screen readers when possible

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - Browser and version
   - Operating system
   - Screen resolution (for UI issues)

2. **Steps to Reproduce**
   - Detailed step-by-step instructions
   - Sample data file (if relevant)
   - Expected vs actual behavior

3. **Screenshots/Videos** (if applicable)

4. **Console Errors** (press F12 → Console tab)

### Bug Report Template
```markdown
**Environment:**
- Browser: Chrome 120.0
- OS: Windows 11
- Resolution: 1920x1080

**Steps to Reproduce:**
1. Open application
2. Upload Excel file with...
3. Click on...
4. Error occurs

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Console Errors:**
[Any error messages from browser console]

**Additional Context:**
[Any other relevant information]
```

## 💡 Feature Requests

When suggesting new features:

1. **Describe the Problem**: What current limitation does this address?
2. **Proposed Solution**: How should it work?
3. **Use Cases**: Who would benefit and how?
4. **Military Context**: How does it fit military workflows?
5. **Implementation Ideas**: Technical approach (if you have thoughts)

### Feature Request Template
```markdown
**Problem Statement:**
[Current limitation or pain point]

**Proposed Feature:**
[Detailed description of the feature]

**Use Case:**
[Who would use it and how]

**Military Relevance:**
[How it fits SAF/military operations]

**Additional Context:**
[Mockups, similar features in other apps, etc.]
```

## 🔄 Pull Request Process

### Before Submitting
1. **Update Documentation**: If you're changing functionality
2. **Test Thoroughly**: Follow the testing checklist
3. **Check Code Style**: Follow established patterns
4. **Update CHANGELOG**: Add entry for your changes

### PR Description Template
```markdown
## Summary
[Brief description of changes]

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Responsive design verified
- [ ] Data integrity tested

## Screenshots (if applicable)
[Before/after screenshots]

## Related Issues
Fixes #[issue number]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated
```

### Review Process
1. **Automated Checks**: Ensure no console errors
2. **Code Review**: Maintainer will review for:
   - Code quality and style
   - Security considerations
   - Performance impact
   - Military workflow compatibility
3. **Testing**: Additional testing by maintainers
4. **Merge**: Once approved, changes will be merged

## 🛡️ Security Considerations

### Data Handling
- **No External Transmission**: All data stays client-side
- **Input Validation**: Sanitize all user inputs
- **XSS Prevention**: Use proper escaping methods
- **File Security**: Validate uploaded files thoroughly

### Sensitive Information
- **No Classified Data**: Don't include any sensitive military information
- **Generic Examples**: Use placeholder names and units
- **Clean Commits**: Don't commit actual personnel data

## 📚 Resources

### Documentation
- [Technical Documentation](sofun-tracker.md)
- [User Guide](USER_GUIDE.md)
- [API Reference](API.md)

### Military Context
- Understanding of SAF assessment cycles
- Familiarity with military rank structure
- Knowledge of NSF vs Regular personnel differences

### Technical Resources
- [MDN Web Docs](https://developer.mozilla.org/)
- [SheetJS Documentation](https://docs.sheetjs.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 🏆 Recognition

Contributors will be acknowledged in:
- README.md contributors section
- CHANGELOG.md for specific contributions
- Special recognition for significant contributions

## 📞 Contact

- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Email [security@your-domain.com] for security issues

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make SOFUN Tracker better for military personnel worldwide! 🇸🇬** 