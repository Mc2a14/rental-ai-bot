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
    
    // Languages
    if (stats.byLanguage && stats.byLanguage.length > 0) {
        const languages = stats.byLanguage.map(l => `${l.language.toUpperCase()}: ${l.count}`).join(', ');
        document.getElementById('languages').textContent = languages;
    } else {
        document.getElementById('languages').textContent = '-';
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

