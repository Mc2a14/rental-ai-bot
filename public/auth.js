// ================================================
// SIMPLE PASSWORD PROTECTION SYSTEM
// ================================================

const ADMIN_PASSWORD = "rental1234!"; // Your actual password

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('admin_authenticated') === 'true';
}

// Authenticate user
function authenticate(password) {
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_last_login', new Date().toISOString());
        return true;
    }
    return false;
}

// Logout user
function logout() {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_last_login');
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
                <h2 style="color: #2c3e50; margin-bottom: 10px;">Admin Access Required</h2>
                <p style="color: #7f8c8d;">Please enter the admin password to continue</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <input type="password" id="adminPasswordInput" placeholder="Enter admin password" 
                       style="width: 100%; padding: 15px; border: 2px solid #e1e5e9; border-radius: 10px; font-size: 1rem; margin-bottom: 15px; transition: border-color 0.3s;" 
                       onkeypress="if(event.key === 'Enter') document.getElementById('loginBtn').click()">
                <div id="loginError" style="color: #e74c3c; font-size: 0.9rem; min-height: 20px; margin-top: 5px; display: none;">
                    Incorrect password. Please try again.
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="loginBtn" 
                        style="flex: 1; background: #3498db; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 1rem; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button onclick="window.location.href='/'" 
                        style="flex: 1; background: #95a5a6; color: white; border: none; padding: 15px; border-radius: 10px; font-size: 1rem; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-home"></i> Go to Chat
                </button>
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
                <p style="color: #7f8c8d; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Only property hosts can access this area.
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Focus on password input
    setTimeout(() => {
        document.getElementById('adminPasswordInput').focus();
    }, 100);
    
    // Add event listeners
    document.getElementById('loginBtn').addEventListener('click', function() {
        const password = document.getElementById('adminPasswordInput').value;
        const errorDiv = document.getElementById('loginError');
        
        if (authenticate(password)) {
            // Success - remove modal and reload page
            document.body.removeChild(modal);
            document.body.style.overflow = '';
            window.location.reload();
        } else {
            // Show error
            errorDiv.style.display = 'block';
            document.getElementById('adminPasswordInput').style.borderColor = '#e74c3c';
            
            // Clear password field
            document.getElementById('adminPasswordInput').value = '';
            document.getElementById('adminPasswordInput').focus();
            
            // Shake animation
            this.style.transform = 'translateX(-5px)';
            setTimeout(() => this.style.transform = 'translateX(5px)', 100);
            setTimeout(() => this.style.transform = 'translateX(0)', 200);
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.location.href = '/';
        }
    });
}

// Add logout functionality to admin pages
function addLogoutButton() {
    // Only add logout button to admin pages
    const adminPages = ['/admin', '/admin.html', '/faq-manage.html'];
    const currentPath = window.location.pathname;
    
    if (!adminPages.some(page => currentPath.includes(page))) {
        return;
    }
    
    // Create logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'adminLogoutBtn';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border: 1px solid #e74c3c;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.9rem;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        gap: 5px;
    `;
    
    logoutBtn.addEventListener('mouseenter', () => {
        logoutBtn.style.background = '#e74c3c';
        logoutBtn.style.color = 'white';
    });
    
    logoutBtn.addEventListener('mouseleave', () => {
        logoutBtn.style.background = 'rgba(231, 76, 60, 0.1)';
        logoutBtn.style.color = '#e74c3c';
    });
    
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            logout();
            window.location.href = '/';
        }
    });
    
    document.body.appendChild(logoutBtn);
}

// Auto-logout after 24 hours (optional security)
function setupAutoLogout() {
    const lastLogin = localStorage.getItem('admin_last_login');
    if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        const now = new Date();
        const hoursDiff = (now - lastLoginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) { // 24 hour timeout
            logout();
        }
    }
}

// Initialize authentication system
function initAuthSystem() {
    setupAutoLogout();
    checkAdminAccess();
    
    // Only add logout button if authenticated
    if (isAuthenticated()) {
        addLogoutButton();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuthSystem);

// Make functions available globally (for manual logout, etc.)
window.adminLogout = logout;
window.checkAdminAccess = checkAdminAccess;
