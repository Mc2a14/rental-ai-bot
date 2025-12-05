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
        setupBtn.className = 'setup-btn';
        setupBtn.innerHTML = '⚙️ Setup';
        setupBtn.title = 'Configure your property information';
        setupBtn.addEventListener('click', () => {
            window.location.href = '/admin';
        });
        headerControls.appendChild(setupBtn);
        
        // Add Clear Chat button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-chat-btn';
        clearBtn.innerHTML = '🗑️ Clear';
        clearBtn.title = 'Clear conversation history';
        clearBtn.addEventListener('click', () => this.clearChat());
        headerControls.appendChild(clearBtn);
        
        // Add Theme Toggle button
        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙 Dark';
        themeToggle.title = 'Toggle dark/light mode';
        themeToggle.addEventListener('click', () => this.toggleTheme());
        headerControls.appendChild(themeToggle);
        
        // Add Language Selector
        const langSelect = document.createElement('select');
        langSelect.id = 'languageSelect';
        langSelect.className = 'language-select';
        langSelect.title = 'Select language / Seleccionar idioma / Choisir la langue';
        
        const languages = [
            { code: 'en', name: '🇺🇸 English', native: 'English' },
            { code: 'es', name: '🇪🇸 Español', native: 'Español' },
            { code: 'fr', name: '🇫🇷 Français', native: 'Français' }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            option.setAttribute('data-native', lang.native);
            langSelect.appendChild(option);
        });
        
        langSelect.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
        headerControls.appendChild(langSelect);
        
        // Add Debug button
        const debugBtn = document.createElement('button');
        debugBtn.className = 'setup-btn';
        debugBtn.innerHTML = '🔍 Debug';
        debugBtn.title = 'Debug property data';
        debugBtn.addEventListener('click', () => this.debugPropertyData());
        headerControls.appendChild(debugBtn);
        
        // Add FAQ Manager button
        const faqBtn = document.createElement('button');
        faqBtn.className = 'setup-btn';
        faqBtn.innerHTML = '🧠 FAQ';
        faqBtn.title = 'Manage FAQ auto-learning';
        faqBtn.addEventListener('click', () => window.open('/faq-manage.html', '_blank'));
        headerControls.appendChild(faqBtn);
        
        const statusIndicator = header.querySelector('.status-indicator');
        if (statusIndicator) {
            header.insertBefore(headerControls, statusIndicator);
        } else {
            header.appendChild(headerControls);
        }
        
        headerControls.style.display = 'flex';
        headerControls.style.alignItems = 'center';
        headerControls.style.gap = '8px';
        headerControls.style.marginLeft = 'auto';
        
        console.log('✅ Header controls created successfully!');
    }

    // NEW: Debug property data
    debugPropertyData() {
        console.log('🔍 DEBUG PROPERTY DATA');
        console.log('=======================');
        
        const propertyId = getPropertyFromURL();
        console.log('1. Property ID from URL:', propertyId);
        
        const properties = JSON.parse(localStorage.getItem('rental_properties') || '{}');
        console.log('2. Total properties in storage:', Object.keys(properties).length);
        
        if (propertyId && properties[propertyId]) {
            const property = properties[propertyId];
            console.log('3. Current property:', property.name);
            console.log('4. Has config:', !!property.config);
            
            if (property.config) {
                console.log('5. Recommendations in config:', property.config.recommendations?.length || 0);
                console.log('6. Appliances in config:', property.config.appliances?.length || 0);
            }
        }
        
        console.log('7. Chat loaded recommendations:', this.hostRecommendations?.length || 0);
        console.log('8. Chat loaded appliances:', this.hostAppliances?.length || 0);
        console.log('9. Chat host config:', this.hostConfig?.name || 'None');
        
        if (this.hostRecommendations && this.hostRecommendations.length > 0) {
            console.log('10. First recommendation:', this.hostRecommendations[0].name);
        }
        
        console.log('=======================');
        
        const summary = `Property Debug:
URL Property: ${propertyId || 'None'}
Property Name: ${propertyId ? (properties[propertyId]?.name || 'Not found') : 'N/A'}
Recommendations: ${this.hostRecommendations?.length || 0}
Appliances: ${this.hostAppliances?.length || 0}`;
        
        alert(summary);
    }

    // LANGUAGE SUPPORT METHODS
    changeLanguage(langCode) {
        this.saveLanguagePreference(langCode);
        this.updateUIForLanguage(langCode);
        this.showTempMessage(`Language changed to ${this.getLanguageName(langCode)}`, 'info');
    }

    updateUIForLanguage(langCode) {
        const messageInput = document.getElementById('messageInput');
        const placeholders = {
            en: "Ask about your stay, local recommendations, or appliance instructions...",
            es: "Pregunte sobre su estadía, recomendaciones locales o instrucciones de electrodomésticos...",
            fr: "Demandez des informations sur votre séjour, des recommandations locales ou des instructions pour les appareils..."
        };
        if (messageInput) {
            messageInput.placeholder = placeholders[langCode] || placeholders.en;
        }
        this.updateQuickQuestions(langCode);
    }

    updateQuickQuestions(langCode) {
        const quickQuestions = {
            en: {
                checkin: "Check-in/out times",
                wifi: "WiFi Information", 
                restaurants: "Nearby Restaurants",
                emergency: "Emergency Contacts",
                applianceHelp: "🛠️ Appliance Help",
                ovenHelp: "🍳 Oven/Microwave",
                washerHelp: "🧺 Washer/Dryer",
                thermostatHelp: "🌡️ Thermostat"
            },
            es: {
                checkin: "Horarios de check-in/out",
                wifi: "Información del WiFi",
                restaurants: "Restaurantes cercanos",
                emergency: "Contactos de emergencia",
                applianceHelp: "🛠️ Ayuda con Electrodomésticos",
                ovenHelp: "🍳 Horno/Microondas",
                washerHelp: "🧺 Lavadora/Secadora",
                thermostatHelp: "🌡️ Termostato"
            },
            fr: {
                checkin: "Horaires check-in/out",
                wifi: "Informations WiFi",
                restaurants: "Restaurants à proximité",
                emergency: "Contacts d'urgence",
                applianceHelp: "🛠️ Aide aux Appareils",
                ovenHelp: "🍳 Four/Micro-ondes",
                washerHelp: "🧺 Lave-linge/Sèche-linge",
                thermostatHelp: "🌡️ Thermostat"
            }
        };

        const questions = quickQuestions[langCode] || quickQuestions.en;
        
        const buttons = document.querySelectorAll('.quick-btn');
        if (buttons.length >= 4) {
            buttons[0].textContent = questions.checkin;
            buttons[1].textContent = questions.wifi;
            buttons[2].textContent = questions.restaurants;
            buttons[3].textContent = questions.emergency;
        }
        
        const applianceButtons = document.querySelectorAll('.appliance-quick-btn');
        if (applianceButtons.length >= 4) {
            applianceButtons[0].textContent = questions.applianceHelp;
            applianceButtons[1].textContent = questions.ovenHelp;
            applianceButtons[2].textContent = questions.washerHelp;
            applianceButtons[3].textContent = questions.thermostatHelp;
        }
    }

    getLanguageName(langCode) {
        const languages = {
            en: 'English',
            es: 'Español', 
            fr: 'Français'
        };
        return languages[langCode] || 'English';
    }

    loadLanguagePreference() {
        try {
            const savedLang = localStorage.getItem(this.languageKey) || 'en';
            const langSelect = document.getElementById('languageSelect');
            if (langSelect) {
                langSelect.value = savedLang;
            }
            this.updateUIForLanguage(savedLang);
            console.log('🌍 Language loaded:', savedLang);
        } catch (error) {
            console.error('Error loading language preference:', error);
        }
    }

    saveLanguagePreference(langCode) {
        try {
            localStorage.setItem(this.languageKey, langCode);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    }

    getCurrentLanguage() {
        const langSelect = document.getElementById('languageSelect');
        return langSelect ? langSelect.value : 'en';
    }

    // THEME MANAGEMENT METHODS
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeButton(newTheme);
        this.saveThemePreference(newTheme);
        this.showTempMessage(`${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    updateThemeButton(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
        }
    }

    loadThemePreference() {
        try {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const savedTheme = localStorage.getItem(this.themeKey);
            let theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
            
            document.documentElement.setAttribute('data-theme', theme);
            this.updateThemeButton(theme);
            
            console.log('🎨 Theme loaded:', theme, '(system prefers dark:', systemPrefersDark, ')');
        } catch (error) {
            console.error('Error loading theme preference:', error);
        }
    }

    saveThemePreference(theme) {
        try {
            localStorage.setItem(this.themeKey, theme);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    }

    // CHAT HISTORY METHODS
    clearChat() {
        if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            const chatMessages = document.getElementById('chatMessages');
            
            const welcomeMessage = chatMessages.querySelector('.message:first-child');
            chatMessages.innerHTML = '';
            if (welcomeMessage) {
                chatMessages.appendChild(welcomeMessage);
            }
            
            this.showTempMessage('Chat history cleared successfully!', 'success');
        }
    }

    showTempMessage(text, type = 'info') {
        const tempMsg = document.createElement('div');
        tempMsg.className = `temp-message temp-message-${type}`;
        tempMsg.textContent = text;
        document.body.appendChild(tempMsg);

        setTimeout(() => {
            tempMsg.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (tempMsg.parentNode) {
                    tempMsg.parentNode.removeChild(tempMsg);
                }
            }, 300);
        }, 3000);
    }

    saveChatHistory() {
        try {
            const chatMessages = document.getElementById('chatMessages');
            const messages = [];
            
            const messageElements = chatMessages.querySelectorAll('.message');
            
            messageElements.forEach((messageEl, index) => {
                if (index === 0) return;
                
                const isBot = messageEl.classList.contains('bot-message');
                const contentEl = messageEl.querySelector('.message-content');
                const content = contentEl.textContent || contentEl.innerText;
                
                messages.push({
                    type: isBot ? 'bot' : 'user',
                    content: content,
                    timestamp: new Date().toISOString()
                });
            });

            localStorage.setItem(this.storageKey, JSON.stringify(messages));
            console.log('💾 Chat history saved:', messages.length, 'messages');
            
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const messages = JSON.parse(saved);
                const chatMessages = document.getElementById('chatMessages');
                
                const welcomeMessage = chatMessages.querySelector('.message:first-child');
                chatMessages.innerHTML = '';
                if (welcomeMessage) {
                    chatMessages.appendChild(welcomeMessage);
                }

                messages.forEach(msg => {
                    this.addMessage(msg.content, msg.type, true);
                });

                chatMessages.scrollTop = chatMessages.scrollHeight;
                console.log('📂 Chat history loaded:', messages.length, 'messages');
                
                this.showTempMessage(`Loaded ${messages.length} previous messages`, 'info');
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        if (messageInput && charCount) {
            const length = messageInput.value.length;
            charCount.textContent = `${length}/500`;
            
            if (length > 450) {
                charCount.style.color = '#e74c3c';
            } else if (length > 400) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#7f8c8d';
            }
        }
    }

    // UPDATED: sendMessage method with FRESH property data each time
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        // TRACK QUESTION FOR FAQ AUTO-LEARNING
        FAQTracker.trackQuestion(message);
        
        messageInput.value = '';
        this.updateCharCount();
        document.getElementById('sendButton').disabled = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            const currentLanguage = this.getCurrentLanguage();
            
            // FIRST: Check if we have an FAQ answer in knowledge base
            const faqAnswer = FAQTracker.findAnswer(message);
            
            if (faqAnswer) {
                console.log("✅ Found FAQ answer in knowledge base");
                this.hideTypingIndicator();
                this.addMessage(faqAnswer, 'bot');
                return;
            }
            
            // IMPORTANT: RELOAD property data for EACH message to ensure freshness
            this.loadAllPropertyData();
            const hostConfig = this.getHostConfig();
            
            // Prepare system messages
            let systemMessage = '';
            
            // Check if question is about local recommendations
            const localKeywords = ['restaurant', 'food', 'eat', 'cafe', 'bar', 
                'beach', 'park', 'attraction', 'nearby', 'local', 
                'recommend', 'things to do', 'activity', 'tour', 
                'sightseeing', 'place to visit', 'what to do', 'see',
                'visit', 'explore', 'destination'];
            
            // Check if question is about appliances
            const applianceKeywords = ['appliance', 'oven', 'microwave', 'stove', 'cooktop',
                'washer', 'dryer', 'laundry', 'washing machine',
                'dishwasher', 'refrigerator', 'fridge', 'freezer',
                'thermostat', 'heating', 'cooling', 'air conditioning',
                'AC', 'heat', 'coffee maker', 'toaster', 'blender',
                'microwave', 'TV', 'television', 'remote', 'control',
                'instructions', 'how to use', 'operate', 'work',
                'not working', 'troubleshoot', 'help with', 'use the',
                'how do I', 'turn on', 'start', 'begin'];
            
            if (anyKeywordInMessage(message, localKeywords) && this.hostRecommendations.length > 0) {
                systemMessage += `When users ask about local places, share these host recommendations:\n\n${this.getRecommendationsText()}`;
            }
            
            // Include appliances context for appliance questions
            if (anyKeywordInMessage(message, applianceKeywords) && this.hostAppliances.length > 0) {
                if (systemMessage) systemMessage += "\n\n";
                systemMessage += `When users ask about appliances, use these instructions:\n\n${this.getAppliancesText()}`;
            }

            console.log('🔄 Sending to AI:', {
                message: message,
                language: currentLanguage,
                hostConfig: hostConfig?.name || 'No config',
                hasRecommendations: this.hostRecommendations.length,
                hasAppliances: this.hostAppliances.length,
                hasSystemMessage: !!systemMessage
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    language: currentLanguage,
                    hostConfig: hostConfig,
                    systemMessage: systemMessage
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'bot');
                console.log('🌍 Response language:', data.detectedLanguage);
                console.log('🏠 Using custom config:', data.usingCustomConfig);
                console.log('🛠️ Using appliances data:', data.usingAppliances || false);
                
                // Auto-learn from successful AI answers
                FAQTracker.autoLearnFromAnswer(message, data.response);
                
                if (data.usingCustomConfig && hostConfig) {
                    console.log('✅ AI is using your custom property configuration');
                }
            } else {
                this.addMessage(
                    "I'm having trouble connecting right now. Please try again in a moment.",
                    'bot'
                );
            }

        } catch (error) {
            this.hideTypingIndicator();
            
            if (error.name === 'AbortError') {
                this.addMessage(
                    "The request took too long. Please try again with a simpler question.",
                    'bot'
                );
            } else {
                this.addMessage(
                    "Sorry, I'm experiencing connection issues. Please check your internet connection and try again.",
                    'bot'
                );
            }
            console.error('Network error:', error);
        }
    }

    addMessage(content, sender, isRestored = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (sender === 'bot') {
            const formattedContent = this.formatBotResponse(content);
            messageContent.innerHTML = formattedContent;
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (!isRestored && chatMessages.children.length > 1) {
            this.saveChatHistory();
        }
    }

    formatBotResponse(text) {
        let formatted = text.replace(/\n/g, '<br>');
        formatted = formatted.replace(/(\d+)\.\s/g, '<strong>$1.</strong> ');
        formatted = formatted.replace(/Emergency:/g, '<strong>🚨 Emergency:</strong>');
        formatted = formatted.replace(/Contact:/g, '<strong>📞 Contact:</strong>');
        formatted = formatted.replace(/Address:/g, '<strong>📍 Address:</strong>');
        formatted = formatted.replace(/Check-in:/g, '<strong>🕒 Check-in:</strong>');
        formatted = formatted.replace(/Check-out:/g, '<strong>🕒 Check-out:</strong>');
        formatted = formatted.replace(/WiFi:/g, '<strong>📶 WiFi:</strong>');
        formatted = formatted.replace(/Parking:/g, '<strong>🚗 Parking:</strong>');
        formatted = formatted.replace(/Trash:/g, '<strong>🗑️ Trash:</strong>');
        formatted = formatted.replace(/Garbage:/g, '<strong>🗑️ Garbage:</strong>');
        formatted = formatted.replace(/Appliance:/g, '<strong>🛠️ Appliance:</strong>');
        formatted = formatted.replace(/Instructions:/g, '<strong>📋 Instructions:</strong>');
        formatted = formatted.replace(/Troubleshooting:/g, '<strong>🔧 Troubleshooting:</strong>');
        formatted = formatted.replace(/Type:/g, '<strong>📝 Type:</strong>');
        
        return formatted;
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }
}

// Helper function to check for local keywords
function anyKeywordInMessage(message, keywords) {
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
}

// Global function for quick questions
function askQuestion(question) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = question;
    document.getElementById('sendButton').disabled = false;
    
    const chat = window.chat || new RentalAIChat();
    chat.sendMessage();
}

// Debug function to check configuration
function debugConfig() {
    const config = localStorage.getItem('rentalAIPropertyConfig');
    const recommendations = localStorage.getItem('rental_ai_recommendations');
    const appliances = localStorage.getItem('rental_ai_appliances');
    const faqLog = localStorage.getItem('rental_ai_faq_log');
    const faqStats = localStorage.getItem('rental_ai_faq_stats');
    const knowledgeBase = localStorage.getItem('rental_ai_knowledge_base');
    
    if (config) {
        const parsed = JSON.parse(config);
        console.log('🔧 Current Host Configuration:', parsed);
        
        let alertText = `Current Configuration:\nProperty: ${parsed.name}\nWiFi: ${parsed.amenities?.wifi || 'Not set'}`;
        
        if (appliances) {
            const applianceList = JSON.parse(appliances);
            alertText += `\nAppliances: ${applianceList.length} configured`;
        }
        
        if (faqLog) {
            const faqList = JSON.parse(faqLog);
            alertText += `\nQuestions Tracked: ${faqList.length}`;
        }
        
        if (faqStats) {
            const stats = JSON.parse(faqStats);
            alertText += `\nFrequent Questions: ${stats.frequentQuestions ? stats.frequentQuestions.length : 0}`;
        }
        
        if (knowledgeBase) {
            const kb = JSON.parse(knowledgeBase);
            alertText += `\nFAQ Knowledge Base: ${kb.length} entries`;
        }
        
        alert(alertText);
    } else {
        console.log('🔧 No host configuration found');
        alert('No host configuration found. Please run setup first.');
    }
}

// Enhanced debug function
function debugFullConfig() {
    const config = localStorage.getItem('rentalAIPropertyConfig');
    const recommendations = localStorage.getItem('rental_ai_recommendations');
    const appliances = localStorage.getItem('rental_ai_appliances');
    const faqLog = localStorage.getItem('rental_ai_faq_log');
    const faqStats = localStorage.getItem('rental_ai_faq_stats');
    const knowledgeBase = localStorage.getItem('rental_ai_knowledge_base');
    
    if (config) {
        const parsed = JSON.parse(config);
        console.log('🔧 FULL Host Configuration:', parsed);
        
        let debugInfo = 'Current Configuration:\n';
        debugInfo += `Property: ${parsed.name || 'Not set'}\n`;
        debugInfo += `Address: ${parsed.address || 'Not set'}\n`;
        debugInfo += `Host Contact: ${parsed.hostContact || 'Not set'}\n`;
        debugInfo += `Maintenance Contact: ${parsed.maintenanceContact || 'Not set'}\n`;
        debugInfo += `Check-in: ${parsed.checkinTime || 'Not set'}\n`;
        debugInfo += `Check-out: ${parsed.checkoutTime || 'Not set'}\n`;
        debugInfo += `WiFi: ${parsed.amenities?.wifi || 'Not set'}\n`;
        debugInfo += `Other Amenities: ${parsed.amenities?.other || 'Not set'}\n`;
        debugInfo += `House Rules: ${parsed.houseRules ? 'Set' : 'Not set'}\n`;
        
        const recs = recommendations ? JSON.parse(recommendations) : [];
        debugInfo += `Recommendations: ${recs.length} places\n`;
        
        const applianceList = appliances ? JSON.parse(appliances) : [];
        debugInfo += `Appliances: ${applianceList.length} configured\n`;
        if (applianceList.length > 0) {
            applianceList.forEach((appliance, index) => {
                debugInfo += `  ${index + 1}. ${appliance.name} (${appliance.type})\n`;
            });
        }
        
        if (faqLog) {
            const faqList = JSON.parse(faqLog);
            debugInfo += `\nFAQ Tracking:\n`;
            debugInfo += `  Questions Tracked: ${faqList.length}\n`;
        }
        
        if (faqStats) {
            const stats = JSON.parse(faqStats);
            debugInfo += `  Frequent Questions: ${stats.frequentQuestions ? stats.frequentQuestions.length : 0}\n`;
        }
        
        if (knowledgeBase) {
            const kb = JSON.parse(knowledgeBase);
            debugInfo += `  Knowledge Base Entries: ${kb.length}\n`;
            kb.slice(0, 5).forEach((entry, index) => {
                debugInfo += `    ${index + 1}. "${entry.question.substring(0, 30)}..." (Uses: ${entry.uses || 0})\n`;
            });
            if (kb.length > 5) debugInfo += `    ... and ${kb.length - 5} more\n`;
        }
        
        alert(debugInfo);
    } else {
        console.log('🔧 No host configuration found');
        alert('No host configuration found. Please run setup first.');
    }
}

// Test FAQ matching
function testFAQMatch(question) {
    console.log('🧪 Testing FAQ match for:', question);
    const result = FAQTracker.findAnswer(question);
    if (result) {
        console.log('✅ Found match:', result.substring(0, 100) + '...');
        return result;
    } else {
        console.log('❌ No match found');
        return null;
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing RentalAIChat...');
    try {
        window.chat = new RentalAIChat();
        console.log('✅ RentalAIChat initialized successfully!');
        
        // Add CSS for header controls
        const style = document.createElement('style');
        style.textContent = `
            .header-controls {
                display: flex !important;
                align-items: center;
                gap: 8px;
                margin-left: auto;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .setup-btn, .clear-chat-btn, .theme-toggle {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 6px 10px;
                border-radius: 10px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .setup-btn:hover, .clear-chat-btn:hover, .theme-toggle:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .language-select {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 6px 10px;
                border-radius: 10px;
                font-size: 0.8rem;
                cursor: pointer;
            }
            
            .language-select option {
                background: #2c3e50;
                color: white;
            }
            
            /* Appliance quick questions */
            .quick-appliance-section {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--border-color);
            }
            
            .quick-section-title {
                margin-bottom: 10px;
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            
            .quick-appliance-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            
            .appliance-quick-btn {
                background: var(--accent-secondary);
                color: white;
                border: none;
                padding: 10px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.85rem;
                text-align: center;
            }
            
            .appliance-quick-btn:hover {
                background: var(--accent-primary);
            }
            
            /* Animation styles */
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
    } catch (error) {
        console.error('❌ Error initializing RentalAIChat:', error);
        alert('Error initializing chat. Please check console for details.');
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
});
