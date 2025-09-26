/**
 * Enhanced Charts Manager for EngineerPulse
 * Advanced interactive charts and data visualizations
 */

class ChartsManager {
    constructor() {
        this.charts = new Map();
        this.chartData = this.initializeChartData();
        this.themes = {
            light: {
                backgroundColor: '#ffffff',
                textColor: '#374151',
                gridColor: '#e5e7eb',
                colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16']
            },
            dark: {
                backgroundColor: '#1f2937',
                textColor: '#f9fafb',
                gridColor: '#374151',
                colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#22d3ee', '#fb923c', '#a3e635']
            }
        };
        this.currentTheme = 'light';
        
        this.init();
    }

    init() {
        // Set Chart.js defaults
        this.setupChartDefaults();
        
        // Listen for theme changes
        this.setupThemeListener();
    }

    setupChartDefaults() {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = 'Inter, system-ui, -apple-system, sans-serif';
            Chart.defaults.font.size = 12;
            Chart.defaults.color = this.themes[this.currentTheme].textColor;
            Chart.defaults.borderColor = this.themes[this.currentTheme].gridColor;
            Chart.defaults.backgroundColor = this.themes[this.currentTheme].backgroundColor;
            
            // Register custom plugins
            this.registerCustomPlugins();
        }
    }

    registerCustomPlugins() {
        // Gradient background plugin
        Chart.register({
            id: 'gradientBackground',
            beforeDraw: (chart) => {
                if (chart.config.options.plugins?.gradientBackground) {
                    const ctx = chart.canvas.getContext('2d');
                    const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
                    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');
                    gradient.addColorStop(1, 'rgba(79, 70, 229, 0.01)');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, chart.width, chart.height);
                }
            }
        });

        // Data point annotations plugin
        Chart.register({
            id: 'dataPointAnnotations',
            afterDatasetsDraw: (chart) => {
                if (chart.config.options.plugins?.dataPointAnnotations) {
                    const ctx = chart.canvas.getContext('2d');
                    chart.data.datasets.forEach((dataset, datasetIndex) => {
                        const meta = chart.getDatasetMeta(datasetIndex);
                        meta.data.forEach((element, index) => {
                            if (dataset.annotations && dataset.annotations[index]) {
                                const annotation = dataset.annotations[index];
                                ctx.fillStyle = annotation.color || '#374151';
                                ctx.font = '10px Inter';
                                ctx.textAlign = 'center';
                                ctx.fillText(
                                    annotation.text,
                                    element.x,
                                    element.y - 10
                                );
                            }
                        });
                    });
                }
            }
        });
    }

    setupThemeListener() {
        // Listen for theme changes
        document.addEventListener('themechange', (e) => {
            this.currentTheme = e.detail.theme;
            this.updateAllChartThemes();
        });
    }

    // Chart Creation Methods
    createVelocityChart(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const data = this.chartData.velocity;
        const config = {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Story Points Completed',
                    data: data.values,
                    borderColor: this.themes[this.currentTheme].colors[0],
                    backgroundColor: this.themes[this.currentTheme].colors[0] + '20',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: this.themes[this.currentTheme].colors[0],
                    pointBorderWidth: 2,
                    pointBorderColor: '#ffffff'
                }, {
                    label: 'Target Velocity',
                    data: data.target,
                    borderColor: this.themes[this.currentTheme].colors[3],
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Sprint Velocity Trend',
                        font: { size: 16, weight: 'bold' },
                        padding: 20
                    },
                    legend: {
                        position: 'top',
                        align: 'end'
                    },
                    tooltip: {
                        backgroundColor: this.themes[this.currentTheme].backgroundColor,
                        titleColor: this.themes[this.currentTheme].textColor,
                        bodyColor: this.themes[this.currentTheme].textColor,
                        borderColor: this.themes[this.currentTheme].gridColor,
                        borderWidth: 1,
                        callbacks: {
                            afterBody: (tooltipItems) => {
                                const dataIndex = tooltipItems[0].dataIndex;
                                const insights = data.insights[dataIndex];
                                return insights ? [`\n${insights}`] : [];
                            }
                        }
                    },
                    gradientBackground: true
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Story Points'
                        },
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    },
                    x: {
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    }
                },
                ...options
            }
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    createBurndownChart(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const data = this.chartData.burndown;
        const config = {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Actual Burndown',
                    data: data.actual,
                    borderColor: this.themes[this.currentTheme].colors[0],
                    backgroundColor: this.themes[this.currentTheme].colors[0] + '20',
                    tension: 0.1,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Ideal Burndown',
                    data: data.ideal,
                    borderColor: this.themes[this.currentTheme].colors[1],
                    backgroundColor: 'transparent',
                    borderDash: [3, 3],
                    tension: 0,
                    fill: false,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sprint Burndown Chart',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: this.themes[this.currentTheme].backgroundColor,
                        titleColor: this.themes[this.currentTheme].textColor,
                        bodyColor: this.themes[this.currentTheme].textColor,
                        borderColor: this.themes[this.currentTheme].gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Remaining Work (Story Points)'
                        },
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Sprint Days'
                        },
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    }
                },
                ...options
            }
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    createCycleTimeChart(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const data = this.chartData.cycleTime;
        const config = {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'This Sprint',
                    data: data.current,
                    backgroundColor: this.themes[this.currentTheme].colors[0],
                    borderColor: this.themes[this.currentTheme].colors[0],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'Last Sprint',
                    data: data.previous,
                    backgroundColor: this.themes[this.currentTheme].colors[1] + '60',
                    borderColor: this.themes[this.currentTheme].colors[1],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Cycle Time Distribution',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: this.themes[this.currentTheme].backgroundColor,
                        titleColor: this.themes[this.currentTheme].textColor,
                        bodyColor: this.themes[this.currentTheme].textColor,
                        borderColor: this.themes[this.currentTheme].gridColor,
                        borderWidth: 1,
                        callbacks: {
                            afterLabel: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${percentage}% of tasks`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Tasks'
                        },
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Cycle Time'
                        },
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    }
                },
                ...options
            }
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    createCodeQualityChart(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const data = this.chartData.codeQuality;
        const config = {
            type: 'radar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Current Sprint',
                    data: data.current,
                    borderColor: this.themes[this.currentTheme].colors[0],
                    backgroundColor: this.themes[this.currentTheme].colors[0] + '30',
                    pointBackgroundColor: this.themes[this.currentTheme].colors[0],
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.themes[this.currentTheme].colors[0],
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }, {
                    label: 'Last Sprint',
                    data: data.previous,
                    borderColor: this.themes[this.currentTheme].colors[1],
                    backgroundColor: this.themes[this.currentTheme].colors[1] + '20',
                    pointBackgroundColor: this.themes[this.currentTheme].colors[1],
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.themes[this.currentTheme].colors[1],
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Code Quality Metrics',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: this.themes[this.currentTheme].backgroundColor,
                        titleColor: this.themes[this.currentTheme].textColor,
                        bodyColor: this.themes[this.currentTheme].textColor,
                        borderColor: this.themes[this.currentTheme].gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        },
                        grid: {
                            color: this.themes[this.currentTheme].gridColor
                        },
                        angleLines: {
                            color: this.themes[this.currentTheme].gridColor
                        }
                    }
                },
                ...options
            }
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    createProductivityHeatmap(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        // Custom heatmap implementation using Chart.js scatter plot
        const data = this.chartData.productivity;
        const config = {
            type: 'scatter',
            data: {
                datasets: data.map((week, weekIndex) => ({
                    label: `Week ${weekIndex + 1}`,
                    data: week.map((value, dayIndex) => ({
                        x: dayIndex,
                        y: weekIndex,
                        v: value // Custom property for value
                    })),
                    backgroundColor: (context) => {
                        const value = context.raw.v;
                        const opacity = value / 10; // Normalize to 0-1
                        return `rgba(79, 70, 229, ${opacity})`;
                    },
                    pointRadius: 25,
                    pointHoverRadius: 30
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Productivity Heatmap',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: this.themes[this.currentTheme].backgroundColor,
                        titleColor: this.themes[this.currentTheme].textColor,
                        bodyColor: this.themes[this.currentTheme].textColor,
                        borderColor: this.themes[this.currentTheme].gridColor,
                        borderWidth: 1,
                        callbacks: {
                            title: (tooltipItems) => {
                                const item = tooltipItems[0];
                                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                return `${days[item.raw.x]}, Week ${item.raw.y + 1}`;
                            },
                            label: (tooltipItem) => {
                                return `Productivity Score: ${tooltipItem.raw.v}/10`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 6,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => {
                                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                return days[value] || '';
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 3,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => `Week ${value + 1}`
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                ...options
            }
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    createTeamPerformanceChart(canvasId, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;

        const data = this.chartData.teamPerformance;
        const config = {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.themes[this.currentTheme].colors.slice(0, data.values.length),
                    borderColor: this.themes[this.currentTheme].backgroundColor,
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Team Contribution',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: this.themes[this.currentTheme].backgroundColor,
                        titleColor: this.themes[this.currentTheme].textColor,
                        bodyColor: this.themes[this.currentTheme].textColor,
                        borderColor: this.themes[this.currentTheme].gridColor,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw} tasks (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                ...options
            }
        };

        const chart = new Chart(canvas.getContext('2d'), config);
        this.charts.set(canvasId, chart);
        return chart;
    }

    // Utility Methods
    updateChartData(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.data = newData;
            chart.update('active');
        }
    }

    updateAllChartThemes() {
        this.setupChartDefaults();
        
        this.charts.forEach((chart, chartId) => {
            // Update theme colors for each chart
            chart.data.datasets.forEach((dataset, index) => {
                if (dataset.borderColor && !dataset.borderColor.includes('rgba')) {
                    dataset.borderColor = this.themes[this.currentTheme].colors[index % this.themes[this.currentTheme].colors.length];
                }
                if (dataset.backgroundColor && !dataset.backgroundColor.includes('rgba')) {
                    dataset.backgroundColor = this.themes[this.currentTheme].colors[index % this.themes[this.currentTheme].colors.length] + '20';
                }
            });
            
            // Update grid colors
            if (chart.options.scales?.x?.grid) {
                chart.options.scales.x.grid.color = this.themes[this.currentTheme].gridColor;
            }
            if (chart.options.scales?.y?.grid) {
                chart.options.scales.y.grid.color = this.themes[this.currentTheme].gridColor;
            }
            
            chart.update();
        });
    }

    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    destroyAllCharts() {
        this.charts.forEach((chart, chartId) => {
            chart.destroy();
        });
        this.charts.clear();
    }

    // Data Management
    initializeChartData() {
        return {
            velocity: {
                labels: ['Sprint 8', 'Sprint 9', 'Sprint 10', 'Sprint 11', 'Sprint 12'],
                values: [35, 38, 32, 45, 42],
                target: [40, 40, 40, 40, 40],
                insights: [
                    'Good baseline sprint',
                    'Slight improvement',
                    'Some blockers encountered',
                    'Excellent performance',
                    'Consistent with target'
                ]
            },
            burndown: {
                labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10'],
                actual: [42, 38, 35, 30, 28, 25, 20, 15, 8, 3],
                ideal: [42, 37.8, 33.6, 29.4, 25.2, 21, 16.8, 12.6, 8.4, 4.2, 0]
            },
            cycleTime: {
                labels: ['< 1 day', '1-2 days', '2-3 days', '3-5 days', '> 5 days'],
                current: [8, 12, 15, 6, 3],
                previous: [5, 8, 12, 10, 8]
            },
            codeQuality: {
                labels: ['Test Coverage', 'Code Complexity', 'Documentation', 'Code Review', 'Bug Rate', 'Performance'],
                current: [85, 75, 70, 90, 95, 80],
                previous: [78, 70, 65, 85, 88, 75]
            },
            productivity: [
                [8, 7, 9, 8, 6, 4, 2], // Week 1
                [9, 8, 8, 9, 7, 3, 1], // Week 2
                [7, 9, 8, 7, 8, 5, 2], // Week 3
                [8, 8, 9, 8, 7, 4, 3]  // Week 4
            ],
            teamPerformance: {
                labels: ['Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Thompson', 'David Park'],
                values: [15, 12, 10, 8, 7]
            }
        };
    }

    // Export functionality
    exportChart(chartId, format = 'png') {
        const chart = this.charts.get(chartId);
        if (chart) {
            const url = chart.toBase64Image(format, 1.0);
            const link = document.createElement('a');
            link.download = `${chartId}.${format}`;
            link.href = url;
            link.click();
        }
    }

    // Animation helpers
    animateChart(chartId, animationType = 'progressive') {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.options.animation = {
                duration: 1500,
                easing: 'easeInOutQuart'
            };
            
            if (animationType === 'progressive') {
                chart.options.animation.onProgress = function(animation) {
                    const progress = animation.currentStep / animation.numSteps;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((element, index) => {
                            element._model.backgroundColor = dataset.backgroundColor;
                        });
                    });
                };
            }
            
            chart.update();
        }
    }

    // Real-time updates
    startRealTimeUpdates(chartId, interval = 30000) {
        const updateInterval = setInterval(() => {
            this.updateChartWithRealTimeData(chartId);
        }, interval);
        
        return updateInterval;
    }

    updateChartWithRealTimeData(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            // Simulate real-time data updates
            chart.data.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(value => {
                    const variation = (Math.random() - 0.5) * 2; // ±1 variation
                    return Math.max(0, Math.round(value + variation));
                });
            });
            
            chart.update('none');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsManager;
} else {
    window.ChartsManager = ChartsManager;
}