// Admin Analytics Dashboard JavaScript
let currentDays = 30;

// Load stats on page load
document.addEventListener('DOMContentLoaded', function() {
    loadStats(30);
});

async function loadStats(days) {
    currentDays = days;
    
    // Update active button
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.days) === days) {
            btn.classList.add('active');
        }
    });
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('content').style.display = 'none';
    
    try {
        const response = await fetch(`/api/admin/stats?days=${days}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load analytics');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayStats(data.stats);
        } else {
            throw new Error(data.message || 'Failed to load analytics');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('loading').innerHTML = `
            <div style="color: #e74c3c;">
                <i class="fas fa-exclamation-triangle"></i> Error loading analytics: ${error.message}
            </div>
        `;
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    }
}

function displayStats(stats) {
    // Summary stats
    document.getElementById('totalUsers').textContent = stats.summary.totalUsers || 0;
    document.getElementById('totalProperties').textContent = stats.summary.totalProperties || 0;
    document.getElementById('totalPageViews').textContent = stats.summary.totalPageViews || 0;
    document.getElementById('uniqueVisitors').textContent = stats.summary.uniqueVisitors || 0;
    document.getElementById('totalQuestions').textContent = stats.summary.totalQuestions || 0;
    
    // Top properties by views
    const topViewsDiv = document.getElementById('topPropertiesByViews');
    topViewsDiv.innerHTML = '';
    
    if (stats.topProperties.byViews && stats.topProperties.byViews.length > 0) {
        stats.topProperties.byViews.forEach((prop, index) => {
            const item = document.createElement('div');
            item.className = 'property-item';
            item.innerHTML = `
                <div>
                    <span style="color: #95a5a6; margin-right: 10px;">#${index + 1}</span>
                    <span class="name">${escapeHtml(prop.name)}</span>
                </div>
                <span class="count">${prop.viewCount} views</span>
            `;
            topViewsDiv.appendChild(item);
        });
    } else {
        topViewsDiv.innerHTML = '<div class="empty-state">No page views yet</div>';
    }
    
    // Top properties by questions
    const topQuestionsDiv = document.getElementById('topPropertiesByQuestions');
    topQuestionsDiv.innerHTML = '';
    
    if (stats.topProperties.byQuestions && stats.topProperties.byQuestions.length > 0) {
        stats.topProperties.byQuestions.forEach((prop, index) => {
            const item = document.createElement('div');
            item.className = 'property-item';
            item.innerHTML = `
                <div>
                    <span style="color: #95a5a6; margin-right: 10px;">#${index + 1}</span>
                    <span class="name">${escapeHtml(prop.name)}</span>
                </div>
                <span class="count">${prop.questionCount} questions</span>
            `;
            topQuestionsDiv.appendChild(item);
        });
    } else {
        topQuestionsDiv.innerHTML = '<div class="empty-state">No questions yet</div>';
    }
    
    // Users list
    const usersListDiv = document.getElementById('usersList');
    usersListDiv.innerHTML = '';
    
    if (stats.users && stats.users.length > 0) {
        stats.users.forEach((user, userIndex) => {
            const item = document.createElement('div');
            item.className = 'user-item';
            
            const createdAt = new Date(user.createdAt);
            const dateStr = createdAt.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            const initials = user.username.substring(0, 2).toUpperCase();
            
            // Get unique property names (remove duplicates)
            const uniqueProperties = [];
            const propertyMap = new Map();
            if (user.properties && user.properties.length > 0) {
                user.properties.forEach(prop => {
                    if (!propertyMap.has(prop.name)) {
                        propertyMap.set(prop.name, prop);
                        uniqueProperties.push(prop);
                    }
                });
            }
            
            // Build properties list (just names, no dates)
            let propertiesHtml = '';
            if (uniqueProperties.length > 0) {
                propertiesHtml = uniqueProperties.map(prop => 
                    `<span style="display: inline-block; margin-right: 10px; margin-top: 5px; padding: 4px 10px; background: #f0f0f0; border-radius: 12px; font-size: 0.85rem; color: #2c3e50;">
                        <i class="fas fa-home" style="margin-right: 4px;"></i>${escapeHtml(prop.name)}
                    </span>`
                ).join('');
            } else {
                propertiesHtml = '<span style="color: #95a5a6; font-size: 0.85rem; font-style: italic;">No properties yet</span>';
            }
            
            // Build dates dropdown content
            let datesHtml = '';
            if (user.properties && user.properties.length > 0) {
                datesHtml = user.properties.map(prop => {
                    const propDate = new Date(prop.createdAt);
                    const propDateStr = propDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    });
                    return `<div style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">
                        <strong>${escapeHtml(prop.name)}</strong><br>
                        <span style="color: #7f8c8d; font-size: 0.85rem;">Created: ${propDateStr}</span>
                    </div>`;
                }).join('');
            }
            
            const dropdownId = `user-dates-${userIndex}`;
            
            item.innerHTML = `
                <div class="user-avatar">${initials}</div>
                <div class="user-info" style="flex: 1;">
                    <div class="username">${escapeHtml(user.username)}</div>
                    <div style="margin-top: 8px;">
                        ${propertiesHtml}
                    </div>
                    ${datesHtml ? `
                        <div style="margin-top: 10px;">
                            <button onclick="toggleDates('${dropdownId}')" style="background: none; border: none; color: #667eea; cursor: pointer; font-size: 0.85rem; padding: 5px 0; display: flex; align-items: center; gap: 5px;">
                                <i class="fas fa-calendar-alt"></i>
                                <span>View Dates</span>
                                <i class="fas fa-chevron-down" id="${dropdownId}-icon"></i>
                            </button>
                            <div id="${dropdownId}" style="display: none; margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; max-height: 300px; overflow-y: auto;">
                                ${datesHtml}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="user-date">
                    Joined: ${dateStr}
                </div>
            `;
            usersListDiv.appendChild(item);
        });
    } else {
        usersListDiv.innerHTML = '<div class="empty-state">No users yet</div>';
    }
    
    // Recent activity
    const recentActivityDiv = document.getElementById('recentActivity');
    recentActivityDiv.innerHTML = '';
    
    if (stats.recentActivity && stats.recentActivity.length > 0) {
        stats.recentActivity.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            const icon = activity.type === 'user' ? 'fa-user' : 'fa-home';
            const iconClass = activity.type === 'user' ? 'user' : 'property';
            const timestamp = new Date(activity.timestamp);
            const timeStr = timestamp.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            item.innerHTML = `
                <div class="activity-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="type">New ${activity.type}</div>
                    <div class="name">${escapeHtml(activity.name || activity.id)}</div>
                    <div class="time">${timeStr}</div>
                </div>
            `;
            recentActivityDiv.appendChild(item);
        });
    } else {
        recentActivityDiv.innerHTML = '<div class="empty-state">No recent activity</div>';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

