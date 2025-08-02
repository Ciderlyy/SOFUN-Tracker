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
        this.activeCharts = new Set(['y2Ippt', 'y2Voc', 'y2Range', 'platoon']); // Default active charts
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
        
        // Create Y2 charts (legacy support)
        this.createY2IpptChart();
        this.createY2VocChart();
        this.createY2RangeChart();
        this.createPlatoonChart();
        
        // Create Y1 charts
        this.createY1IpptChart();
        this.createY1VocChart();
        this.createY1AtpChart();
        
        // Create comparison chart
        this.createComparisonChart();
        
        console.log('✅ All dashboard charts created');
    }

    /* ---------- Chart Creation ---------- */

    /**
     * Create Y2 IPPT Performance Chart (Doughnut)
     */
    createY2IpptChart() {
        const ctx = document.getElementById('y2IpptChart');
        if (!ctx) {
            console.warn('Y2 IPPT chart canvas not found');
            return;
        }

        this.charts.y2Ippt = new Chart(ctx.getContext('2d'), {
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
    createY2VocChart() {
        const ctx = document.getElementById('y2VocChart');
        if (!ctx) {
            console.warn('VOC chart canvas not found');
            return;
        }

        this.charts.y2Voc = new Chart(ctx.getContext('2d'), {
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
    createY2RangeChart() {
        const ctx = document.getElementById('y2RangeChart');
        if (!ctx) {
            console.warn('Range chart canvas not found');
            return;
        }

        this.charts.y2Range = new Chart(ctx.getContext('2d'), {
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

    /* ---------- Y1 Chart Creation ---------- */

    /**
     * Create Y1 IPPT Performance Chart (Doughnut)
     */
    createY1IpptChart() {
        const ctx = document.getElementById('y1IpptChart');
        if (!ctx) {
            console.warn('Y1 IPPT chart canvas not found');
            return;
        }

        this.charts.y1Ippt = new Chart(ctx.getContext('2d'), {
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
     * Create Y1 VOC Results Chart (Bar)
     */
    createY1VocChart() {
        const ctx = document.getElementById('y1VocChart');
        if (!ctx) {
            console.warn('Y1 VOC chart canvas not found');
            return;
        }

        this.charts.y1Voc = new Chart(ctx.getContext('2d'), {
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
     * Create Y1 ATP Performance Chart (Bar)
     */
    createY1AtpChart() {
        const ctx = document.getElementById('y1AtpChart');
        if (!ctx) {
            console.warn('Y1 ATP chart canvas not found');
            return;
        }

        this.charts.y1Atp = new Chart(ctx.getContext('2d'), {
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
     * Create Y1 vs Y2 Comparison Chart
     */
    createComparisonChart() {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) {
            console.warn('Comparison chart canvas not found');
            return;
        }

        this.charts.comparison = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['IPPT Gold', 'IPPT Pass', 'VOC Pass', 'Range/ATP Pass'],
                datasets: [{
                    label: 'Y1 Performance',
                    data: [0, 0, 0, 0],
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Y2 Performance',
                    data: [0, 0, 0, 0],
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
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
        this.updateStatCard('totalPersonnel', activePersonnel.length);
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

        // Enhanced animation effect
        element.style.transform = 'scale(1.1) rotate(2deg)';
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.filter = 'brightness(1.2) drop-shadow(0 0 10px rgba(79, 172, 254, 0.6))';
        
        setTimeout(() => {
            element.textContent = value;
            element.style.transform = 'scale(1) rotate(0deg)';
            element.style.filter = 'brightness(1) drop-shadow(0 0 5px rgba(79, 172, 254, 0.3))';
        }, 150);
        
        setTimeout(() => {
            element.style.filter = 'brightness(1) drop-shadow(0 0 2px rgba(79, 172, 254, 0.2))';
        }, 450);
    }

    /**
     * Update all charts with new data
     * @param {Array} activePersonnel - Active personnel data
     */
    updateCharts(activePersonnel) {
        // Update Y2 charts (legacy compatibility)
        this.updateY2IpptChart(activePersonnel);
        this.updateY2VocChart(activePersonnel);
        this.updateY2RangeChart(activePersonnel);
        this.updatePlatoonChart(activePersonnel);
        
        // Update Y1 charts
        this.updateY1IpptChart(activePersonnel);
        this.updateY1VocChart(activePersonnel);
        this.updateY1AtpChart(activePersonnel);
        
        // Update comparison chart
        this.updateComparisonChart(activePersonnel);
    }

    /**
     * Update Y2 IPPT chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateY2IpptChart(activePersonnel) {
        if (!this.charts.y2Ippt) {
            console.warn('Y2 IPPT chart not initialized');
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

        this.charts.y2Ippt.data.datasets[0].data = Object.values(y2IpptCounts);
        this.charts.y2Ippt.update('active');
    }

    /**
     * Update Y2 VOC chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateY2VocChart(activePersonnel) {
        if (!this.charts.y2Voc) return;

        const categories = ['NSF', 'Regular'];
        const vocData = { Pass: [], Fail: [], Pending: [] };
        
        categories.forEach(cat => {
            const catPersonnel = activePersonnel.filter(p => p.category === cat);
            vocData.Pass.push(catPersonnel.filter(p => p.y2?.voc === 'Pass').length);
            vocData.Fail.push(catPersonnel.filter(p => p.y2?.voc === 'Fail').length);
            vocData.Pending.push(catPersonnel.filter(p => !p.y2?.voc || p.y2.voc === 'Pending').length);
        });
        
        this.charts.y2Voc.data.datasets[0].data = vocData.Pass;
        this.charts.y2Voc.data.datasets[1].data = vocData.Fail;
        this.charts.y2Voc.data.datasets[2].data = vocData.Pending;
        this.charts.y2Voc.update('active');
    }

    /**
     * Update Y2 range chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateY2RangeChart(activePersonnel) {
        if (!this.charts.y2Range) return;

        const y2RangeCounts = { Marksman: 0, Sharpshooter: 0, Pass: 0, Fail: 0, Pending: 0 };
        
        activePersonnel.forEach(p => {
            const result = p.y2?.range;
            if (y2RangeCounts[result] !== undefined) {
                y2RangeCounts[result]++;
            } else {
                y2RangeCounts.Pending++;
            }
        });

        this.charts.y2Range.data.datasets[0].data = Object.values(y2RangeCounts);
        this.charts.y2Range.update('active');
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

    /* ---------- Y1 Chart Updates ---------- */

    /**
     * Update Y1 IPPT chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateY1IpptChart(activePersonnel) {
        if (!this.charts.y1Ippt) {
            console.warn('Y1 IPPT chart not initialized');
            return;
        }

        const y1IpptCounts = { Gold: 0, Silver: 0, Pass: 0, Fail: 0, Pending: 0 };
        
        activePersonnel.forEach(p => {
            const grade = p.y1?.ippt;
            if (y1IpptCounts[grade] !== undefined) {
                y1IpptCounts[grade]++;
            } else {
                y1IpptCounts.Pending++;
            }
        });

        this.charts.y1Ippt.data.datasets[0].data = Object.values(y1IpptCounts);
        this.charts.y1Ippt.update('active');
    }

    /**
     * Update Y1 VOC chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateY1VocChart(activePersonnel) {
        if (!this.charts.y1Voc) return;

        const categories = ['NSF', 'Regular'];
        const vocData = { Pass: [], Fail: [], Pending: [] };
        
        categories.forEach(cat => {
            const catPersonnel = activePersonnel.filter(p => p.category === cat);
            vocData.Pass.push(catPersonnel.filter(p => p.y1?.voc === 'Pass').length);
            vocData.Fail.push(catPersonnel.filter(p => p.y1?.voc === 'Fail').length);
            vocData.Pending.push(catPersonnel.filter(p => !p.y1?.voc || p.y1.voc === 'Pending').length);
        });
        
        this.charts.y1Voc.data.datasets[0].data = vocData.Pass;
        this.charts.y1Voc.data.datasets[1].data = vocData.Fail;
        this.charts.y1Voc.data.datasets[2].data = vocData.Pending;
        this.charts.y1Voc.update('active');
    }

    /**
     * Update Y1 ATP chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateY1AtpChart(activePersonnel) {
        if (!this.charts.y1Atp) return;

        const y1AtpCounts = { Marksman: 0, Sharpshooter: 0, Pass: 0, Fail: 0, Pending: 0 };
        
        activePersonnel.forEach(p => {
            const result = p.y1?.atp;
            if (y1AtpCounts[result] !== undefined) {
                y1AtpCounts[result]++;
            } else {
                y1AtpCounts.Pending++;
            }
        });

        this.charts.y1Atp.data.datasets[0].data = Object.values(y1AtpCounts);
        this.charts.y1Atp.update('active');
    }

    /**
     * Update Y1 vs Y2 comparison chart
     * @param {Array} activePersonnel - Active personnel data
     */
    updateComparisonChart(activePersonnel) {
        if (!this.charts.comparison) return;

        const total = activePersonnel.length;
        if (total === 0) return;

        // Calculate Y1 performance percentages
        const y1Stats = {
            ipptGold: (activePersonnel.filter(p => p.y1?.ippt === 'Gold').length / total) * 100,
            ipptPass: (activePersonnel.filter(p => p.y1?.ippt && p.y1.ippt !== 'Fail' && p.y1.ippt !== 'Pending').length / total) * 100,
            vocPass: (activePersonnel.filter(p => p.y1?.voc === 'Pass').length / total) * 100,
            atpPass: (activePersonnel.filter(p => p.y1?.atp && p.y1.atp !== 'Fail' && p.y1.atp !== 'Pending').length / total) * 100
        };

        // Calculate Y2 performance percentages
        const y2Stats = {
            ipptGold: (activePersonnel.filter(p => p.y2?.ippt === 'Gold').length / total) * 100,
            ipptPass: (activePersonnel.filter(p => p.y2?.ippt && p.y2.ippt !== 'Fail' && p.y2.ippt !== 'Pending').length / total) * 100,
            vocPass: (activePersonnel.filter(p => p.y2?.voc === 'Pass').length / total) * 100,
            rangePass: (activePersonnel.filter(p => p.y2?.range && p.y2.range !== 'Fail' && p.y2.range !== 'Pending').length / total) * 100
        };

        this.charts.comparison.data.datasets[0].data = [
            y1Stats.ipptGold.toFixed(1),
            y1Stats.ipptPass.toFixed(1),
            y1Stats.vocPass.toFixed(1),
            y1Stats.atpPass.toFixed(1)
        ];

        this.charts.comparison.data.datasets[1].data = [
            y2Stats.ipptGold.toFixed(1),
            y2Stats.ipptPass.toFixed(1),
            y2Stats.vocPass.toFixed(1),
            y2Stats.rangePass.toFixed(1)
        ];

        this.charts.comparison.update('active');
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

/* ---------- Chart Selection Functions ---------- */

/**
 * Toggle chart visibility
 * @param {string} chartType - Type of chart to toggle
 */
function toggleChart(chartType) {
    const chartWrapper = document.getElementById(`chart-${chartType}`);
    const checkbox = document.getElementById(`chart${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`);
    
    if (!chartWrapper || !checkbox) {
        console.warn(`Chart elements not found for ${chartType}`);
        return;
    }
    
    if (checkbox.checked) {
        chartWrapper.style.display = 'block';
        window.sofunDashboard.activeCharts.add(chartType);
    } else {
        chartWrapper.style.display = 'none';
        window.sofunDashboard.activeCharts.delete(chartType);
    }
    
    // Update charts layout
    updateChartsLayout();
    
    console.log(`📊 Chart ${chartType} ${checkbox.checked ? 'enabled' : 'disabled'}`);
}

/**
 * Select all charts
 */
function selectAllCharts() {
    const checkboxes = document.querySelectorAll('.chart-option input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            const chartType = checkbox.id.replace('chart', '').toLowerCase();
            // Fix casing for compound chart types
            const fixedChartType = chartType.replace(/([a-z])([A-Z])/g, '$1$2').toLowerCase();
            toggleChart(fixedChartType);
        }
    });
    console.log('📊 All charts enabled');
}

/**
 * Clear all charts
 */
function clearAllCharts() {
    const checkboxes = document.querySelectorAll('.chart-option input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            const chartType = checkbox.id.replace('chart', '').toLowerCase();
            // Fix casing for compound chart types  
            const fixedChartType = chartType.replace(/([a-z])([A-Z])/g, '$1$2').toLowerCase();
            toggleChart(fixedChartType);
        }
    });
    console.log('🗑️ All charts cleared');
}

/**
 * Reset to default charts (Y2 + Platoon)
 */
function resetDefaultCharts() {
    clearAllCharts();
    
    const defaultCharts = ['y2Ippt', 'y2Voc', 'y2Range', 'platoon'];
    defaultCharts.forEach(chartType => {
        const checkbox = document.getElementById(`chart${chartType.charAt(0).toUpperCase() + chartType.slice(1)}`);
        if (checkbox) {
            checkbox.checked = true;
            toggleChart(chartType);
        }
    });
    console.log('🔄 Reset to default charts');
}

/**
 * Update charts grid layout based on active charts
 */
function updateChartsLayout() {
    const chartsGrid = document.getElementById('chartsGrid');
    const activeChartCount = window.sofunDashboard.activeCharts.size;
    
    if (activeChartCount === 0) {
        chartsGrid.style.gridTemplateColumns = '1fr';
    } else if (activeChartCount === 1) {
        chartsGrid.style.gridTemplateColumns = '1fr';
    } else if (activeChartCount === 2) {
        chartsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else if (activeChartCount <= 4) {
        chartsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    } else {
        chartsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
    }
}

console.log('✅ SOFUN Dashboard loaded - Charts and statistics ready');