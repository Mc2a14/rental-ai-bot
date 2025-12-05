// ================================================
// PROPERTY-SPECIFIC LOADING
// ================================================

// Get property ID from URL
function getPropertyFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('property');
}

// Load property-specific configuration
function loadPropertyConfig() {
    const propertyId = getPropertyFromURL();
    
    if (!propertyId) {
        // No property specified - show default
        console.log('No property specified in URL, using default');
        return;
    }
    
    console.log('Loading property:', propertyId);
    
    // Get properties from localStorage
    const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
    const property = properties[propertyId];
    
    if (!property) {
        console.error('Property not found:', propertyId);
        showPropertyNotFound(propertyId);
        return;
    }
    
    // Update UI with property info
    updatePropertyUI(property);
    
    // Load property-specific FAQs
    loadPropertyFAQs(propertyId);
}

// Update UI with property information
function updatePropertyUI(property) {
    // Update header
    const headerTitle = document.querySelector('.header-text h2');
    const headerSubtitle = document.querySelector('.header-text p');
    
    if (headerTitle && property.name) {
        headerTitle.textContent = property.name;
    }
    
    if (headerSubtitle && property.address) {
        headerSubtitle.textContent = property.address;
    }
    
    // Update page title
    if (property.name) {
        document.title = `${property.name} - Rental AI Assistant`;
    }
    
    console.log('Property loaded:', property.name);
}

