const auth = new AmazonAdsAuth();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const userInfo = document.getElementById('userInfo');
const metricsSection = document.getElementById('metricsSection');
const dataDisplay = document.getElementById('dataDisplay');

let currentTab = 'campaigns';

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Format number with commas
function formatNumber(num) {
    return new Intl.NumberFormat().format(num || 0);
}

// Format currency
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
}

// Display metrics summary
function displayMetrics(metrics) {
    metricsSection.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${formatNumber(metrics.total_campaigns)}</div>
                <div class="metric-label">Campaigns</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(metrics.total_impressions)}</div>
                <div class="metric-label">Impressions</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(metrics.total_clicks)}</div>
                <div class="metric-label">Clicks</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(metrics.total_spend)}</div>
                <div class="metric-label">Spend</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatCurrency(metrics.total_sales)}</div>
                <div class="metric-label">Sales</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(metrics.avg_acos || 0).toFixed(2)}%</div>
                <div class="metric-label">Avg ACOS</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${(metrics.avg_roas || 0).toFixed(2)}x</div>
                <div class="metric-label">Avg ROAS</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${formatNumber(metrics.total_orders)}</div>
                <div class="metric-label">Orders</div>
            </div>
        </div>
    `;
}

// Display campaigns
function displayCampaigns(campaigns) {
    if (!campaigns || campaigns.length === 0) {
        dataDisplay.innerHTML = '<p class="no-data">No campaigns found. Sync your data first.</p>';
        return;
    }
    
    dataDisplay.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>State</th>
                        <th>Budget</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                        <th>Spend</th>
                        <th>Sales</th>
                        <th>ACOS</th>
                        <th>ROAS</th>
                    </tr>
                </thead>
                <tbody>
                    ${campaigns.map(c => `
                        <tr>
                            <td class="campaign-name">${c.name}</td>
                            <td><span class="badge badge-${c.state.toLowerCase()}">${c.state}</span></td>
                            <td>${formatCurrency(c.budget)}</td>
                            <td>${formatNumber(c.impressions)}</td>
                            <td>${formatNumber(c.clicks)}</td>
                            <td>${formatCurrency(c.spend)}</td>
                            <td>${formatCurrency(c.sales)}</td>
                            <td>${c.acos ? c.acos.toFixed(2) + '%' : '-'}</td>
                            <td>${c.roas ? c.roas.toFixed(2) + 'x' : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Display ad groups
function displayAdGroups(adGroups) {
    if (!adGroups || adGroups.length === 0) {
        dataDisplay.innerHTML = '<p class="no-data">No ad groups found. Sync your data first.</p>';
        return;
    }
    
    dataDisplay.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>State</th>
                        <th>Default Bid</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                        <th>Spend</th>
                        <th>Sales</th>
                    </tr>
                </thead>
                <tbody>
                    ${adGroups.map(ag => `
                        <tr>
                            <td>${ag.name}</td>
                            <td><span class="badge badge-${ag.state.toLowerCase()}">${ag.state}</span></td>
                            <td>${formatCurrency(ag.defaultBid)}</td>
                            <td>${formatNumber(ag.impressions)}</td>
                            <td>${formatNumber(ag.clicks)}</td>
                            <td>${formatCurrency(ag.spend)}</td>
                            <td>${formatCurrency(ag.sales)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Display keywords
function displayKeywords(keywords) {
    if (!keywords || keywords.length === 0) {
        dataDisplay.innerHTML = '<p class="no-data">No keywords found. Sync your data first.</p>';
        return;
    }
    
    dataDisplay.innerHTML = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Keyword</th>
                        <th>Match Type</th>
                        <th>State</th>
                        <th>Bid</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                        <th>CTR</th>
                        <th>Spend</th>
                        <th>Sales</th>
                        <th>ACOS</th>
                    </tr>
                </thead>
                <tbody>
                    ${keywords.map(kw => `
                        <tr>
                            <td class="keyword-text">${kw.keywordText}</td>
                            <td><span class="badge badge-match">${kw.matchType}</span></td>
                            <td><span class="badge badge-${kw.state.toLowerCase()}">${kw.state}</span></td>
                            <td>${formatCurrency(kw.bid)}</td>
                            <td>${formatNumber(kw.impressions)}</td>
                            <td>${formatNumber(kw.clicks)}</td>
                            <td>${kw.ctr ? kw.ctr.toFixed(2) + '%' : '-'}</td>
                            <td>${formatCurrency(kw.spend)}</td>
                            <td>${formatCurrency(kw.sales)}</td>
                            <td>${kw.acos ? kw.acos.toFixed(2) + '%' : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Display audiences
function displayAudiences(audiences) {
    dataDisplay.innerHTML = `
        <div class="json-display">
            <pre>${JSON.stringify(audiences, null, 2)}</pre>
        </div>
    `;
}

// Display alerts
function displayAlerts(alerts, unreadCount) {
    if (!alerts || alerts.length === 0) {
        dataDisplay.innerHTML = '<p class="no-data">No alerts at this time.</p>';
        return;
    }
    
    dataDisplay.innerHTML = `
        <div class="alerts-container">
            <h3>Alerts (${unreadCount} unread)</h3>
            ${alerts.map(alert => `
                <div class="alert-item ${alert.isRead ? 'read' : 'unread'} severity-${alert.severity.toLowerCase()}">
                    <div class="alert-header">
                        <span class="alert-type">${alert.type}</span>
                        <span class="alert-time">${new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load tab content
async function loadTab(tabName) {
    currentTab = tabName;
    dataDisplay.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        switch(tabName) {
            case 'campaigns':
                const { campaigns } = await auth.makeAuthenticatedRequest('/ads/campaigns');
                displayCampaigns(campaigns);
                break;
            case 'adgroups':
                const { adGroups } = await auth.makeAuthenticatedRequest('/ads/ad-groups');
                displayAdGroups(adGroups);
                break;
            case 'keywords':
                const { keywords } = await auth.makeAuthenticatedRequest('/ads/keywords');
                displayKeywords(keywords);
                break;
            case 'audiences':
                const { audiences } = await auth.makeAuthenticatedRequest('/ads/audiences');
                displayAudiences(audiences);
                break;
            case 'alerts':
                const alertsData = await auth.makeAuthenticatedRequest('/ads/alerts');
                displayAlerts(alertsData.alerts, alertsData.unreadCount);
                break;
        }
    } catch (error) {
        showError(error.message);
        dataDisplay.innerHTML = '<p class="error-text">Failed to load data. Please try again.</p>';
    }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const marketplace = document.getElementById('marketplace').value;

    if (!marketplace) {
        showError('Please select a marketplace');
        return;
    }

    try {
        loadingMessage.style.display = 'block';
        loginForm.style.display = 'none';

        const { authUrl } = await auth.getAuthUrl(marketplace, email, name);
        window.location.href = authUrl;
    } catch (error) {
        showError(error.message);
        loadingMessage.style.display = 'none';
        loginForm.style.display = 'block';
    }
});

// Handle OAuth callback
async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
        showError(`Authentication error: ${error}`);
        return;
    }

    if (code && state) {
        try {
            loadingMessage.style.display = 'block';
            
            await auth.exchangeToken(code, state);
            window.history.replaceState({}, document.title, window.location.pathname);
            
            showDashboard();
            showSuccess('Successfully authenticated with Amazon Ads! ✅');
        } catch (error) {
            showError(error.message);
        } finally {
            loadingMessage.style.display = 'none';
        }
    }
}

// Show dashboard
async function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    
    try {
        // Load dashboard data
        const dashboard = await auth.makeAuthenticatedRequest('/ads/dashboard');
        
        if (dashboard.user) {
            userInfo.innerHTML = `
                <h3>Welcome, ${dashboard.user.name}! 👋</h3>
                <div class="user-details">
                    <p><strong>Email:</strong> ${dashboard.user.email}</p>
                    <p><strong>Marketplace:</strong> ${dashboard.user.marketplace}</p>
                    <p><strong>Last Sync:</strong> ${dashboard.user.last_sync ? new Date(dashboard.user.last_sync).toLocaleString() : 'Never'}</p>
                    <p><strong>Status:</strong> <span style="color: green;">✓ Connected</span></p>
                </div>
            `;
        }
        
        // Display metrics
        if (dashboard.metrics) {
            displayMetrics(dashboard.metrics);
        }
        
        // Load initial tab
        loadTab('campaigns');
        
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// Tab switching
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-btn')) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        loadTab(e.target.dataset.tab);
    }
});

// Auto Sync
document.getElementById('autoSyncBtn').addEventListener('click', async () => {
    try {
        document.getElementById('autoSyncBtn').disabled = true;
        document.getElementById('autoSyncBtn').textContent = '⏳ Syncing...';
        
        const data = await auth.makeAuthenticatedRequest('/ads/automate-sync', 'POST');
        showSuccess(`Synced: ${data.data.campaigns} campaigns, ${data.data.adGroups} ad groups, ${data.data.keywords} keywords!`);
        
        // Reload dashboard
        showDashboard();
        loadTab(currentTab);
    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('autoSyncBtn').disabled = false;
        document.getElementById('autoSyncBtn').textContent = '🔄 Auto Sync';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.logout();
    dashboardSection.style.display = 'none';
    loginSection.style.display = 'block';
    loginForm.style.display = 'block';
    showSuccess('Logged out successfully!');
});

// Initialize app
if (auth.isAuthenticated()) {
    showDashboard();
} else {
    handleCallback();
}