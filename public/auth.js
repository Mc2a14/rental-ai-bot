// ================================================
// CROSS-DEVICE AUTHENTICATION SYSTEM
// ================================================

const AUTH_KEY = 'rentalai_user_auth';

// Check if logged in (checks both session and localStorage for backward compatibility)
async function isAuthenticated() {
    try {
        // First check server session
        try {
            const response = await fetch('/api/user/me', {
                method: 'GET',
                credentials: 'include' // Important: include cookies
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    // Update localStorage for backward compatibility
                    localStorage.setItem(AUTH_KEY, JSON.stringify({
                        userId: data.user.id || data.user.userId,
                        username: data.user.username,
                        loggedInAt: new Date().toISOString()
                    }));
                    return true;
                }
            }
        } catch (error) {
            console.warn('Session check failed, falling back to localStorage:', error);
        }
        
        // Fallback to localStorage (for backward compatibility)
        const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
        return !!auth.userId && !!auth.username;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Login with server
async function login(username, password) {
    try {
        const response = await fetch('/api/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: include cookies for session
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Session is stored in cookie, but also save to localStorage for backward compatibility
            localStorage.setItem(AUTH_KEY, JSON.stringify({
                userId: data.user.id || data.user.userId,
                username: data.user.username,
                loggedInAt: new Date().toISOString()
            }));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

// Register new user
async function register(username, password) {
    try {
        const response = await fetch('/api/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Auto-login after successful registration
            return await login(username, password);
        }
        return false;
    } catch (error) {
        console.error('Register error:', error);
        return false;
    }
}

// Get current user
function getCurrentUser() {
    if (!isAuthenticated()) return null;
    return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
}

// Logout
async function logout() {
    try {
        // Clear server session
        await fetch('/api/user/logout', {
            method: 'POST',
            credentials: 'include' // Important: include cookies
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear localStorage
        localStorage.removeItem(AUTH_KEY);
    }
}

// Show login modal
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
                <p style="color: #7f8c8d;">Login to create and manage your property</p>
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
async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    const success = await login(username, password);
    
    if (success) {
        // Success - remove modal and reload page
        const modal = document.getElementById('adminLoginModal');
        if (modal) {
            document.body.removeChild(modal);
        }
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

async function handleCreateAccount() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
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
    
    // Register user
    const success = await register(username, password);
    
    if (success) {
        successDiv.textContent = 'Account created successfully! Please login.';
        successDiv.style.display = 'block';
        
        // Clear form
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Switch back to login form after 2 seconds
        setTimeout(() => {
            showLoginForm();
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').focus();
        }, 2000);
    } else {
        errorDiv.textContent = 'Username already exists';
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

// Add logout button
function addLogoutButton() {
    if (document.getElementById('adminLogoutBtn')) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Find the admin header to place logout button there
    const adminHeader = document.querySelector('.admin-header');
    if (!adminHeader) {
        console.warn('Admin header not found, cannot add logout button');
        return;
    }
    
    // Check if logout button already exists in header
    let logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        // Update existing button
        logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
    } else {
        // Create new logout button
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'adminLogoutBtn';
        logoutBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        logoutBtn.style.cssText = `
            background: white;
            color: #e74c3c;
            border: 2px solid #e74c3c;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 3px 6px rgba(231, 76, 60, 0.2);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        `;
        
        // Add to header's top row (next to GuestBud title)
        const headerTopRow = adminHeader.querySelector('div[style*="justify-content: space-between"]');
        if (headerTopRow) {
            headerTopRow.appendChild(logoutBtn);
        } else {
            // Fallback: append to header
            adminHeader.appendChild(logoutBtn);
        }
    }
    
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
        e.stopPropagation();
        if (confirm('Logout?')) {
            logout();
            window.location.href = '/';
        }
    });
}

// Check authentication
function checkAdminAccess() {
    const adminPages = ['/admin', '/admin.html