// Show error if property not found
function showPropertyNotFound(propertyId) {
    const messages = document.querySelector('.chat-messages');
    if (!messages) return;
    
    const errorMsg = document.createElement('div');
    errorMsg.className = 'message bot-message';
    errorMsg.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p><strong>⚠️ Property Not Found</strong></p>
            <p>The property link you used doesn't exist or has been deleted.</p>
            <p>Please check your link or contact your host.</p>
            <p><small>Property ID: ${propertyId}</small></p>
        </div>
    `;
    
    messages.insertBefore(errorMsg, messages.firstChild);
}

// Load property-specific FAQs (you'll need to adapt your FAQ system)
function loadPropertyFAQs(propertyId) {
    console.log('Loading FAQs for property:', propertyId);
    
    // Example: Load property-specific config
    const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
    const property = properties[propertyId];
    
    if (property && property.config) {
        console.log('Property config available:', property.config);
    }
}

// Initialize property loading
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        loadPropertyConfig();
    }, 100);
});

// ================================================
// FAQ AUTO-LEARNING SYSTEM
// ================================================
const FAQTracker = {
    // Track a new question
    trackQuestion(question, propertyId = 'default') {
        console.log("📝 Tracking question:", question);
        
        try {
            const faqLog = JSON.parse(localStorage.getItem('rental_ai_faq_log') || '[]');
            
            if (question.length < 3) return;
            if (question.startsWith('/') || question.includes('password') || question.includes('credit card')) {
                return;
            }
            
            faqLog.push({
                id: Date.now() + Math.random(),
                question: question.trim(),
                timestamp: new Date().toISOString(),
                propertyId: propertyId,
                answered: false,
                category: this.detectCategory(question)
            });
            
            const trimmedLog = faqLog.slice(-1000);
            localStorage.setItem('rental_ai_faq_log', JSON.stringify(trimmedLog));
            
            console.log(`✅ Question logged. Total: ${trimmedLog.length}`);
            this.analyzeFrequency();
            
        } catch (error) {
            console.error('❌ Error tracking question:', error);
        }
    },
    
    // Detect question category
    detectCategory(question) {
        const q = question.toLowerCase();
        
        if (q.includes('trash') || q.includes('garbage') || q.includes('rubbish') || 
            q.includes('waste') || q.includes('dispose') || q.includes('bin') || 
            q.includes('bags') || q.includes('dumpster')) {
            return 'trash';
        } else if (q.includes('wifi') || q.includes('internet') || q.includes('wi-fi')) {
            return 'wifi';
        } else if (q.includes('check') && (q.includes('in') || q.includes('out'))) {
            return 'checkin';
        } else if (q.includes('appliance') || q.includes('tv') || q.includes('oven') || q.includes('washer')) {
            return 'appliances';
        } else if (q.includes('rule') || q.includes('policy') || q.includes('quiet')) {
            return 'rules';
        } else if (q.includes('restaurant') || q.includes('eat') || q.includes('food')) {
            return 'recommendations';
        } else if (q.includes('emergency') || q.includes('contact') || q.includes('help')) {
            return 'emergency';
        } else if (q.includes('beach') || q.includes('playa') || q.includes('ocean') || q.includes('sea')) {
            return 'beach';
        } else if (q.includes('parking') || q.includes('car') || q.includes('vehicle')) {
            return 'parking';
        } else if (q.includes('key') || q.includes('lock') || q.includes('door') || q.includes('access')) {
            return 'access';
        } else if (q.includes('clean') || q.includes('cleaning') || q.includes('towel') || q.includes('linen')) {
            return 'cleaning';
        } else {
            return 'general';
        }
    },
    
    // Analyze frequency of questions
    analyzeFrequency() {
        const faqLog = JSON.parse(localStorage.getItem('rental_ai_faq_log') || '[]');
        const faqStats = JSON.parse(localStorage.getItem('rental_ai_faq_stats') || '{}');
        
        const questionCounts = {};
        faqLog.forEach(entry => {
            const key = entry.question.toLowerCase().trim();
            questionCounts[key] = (questionCounts[key] || 0) + 1;
        });
        
        faqStats.totalQuestions = faqLog.length;
        faqStats.uniqueQuestions = Object.keys(questionCounts).length;
        faqStats.lastAnalyzed = new Date().toISOString();
        
        const frequentQuestions = Object.entries(questionCounts)
            .filter(([_, count]) => count >= 2)
            .map(([question, count]) => ({ question, count }));
        
        faqStats.frequentQuestions = frequentQuestions;
        localStorage.setItem('rental_ai_faq_stats', JSON.stringify(faqStats));
        
        console.log(`📊 FAQ Stats: ${frequentQuestions.length} frequent questions`);
        
        const needsReview = frequentQuestions.filter(q => q.count >= 3);
        if (needsReview.length > 0) {
            this.flagForReview(needsReview);
        }
    },
    
    // Flag questions for host review
    flagForReview(questions) {
        const reviewList = JSON.parse(localStorage.getItem('rental_ai_review_list') || '[]');
        
        questions.forEach(q => {
            const exists = reviewList.some(item => 
                item.question.toLowerCase() === q.question.toLowerCase()
            );
            
            if (!exists) {
                reviewList.push({
                    question: q.question,
                    count: q.count,
                    firstSeen: new Date().toISOString(),
                    lastSeen: new Date().toISOString(),
                    reviewed: false,
                    category: this.detectCategory(q.question)
                });
            }
        });
        
        const trimmedList = reviewList.slice(-50);
        localStorage.setItem('rental_ai_review_list', JSON.stringify(trimmedList));
        
        console.log(`🚩 ${questions.length} questions flagged for review`);
        this.showNotificationIfNeeded(questions.length);
    },
    
    // Show notification in admin
    showNotificationIfNeeded(count) {
        console.log(`💡 ${count} frequent questions need review. Visit /faq-manage.html`);
    },
    
    // Get FAQ knowledge base
    getKnowledgeBase() {
        return JSON.parse(localStorage.getItem('rental_ai_knowledge_base') || '[]');
    },
    
    // Add to knowledge base
    addToKnowledgeBase(question, answer, category = 'general') {
        const knowledgeBase = this.getKnowledgeBase();
        
        knowledgeBase.push({
            id: Date.now(),
            question: question.trim(),
            answer: answer.trim(),
            category: category,
            created: new Date().toISOString(),
            uses: 0,
            confidence: 1.0,
            lastUsed: new Date().toISOString()
        });
        
        localStorage.setItem('rental_ai_knowledge_base', JSON.stringify(knowledgeBase));
        console.log(`✅ Added to knowledge base: "${question}" (Category: ${category})`);
    },
    
    // IMPROVED: Find answer in knowledge base
    findAnswer(question) {
        const knowledgeBase = this.getKnowledgeBase();
        if (knowledgeBase.length === 0) return null;
        
        const q = question.toLowerCase().trim();
        console.log('🔍 FAQ Search for:', q);
        
        const synonymGroups = {
            'trash': ['trash', 'garbage', 'rubbish', 'waste', 'refuse', 'litter', 'throw away', 'dispose', 'bin', 'dump', 'bags', 'full bags', 'garbage bags', 'trash bags', 'where does', 'where do', 'where to', 'disposal', 'dumpster', 'take out', 'put out'],
            'beach': ['beach', 'playa', 'shore', 'coast', 'seaside', 'ocean', 'sand', 'waves'],
            'pool': ['pool', 'swimming', 'jacuzzi', 'hot tub', 'spa', 'swim'],
            'restaurant': ['restaurant', 'food', 'eat', 'dining', 'meal', 'cafe', 'bar', 'bistro'],
            'wifi': ['wifi', 'internet', 'wireless', 'network', 'connection', 'online', 'web'],
            'parking': ['parking', 'car', 'vehicle', 'park', 'spot', 'garage'],
            'kitchen': ['kitchen', 'cook', 'stove', 'oven', 'fridge', 'refrigerator'],
            'checkin': ['check in', 'check-in', 'arrive', 'arrival', 'enter', 'come', 'get here'],
            'checkout': ['check out', 'check-out', 'leave', 'depart', 'exit', 'go', 'vacate'],
            'time': ['time', 'hour', 'when', 'schedule', 'clock'],
            'clean': ['clean', 'cleaning', 'tidy', 'maid', 'housekeeping', 'towels', 'linens'],
            'key': ['key', 'lock', 'door', 'enter', 'access', 'code'],
            'tv': ['tv', 'television', 'netflix', 'youtube', 'movie', 'watch'],
            'ac': ['ac', 'air conditioning', 'heating', 'cooling', 'thermostat', 'temperature'],
            'washer': ['washer', 'laundry', 'dryer', 'clothes', 'wash'],
            'how': ['how', 'operate', 'use', 'work', 'function'],
            'where': ['where', 'location', 'place', 'find', 'locate'],
            'what': ['what', 'which', 'tell me about', 'information'],
            'can': ['can', 'could', 'may', 'able', 'possible', 'allow'],
            'please': ['please', 'could you', 'can you', 'would you']
        };
        
        const questionPatterns = [
            { pattern: /^(what is|what's) (the|a|an)?/i, replace: '' },
            { pattern: /^(how do i|how to|how can i)/i, replace: '' },
            { pattern: /^(where is|where are|where can i|where should i|where do i)/i, replace: '' },
            { pattern: /^(when is|when are|when can i)/i, replace: '' },
            { pattern: /^(do you have|is there|are there)/i, replace: '' },
            { pattern: /^(can i|may i|could i)/i, replace: '' },
            { pattern: /^(tell me about|i need|i want|i\'m looking for)/i, replace: '' },
            { pattern: /^(please tell me|could you tell me|can you tell me)/i, replace: '' },
            { pattern: /[?,.!]/g, replace: '' },
            { pattern: /\s+/g, replace: ' ' }
        ];
        
        let normalizedQ = q;
        questionPatterns.forEach(pattern => {
            normalizedQ = normalizedQ.replace(pattern.pattern, pattern.replace);
        });
        normalizedQ = normalizedQ.trim();
        
        const applianceGroups = {
            'oven_microwave': ['oven', 'microwave', 'stove', 'cooktop', 'bake', 'cook', 'heat'],
            'washer_dryer': ['washer', 'dryer', 'laundry', 'clothes', 'wash', 'detergent', 'spin'],
            'refrigerator': ['refrigerator', 'fridge', 'freezer', 'cool', 'chill', 'ice'],
            'thermostat': ['thermostat', 'temperature', 'heat', 'cool', 'ac', 'air conditioning', 'climate'],
            'tv': ['tv', 'television', 'remote', 'channel', 'netflix', 'stream', 'watch']
        };
        
        let userApplianceGroup = null;
        for (const [group, keywords] of Object.entries(applianceGroups)) {
            if (keywords.some(keyword => normalizedQ.includes(keyword))) {
                userApplianceGroup = group;
                break;
            }
        }
        
        const scoredEntries = knowledgeBase.map(entry => {
            const entryQ = entry.question.toLowerCase().trim();
            let normalizedEntryQ = entryQ;
            
            questionPatterns.forEach(pattern => {
                normalizedEntryQ = normalizedEntryQ.replace(pattern.pattern, pattern.replace);
            });
            normalizedEntryQ = normalizedEntryQ.trim();
            
            let score = 0;
            
            console.log(`  Comparing: User="${normalizedQ}" vs FAQ="${normalizedEntryQ}"`);
            
            if (normalizedQ === normalizedEntryQ) {
                console.log('    ✅ Exact match!');
                score = 100;
            } else if (q === entryQ) {
                console.log('    ✅ Original text match!');
                score = 100;
            } else {
                const questionWords = this.getExpandedWords(normalizedQ, synonymGroups);
                const entryWords = this.getExpandedWords(normalizedEntryQ, synonymGroups);
                
                const intersection = [...questionWords].filter(word => 
                    entryWords.has(word) && word.length > 2
                );
                
                const union = new Set([...questionWords, ...entryWords]);
                const unionSize = union.size || 1;
                const similarity = intersection.length / unionSize;
                score = Math.min(similarity * 100, 80);
                
                console.log(`    Similarity: ${similarity * 100}% → base score: ${score}`);
                
                if (userApplianceGroup) {
                    let entryApplianceGroup = null;
                    for (const [group, keywords] of Object.entries(applianceGroups)) {
                        if (keywords.some(keyword => normalizedEntryQ.includes(keyword))) {
                            entryApplianceGroup = group;
                            break;
                        }
                    }
                    
                    if (entryApplianceGroup) {
                        if (userApplianceGroup === entryApplianceGroup) {
                            score += 25;
                            console.log(`    ✅ Same appliance group: ${userApplianceGroup} (+25)`);
                        } else {
                            score -= 50;
                            console.log(`    ❌ Different appliance groups: ${userApplianceGroup} vs ${entryApplianceGroup} (-50)`);
                        }
                    }
                }
                
                const keywordCategories = {
                    'wifi': ['wifi', 'internet', 'password', 'network', 'connection', 'wi-fi'],
                    'checkin': ['checkin', 'check-in', 'checkout', 'check-out', 'arrival', 'departure', 'time', 'schedule'],
                    'emergency': ['emergency', 'urgent', 'contact', 'number', 'phone', 'fire', 'police', 'hospital', 'doctor', 'ambulance'],
                    'restaurant': ['restaurant', 'food', 'eat', 'dining', 'meal', 'cafe', 'bar', 'bistro', 'restaurants', 'nearby', 'local'],
                    'beach': ['beach', 'playa', 'shore', 'ocean', 'sea', 'sand'],
                    'parking': ['parking', 'car', 'vehicle', 'garage', 'spot', 'space'],
                    'keys': ['key', 'keys', 'access', 'door', 'lock', 'code', 'entry'],
                    'trash': ['trash', 'garbage', 'recycle', 'disposal', 'waste']
                };
                
                let userCategory = null;
                let entryCategory = null;
                
                for (const [category, keywords] of Object.entries(keywordCategories)) {
                    if (keywords.some(keyword => normalizedQ.includes(keyword))) {
                        userCategory = category;
                    }
                    if (keywords.some(keyword => normalizedEntryQ.includes(keyword))) {
                        entryCategory = category;
                    }
                }
                
                if (userCategory && entryCategory) {
                    if (userCategory === entryCategory) {
                        score += 15;
                    } else {
                        score -= 25;
                    }
                }
                
                score += Math.min((entry.uses || 0) * 0.5, 10);
            }
            
            score = Math.max(0, Math.min(100, Math.round(score)));
            console.log(`    Final score: ${score}%`);
            
            return { entry, score, normalizedEntryQ };
        });
        
        scoredEntries.sort((a, b) => b.score - a.score);
        
        const topMatches = scoredEntries.filter(s => s.score > 0).slice(0, 5);
        if (topMatches.length > 0) {
            console.log('🔍 Top FAQ Matches:');
            topMatches.forEach((match, i) => {
                console.log(`  ${i+1}. "${match.entry.question}" → ${match.score}%`);
            });
        }
        
        let threshold = 70;
        const applianceKeywords = ['oven', 'microwave', 'washer', 'dryer', 'laundry', 'fridge', 'thermostat', 'tv'];
        const isApplianceQuestion = applianceKeywords.some(keyword => q.includes(keyword));
        
        if (isApplianceQuestion) {
            threshold = 80;
            console.log(`🔧 Appliance question detected - using higher threshold: ${threshold}%`);
        }
        
        const bestMatch = scoredEntries[0];
        
        if (bestMatch && bestMatch.score >= threshold) {
            bestMatch.entry.uses = (bestMatch.entry.uses || 0) + 1;
            bestMatch.entry.lastUsed = new Date().toISOString();
            localStorage.setItem('rental_ai_knowledge_base', JSON.stringify(knowledgeBase));
            console.log(`✅ FAQ Match: "${bestMatch.entry.question}" (${bestMatch.score}%)`);
            return bestMatch.entry.answer;
        }
        
        console.log(`❌ No FAQ match (best: ${scoredEntries[0] ? scoredEntries[0].score : 0}%, threshold: ${threshold}%)`);
        return null;
    },
    
    // Helper: Get expanded words with synonyms
    getExpandedWords(text, synonymGroups) {
        if (!text || text.trim().length === 0) return new Set();
        
        const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 1);
        const expandedSet = new Set();
        
        words.forEach(word => {
            const cleanWord = word.replace(/[^a-z]/g, '');
            if (cleanWord.length < 2) return;
            
            expandedSet.add(cleanWord);
            
            for (const [key, synonyms] of Object.entries(synonymGroups)) {
                if (synonyms.includes(cleanWord)) {
                    synonyms.forEach(synonym => {
                        if (synonym.length > 1) expandedSet.add(synonym);
                    });
                }
            }
            
            if (cleanWord.endsWith('s') && cleanWord.length > 3) expandedSet.add(cleanWord.slice(0, -1));
            if (cleanWord.endsWith('ing') && cleanWord.length > 4) expandedSet.add(cleanWord.slice(0, -3));
            if (cleanWord.endsWith('ed') && cleanWord.length > 3) expandedSet.add(cleanWord.slice(0, -2));
        });
        
        return expandedSet;
    },
    
    // ADDED: Auto-learn from successful AI answers
    autoLearnFromAnswer(question, aiAnswer) {
        try {
            const knowledgeBase = this.getKnowledgeBase();
            const q = question.toLowerCase().trim();
            
            const existingEntry = knowledgeBase.find(entry => 
                entry.question.toLowerCase().trim() === q
            );
            
            if (existingEntry) {
                if (existingEntry.answer !== aiAnswer) {
                    existingEntry.answer = aiAnswer;
                    existingEntry.lastUpdated = new Date().toISOString();
                    localStorage.setItem('rental_ai_knowledge_base', JSON.stringify(knowledgeBase));
                    console.log(`🔄 Updated existing FAQ entry: "${question}"`);
                }
                return;
            }
            
            const faqLog = JSON.parse(localStorage.getItem('rental_ai_faq_log') || '[]');
            const similarQuestions = faqLog.filter(entry => 
                entry.question.toLowerCase().includes(q.substring(0, 10)) || 
                q.includes(entry.question.toLowerCase().substring(0, 10))
            );
            
            if (similarQuestions.length >= 2) {
                this.addToKnowledgeBase(
                    question,
                    aiAnswer,
                    this.detectCategory(question)
                );
                console.log(`🤖 Auto-learned from AI answer: "${question.substring(0, 50)}..."`);
            }
            
        } catch (error) {
            console.error('Error in auto-learn:', error);
        }
    }
};

// ================================================
// MAIN CHAT CLASS - FIXED PROPERTY ISOLATION
// ================================================

class RentalAIChat {
    constructor() {
        console.log('🔄 Chat Initialized - localStorage:', !!window.localStorage);
        
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        this.themeKey = 'rental_ai_theme';
        this.languageKey = 'rental_ai_language';
        this.recommendationsKey = 'rental_ai_recommendations';
        this.appliancesKey = 'rental_ai_appliances';
        
        // Clear any cached data first
        this.hostConfig = null;
        this.hostRecommendations = [];
        this.hostAppliances = [];
        
        console.log('🔍 Step 1: Loading property-specific data...');
        this.loadAllPropertyData();
        
        console.log('🔍 Step 2: Initializing event listeners...');
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
        
        console.log('🔍 Step 3: Creating header controls...');
        this.createHeaderControls();
        
        console.log('🔍 Step 4: Loading preferences...');
        this.loadThemePreference();
        this.loadLanguagePreference();
        
        console.log('🔍 Step 5: Setting up quick questions...');
        this.setupQuickQuestionButtons();
        
        console.log('✅ Chat initialization complete!');
    }

    // NEW: Load ALL property data in correct order
    loadAllPropertyData() {
        this.loadPropertyConfig();
        this.loadRecommendations();
        this.loadAppliances();
    }

    // HOST CONFIGURATION METHODS - FIXED
    loadPropertyConfig() {
        try {
            const propertyId = getPropertyFromURL();
            
            if (propertyId) {
                const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
                const property = properties[propertyId];
                
                if (property && property.config) {
                    console.log('🏠 Using PROPERTY-SPECIFIC configuration:', property.name);
                    this.hostConfig = this.transformPropertyConfig(property.config, property.name, property.address);
                    this.updateUIWithPropertyInfo(property);
                    return;
                } else {
                    console.error('❌ Property found but missing config:', propertyId);
                }
            }
            
            // FALLBACK: Old system
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            if (savedConfig) {
                const hostConfig = JSON.parse(savedConfig);
                
                const headerText = document.querySelector('.header-text h2');
                const headerSubtext = document.querySelector('.header-text p');
                
                if (headerText && hostConfig.name) {
                    headerText.textContent = `Rental AI Assistant - ${hostConfig.name}`;
                }
                
                if (headerSubtext && hostConfig.name) {
                    headerSubtext.textContent = `${hostConfig.name} • 24/7 Support`;
                }

                const welcomePropertyName = document.getElementById('welcomePropertyName');
                if (welcomePropertyName && hostConfig.name) {
                    welcomePropertyName.textContent = hostConfig.name;
                }
                
                console.log('🏠 Using LEGACY configuration:', hostConfig.name);
                this.hostConfig = hostConfig;
            } else {
                console.log('🏠 Using default configuration');
                this.hostConfig = null;
            }
        } catch (error) {
            console.error('Error loading property config:', error);
            this.hostConfig = null;
        }
    }
    
    // Helper: Transform property config to expected format
    transformPropertyConfig(config, name, address) {
        return {
            name: name || config.propertyName,
            address: address || config.propertyAddress,
            type: config.propertyType || '',
            hostContact: config.hostContact || '',
            maintenanceContact: config.maintenanceContact || '',
            emergencyContact: config.maintenanceContact || config.hostContact || '',
            checkinTime: config.checkInTime || '3:00 PM',
            checkoutTime: config.checkOutTime || '11:00 AM',
            lateCheckout: config.lateCheckout || '',
            amenities: {
                wifi: config.wifiDetails || '',
                parking: config.parking || '',
                other: config.amenities || ''
            },
            houseRules: config.houseRules || '',
            appliances: config.appliances || [],
            hasAppliances: config.appliances && config.appliances.length > 0,
            hasRecommendations: config.recommendations && config.recommendations.length > 0,
            lastUpdated: new Date().toISOString(),
            contact: config.hostContact || '',
            checkInOut: {
                checkIn: config.checkInTime || '3:00 PM',
                checkOut: config.checkOutTime || '11:00 AM'
            }
        };
    }
    
    // Update UI with property information
    updateUIWithPropertyInfo(property) {
        const headerTitle = document.querySelector('.header-text h2');
        const headerSubtitle = document.querySelector('.header-text p');
        
        if (headerTitle && property.name) {
            headerTitle.textContent = `Rental AI Assistant - ${property.name}`;
        }
        
        if (headerSubtitle && property.name) {
            headerSubtitle.textContent = `${property.name} • 24/7 Support`;
        }

        const welcomePropertyName = document.getElementById('welcomePropertyName');
        if (welcomePropertyName && property.name) {
            welcomePropertyName.textContent = property.name;
        }
    }

    // HOST RECOMMENDATIONS METHODS - FIXED
    loadRecommendations() {
        try {
            this.hostRecommendations = []; // Clear first
            
            const propertyId = getPropertyFromURL();
            
            if (propertyId) {
                const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
                const property = properties[propertyId];
                
                if (property && property.config && property.config.recommendations) {
                    this.hostRecommendations = property.config.recommendations;
                    console.log('📍 Loaded PROPERTY-SPECIFIC recommendations:', this.hostRecommendations.length);
                    console.log('📍 First recommendation:', this.hostRecommendations[0]?.name || 'None');
                    return;
                }
            }
            
            // FALLBACK: Old system
            const saved = localStorage.getItem(this.recommendationsKey);
            if (saved) {
                this.hostRecommendations = JSON.parse(saved);
                console.log('📍 Loaded LEGACY recommendations:', this.hostRecommendations.length);
            } else {
                console.log('📍 No recommendations found');
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.hostRecommendations = [];
        }
    }

    // HOST APPLIANCES METHODS - FIXED
    loadAppliances() {
        try {
            this.hostAppliances = []; // Clear first
            
            const propertyId = getPropertyFromURL();
            
            if (propertyId) {
                const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
                const property = properties[propertyId];
                
                if (property && property.config && property.config.appliances) {
                    this.hostAppliances = property.config.appliances;
                    console.log('🛠️ Loaded PROPERTY-SPECIFIC appliances:', this.hostAppliances.length);
                    console.log('🛠️ First appliance:', this.hostAppliances[0]?.name || 'None');
                    return;
                }
            }
            
            // FALLBACK: Old system
            const saved = localStorage.getItem(this.appliancesKey);
            if (saved) {
                this.hostAppliances = JSON.parse(saved);
                console.log('🛠️ Loaded LEGACY appliances:', this.hostAppliances.length);
            } else {
                console.log('🛠️ No appliances found');
            }
        } catch (error) {
            console.error('Error loading appliances:', error);
            this.hostAppliances = [];
        }
    }

    // Get host config - ALWAYS fresh from URL
    getHostConfig() {
        try {
            const propertyId = getPropertyFromURL();
            
            if (propertyId) {
                const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
                const property = properties[propertyId];
                
                if (property && property.config) {
                    return this.transformPropertyConfig(property.config, property.name, property.address);
                }
            }
            
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            return savedConfig ? JSON.parse(savedConfig) : null;
        } catch (error) {
            console.error('Error getting host config:', error);
            return null;
        }
    }

    saveRecommendations() {
        try {
            localStorage.setItem(this.recommendationsKey, JSON.stringify(this.hostRecommendations));
        } catch (error) {
            console.error('Error saving recommendations:', error);
        }
    }

    getRecommendationsText() {
        if (!this.hostRecommendations || this.hostRecommendations.length === 0) {
            return "";
        }
        
        let text = "HOST RECOMMENDATIONS:\n\n";
        this.hostRecommendations.forEach(place => {
            text += `📍 ${place.name} (${place.category})\n`;
            if (place.description) text += `📝 ${place.description}\n`;
            if (place.notes) text += `💡 ${place.notes}\n`;
            text += "\n";
        });
        return text;
    }

    // Get appliances text for AI context
    getAppliancesText() {
        if (!this.hostAppliances || this.hostAppliances.length === 0) {
            return "";
        }
        
        let text = "HOST APPLIANCES:\n\n";
        this.hostAppliances.forEach(appliance => {
            text += `🛠️ ${appliance.name} (${appliance.type})\n`;
            if (appliance.instructions) text += `📋 Instructions: ${appliance.instructions}\n`;
            if (appliance.troubleshooting) text += `🔧 Troubleshooting: ${appliance.troubleshooting}\n`;
            if (appliance.photo) text += `📸 Photo available\n`;
            text += "\n";
        });
        return text;
    }

    initializeEventListeners() {
        console.log('🔍 Setting up event listeners...');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        if (!messageInput || !sendButton) {
            console.error('❌ Message input or send button not found!');
            return;
        }

        sendButton.addEventListener('click', () => this.sendMessage());
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        messageInput.addEventListener('input', () => this.updateCharCount());
        
        messageInput.addEventListener('input', () => {
            sendButton.disabled = messageInput.value.trim().length === 0;
        });

        console.log('✅ All event listeners initialized');
    }

    // Setup quick question buttons including appliance presets
    setupQuickQuestionButtons() {
        console.log('🔍 Setting up quick question buttons...');
        const quickQuestionsContainer = document.querySelector('.quick-questions');
        if (!quickQuestionsContainer) {
            console.log('⚠️ Quick questions container not found');
            return;
        }

        const existingApplianceSection = quickQuestionsContainer.querySelector('.quick-appliance-section');
        if (existingApplianceSection) {
            existingApplianceSection.remove();
        }

        const applianceButtons = [
            { id: 'appliance-help', text: '🛠️ Appliance Help', question: 'How do I use the appliances?' },
            { id: 'oven-help', text: '🍳 Oven/Microwave', question: 'How do I use the oven or microwave?' },
            { id: 'washer-help', text: '🧺 Washer/Dryer', question: 'How do I use the washer and dryer?' },
            { id: 'thermostat-help', text: '🌡️ Thermostat', question: 'How do I adjust the thermostat?' }
        ];

        const applianceSection = document.createElement('div');
        applianceSection.className = 'quick-appliance-section';
        applianceSection.innerHTML = '<h4 class="quick-section-title">Appliance Help</h4>';
        
        const applianceGrid = document.createElement('div');
        applianceGrid.className = 'quick-appliance-grid';
        
        applianceButtons.forEach(btn => {
            const button = document.createElement('button');
            button.className = 'appliance-quick-btn';
            button.id = btn.id;
            button.textContent = btn.text;
            button.setAttribute('data-question', btn.question);
            button.addEventListener('click', () => this.askApplianceQuestion(btn.question));
            applianceGrid.appendChild(button);
        });
        
        applianceSection.appendChild(applianceGrid);
        quickQuestionsContainer.appendChild(applianceSection);
        console.log('✅ Appliance quick questions added');
    }

    // Handle appliance question button clicks
    askApplianceQuestion(question) {
        const messageInput = document.getElementById('messageInput');
        messageInput.value = question;
        document.getElementById('sendButton').disabled = false;
        this.sendMessage();
    }

    // HEADER CONTROLS METHODS
    createHeaderControls() {
        console.log('🔄 Creating header controls...');
        
        const header = document.querySelector('.chat-header');
        if (!header) {
            console.error('❌ Chat header not found!');
            return;
        }
        
        const existingControls = header.querySelector('.header-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        
        // Add Setup button
        const setupBtn = document.createElement('button');
        setupBtn
