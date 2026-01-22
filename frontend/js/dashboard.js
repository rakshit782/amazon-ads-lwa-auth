// Check authentication
if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

const auth = new AmazonAdsAuth();
let currentTab = 'campaigns';

// DOM Elements
const userInfo = document.getElementById('userInfo');
const metricsSection = document.getElementById('metricsSection');
const dataDisplay = document.getElementById('dataDisplay');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => errorMessage.style.display = 'none', 5000);
}

// Show success
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    setTimeout(() => successMessage.style.display = 'none', 3000);
}

// Format number
function formatNumber(num) {
    return new Intl.NumberFormat().format(num || 0);
}

// Format currency
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
}

// Display metrics
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

// Load dashboard
async function loadDashboard() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        userInfo.innerHTML = `
            <h3>Welcome, ${user.name}! 👋</h3>
            <div class="user-details">
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Marketplace:</strong> ${user.marketplace}</p>
                <p><strong>Status:</strong> <span style="color: green;">✓ Connected</span></p>
            </div>
        `;

        // Show Connect Amazon button if no Amazon auth
        if (!user.hasAmazonAuth) {
            document.getElementById('connectAmazonBtn').style.display = 'inline-block';
            document.getElementById('autoSyncBtn').style.display = 'none';
        }

        // Try to load dashboard data
        try {
            const dashboard = await auth.makeAuthenticatedRequest('/ads/dashboard');
            if (dashboard.metrics) {
                displayMetrics(dashboard.metrics);
            }
        } catch (error) {
            console.log('No dashboard data yet');
        }

        loadTab('campaigns');
    } catch (error) {
        showError('Failed to load dashboard');
        console.error(error);
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

// Load tab content
async function loadTab(tabName) {
    currentTab = tabName;
    dataDisplay.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    
    try {
        const response = await auth.makeAuthenticatedRequest(`/ads/${tabName}`);
        // Display based on tab (implement display functions as needed)
        dataDisplay.innerHTML = `<pre>${JSON.stringify(response, null, 2)}</pre>`;
    } catch (error) {
        dataDisplay.innerHTML = '<p class="no-data">No data available. Please sync your Amazon account.</p>';
    }
}

// Connect Amazon button
document.getElementById('connectAmazonBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Auto Sync
document.getElementById('autoSyncBtn').addEventListener('click', async () => {
    try {
        document.getElementById('autoSyncBtn').disabled = true;
        document.getElementById('autoSyncBtn').textContent = '⏳ Syncing...';
        
        await auth.makeAuthenticatedRequest('/ads/automate-sync', 'POST');
        showSuccess('Data synced successfully!');
        
        loadDashboard();
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
    window.location.href = 'login.html';
});

// Initialize
loadDashboard();