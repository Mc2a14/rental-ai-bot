// Analytics Dashboard JavaScript
let currentPropertyId = null;
let currentDays = 30;

// Check authentication on load
document.addEventListener('DOMContentLoaded', async function() {
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        window.location.href = '/admin';
        return;
    }
    
    await loadProperties();
    await loadAnalytics();
});

async function loadProperties() {
    try {
        const user = getCurrentUser();
        if (!user || !user.userId) {
            // Try to get from session
            const response = await fetch('/api/user/me', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    user = data.user;
                }
            }
        }
        
        if (!user || !user.userId) {
            document.getElementById('error').textContent = 'Please log in to view analytics';
            document.getElementById('error').style.display = 'block';
            return;
        }
        
        const response = await fetch(`/api/user/${user.userId}/properties`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.properties && data.properties.length > 0) {
                const select = document.getElementById('propertySelect');
                select.innerHTML = '';
                
                data.properties.forEach(property => {
                    const option = document.createElement('option');
                    option.value = property.id || property.propertyId;
                    option.textContent = property.name;
                    select.appendChild(option);
                });
                
                // Select first property by default
                if (data.properties.length > 0) {
                    currentPropertyId = data.properties[0].id || data.properties[0].propertyId;
                    select.value = currentPropertyId;
                }
            } else {
                document.getElementById('error').textContent = 'No properties found. Please create a property first.';
                document.getElementById('error').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error loading properties:', error);
        document.getElementById('error').textContent = 'Error loading properties';
        document.getElementById('error').style.display = 'block';
    }
}

