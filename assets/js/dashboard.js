/* =================================================================
   SOFUN TRACKER - DASHBOARD
   Charts, statistics, and data visualization
   ================================================================= */

/**
 * SOFUN Dashboard Manager
 * Handles all charts, statistics, and dashboard updates
 */
class SofunDashboard {
    constructor() {
        this.charts = {};
        this.isDarkMode = false;
        this.initialized = false;
        this.chartColors = {
            primary: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            danger: '#e74c3c',
            info: '#17a2b8',
            secondary: '#6c757d'
        };
    }

    /* ---------- Initialization ---------- */

    /**
     * Initialize dashboard and create all charts
     */
    init() {
        try {
            this.isDarkMode = document.body.classList.contains('dark-mode');
            this.createCharts();
            this.initialized = true;
            console.log('✅ Dashboard initialized with charts');
        } catch (error) {
            logError('Dashboard initialization failed', error);
        }
    }

    /**
     * Create all dashboard charts
     */
    createCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library not loaded');
            return;
        }
        this.createIpptChart();
        this.createVocChart();
        this.createRangeChart();
        this.createPlatoonChart();
    }

    /* ---------- Chart Creation ---------- */

    /**
     * Create Y2 IPPT Performance Chart (Doughnut)
     */
    createIpptChart() {
        const ctx = document.getElementById('ipptChart');
        if (!ctx) {
            console.warn('IPPT chart canvas not found');
            return;
        }

        this.charts.ippt = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Gold', 'Silver', 'Pass', 'Fail', 'Pending'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#FFD700', // Gold
                        '#C0C0C0', // Silver
                        '#28A745', // Pass (Green)
                        '#DC3545', // Fail (Red)
                        '#FFC107'  // Pending (Yellow)
                    ],
                    borderWidth: 2,
                    borderColor: this.isDarkMode ? '#495057' : '#ffffff'
                }]
            },
            options: {
                ...this.getBaseChartOptions(),
                plugins: {
                    ...this.getBaseChartOptions().plugins,
                    legend: {
                        position: 'bottom',
                        labels: {
                            ...this.getLegendLabelOptions(),
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create Y2 VOC Results Chart (Bar)
     */
    createVocChart() {
        const ctx = document.getElementById('vocChart');
        if (!ctx) {
            console.warn('VOC chart canvas not found');
            return;
        }

        this.charts.voc = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['NSF', 'Regular'],
                datasets: [{
                    label: 'Pass',
                    data: [0, 0],
                    backgroundColor: '#28A745',
                    borderColor: '#1e7e34',
                    borderWidth: 1
                }, {
                    label: 'Fail',
                    data: [0, 0],
                    backgroundColor: '#DC3545',
                    borderColor: '#bd2130',
                    borderWidth: 1
                }, {
                    label: 'Pending',
                    data: [0, 0],
                    backgroundColor: '#FFC107',
                    borderColor: '#e0a800',
                    borderWidth: 1
                }]
            },
            options: {
                ...this.getBaseChartOptions(),
                plugins: {
                    ...this.getBaseChartOptions().plugins,
                    legend: {
                        position: 'top',
                        labels: this.getLegendLabelOptions()
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            ...this.getAxisTickOptions(),
                            stepSize: 1
                        },
                        grid: this.getGridOptions()
                    },
                    x: {
                        ticks: this.getAxisTickOptions(),
                        grid: this.getGridOptions()
                    }
                }
            }
        });
    }

    /**
     * Create Y2 Range Performance Chart (Bar)
     */
    createRangeChart() {
        const ctx = document.getElementById('rangeChart');
        if (!ctx) {
            console.warn('Range chart canvas not found');
            return;
        }

        this.charts.range = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Marksman', 'Sharpshooter', 'Pass', 'Fail', 'Pending'],
                datasets: [{
                    label: 'Personnel Count',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#007BFF', // Marksman (Blue)
                        '#17A2B8', // Sharpshooter (Cyan)
                        '#28A745', // Pass (Green)
                        '#DC3545', // Fail (Red)
                        '#FFC107'  // Pending (Yellow)
                    ],
                    borderColor: [
                        '#0056b3',
                        '#117a8b',
                        '#1e7e34',
                        '#bd2130',
                        '#e0a800'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                ...this.getBaseChartOptions(),
                plugins: {
                    ...this.getBaseChartOptions().plugins,
                    legend: {
                        display: false // Hide legend for single dataset
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            ...this.getAxisTickOptions(),
                            stepSize: 1
                        },
                        grid: this.getGridOptions()
                    },
                    x: {
                        ticks: this.getAxisTickOptions(),
                        grid: this.getGridOptions()
                    }
                }
            }
        });
    }

    /**
     * Create Platoon Performance Chart (Bar)
     */
    createPlatoonChart() {
        const ctx = document.getElementById('platoonChart');
        if (!ctx) {
            console.warn('Platoon chart canvas not found');
            return;
        }

        this.charts.platoon = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Y2 Completion %',
                    data: [],
                    backgroundColor: this.chartColors.primary,
                    borderColor: '#2980b9',
                    borderWidth: 1
                }]
            },
            options: {
                ...this.getBaseChartOptions(),
                plugins: {
                    ...this.getBaseChartOptions().plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${context.raw}% completed`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            ...this.getAxisTickOptions(),
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: this.getGridOptions()
                    },
                    x: {
                        ticks: this.getAxisTickOptions(),
                        grid: this.getGridOptions()
                    }
                }
            }
        });
    }

    /* ---------- Chart Configuration Helpers ---------- */

    /**
     * Get base chart options
     * @returns {Object} Base chart configuration
     */
    getBaseChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    backgroundColor: this.isDarkMode ? 'rgba(30, 30, 46, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    titleColor: this.isDarkMode ? '#eee' : '#fff',
                    bodyColor: this.isDarkMode ? '#eee' : '#fff',
                    borderColor: this.isDarkMode ? '#495057' : '#ccc',
                    borderWidth: 1
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        };
    }

    /**
     * Get legend label options
     * @returns {Object} Legend configuration
     */
    getLegendLabelOptions() {
        return {
            color: this.isDarkMode ? '#eee' : '#2c3e50',
            font: {
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                size: 12
            }
        };
    }

    /**
     * Get axis tick options
     * @returns {Object} Axis tick configuration
     */
    getAxisTickOptions() {
        return {
            color: this.isDarkMode ? '#adb5bd' : '#495057',
            font: {
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                size: 11
            }
        };
    }

    /**
     * Get grid options
     * @returns {Object} Grid configuration
     */
    getGridOptions() {
        return {
            color: this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderColor: this.isDarkMode ? '#495057' : '#dee2e6'
        };
    }

    /* ---------- Dashboard Updates ---------- */

    /**
     * Update entire dashboard with new data
     * @param {Array} filteredData - Filtered personnel data
     */
    updateDashboard(filteredData) {
        if (!this.initialized) {
            console.warn('Dashboard not initialized');
            return;
        }

        try {
            const activePersonnel = filteredData.filter(p => !p.isORD);
            this.updateStatistics(activePersonnel);
            this.updateCharts(activePersonnel);
        } catch (error) {
            logError('Dashboard update failed', error);
        }
    }

    /**
     * Update statistics cards
     * @param {Array} activePersonnel - Active personnel data
     */
    updateStatistics(activePersonnel) {
        const nsfPersonnel = activePersonnel.filter(p => p.category === 'NSF');
        const regularPersonnel = activePersonnel.filter(p => p.category === 'Regular');
        
        // Update statistics cards
        this.updateStatCard('totalNSF', nsfPersonnel.length);
        this.updateStatCard('totalRegulars', regularPersonnel.length);
        this.updateStatCard('y2IpptGold', activePersonnel.filter(p => p.y2?.ippt === 'Gold').length);
        this.updateStatCard('y2VocPass', activePersonnel.filter(p => p.y2?.voc === 'Pass').length);
        this.updateStatCard('y2RangeQualified', 
            activePersonnel.filter(p => p.y2?.range === 'Marksman' || p.y2?.range === 'Sharpshooter').length
        );
        
        // Calculate and update data completeness
        const completeness = calculateCompletionPercentage(activePersonnel);
        this.updateStatCard('dataCompleteness', completeness + '%');
    }

    /**
     * Update individual statistics card with animation
     * @param {string} elementId - Element ID
     * @param {string|number} value - New value
     */
    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Stat card element not found: ${elementId}`);
            return;
        }

        // Add animation effect
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
            element.textContent = value;
            element.style.transform = 'scale(1)';
        }, 100);
    }

    /**
     * Update all charts with new data
     * @param {Array} activePersonnel - Active personnel data
     */
    updateCharts(activePersonnel) {
        this.updateIpptChart(activePersonnel);
        this.updateVocChart(activePersonnel);
        this.updateRangeChart(activePersonnel);
        this.updatePlatoonChart(activePersonnel);
    }

    /**
     * Update Y2 IPPT chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateIpptChart(activePersonnel) {
        if (!this.charts.ippt) {
            console.warn('IPPT chart not initialized');
            return;
        }

        const y2IpptCounts = { Gold: 0, Silver: 0, Pass: 0, Fail: 0, Pending: 0 };
        
        activePersonnel.forEach(p => {
            const grade = p.y2?.ippt;
            if (y2IpptCounts[grade] !== undefined) {
                y2IpptCounts[grade]++;
            } else {
                y2IpptCounts.Pending++;
            }
        });

        this.charts.ippt.data.datasets[0].data = Object.values(y2IpptCounts);
        this.charts.ippt.update('active');
    }

    /**
     * Update Y2 VOC chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateVocChart(activePersonnel) {
        if (!this.charts.voc) return;

        const categories = ['NSF', 'Regular'];
        const vocData = { Pass: [], Fail: [], Pending: [] };
        
        categories.forEach(cat => {
            const catPersonnel = activePersonnel.filter(p => p.category === cat);
            vocData.Pass.push(catPersonnel.filter(p => p.y2?.voc === 'Pass').length);
            vocData.Fail.push(catPersonnel.filter(p => p.y2?.voc === 'Fail').length);
            vocData.Pending.push(catPersonnel.filter(p => !p.y2?.voc || p.y2.voc === 'Pending').length);
        });
        
        this.charts.voc.data.datasets[0].data = vocData.Pass;
        this.charts.voc.data.datasets[1].data = vocData.Fail;
        this.charts.voc.data.datasets[2].data = vocData.Pending;
        this.charts.voc.update('active');
    }

    /**
     * Update Y2 range chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateRangeChart(activePersonnel) {
        if (!this.charts.range) return;

        const y2RangeCounts = { Marksman: 0, Sharpshooter: 0, Pass: 0, Fail: 0, Pending: 0 };
        
        activePersonnel.forEach(p => {
            const result = p.y2?.range;
            if (y2RangeCounts[result] !== undefined) {
                y2RangeCounts[result]++;
            } else {
                y2RangeCounts.Pending++;
            }
        });

        this.charts.range.data.datasets[0].data = Object.values(y2RangeCounts);
        this.charts.range.update('active');
    }

    /**
     * Update platoon performance chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updatePlatoonChart(activePersonnel) {
        if (!this.charts.platoon) return;

        const platoonStats = {};
        
        activePersonnel.forEach(p => {
            const platoon = p.platoon || 'Unassigned';
            if (!platoonStats[platoon]) {
                platoonStats[platoon] = { total: 0, complete: 0 };
            }
            platoonStats[platoon].total++;
            
            // Check if Y2 assessments are complete
            if (p.y2?.ippt && p.y2?.voc && p.y2?.range) {
                platoonStats[platoon].complete++;
            }
        });
        
        const platoonLabels = Object.keys(platoonStats).sort();
        const platoonData = platoonLabels.map(platoon => {
            const stats = platoonStats[platoon];
            return stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;
        });
        
        this.charts.platoon.data.labels = platoonLabels;
        this.charts.platoon.data.datasets[0].data = platoonData;
        this.charts.platoon.update('active');
    }

    /* ---------- Theme Management ---------- */

    /**
     * Update charts theme for dark/light mode
     */
    updateChartsTheme() {
        this.isDarkMode = document.body.classList.contains('dark-mode');
        
        Object.values(this.charts).forEach(chart => {
            if (!chart) return;
            
            // Update legend colors
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = this.isDarkMode ? '#eee' : '#2c3e50';
            }
            
            // Update axis colors
            if (chart.options.scales) {
                ['x', 'y'].forEach(axis => {
                    if (chart.options.scales[axis]?.ticks) {
                        chart.options.scales[axis].ticks.color = this.isDarkMode ? '#adb5bd' : '#495057';
                    }
                    if (chart.options.scales[axis]?.grid) {
                        chart.options.scales[axis].grid.color = this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                        chart.options.scales[axis].grid.borderColor = this.isDarkMode ? '#495057' : '#dee2e6';
                    }
                });
            }
            
            // Update tooltip colors
            if (chart.options.plugins?.tooltip) {
                chart.options.plugins.tooltip.backgroundColor = this.isDarkMode ? 'rgba(30, 30, 46, 0.9)' : 'rgba(0, 0, 0, 0.8)';
                chart.options.plugins.tooltip.titleColor = this.isDarkMode ? '#eee' : '#fff';
                chart.options.plugins.tooltip.bodyColor = this.isDarkMode ? '#eee' : '#fff';
                chart.options.plugins.tooltip.borderColor = this.isDarkMode ? '#495057' : '#ccc';
            }
            
            chart.update('none'); // Update without animation
        });
        
        console.log(`Charts updated for ${this.isDarkMode ? 'dark' : 'light'} mode`);
    }

    /* ---------- Utility Methods ---------- */

    /**
     * Get chart data for export
     * @returns {Object} Chart data for all charts
     */
    getChartData() {
        const chartData = {};
        
        Object.entries(this.charts).forEach(([name, chart]) => {
            if (chart) {
                chartData[name] = {
                    labels: chart.data.labels,
                    datasets: chart.data.datasets.map(dataset => ({
                        label: dataset.label,
                        data: [...dataset.data]
                    }))
                };
            }
        });
        
        return chartData;
    }

    /**
     * Destroy all charts (cleanup)
     */
    destroy() {
        Object.entries(this.charts).forEach(([name, chart]) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
        this.initialized = false;
        console.log('Dashboard charts destroyed');
    }

    /**
     * Refresh all charts
     */
    refresh() {
        this.destroy();
        this.init();
        console.log('Dashboard refreshed');
    }
}

/* ---------- Global Dashboard Instance ---------- */

// Create global dashboard instance
const dashboard = new SofunDashboard();

/* ---------- Global Functions (for backward compatibility) ---------- */

/**
 * Global function to create charts
 */
function createCharts() {
    dashboard.init();
}

/**
 * Global function to update charts theme
 */
function updateChartsTheme() {
    dashboard.updateChartsTheme();
}

/**
 * Global function to update dashboard
 * @param {Array} filteredData - Filtered personnel data
 */
function updateDashboard(filteredData) {
    dashboard.updateDashboard(filteredData);
}

console.log('✅ SOFUN Dashboard loaded - Charts and statistics ready');