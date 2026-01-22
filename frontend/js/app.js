const auth = new AmazonAdsAuth();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const userInfo = document.getElementById('userInfo');
const dataDisplay = document.getElementById('dataDisplay');

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
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = 'background: #4CAF50; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;';
    document.querySelector('.container').prepend(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Display data
function displayData(title, data) {
    dataDisplay.innerHTML = `
        <h3>${title}</h3>
        <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
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
        
        // Redirect to Amazon LWA
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
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            showDashboard();
            showSuccess('Successfully authenticated with Amazon Ads! \u2705');
        } catch (error) {
            showError(error.message);
        } finally {
            loadingMessage.style.display = 'none';
        }
    }
}

// Show dashboard
function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    
    if (auth.user) {
        userInfo.innerHTML = `
            <h3>Welcome, ${auth.user.name}!</h3>
            <p><strong>Email:</strong> ${auth.user.email}</p>
            <p><strong>Marketplace:</strong> ${auth.user.marketplace}</p>
            <p><strong>Status:</strong> <span style="color: green;">✓ Connected</span></p>
        `;
    }
}

// Fetch Profiles
document.getElementById('fetchProfilesBtn').addEventListener('click', async () => {
    try {
        const data = await auth.makeAuthenticatedRequest('/ads/profiles');
        displayData('Advertising Profiles', data.profiles);
        showSuccess('Profiles fetched successfully!');
    } catch (error) {
        showError(error.message);
    }
});

// Fetch Campaigns
document.getElementById('fetchCampaignsBtn').addEventListener('click', async () => {
    try {
        const data = await auth.makeAuthenticatedRequest('/ads/campaigns');
        displayData('Campaigns', data.campaigns);
        showSuccess('Campaigns fetched successfully!');
    } catch (error) {
        showError(error.message);
    }
});

// Fetch Ad Groups
document.getElementById('fetchAdGroupsBtn').addEventListener('click', async () => {
    try {
        const data = await auth.makeAuthenticatedRequest('/ads/ad-groups');
        displayData('Ad Groups', data.adGroups);
        showSuccess('Ad groups fetched successfully!');
    } catch (error) {
        showError(error.message);
    }
});

// Fetch Keywords
document.getElementById('fetchKeywordsBtn').addEventListener('click', async () => {
    try {
        const data = await auth.makeAuthenticatedRequest('/ads/keywords');
        displayData('Keywords', data.keywords);
        showSuccess('Keywords fetched successfully!');
    } catch (error) {
        showError(error.message);
    }
});

// Fetch Audiences (NEW)
document.getElementById('fetchAudiencesBtn').addEventListener('click', async () => {
    try {
        const data = await auth.makeAuthenticatedRequest('/ads/audiences');
        displayData('Audiences', data.audiences);
        showSuccess('Audiences fetched successfully! \u2728');
    } catch (error) {
        showError(error.message);
    }
});

// Auto Sync
document.getElementById('autoSyncBtn').addEventListener('click', async () => {
    try {
        const data = await auth.makeAuthenticatedRequest('/ads/automate-sync', 'POST');
        displayData('Sync Results', data);
        showSuccess('Data synchronized successfully! (Including audiences)');
    } catch (error) {
        showError(error.message);
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.logout();
    dashboardSection.style.display = 'none';
    loginSection.style.display = 'block';
    loginForm.style.display = 'block';
    dataDisplay.innerHTML = '';
    showSuccess('Logged out successfully!');
});

// Initialize app
if (auth.isAuthenticated()) {
    showDashboard();
} else {
    handleCallback();
}