async function loadAnalytics() {
    const propertySelect = document.getElementById('propertySelect');
    const propertyId = propertySelect.value || currentPropertyId;
    
    if (!propertyId) {
        document.getElementById('error').textContent = 'Please select a property';
        document.getElementById('error').style.display = 'block';
        return;
    }
    
    currentPropertyId = propertyId;
    
    document.getElementById('loading').style.display = 'block';
    document.getElementById('analyticsContent').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    try {
        const response = await fetch(`/api/analytics/property/${propertyId}/stats?days=${currentDays}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load analytics');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayAnalytics(data.stats);
            await loadFAQs(propertyId);
            await loadSuccessfulPatterns(propertyId);
        } else {
            throw new Error(data.message || 'Failed to load analytics');
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        document.getElementById('error').textContent = 'Error loading analytics: ' + error.message;
        document.getElementById('error').style.display = 'block';
    } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('analyticsContent').style.display = 'block';
    }
}

function displayAnalytics(stats) {
    // Total questions
    document.getElementById('totalQuestions').textContent = stats.total || 0;
    
    // Page views
    if (stats.pageViews) {
        const totalViews = stats.pageViews.totalViews || 0;
        const uniqueVisitors = stats.pageViews.uniqueVisitors || 0;
        document.getElementById('totalPageViews').textContent = totalViews;
        document.getElementById('uniqueVisitors').textContent = `${uniqueVisitors} unique visitors`;
        
        // Show page views section if there are views
        if (totalViews > 0) {
            document.getElementById('pageViewsSection').style.display = 'block';
            displayPageViews(stats.pageViews);
        }
    } else {
        document.getElementById('totalPageViews').textContent = '0';
        document.getElementById('uniqueVisitors').textContent = '0 unique visitors';
    }
    
    // Helpful rate
    const helpfulRate = Math.round(stats.helpfulRate || 0);
    document.getElementById('helpfulRate').textContent = helpfulRate + '%';
    const helpfulRateEl = document.getElementById('helpfulRate');
    if (helpfulRate >= 80) {
        helpfulRateEl.style.color = '#27ae60';
    } else if (helpfulRate >= 60) {
        helpfulRateEl.style.color = '#f39c12';
    } else {
        helpfulRateEl.style.color = '#e74c3c';
    }
    
    // Top category
    if (stats.byCategory && stats.byCategory.length > 0) {
        document.getElementById('topCategory').textContent = stats.byCategory[0].category;
    } else {
        document.getElementById('topCategory').textContent = '-';
    }
    
    // Most frequent questions
    const frequentList = document.getElementById('frequentQuestions');
    frequentList.innerHTML = '';
    
    if (stats.frequentQuestions && stats.frequentQuestions.length > 0) {
        stats.frequentQuestions.forEach((q, index) => {
            const li = document.createElement('li');
            li.className = 'question-item';
            
            const helpfulRate = Math.round((q.helpfulRate || 0) * 100);
            const helpfulColor = helpfulRate >= 80 ? '#27ae60' : helpfulRate >= 60 ? '#f39c12' : '#e74c3c';
            
            li.innerHTML = `
                <div class="question-text">
                    <strong>${index + 1}.</strong> ${escapeHtml(q.question)}
                </div>
                <div class="question-stats">
                    <span class="frequency-badge">${q.frequency}x</span>
                    <span class="helpful-rate" style="color: ${helpfulColor}">
                        ${helpfulRate}% helpful
                    </span>
                </div>
            `;
            frequentList.appendChild(li);
        });
    } else {
        frequentList.innerHTML = '<li class="empty-state">No questions yet</li>';
    }
    
    // Questions by category
    const categoryList = document.getElementById('categoryBreakdown');
    categoryList.innerHTML = '';
    
    if (stats.byCategory && stats.byCategory.length > 0) {
        stats.byCategory.forEach(cat => {
            const li = document.createElement('li');
            li.className = 'question-item';
            li.innerHTML = `
                <div class="question-text">
                    <span class="category-badge">${cat.category}</span>
                </div>
                <div class="question-stats">
                    <span class="frequency-badge">${cat.count} questions</span>
                </div>
            `;
            categoryList.appendChild(li);
        });
    } else {
        categoryList.innerHTML = '<li class="empty-state">No categories yet</li>';
    }
}

function displayPageViews(pageViews) {
    const pageViewsContent = document.getElementById('pageViewsContent');
    pageViewsContent.innerHTML = '';
    
    if (!pageViews || pageViews.totalViews === 0) {
        pageViewsContent.innerHTML = '<div class="empty-state">No page views yet</div>';
        return;
    }
    
    // Summary
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;';
    summaryDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
            <div>
                <strong style="color: #7f8c8d; font-size: 0.9rem;">Total Views</strong>
                <div style="font-size: 1.5rem; font-weight: bold; color: #2c3e50;">${pageViews.totalViews}</div>
            </div>
            <div>
                <strong style="color: #7f8c8d; font-size: 0.9rem;">Unique Visitors</strong>
                <div style="font-size: 1.5rem; font-weight: bold; color: #3498db;">${pageViews.uniqueVisitors}</div>
            </div>
        </div>
    `;
    pageViewsContent.appendChild(summaryDiv);
    
    // Views by day
    if (pageViews.viewsByDay && pageViews.viewsByDay.length > 0) {
        const dailyDiv = document.createElement('div');
        dailyDiv.style.marginBottom = '20px';
        dailyDiv.innerHTML = '<h3 style="margin-bottom: 10px; color: #2c3e50;">Views by Day</h3>';
        
        const dailyList = document.createElement('ul');
        dailyList.className = 'question-list';
        dailyList.style.maxHeight = '200px';
        dailyList.style.overflowY = 'auto';
        
        pageViews.viewsByDay.forEach(day => {
            const li = document.createElement('li');
            li.className = 'question-item';
            const date = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            li.innerHTML = `
                <div class="question-text">
                    <span>${date}</span>
                </div>
                <div class="question-stats">
                    <span class="frequency-badge">${day.count} views</span>
                </div>
            `;
            dailyList.appendChild(li);
        });
        
        dailyDiv.appendChild(dailyList);
        pageViewsContent.appendChild(dailyDiv);
    }
    
    // Recent views
    if (pageViews.recentViews && pageViews.recentViews.length > 0) {
        const recentDiv = document.createElement('div');
        recentDiv.innerHTML = '<h3 style="margin-bottom: 10px; color: #2c3e50;">Recent Views</h3>';
        
        const recentList = document.createElement('ul');
        recentList.className = 'question-list';
        recentList.style.maxHeight = '200px';
        recentList.style.overflowY = 'auto';
        
        pageViews.recentViews.forEach(view => {
            const li = document.createElement('li');
            li.className = 'question-item';
            const date = new Date(view.viewedAt).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            li.innerHTML = `
                <div class="question-text">
                    <span>${date}</span>
                </div>
            `;
            recentList.appendChild(li);
        });
        
        recentDiv.appendChild(recentList);
        pageViewsContent.appendChild(recentDiv);
    }
}

async function loadFAQs(propertyId) {
    try {
        const response = await fetch(`/api/analytics/property/${propertyId}/faqs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.faqs && data.faqs.length > 0) {
                displayFAQs(data.faqs);
            } else {
                document.getElementById('faqsList').innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No FAQs generated yet. Click "Generate FAQs" to create them from frequent questions.</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading FAQs:', error);
    }
}

function displayFAQs(faqs) {
    const faqsList = document.getElementById('faqsList');
    faqsList.innerHTML = '';
    
    faqs.forEach(faq => {
        const div = document.createElement('div');
        div.className = 'faq-item';
        div.innerHTML = `
            <div class="faq-question">${escapeHtml(faq.question)}</div>
            <div class="faq-answer">${escapeHtml(faq.answer)}</div>
            <div class="faq-meta">
                <span><i class="fas fa-chart-line"></i> Asked ${faq.frequency} times</span>
                <span><i class="fas fa-thumbs-up"></i> ${faq.helpfulCount || 0} helpful</span>
            </div>
        `;
        faqsList.appendChild(div);
    });
}

async function generateFAQs() {
    if (!currentPropertyId) {
        alert('Please select a property first');
        return;
    }
    
    if (!confirm('Generate FAQs from frequent questions? This will analyze all questions and create FAQs.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/analytics/property/${currentPropertyId}/generate-faqs`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                alert(`Generated ${data.faqs.length} FAQs!`);
                await loadFAQs(currentPropertyId);
            } else {
                alert('Error generating FAQs: ' + (data.message || 'Unknown error'));
            }
        } else {
            throw new Error('Failed to generate FAQs');
        }
    } catch (error) {
        console.error('Error generating FAQs:', error);
        alert('Error generating FAQs: ' + error.message);
    }
}

function setTimeFilter(days) {
    currentDays = days;
    
    // Update button states
    document.querySelectorAll('.time-btn').forEach(btn => {
        if (parseInt(btn.dataset.days) === days) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    loadAnalytics();
}

async function loadSuccessfulPatterns(propertyId) {
    try {
        const response = await fetch(`/api/analytics/property/${propertyId}/patterns?limit=10`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load successful patterns');
        }
        
        const data = await response.json();
        const patternsList = document.getElementById('successfulPatternsList');
        
        if (!patternsList) {
            console.warn('successfulPatternsList element not found');
            return;
        }
        
        if (data.success && data.patterns && data.patterns.length > 0) {
            patternsList.innerHTML = data.patterns.map((pattern, index) => `
                <div class="question-item" style="border-left: 4px solid #2ecc71; background: #f8fff8;">
                    <div class="question-text">
                        <strong>Q:</strong> ${escapeHtml(pattern.question)}
                        <div style="margin-top: 8px; color: #7f8c8d; font-size: 14px; padding: 10px; background: white; border-radius: 5px; margin-top: 10px;">
                            <strong>A:</strong> ${escapeHtml(pattern.answer.substring(0, 200))}${pattern.answer.length > 200 ? '...' : ''}
                        </div>
                    </div>
                    <div class="question-stats">
                        <span class="frequency-badge" style="background: #2ecc71;">
                            👍 ${pattern.helpfulCount} helpful
                        </span>
                        <span class="helpful-rate" style="color: #2ecc71;">
                            ${Math.round(pattern.helpfulRate * 100)}% success
                        </span>
                        ${pattern.category ? `<span class="category-badge">${pattern.category}</span>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            patternsList.innerHTML = '<div class="empty-state" style="padding: 20px; color: #95a5a6; text-align: center;"><i class="fas fa-info-circle"></i><p style="margin-top: 10px;">No successful patterns yet. As guests provide feedback, successful responses will appear here.</p></div>';
        }
    } catch (error) {
        console.error('Error loading successful patterns:', error);
        const patternsList = document.getElementById('successfulPatternsList');
        if (patternsList) {
            patternsList.innerHTML = 
                '<div class="empty-state" style="padding: 20px; color: #e74c3c; text-align: center;"><i class="fas fa-exclamation-triangle"></i><p style="margin-top: 10px;">Error loading successful patterns</p></div>';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

