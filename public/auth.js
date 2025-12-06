// ================================================
// MULTI-USER PASSWORD PROTECTION SYSTEM
// ================================================

// User database (stored in localStorage)
const USERS_KEY = 'rental_admin_users';
const SESSIONS_KEY = 'rental_admin_sessions';

// Initialize users if none exist
function initUsers() {
    if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers = [
            {
                id: 'admin-' + Date.now(),
                username: 'admin',
                password: 'rental2024', // Change this!
                email: '',
                created: new Date().toISOString(),
                role: 'admin'
            }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
}

// Get all users
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

// Save users
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Check if user is authenticated
function isAuthenticated() {
    const session = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
    return session.authenticated === true && session.expires > Date.now();
}

// Authenticate user
function authenticate(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Create session (expires in 24 hours)
        const session = {
            authenticated: true,
            userId: user.id,
            username: user.username,
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(session));
        return true;
    }
    return false;
}

// Get current user
function getCurrentUser() {
    if (!isAuthenticated()) return null;
    const session = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
    const users = getUsers();
    return users.find(u => u.id === session.userId);
}

// Logout user
function logout() {
    localStorage.removeItem(SESSIONS_KEY);
}

// Create new user (for admin to create host accounts)
function createUser(username, password, email = '', role = 'host') {
    const users = getUsers();
    
    // Check if username exists
    if (users.some(u => u.username === username)) {
        return { success: false, message: 'Username already exists' };
    }
    
    const newUser = {
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        username,
        password,
        email,
        role,
        created: new Date().toISOString(),
        properties: [] // Array of property IDs this host manages
    };
    
    users.push(newUser);
    saveUsers(users);
    return { success: true, user: newUser };
}

// Change password
function changePassword(username, oldPassword, newPassword) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.username === username && u.password === oldPassword);
    
    if (userIndex === -1) {
        return { success: false, message: 'Current password is incorrect' };
    }
    
    users[userIndex].password = newPassword;
    saveUsers(users);
    return { success: true };
}

// Show enhanced login modal with user creation
function showLoginModal() {
    // Prevent multiple modals
    if (document.getElementById('adminLoginModal')) {
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'adminLoginModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 15px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            <div style="margin-bottom: 25px;">
                <i class="fas fa-lock" style="font-size: 3rem; color: #3498db; margin-bottom: 15px;"></i>
                <h2 style="color: #2c3e50; margin-bottom: 10px;">Host Portal</h2>
                <p style="color: #7f8c8d;">Login to manage your properties</p>
            </div>
            
            <!-- Login Form -->
            <div id="loginForm">
                <div style="margin-bottom: 20px;">
                    <input type="text" id="loginUsername" placeholder="Username" 
                           style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; margin-bottom: 15px;">
                    <input type="password" id="loginPassword" placeholder="Password" 
                           style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem;"
                           onkeypress="if(event.key === 'Enter') document.getElementById('loginBtn').click()">
                    <div id="loginError" style="color: #e74c3c; font-size: 0.9rem; min-height: 20px; margin-top: 5px; display: none;">
                        Incorrect username or password.
                    </div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="loginBtn" 
                            style="flex: 2; background: #3498db; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 1rem; cursor: pointer;">
                        <i class="fas fa-sign-in-alt"></i> Login
                    </button>
                    <button id="showCreateAccountBtn" 
                            style="flex: 1; background: #95a5a6; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 1rem; cursor: pointer;">
                        <i class="fas fa-user-plus"></i> New
                    </button>
                </div>
            </div>
            
            <!-- Create Account Form (hidden by default) -->
            <div id="createAccountForm" style="display: none;">
                <div style="margin-bottom: 20px;">
                    <input type="text" id="newUsername" placeholder="Choose username" 
                           style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; margin-bottom: 15px;">
                    <input type="password" id="newPassword" placeholder="Choose password" 
                           style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; margin-bottom: 15px;">
                    <input type="password" id="confirmPassword" placeholder="Confirm password" 
                           style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; margin-bottom: 15px;">
                    <input type="email" id="newEmail" placeholder="Email (optional)" 
                           style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem;">
                    <div id="createError" style="color: #e74c3c; font-size: 0.9rem; min-height: 20px; margin-top: 5px; display: none;"></div>
                    <div id="createSuccess" style="color: #2ecc71; font-size: 0.9rem; min-height: 20px; margin-top: 5px; display: none;"></div>
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button id="createAccountBtn" 
                            style="flex: 2; background: #2ecc71; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 1rem; cursor: pointer;">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                    <button id="showLoginBtn" 
                            style="flex: 1; background: #95a5a6; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 1rem; cursor: pointer;">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
                <button onclick="window.location.href='/'" 
                        style="background: none; color: #7f8c8d; border: none; font-size: 0.9rem; cursor: pointer;">
                    <i class="fas fa-home"></i> Return to Guest Chat
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Focus on username input
    setTimeout(() => {
        document.getElementById('loginUsername').focus();
    }, 100);
    
    // Event listeners
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('createAccountBtn').addEventListener('click', handleCreateAccount);
    document.getElementById('showCreateAccountBtn').addEventListener('click', showCreateAccountForm);
    document.getElementById('showLoginBtn').addEventListener('click', showLoginForm);
    
    // Enter key support
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCreateAccount();
    });
}

