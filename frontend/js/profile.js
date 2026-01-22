// Check authentication
if (!localStorage.getItem('authToken')) {
    window.location.href = 'login.html';
}

const auth = new AmazonAdsAuth();

// Show error
function showError(message) {
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    setTimeout(() => errorMsg.style.display = 'none', 5000);
}

// Show success
function showSuccess(message) {
    const successMsg = document.getElementById('successMessage');
    successMsg.textContent = message;
    successMsg.style.display = 'block';
    setTimeout(() => successMsg.style.display = 'none', 3000);
}

// Load user profile
async function loadProfile() {
    try {
        const response = await auth.makeAuthenticatedRequest('/auth/profile');
        const user = response.user;

        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userMarketplace').value = user.marketplace || '';
        document.getElementById('memberSince').value = new Date(user.created_at).toLocaleDateString();

        // Update connection status
        updateConnectionStatus(user);

    } catch (error) {
        showError('Failed to load profile');
        console.error(error);
    }
}

// Update connection status
function updateConnectionStatus(user) {
    const statusDiv = document.getElementById('connectionStatus');
    const connectBtn = document.getElementById('connectAmazonBtn');
    const disconnectBtn = document.getElementById('disconnectAmazonBtn');

    const hasAmazonAuth = !!(user.refresh_token && user.access_token);

    if (hasAmazonAuth) {
        statusDiv.className = 'connection-status connected';
        statusDiv.innerHTML = `
            <strong>✅ Connected to Amazon Advertising</strong>
            <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: var(--text-light);">
                Profile ID: ${user.profile_id || 'Not set'}<br>
                Last Sync: ${user.last_sync ? new Date(user.last_sync).toLocaleString() : 'Never'}
            </p>
        `;
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
    } else {
        statusDiv.className = 'connection-status disconnected';
        statusDiv.innerHTML = `
            <strong>❌ Not Connected</strong>
            <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: var(--text-light);">
                Connect your Amazon Advertising account to sync campaigns and data.
            </p>
        `;
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
    }
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('userName').value;
    
    try {
        await auth.makeAuthenticatedRequest('/auth/update-profile', 'PUT', { name });
        showSuccess('Profile updated successfully!');
        
        // Update local storage
        const user = JSON.parse(localStorage.getItem('user'));
        user.name = name;
        localStorage.setItem('user', JSON.stringify(user));
        
    } catch (error) {
        showError(error.message);
    }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return;
    }
    
    try {
        await auth.makeAuthenticatedRequest('/auth/change-password', 'PUT', {
            currentPassword,
            newPassword
        });
        
        showSuccess('Password changed successfully!');
        
        // Clear form
        document.getElementById('passwordForm').reset();
        
    } catch (error) {
        showError(error.message);
    }
});

// Connect Amazon
document.getElementById('connectAmazonBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Disconnect Amazon
document.getElementById('disconnectAmazonBtn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to disconnect your Amazon account? Your synced data will remain.')) {
        return;
    }
    
    try {
        await auth.makeAuthenticatedRequest('/auth/disconnect-amazon', 'POST');
        showSuccess('Amazon account disconnected');
        loadProfile();
    } catch (error) {
        showError(error.message);
    }
});

// Delete account
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const confirmed = confirm('⚠️ WARNING: This will permanently delete your account and all data. This action cannot be undone. Are you absolutely sure?');
    
    if (!confirmed) return;
    
    const doubleConfirm = confirm('This is your last chance. Type your email to confirm deletion.');
    
    if (!doubleConfirm) return;
    
    try {
        await auth.makeAuthenticatedRequest('/auth/delete-account', 'DELETE');
        showSuccess('Account deleted. Redirecting...');
        
        setTimeout(() => {
            auth.logout();
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        showError(error.message);
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.logout();
    window.location.href = 'login.html';
});

// Initialize
loadProfile();