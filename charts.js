document.addEventListener('DOMContentLoaded', function() {
    // Global chart settings
    Chart.defaults.color = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#f8f9fa' : '#212529';
    Chart.defaults.borderColor = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? '#444' : '#ddd';
    
    // Get country selection element
    const countrySelector = document.getElementById('country-selector');
    const updateButton = document.getElementById('update-data');
    const countryDataContainer = document.getElementById('country-data-container');
    
    // Charts
    let casesChart, statsChart, globalTrendChart;
    
    // Initialize country dropdown
    loadCountries();
    
    // Country selector change event
    updateButton.addEventListener('click', function() {
        const selectedCountry = countrySelector.value;
        if (selectedCountry) {
            loadCountryData(selectedCountry);
        }
    });
    
    // Load countries for dropdown
    function loadCountries() {
        fetch('/api/countries')
            .then(response => response.json())
            .then(data => {
                // Sort countries by name
                data.sort((a, b) => a.country.localeCompare(b.country));
                
                // Clear and populate dropdown
                countrySelector.innerHTML = '<option value="">Select a country</option>';
                
                data.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.country;
                    option.textContent = country.country;
                    countrySelector.appendChild(option);
                });
                
                // Default to a country (e.g., USA)
                countrySelector.value = 'USA';
                loadCountryData('USA');
            })
            .catch(error => {
                console.error('Error loading countries:', error);
                countrySelector.innerHTML = '<option value="">Error loading countries</option>';
            });
            
        // Load top affected countries
        loadTopCountries();
        
        // Initialize global trend chart
        initGlobalTrendChart();
    }
    
    // Load data for selected country
    function loadCountryData(countryName) {
        fetch(`/api/country/${countryName}`)
            .then(response => response.json())
            .then(data => {
                // Display country data
                document.getElementById('country-name').textContent = data.country;
                document.getElementById('country-flag').src = data.countryInfo.flag;
                document.getElementById('country-cases').textContent = formatNumber(data.cases);
                document.getElementById('country-today-cases').textContent = '+' + formatNumber(data.todayCases);
                document.getElementById('country-deaths').textContent = formatNumber(data.deaths);
                document.getElementById('country-today-deaths').textContent = '+' + formatNumber(data.todayDeaths);
                document.getElementById('country-recovered').textContent = formatNumber(data.recovered);
                document.getElementById('country-today-recovered').textContent = '+' + formatNumber(data.todayRecovered);
                document.getElementById('country-active').textContent = formatNumber(data.active);
                document.getElementById('country-critical').textContent = formatNumber(data.critical);
                document.getElementById('country-tests').textContent = formatNumber(data.tests);
                document.getElementById('country-tests-per-million').textContent = formatNumber(data.testsPerOneMillion);
                document.getElementById('country-population').textContent = formatNumber(data.population);
                document.getElementById('country-cases-per-million').textContent = formatNumber(data.casesPerOneMillion);
                
                // Show the data container
                countryDataContainer.style.display = 'block';
                
                // Load historical data for charts
                loadHistoricalData(countryName);
            })
            .catch(error => {
                console.error('Error loading country data:', error);
                alert('Error loading data for ' + countryName);
            });
    }
    
    // Load historical data for charts
    function loadHistoricalData(countryName) {
        fetch(`/api/historical/${countryName}?days=30`)
            .then(response => response.json())
            .then(data => {
                if (data.timeline) {
                    const casesData = data.timeline.cases;
                    const deathsData = data.timeline.deaths;
                    const recoveredData = data.timeline.recovered;
                    
                    updateCasesChart(casesData);
                    updateStatsChart(casesData, deathsData, recoveredData);
                } else {
                    console.error('No timeline data available');
                }
            })
            .catch(error => {
                console.error('Error loading historical data:', error);
            });
    }
    
    // Update cases chart
    function updateCasesChart(casesData) {
        const dates = Object.keys(casesData);
        const values = Object.values(casesData);
        
        // Calculate daily new cases
        const dailyNewCases = [];
        for (let i = 1; i < values.length; i++) {
            dailyNewCases.push(values[i] - values[i-1]);
        }
        
        // Format dates for display
        const formattedDates = dates.slice(1).map(date => {
            const parts = date.split('/');
            return `${parts[1]}/${parts[0]}`;
        });
        
        if (casesChart) {
            casesChart.destroy();
        }
        
        const casesCtx = document.getElementById('cases-chart').getContext('2d');
        casesChart = new Chart(casesCtx, {
            type: 'bar',
            data: {
                labels: formattedDates,
                datasets: [{
                    label: 'Daily New Cases',
                    data: dailyNewCases,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily New Cases (Last 30 Days)'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'New Cases: ' + formatNumber(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Update stats chart
    function updateStatsChart(casesData, deathsData, recoveredData) {
        const dates = Object.keys(casesData);
        const lastDate = dates[dates.length - 1];
        
        const totalCases = casesData[lastDate] || 0;
        const totalDeaths = deathsData[lastDate] || 0;
        const totalRecovered = recoveredData ? (recoveredData[lastDate] || 0) : 0;
        const activeCases = totalCases - totalDeaths - totalRecovered;
        
        if (statsChart) {
            statsChart.destroy();
        }
        
        const statsCtx = document.getElementById('stats-chart').getContext('2d');
        statsChart = new Chart(statsCtx, {
            type: 'pie',
            data: {
                labels: ['Active Cases', 'Recovered', 'Deaths'],
                datasets: [{
                    data: [activeCases, totalRecovered, totalDeaths],
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 193, 7, 1)',
                        'rgba(40, 167, 69, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Current Statistics Breakdown'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = formatNumber(context.raw);
                                const percentage = ((context.raw / totalCases) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Load top affected countries
    function loadTopCountries() {
        fetch('/api/countries')
            .then(response => response.json())
            .then(data => {
                // Sort countries by total cases
                data.sort((a, b) => b.cases - a.cases);
                
                // Take top 8 countries
                const topCountries = data.slice(0, 8);
                
                // Clear container
                const container = document.getElementById('top-countries');
                container.innerHTML = '';
                
                // Populate with top countries
                topCountries.forEach(country => {
                    const col = document.createElement('div');
                    col.className = 'col-md-3 col-sm-6 mb-4';
                    
                    col.innerHTML = `
                        <div class="card border-0 shadow-sm country-card h-100">
                            <div class="card-body text-center">
                                <img src="${country.countryInfo.flag}" alt="${country.country} Flag" class="mb-2" style="height: 40px;">
                                <h5 class="card-title">${country.country}</h5>
                                <p class="mb-1">Cases: <span class="text-danger">${formatNumber(country.cases)}</span></p>
                                <p class="mb-1">Deaths: <span class="text-dark">${formatNumber(country.deaths)}</span></p>
                                <p class="mb-0">Recovered: <span class="text-success">${formatNumber(country.recovered)}</span></p>
                            </div>
                        </div>
                    `;
                    
                    container.appendChild(col);
                });
            })
            .catch(error => {
                console.error('Error loading top countries:', error);
            });
    }
    
    // Initialize global trend chart
    function initGlobalTrendChart() {
        fetch(`/api/historical/all?days=90`)
            .then(response => response.json())
            .then(data => {
                if (data.cases && data.deaths) {
                    const casesData = data.cases;
                    const deathsData = data.deaths;
                    
                    const dates = Object.keys(casesData);
                    const formattedDates = dates.map(date => {
                        const parts = date.split('/');
                        return `${parts[1]}/${parts[0]}`;
                    });
                    
                    const casesValues = Object.values(casesData);
                    const deathsValues = Object.values(deathsData);
                    
                    const globalTrendCtx = document.getElementById('global-trend-chart').getContext('2d');
                    globalTrendChart = new Chart(globalTrendCtx, {
                        type: 'line',
                        data: {
                            labels: formattedDates,
                            datasets: [
                                {
                                    label: 'Global Cases',
                                    data: casesValues,
                                    borderColor: 'rgba(54, 162, 235, 1)',
                                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                                    borderWidth: 2,
                                    fill: true,
                                    tension: 0.1
                                },
                                {
                                    label: 'Global Deaths',
                                    data: deathsValues,
                                    borderColor: 'rgba(220, 53, 69, 1)',
                                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                    borderWidth: 2,
                                    fill: true,
                                    tension: 0.1
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Global COVID-19 Trends (Last 90 Days)'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.dataset.label + ': ' + formatNumber(context.raw);
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    ticks: {
                                        callback: function(value) {
                                            if (value >= 1000000) {
                                                return (value / 1000000).toFixed(1) + 'M';
                                            } else if (value >= 1000) {
                                                return (value / 1000).toFixed(1) + 'K';
                                            }
                                            return value;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    console.error('No global timeline data available');
                }
            })
            .catch(error => {
                console.error('Error loading global trend data:', error);
            });
    }
    
    // Helper function to format numbers with commas
    function formatNumber(num) {
        if (!num) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Update charts when theme changes
    document.getElementById('theme-toggle').addEventListener('click', function() {
        // Update chart colors based on new theme
        setTimeout(() => {
            const theme = document.documentElement.getAttribute('data-bs-theme');
            Chart.defaults.color = theme === 'dark' ? '#f8f9fa' : '#212529';
            Chart.defaults.borderColor = theme === 'dark' ? '#444' : '#ddd';
            
            // Refresh all charts
            if (casesChart) casesChart.update();
            if (statsChart) statsChart.update();
            if (globalTrendChart) globalTrendChart.update();
        }, 100);
    });
});
