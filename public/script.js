// ================================================
// FAQ AUTO-LEARNING SYSTEM - ADDED
// ================================================
const FAQTracker = {
    // Track a new question
    trackQuestion(question, propertyId = 'default') {
        console.log("📝 Tracking question:", question);
        
        try {
            const faqLog = JSON.parse(localStorage.getItem('rental_ai_faq_log') || '[]');
            
            // Don't track very short questions
            if (question.length < 3) return;
            
            // Don't track commands or special queries
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
            
            // Keep only last 1000 questions to avoid storage issues
            const trimmedLog = faqLog.slice(-1000);
            localStorage.setItem('rental_ai_faq_log', JSON.stringify(trimmedLog));
            
            console.log(`✅ Question logged. Total: ${trimmedLog.length}`);
            
            // Check if this is becoming frequent
            this.analyzeFrequency();
            
        } catch (error) {
            console.error('❌ Error tracking question:', error);
        }
    },
    
    // Detect question category
    detectCategory(question) {
        const q = question.toLowerCase();
        
        // ADDED: Trash/Garbage category first
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
        
        // Group questions by text (simplified)
        const questionCounts = {};
        faqLog.forEach(entry => {
            const key = entry.question.toLowerCase().trim();
            questionCounts[key] = (questionCounts[key] || 0) + 1;
        });
        
        // Update stats
        faqStats.totalQuestions = faqLog.length;
        faqStats.uniqueQuestions = Object.keys(questionCounts).length;
        faqStats.lastAnalyzed = new Date().toISOString();
        
        // Find frequent questions (asked 2+ times)
        const frequentQuestions = Object.entries(questionCounts)
            .filter(([_, count]) => count >= 2)
            .map(([question, count]) => ({ question, count }));
        
        faqStats.frequentQuestions = frequentQuestions;
        localStorage.setItem('rental_ai_faq_stats', JSON.stringify(faqStats));
        
        console.log(`📊 FAQ Stats: ${frequentQuestions.length} frequent questions`);
        
        // If we have very frequent questions (3+ times), flag for review
        const needsReview = frequentQuestions.filter(q => q.count >= 3);
        if (needsReview.length > 0) {
            this.flagForReview(needsReview);
        }
    },
    
    // Flag questions for host review
    flagForReview(questions) {
        const reviewList = JSON.parse(localStorage.getItem('rental_ai_review_list') || '[]');
        
        questions.forEach(q => {
            // Check if already in review list
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
        
        // Keep list manageable
        const trimmedList = reviewList.slice(-50);
        localStorage.setItem('rental_ai_review_list', JSON.stringify(trimmedList));
        
        console.log(`🚩 ${questions.length} questions flagged for review`);
        
        // Show notification if host is on admin page
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
        
        // Define comprehensive synonym groups for common rental topics
        const synonymGroups = {
            // Trash/Garbage - EXPANDED
            'trash': ['trash', 'garbage', 'rubbish', 'waste', 'refuse', 'litter', 
                     'throw away', 'dispose', 'bin', 'dump', 'bags', 'full bags',
                     'garbage bags', 'trash bags', 'where does', 'where do', 'where to',
                     'disposal', 'dumpster', 'take out', 'put out'],
            
            // Location/Places
            'beach': ['beach', 'playa', 'shore', 'coast', 'seaside', 'ocean', 'sand', 'waves'],
            'pool': ['pool', 'swimming', 'jacuzzi', 'hot tub', 'spa', 'swim'],
            'restaurant': ['restaurant', 'food', 'eat', 'dining', 'meal', 'cafe', 'bar', 'bistro'],
            
            // Amenities
            'wifi': ['wifi', 'internet', 'wireless', 'network', 'connection', 'online', 'web'],
            'parking': ['parking', 'car', 'vehicle', 'park', 'spot', 'garage'],
            'kitchen': ['kitchen', 'cook', 'stove', 'oven', 'fridge', 'refrigerator'],
            
            // Check-in/out
            'checkin': ['check in', 'check-in', 'arrive', 'arrival', 'enter', 'come', 'get here'],
            'checkout': ['check out', 'check-out', 'leave', 'depart', 'exit', 'go', 'vacate'],
            'time': ['time', 'hour', 'when', 'schedule', 'clock'],
            
            // Housekeeping
            'clean': ['clean', 'cleaning', 'tidy', 'maid', 'housekeeping', 'towels', 'linens'],
            'key': ['key', 'lock', 'door', 'enter', 'access', 'code'],
            
            // Appliances
            'tv': ['tv', 'television', 'netflix', 'youtube', 'movie', 'watch'],
            'ac': ['ac', 'air conditioning', 'heating', 'cooling', 'thermostat', 'temperature'],
            'washer': ['washer', 'laundry', 'dryer', 'clothes', 'wash'],
            
            // General
            'how': ['how', 'operate', 'use', 'work', 'function'],
            'where': ['where', 'location', 'place', 'find', 'locate'],
            'what': ['what', 'which', 'tell me about', 'information'],
            'can': ['can', 'could', 'may', 'able', 'possible', 'allow'],
            'please': ['please', 'could you', 'can you', 'would you']
        };
        
        // Common question patterns to normalize
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
        
        // Normalize the question
        let normalizedQ = q;
        questionPatterns.forEach(pattern => {
            normalizedQ = normalizedQ.replace(pattern.pattern, pattern.replace);
        });
        normalizedQ = normalizedQ.trim();
        
               // Score each FAQ entry with ENHANCED KEYWORD WEIGHTING
        const scoredEntries = knowledgeBase.map(entry => {
            const entryQ = entry.question.toLowerCase().trim();
            let normalizedEntryQ = entryQ;
            
            // Normalize FAQ question too
            questionPatterns.forEach(pattern => {
                normalizedEntryQ = normalizedEntryQ.replace(pattern.pattern, pattern.replace);
            });
            normalizedEntryQ = normalizedEntryQ.trim();
            
            let score = 0;
            
            // 1. Exact match (highest priority)
            if (normalizedQ === normalizedEntryQ || q === entryQ) {
                score = 100;
            }
            // 2. Contains match (direct)
            else if (normalizedQ.includes(normalizedEntryQ) || normalizedEntryQ.includes(normalizedQ)) {
                score = 85;
            }
            // 3. Smart word matching with synonyms and category weighting
            else {
                // Get all words from both questions (with synonyms expanded)
                const questionWords = this.getExpandedWords(normalizedQ, synonymGroups);
                const entryWords = this.getExpandedWords(normalizedEntryQ, synonymGroups);
                
                // Calculate word overlap
                const intersection = [...questionWords].filter(word => 
                    entryWords.has(word) && word.length > 2
                );
                
                // Calculate similarity score - FIXED: Prevent division by zero
                const union = new Set([...questionWords, ...entryWords]);
                const unionSize = union.size || 1; // Prevent division by zero
                const similarity = intersection.length / unionSize;
                score = Math.min(similarity * 100, 80);
                
                                // ENHANCED KEYWORD WEIGHTING SYSTEM
                const keywordCategories = {
                    // High importance - specific topics that shouldn't cross-match
                    'wifi': ['wifi', 'internet', 'password', 'network', 'connection', 'wi-fi'],
                    'checkin': ['checkin', 'check-in', 'checkout', 'check-out', 'arrival', 'departure', 'time', 'schedule'],
                    'emergency': ['emergency', 'urgent', 'contact', 'number', 'phone', 'fire', 'police', 'hospital', 'doctor', 'ambulance'],
                    // ADD THIS LINE:
                    'restaurant': ['restaurant', 'food', 'eat', 'dining', 'meal', 'cafe', 'bar', 'bistro', 'restaurants', 'nearby', 'local'],
                    'beach': ['beach', 'playa', 'shore', 'ocean', 'sea', 'sand'],
                    'parking': ['parking', 'car', 'vehicle', 'garage', 'spot', 'space'],
                    'appliances': ['appliance', 'oven', 'microwave', 'washer', 'dryer', 'stove', 'fridge', 'refrigerator'],
                    'keys': ['key', 'keys', 'access', 'door', 'lock', 'code', 'entry'],
                    'trash': ['trash', 'garbage', 'recycle', 'disposal', 'waste']
                };
                
                // Medium importance - general terms
                const mediumKeywords = ['where', 'what', 'how', 'when', 'why', 'who', 'can', 'do', 'is', 'are', 'the'];
                
                // Identify the main category of the user's question
                let userQuestionCategory = null;
                for (const [category, keywords] of Object.entries(keywordCategories)) {
                    if (keywords.some(keyword => q.includes(keyword))) {
                        userQuestionCategory = category;
                        break;
                    }
                }
                
                // Identify the main category of the FAQ entry
                let faqCategory = null;
                for (const [category, keywords] of Object.entries(keywordCategories)) {
                    if (keywords.some(keyword => entryQ.includes(keyword))) {
                        faqCategory = category;
                        break;
                    }
                }
                
                // CATEGORY MATCHING LOGIC
                if (userQuestionCategory && faqCategory) {
                    if (userQuestionCategory === faqCategory) {
                        // Same category = BIG bonus
                        score += 40;
                        console.log(`🎯 Category match: ${userQuestionCategory} (${score}%)`);
                    } else {
                        // Different categories = BIG penalty (prevent cross-matching)
                        score -= 35;
                        console.log(`⚠️ Category mismatch: ${userQuestionCategory} vs ${faqCategory} (${score}%)`);
                    }
                }
                
                               // Specific keyword penalties (prevent cross-matching)
                if (q.includes('wifi') && entryQ.includes('emergency')) {
                    score -= 50; // Heavy penalty for WiFi matching with emergency
                }
                if (q.includes('emergency') && entryQ.includes('wifi')) {
                    score -= 50;
                }
                if ((q.includes('checkin') || q.includes('check-out')) && entryQ.includes('emergency')) {
                    score -= 40;
                }
                if (q.includes('emergency') && (entryQ.includes('checkin') || entryQ.includes('check-out'))) {
                    score -= 40;
                }
                // ADD THESE NEW LINES:
                if ((q.includes('restaurant') || q.includes('food') || q.includes('eat') || q.includes('dining')) && entryQ.includes('emergency')) {
                    score -= 45;
                }
                if (q.includes('emergency') && (entryQ.includes('restaurant') || entryQ.includes('food') || entryQ.includes('eat') || entryQ.includes('dining'))) {
                    score -= 45;
                }
                
                // Bonus for matching specific important keywords
                Object.values(keywordCategories).flat().forEach(keyword => {
                    if (q.includes(keyword) && entryQ.includes(keyword)) {
                        score += 8; // Moderate bonus for matching specific keywords
                    }
                });
                
                // Small bonus for medium keyword matches
                mediumKeywords.forEach(keyword => {
                    if (q.includes(keyword) && entryQ.includes(keyword)) {
                        score += 2; // Small bonus for general word matches
                    }
                });
                
                // Boost for category matches (using your existing system)
                if (entry.category && this.detectCategory(q) === entry.category) {
                    score += 15;
                }
                
                // Boost for question words match
                const questionWordsList = ['where', 'what', 'how', 'when', 'why', 'who'];
                const matchingQuestionWords = questionWordsList.filter(word => 
                    q.includes(word) && entryQ.includes(word)
                );
                score += matchingQuestionWords.length * 10;
                
                // Additional boosting factors
                // Length similarity boost
                const lengthDiff = Math.abs(normalizedQ.length - normalizedEntryQ.length);
                if (lengthDiff < 10) score += 5;
                
                // Common word boost
                const commonWords = ['the', 'and', 'for', 'with', 'from', 'to', 'a', 'an', 'in', 'on', 'at'];
                const commonMatches = commonWords.filter(word => 
                    normalizedQ.includes(word) && normalizedEntryQ.includes(word)
                );
                score += commonMatches.length * 2;
                
                // Usage boost - more used answers get slightly higher score
                score += Math.min((entry.uses || 0) * 0.5, 10);
            }
            
            // Ensure score is within bounds
            score = Math.max(0, Math.min(100, Math.round(score)));
            
            return { entry, score, normalizedEntryQ };
        });
        
        // Sort by score (highest first)
        scoredEntries.sort((a, b) => b.score - a.score);
        
        // Debug logging
        const topMatches = scoredEntries.filter(s => s.score > 0).slice(0, 5);
        if (topMatches.length > 0) {
            console.log('🔍 Top FAQ Matches:');
            topMatches.forEach((match, i) => {
                console.log(`  ${i+1}. "${match.entry.question}" → ${match.score}%`);
            });
        }
        
        // If best match has decent score, use it
        const bestMatch = scoredEntries[0];
        const threshold = 70; // Increase to 70% for all questions
        
        if (bestMatch && bestMatch.score >= threshold) {
            bestMatch.entry.uses = (bestMatch.entry.uses || 0) + 1;
            bestMatch.entry.lastUsed = new Date().toISOString();
            localStorage.setItem('rental_ai_knowledge_base', JSON.stringify(knowledgeBase));
            console.log(`✅ FAQ Match: "${bestMatch.entry.question}" (${bestMatch.score}%)`);
            return bestMatch.entry.answer;
        }
        
        console.log(`❌ No FAQ match (best: ${scoredEntries[0] ? scoredEntries[0].score : 0}%)`);
        return null;
    },
    
    // Helper: Get expanded words with synonyms
    getExpandedWords(text, synonymGroups) {
        if (!text || text.trim().length === 0) return new Set();
        
        const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 1);
        const expandedSet = new Set();
        
        words.forEach(word => {
            // Clean the word
            const cleanWord = word.replace(/[^a-z]/g, '');
            if (cleanWord.length < 2) return;
            
            expandedSet.add(cleanWord);
            
            // Add synonyms
            for (const [key, synonyms] of Object.entries(synonymGroups)) {
                if (synonyms.includes(cleanWord)) {
                    synonyms.forEach(synonym => {
                        if (synonym.length > 1) expandedSet.add(synonym);
                    });
                }
            }
            
            // Add stemmed versions (simple)
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
            
            // Check if this question already exists in knowledge base
            const existingEntry = knowledgeBase.find(entry => 
                entry.question.toLowerCase().trim() === q
            );
            
            if (existingEntry) {
                // Update existing entry if AI answer is different
                if (existingEntry.answer !== aiAnswer) {
                    existingEntry.answer = aiAnswer;
                    existingEntry.lastUpdated = new Date().toISOString();
                    localStorage.setItem('rental_ai_knowledge_base', JSON.stringify(knowledgeBase));
                    console.log(`🔄 Updated existing FAQ entry: "${question}"`);
                }
                return;
            }
            
            // Only auto-learn if this is a frequently asked question
            const faqLog = JSON.parse(localStorage.getItem('rental_ai_faq_log') || '[]');
            const similarQuestions = faqLog.filter(entry => 
                entry.question.toLowerCase().includes(q.substring(0, 10)) || 
                q.includes(entry.question.toLowerCase().substring(0, 10))
            );
            
            if (similarQuestions.length >= 2) {
                // Add to knowledge base as auto-learned
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
// MAIN CHAT CLASS
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
        
        console.log('🔍 Step 1: Loading property config...');
        this.loadPropertyConfig();
        
        console.log('🔍 Step 2: Initializing event listeners...');
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
        
        console.log('🔍 Step 3: Creating header controls...');
        this.createHeaderControls();
        
        console.log('🔍 Step 4: Loading preferences...');
        this.loadThemePreference();
        this.loadLanguagePreference();
        this.loadRecommendations();
        this.loadAppliances();
        
        console.log('🔍 Step 5: Setting up quick questions...');
        this.setupQuickQuestionButtons();
        
        console.log('🔍 Step 6: Refreshing config...');
        this.refreshPropertyConfig();
        
        console.log('✅ Chat initialization complete!');
    }

    // HOST CONFIGURATION METHODS
    loadPropertyConfig() {
        try {
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            if (savedConfig) {
                const hostConfig = JSON.parse(savedConfig);
                
                // Update the chat header with custom property name
                const headerText = document.querySelector('.header-text h2');
                const headerSubtext = document.querySelector('.header-text p');
                
                if (headerText && hostConfig.name) {
                    headerText.textContent = `Rental AI Assistant - ${hostConfig.name}`;
                }
                
                if (headerSubtext && hostConfig.name) {
                    headerSubtext.textContent = `${hostConfig.name} • 24/7 Support`;
                }

                // ✅ UPDATE WELCOME MESSAGE PROPERTY NAME
                const welcomePropertyName = document.getElementById('welcomePropertyName');
                if (welcomePropertyName && hostConfig.name) {
                    welcomePropertyName.textContent = hostConfig.name;
                }
                
                console.log('🏠 Using host configuration:', hostConfig.name);
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

    // NEW: Refresh property config to get latest data
    refreshPropertyConfig() {
        this.loadPropertyConfig();
        this.loadRecommendations();
        this.loadAppliances();
        
        console.log('🔄 Refreshed property config:', this.hostConfig?.name);
        console.log('🔄 Refreshed recommendations:', this.hostRecommendations.length);
        console.log('🔄 Refreshed appliances:', this.hostAppliances.length);
    }

    getHostConfig() {
        try {
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            return savedConfig ? JSON.parse(savedConfig) : null;
        } catch (error) {
            console.error('Error getting host config:', error);
            return null;
        }
    }

    // HOST RECOMMENDATIONS METHODS
    loadRecommendations() {
        try {
            const saved = localStorage.getItem(this.recommendationsKey);
            if (saved) {
                this.hostRecommendations = JSON.parse(saved);
                console.log('📍 Host recommendations loaded:', this.hostRecommendations.length);
            } else {
                this.hostRecommendations = [];
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.hostRecommendations = [];
        }
    }

    // HOST APPLIANCES METHODS - ADDED
    loadAppliances() {
        try {
            const saved = localStorage.getItem(this.appliancesKey);
            if (saved) {
                this.hostAppliances = JSON.parse(saved);
                console.log('🛠️ Host appliances loaded:', this.hostAppliances.length);
            } else {
                this.hostAppliances = [];
            }
        } catch (error) {
            console.error('Error loading appliances:', error);
            this.hostAppliances = [];
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

    // ADDED: Get appliances text for AI context
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

        // Send message on button click
        sendButton.addEventListener('click', () => this.sendMessage());
        console.log('✅ Send button listener added');

        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Update character count
        messageInput.addEventListener('input', () => this.updateCharCount());

        // Enable/disable send button based on input
        messageInput.addEventListener('input', () => {
            sendButton.disabled = messageInput.value.trim().length === 0;
        });

        console.log('✅ All event listeners initialized');
    }

    // ADDED: Setup quick question buttons including appliance presets
    setupQuickQuestionButtons() {
        console.log('🔍 Setting up quick question buttons...');
        const quickQuestionsContainer = document.querySelector('.quick-questions');
        if (!quickQuestionsContainer) {
            console.log('⚠️ Quick questions container not found');
            return;
        }

        // Check if appliance section already exists
        const existingApplianceSection = quickQuestionsContainer.querySelector('.quick-appliance-section');
        if (existingApplianceSection) {
            console.log('⚠️ Appliance section already exists, removing...');
            existingApplianceSection.remove();
        }

        // ADDED: Appliance-specific quick questions
        const applianceButtons = [
            { id: 'appliance-help', text: '🛠️ Appliance Help', question: 'How do I use the appliances?' },
            { id: 'oven-help', text: '🍳 Oven/Microwave', question: 'How do I use the oven or microwave?' },
            { id: 'washer-help', text: '🧺 Washer/Dryer', question: 'How do I use the washer and dryer?' },
            { id: 'thermostat-help', text: '🌡️ Thermostat', question: 'How do I adjust the thermostat?' }
        ];

        // Create appliance quick questions section
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
        
        // Insert appliance section after the existing quick questions
        quickQuestionsContainer.appendChild(applianceSection);
        console.log('✅ Appliance quick questions added');
    }

    // ADDED: Handle appliance question button clicks
    askApplianceQuestion(question) {
        const messageInput = document.getElementById('messageInput');
        messageInput.value = question;
        document.getElementById('sendButton').disabled = false;
        this.sendMessage();
    }

    // HEADER CONTROLS METHODS - FIXED WITH DEBUGGING
    createHeaderControls() {
        console.log('🔄 Creating header controls...');
        
        // Check if header exists
        const header = document.querySelector('.chat-header');
        console.log('🔍 Header element found:', !!header);
        
        if (!header) {
            console.error('❌ Chat header not found! Looking for .chat-header');
            // Try alternative selectors
            const altHeader = document.querySelector('header');
            console.log('🔍 Alternative header found:', !!altHeader);
            
            // Emergency: Create a temporary header if none exists
            if (!altHeader) {
                console.error('❌ No header found at all!');
                this.createEmergencyHeader();
                return;
            }
            return;
        }
        
        // Check if controls already exist
        const existingControls = header.querySelector('.header-controls');
        if (existingControls) {
            console.log('⚠️ Header controls already exist, removing...');
            existingControls.remove();
        }
        
        const headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        console.log('✅ Created headerControls div');
        
        // Add Setup button
        const setupBtn = document.createElement('button');
        setupBtn.className = 'setup-btn';
        setupBtn.innerHTML = '⚙️ Setup';
        setupBtn.title = 'Configure your property information';
        setupBtn.addEventListener('click', () => {
            window.location.href = '/admin';
        });
        headerControls.appendChild(setupBtn);
        console.log('✅ Added Setup button');
        
        // Add Clear Chat button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-chat-btn';
        clearBtn.innerHTML = '🗑️ Clear';
        clearBtn.title = 'Clear conversation history';
        clearBtn.addEventListener('click', () => this.clearChat());
        headerControls.appendChild(clearBtn);
        console.log('✅ Added Clear button');
        
        // Add Theme Toggle button
        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙 Dark';
        themeToggle.title = 'Toggle dark/light mode';
        themeToggle.addEventListener('click', () => this.toggleTheme());
        headerControls.appendChild(themeToggle);
        console.log('✅ Added Theme toggle');
        
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
        console.log('✅ Added Language selector');
        
        // Find where to insert
        const statusIndicator = header.querySelector('.status-indicator');
        console.log('🔍 Status indicator found:', !!statusIndicator);
        
        if (statusIndicator) {
            header.insertBefore(headerControls, statusIndicator);
            console.log('✅ Inserted controls before status indicator');
        } else {
            header.appendChild(headerControls);
            console.log('✅ Appended controls to header');
        }
        
        // Force visibility
        headerControls.style.display = 'flex';
        headerControls.style.alignItems = 'center';
        headerControls.style.gap = '8px';
        headerControls.style.marginLeft = 'auto';
        headerControls.style.visibility = 'visible';
        headerControls.style.opacity = '1';
        
        console.log('✅ Header controls created successfully!');
    }

    // Emergency header creation if no header exists
    createEmergencyHeader() {
        console.log('🚨 Creating emergency header...');
        const emergencyHeader = document.createElement('div');
        emergencyHeader.className = 'emergency-header-controls';
        emergencyHeader.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 8px;
        `;
        
        // Add Setup button
        const setupBtn = document.createElement('button');
        setupBtn.textContent = '⚙️ Setup';
        setupBtn.style.cssText = 'padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;';
        setupBtn.addEventListener('click', () => window.location.href = '/admin');
        emergencyHeader.appendChild(setupBtn);
        
        // Add Clear button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ Clear';
        clearBtn.style.cssText = 'padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;';
        clearBtn.addEventListener('click', () => this.clearChat());
        emergencyHeader.appendChild(clearBtn);
        
        document.body.appendChild(emergencyHeader);
        console.log('✅ Emergency header created');
    }

    createSetupButton() {
        const setupBtn = document.createElement('button');
        setupBtn.className = 'setup-btn';
        setupBtn.innerHTML = '⚙️ Setup';
        setupBtn.title = 'Configure your property information';
        setupBtn.addEventListener('click', () => {
            window.location.href = '/admin';
        });
        return setupBtn;
    }

    // REMOVED: createRecommendationsButton() - Users shouldn't manage recommendations

    createClearButton() {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-chat-btn';
        clearBtn.innerHTML = '🗑️ Clear';
        clearBtn.title = 'Clear conversation history';
        clearBtn.addEventListener('click', () => this.clearChat());
        return clearBtn;
    }

    createThemeToggle() {
        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙 Dark';
        themeToggle.title = 'Toggle dark/light mode';
        themeToggle.addEventListener('click', () => this.toggleTheme());
        return themeToggle;
    }

    createLanguageSelector() {
        // Create language selector
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

        return langSelect;
    }

    // Recommendations Modal - KEPT for potential admin use, but not accessible from user interface
    showRecommendationsModal() {
        // Create modal for managing recommendations
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Manage Local Recommendations</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="add-recommendation-form">
                        <h4>Add New Recommendation</h4>
                        <div class="form-group">
                            <input type="text" id="rec-name" placeholder="Place Name *" class="form-input">
                        </div>
                        <div class="form-group">
                            <select id="rec-category" class="form-select">
                                <option value="Restaurant">Restaurant</option>
                                <option value="Cafe">Cafe</option>
                                <option value="Bar">Bar</option>
                                <option value="Beach">Beach</option>
                                <option value="Park">Park</option>
                                <option value="Attraction">Attraction</option>
                                <option value="Shop">Shop</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <textarea id="rec-description" placeholder="Description" class="form-textarea"></textarea>
                        </div>
                        <div class="form-group">
                            <input type="text" id="rec-notes" placeholder="Special notes or tips" class="form-input">
                        </div>
                        <button class="add-rec-btn">Add Recommendation</button>
                    </div>
                    
                    <div class="recommendations-list">
                        <h4>Current Recommendations</h4>
                        <div id="current-recommendations"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.updateRecommendationsList();

        // Event listeners for modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.add-rec-btn').addEventListener('click', () => {
            this.addRecommendationFromModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    updateRecommendationsList() {
        const container = document.getElementById('current-recommendations');
        if (!container) return;

        if (this.hostRecommendations.length === 0) {
            container.innerHTML = '<p class="no-recommendations">No recommendations yet. Add some above!</p>';
            return;
        }

        container.innerHTML = '';
        this.hostRecommendations.forEach((place, index) => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="place-info">
                    <strong>${place.name}</strong> <span class="category">(${place.category})</span>
                    ${place.description ? `<p>${place.description}</p>` : ''}
                    ${place.notes ? `<p class="notes">💡 ${place.notes}</p>` : ''}
                </div>
                <button class="remove-rec-btn" data-index="${index}">Remove</button>
            `;
            container.appendChild(item);
        });

        // Add remove event listeners
        container.querySelectorAll('.remove-rec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeRecommendation(index);
            });
        });
    }

    addRecommendationFromModal() {
        const name = document.getElementById('rec-name').value.trim();
        const category = document.getElementById('rec-category').value;
        const description = document.getElementById('rec-description').value.trim();
        const notes = document.getElementById('rec-notes').value.trim();

        if (!name) {
            this.showTempMessage('Please enter a place name', 'error');
            return;
        }

        const newPlace = {
            name,
            category,
            description,
            notes
        };

        this.hostRecommendations.push(newPlace);
        this.saveRecommendations();
        this.updateRecommendationsList();

        // Clear form
        document.getElementById('rec-name').value = '';
        document.getElementById('rec-description').value = '';
        document.getElementById('rec-notes').value = '';

        this.showTempMessage('Recommendation added successfully!', 'success');
    }

    removeRecommendation(index) {
        if (confirm('Are you sure you want to remove this recommendation?')) {
            this.hostRecommendations.splice(index, 1);
            this.saveRecommendations();
            this.updateRecommendationsList();
            this.showTempMessage('Recommendation removed', 'info');
        }
    }

    // LANGUAGE SUPPORT METHODS
    changeLanguage(langCode) {
        this.saveLanguagePreference(langCode);
        this.updateUIForLanguage(langCode);
        this.showTempMessage(`Language changed to ${this.getLanguageName(langCode)}`, 'info');
    }

    updateUIForLanguage(langCode) {
        // Update placeholder text based on language
        const messageInput = document.getElementById('messageInput');
        const placeholders = {
            en: "Ask about your stay, local recommendations, or appliance instructions...",
            es: "Pregunte sobre su estadía, recomendaciones locales o instrucciones de electrodomésticos...",
            fr: "Demandez des informations sur votre séjour, des recommandations locales ou des instructions pour les appareils..."
        };
        if (messageInput) {
            messageInput.placeholder = placeholders[langCode] || placeholders.en;
        }

        // Update quick question buttons
        this.updateQuickQuestions(langCode);
    }

    updateQuickQuestions(langCode) {
        const quickQuestions = {
            en: {
                checkin: "Check-in/out times",
                wifi: "WiFi Information", 
                restaurants: "Nearby Restaurants",
                emergency: "Emergency Contacts",
                // ADDED: Appliance questions
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
                // ADDED: Appliance questions in Spanish
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
                // ADDED: Appliance questions in French
                applianceHelp: "🛠️ Aide aux Appareils",
                ovenHelp: "🍳 Four/Micro-ondes",
                washerHelp: "🧺 Lave-linge/Sèche-linge",
                thermostatHelp: "🌡️ Thermostat"
            }
        };

        const questions = quickQuestions[langCode] || quickQuestions.en;
        
        // Update existing quick question buttons
        const buttons = document.querySelectorAll('.quick-btn');
        if (buttons.length >= 4) {
            buttons[0].textContent = questions.checkin;
            buttons[1].textContent = questions.wifi;
            buttons[2].textContent = questions.restaurants;
            buttons[3].textContent = questions.emergency;
        }
        
        // Update appliance quick question buttons
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

    // UPDATED: sendMessage method with FAQ tracking and knowledge base check
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
                return; // Skip AI API call
            }
            
            // Get FRESH host configuration every time
            const hostConfig = this.getHostConfig();
            
            // Prepare system messages with recommendations AND appliances for relevant queries
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

            // DEBUG: Log what we're sending to the backend
            console.log('🔄 Sending to AI:', {
                message: message,
                language: currentLanguage,
                hostConfig: hostConfig,
                hasRecommendations: this.hostRecommendations.length,
                hasAppliances: this.hostAppliances.length,
                hasSystemMessage: !!systemMessage,
                checkedFAQ: true
            });

            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
                
                // Auto-learn from successful AI answers for frequently asked questions
                FAQTracker.autoLearnFromAnswer(message, data.response);
                
                // Show notification if using custom config
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
        // ADDED: Trash/Garbage formatting
        formatted = formatted.replace(/Trash:/g, '<strong>🗑️ Trash:</strong>');
        formatted = formatted.replace(/Garbage:/g, '<strong>🗑️ Garbage:</strong>');
        // ADDED: Appliance formatting
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

// ADDED: FAQ Manager shortcut
function openFAQManager() {
    window.open('/faq-manage.html', '_blank');
}

// ADDED: Test FAQ matching
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
        
        // Add FAQ Manager button to header controls if needed
        setTimeout(() => {
            const headerControls = document.querySelector('.header-controls');
            if (headerControls) {
                const faqBtn = document.createElement('button');
                faqBtn.className = 'setup-btn';
                faqBtn.innerHTML = '🧠 FAQ Manager';
                faqBtn.title = 'Manage FAQ auto-learning';
                faqBtn.addEventListener('click', openFAQManager);
                headerControls.appendChild(faqBtn);
                console.log('✅ FAQ Manager button added to header');
            }
        }, 1000);
        
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