// Form handlers
function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (authenticate(username, password)) {
        // Success - remove modal and reload page
        document.body.removeChild(document.getElementById('adminLoginModal'));
        document.body.style.overflow = '';
        window.location.reload();
    } else {
        // Show error
        errorDiv.style.display = 'block';
        document.getElementById('loginPassword').style.borderColor = '#e74c3c';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

function handleCreateAccount() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const email = document.getElementById('newEmail').value;
    const errorDiv = document.getElementById('createError');
    const successDiv = document.getElementById('createSuccess');
    
    // Reset styles
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validation
    if (!username || !password) {
        errorDiv.textContent = 'Username and password are required';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (password.length < 4) {
        errorDiv.textContent = 'Password must be at least 4 characters';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Create user
    const result = createUser(username, password, email);
    
    if (result.success) {
        successDiv.textContent = 'Account created successfully! Please login.';
        successDiv.style.display = 'block';
        
        // Clear form
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('newEmail').value = '';
        
        // Switch back to login form after 2 seconds
        setTimeout(() => {
            showLoginForm();
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').focus();
        }, 2000);
    } else {
        errorDiv.textContent = result.message;
        errorDiv.style.display = 'block';
    }
}

function showCreateAccountForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('createAccountForm').style.display = 'block';
    document.getElementById('newUsername').focus();
}

function showLoginForm() {
    document.getElementById('createAccountForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('loginUsername').focus();
}

// Check authentication on admin pages
function checkAdminAccess() {
    // Pages that require authentication
    const adminPages = [
        '/admin',
        '/admin.html',
        '/faq-manage.html',
        '/faq-manage'
    ];
    
    const currentPath = window.location.pathname;
    
    // Check if current page is an admin page
    const isAdminPage = adminPages.some(page => 
        currentPath.includes(page) || 
        currentPath.endsWith(page.replace('.html', ''))
    );
    
    if (!isAdminPage) {
        return; // Not an admin page, no protection needed
    }
    
    // If not authenticated, show login modal
    if (!isAuthenticated()) {
        showLoginModal();
    }
}

// Add user management to admin panel
function addUserManagementToAdmin() {
    // Only add to admin page
    if (!window.location.pathname.includes('/admin')) {
        return;
    }
    
    // Wait for admin panel to load
    setTimeout(() => {
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return; // Only show to admin users
        }
        
        // Add user management section to admin panel
        const adminContainer = document.querySelector('.admin-container');
        if (!adminContainer) return;
        
        const userSection = document.createElement('div');
        userSection.className = 'form-section';
        userSection.style.marginTop = '30px';
        userSection.innerHTML = `
            <h3><i class="fas fa-users"></i> Host Account Management</h3>
            <p>Create and manage host accounts.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h4>Create New Host Account</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <input type="text" id="hostUsername" placeholder="Username" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="password" id="hostPassword" placeholder="Password" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="email" id="hostEmail" placeholder="Email (optional)" style="padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                <button id="createHostBtn" class="btn btn-primary" style="padding: 10px 20px;">
                    <i class="fas fa-user-plus"></i> Create Host Account
                </button>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4>Existing Host Accounts</h4>
                <div id="hostAccountsList" style="margin-top: 15px;">
                    <!-- Host accounts will appear here -->
                </div>
            </div>
        `;
        
        adminContainer.appendChild(userSection);
        
        // Load and display host accounts
        renderHostAccounts();
        
        // Add event listener for create button
        document.getElementById('createHostBtn').addEventListener('click', createHostAccount);
    }, 1000);
}

function renderHostAccounts() {
    const container = document.getElementById('hostAccountsList');
    if (!container) return;
    
    const users = getUsers();
    const hosts = users.filter(u => u.role === 'host');
    
    if (hosts.length === 0) {
        container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No host accounts yet.</p>';
        return;
    }
    
    container.innerHTML = hosts.map(host => `
        <div class="host-account" style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #3498db; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #2c3e50;">${host.username}</strong>
                ${host.email ? `<div style="color: #7f8c8d; font-size: 0.9em;">${host.email}</div>` : ''}
                <div style="color: #95a5a6; font-size: 0.8em; margin-top: 5px;">
                    Created: ${new Date(host.created).toLocaleDateString()}
                </div>
            </div>
            <button onclick="deleteHostAccount('${host.id}')" class="btn-danger" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8em;">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `).join('');
}

function createHostAccount() {
    const username = document.getElementById('hostUsername').value;
    const password = document.getElementById('hostPassword').value;
    const email = document.getElementById('hostEmail').value;
    
    if (!username || !password) {
        alert('Username and password are required');
        return;
    }
    
    const result = createUser(username, password, email, 'host');
    
    if (result.success) {
        alert(`Host account "${username}" created successfully!`);
        document.getElementById('hostUsername').value = '';
        document.getElementById('hostPassword').value = '';
        document.getElementById('hostEmail').value = '';
        renderHostAccounts();
    } else {
        alert(result.message);
    }
}

function deleteHostAccount(userId) {
    if (!confirm('Are you sure you want to delete this host account? This cannot be undone.')) {
        return;
    }
    
    const users = getUsers();
    const updatedUsers = users.filter(u => u.id !== userId);
    saveUsers(updatedUsers);
    renderHostAccounts();
}

// Add enhanced logout button
function addLogoutButton() {
    const adminPages = ['/admin', '/admin.html', '/faq-manage.html'];
    const currentPath = window.location.pathname;
    
    if (!adminPages.some(page => currentPath.includes(page))) {
        return;
    }
    
    // Remove existing logout button if any
    const existingBtn = document.getElementById('adminLogoutBtn');
    if (existingBtn) existingBtn.remove();
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'adminLogoutBtn';
    logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${currentUser.username})`;
    logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #e74c3c;
        border: 2px solid #e74c3c;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 3px 6px rgba(231, 76, 60, 0.2);
        display: flex;
        align-items: center;
        gap: 6px;
    `;
    
    logoutBtn.addEventListener('mouseenter', () => {
        logoutBtn.style.background = '#e74c3c';
        logoutBtn.style.color = 'white';
        logoutBtn.style.transform = 'translateY(-2px)';
        logoutBtn.style.boxShadow = '0 5px 10px rgba(231, 76, 60, 0.3)';
    });
    
    logoutBtn.addEventListener('mouseleave', () => {
        logoutBtn.style.background = 'white';
        logoutBtn.style.color = '#e74c3c';
        logoutBtn.style.transform = 'translateY(0)';
        logoutBtn.style.boxShadow = '0 3px 6px rgba(231, 76, 60, 0.2)';
    });
    
    logoutBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent any parent event handlers
        if (confirm(`Logout ${currentUser.username}?`)) {
            logout();
            window.location.href = '/';
        }
    });
    
    document.body.appendChild(logoutBtn);
}

// Auto-logout after 24 hours
function setupAutoLogout() {
    const session = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}');
    if (session.expires && session.expires < Date.now()) {
        logout();
    }
}

// Initialize authentication system
function initAuthSystem() {
    initUsers(); // Initialize user database
    setupAutoLogout();
    checkAdminAccess();
    
    // Only add features if authenticated
    if (isAuthenticated()) {
        addLogoutButton();
        addUserManagementToAdmin();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuthSystem);

// Make functions available globally
window.adminLogout = logout;
window.deleteHostAccount = deleteHostAccount;
