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

