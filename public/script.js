// ================================================
// MAIN CHAT CLASS - SIMPLIFIED VERSION
// ================================================

class RentalAIChat {
    constructor() {
    console.log('🔄 Chat Initialized - CLEARING CACHE');
    
    // Clear any cached data
    this.hostConfig = null;
    this.hostRecommendations = [];
    this.hostAppliances = [];
        
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        this.themeKey = 'rental_ai_theme';
        this.languageKey = 'rental_ai_language';
        this.recommendationsKey = 'rental_ai_recommendations';
        this.appliancesKey = 'rental_ai_appliances';
        
        // Always load from rentalAIPropertyConfig
        this.hostConfig = null;
        this.hostRecommendations = [];
        this.hostAppliances = [];
        
        console.log('🔍 Step 1: Loading property data from rentalAIPropertyConfig...');
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

  // In script.js - Update loadAllPropertyData to clear cache
loadAllPropertyData() {
    console.log('=== CLEARING CACHE AND LOADING PROPERTY DATA ===');
    
    // Clear all cached data to prevent stale data
    this.hostConfig = null;
    this.hostRecommendations = [];
    this.hostAppliances = [];
    
    // Force reload from localStorage
    this.loadPropertyConfig();
    this.loadRecommendations();
    this.loadAppliances();
    
    console.log('=== PROPERTY DATA LOADED ===');
    console.log('Host Config:', this.hostConfig?.name || 'None');
    console.log('Recommendations:', this.hostRecommendations?.length || 0);
    console.log('Appliances:', this.hostAppliances?.length || 0);
    
    // Update quick questions based on current data
    this.setupQuickQuestionButtons();
    
    // Update UI with current property info
    this.updateUIWithPropertyInfo();
}

// Add this new method to update UI
updateUIWithPropertyInfo() {
    if (!this.hostConfig) return;
    
    const headerText = document.querySelector('.header-text h2');
    const headerSubtext = document.querySelector('.header-text p');
    
    if (headerText && this.hostConfig.name) {
        headerText.textContent = `Rental AI Assistant - ${this.hostConfig.name}`;
    }
    
    if (headerSubtext && this.hostConfig.name) {
        headerSubtext.textContent = `${this.hostConfig.name} • 24/7 Support`;
    }
}

// Update loadPropertyConfig to use updateUIWithPropertyInfo
loadPropertyConfig() {
    try {
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        if (savedConfig) {
            this.hostConfig = JSON.parse(savedConfig);
            console.log(`✅ Loaded config for: ${this.hostConfig.name}`);
            
            // Update UI
            this.updateUIWithPropertyInfo();
        } else {
            console.log('🏠 No configuration found - using default');
            this.hostConfig = null;
        }
    } catch (error) {
        console.error('Error loading property config:', error);
        this.hostConfig = null;
    }
}

    // Load recommendations from rental_ai_recommendations
    loadRecommendations() {
        try {
            // Always clear first
            this.hostRecommendations = [];
            
            const saved = localStorage.getItem(this.recommendationsKey);
            if (saved) {
                this.hostRecommendations = JSON.parse(saved);
                console.log(`📚 Loaded ${this.hostRecommendations.length} recommendations`);
            } else {
                // Also check if recommendations are stored in the config
                if (this.hostConfig && this.hostConfig.recommendations) {
                    this.hostRecommendations = this.hostConfig.recommendations;
                    console.log(`📚 Loaded ${this.hostRecommendations.length} recommendations from config`);
                }
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.hostRecommendations = [];
        }
    }

    // Load appliances from rental_ai_appliances
    loadAppliances() {
        try {
            // Always clear first
            this.hostAppliances = [];
            
            const saved = localStorage.getItem(this.appliancesKey);
            if (saved) {
                this.hostAppliances = JSON.parse(saved);
                console.log(`🛠️ Loaded ${this.hostAppliances.length} appliances`);
            } else {
                // Also check if appliances are stored in the config
                if (this.hostConfig && this.hostConfig.appliances) {
                    this.hostAppliances = this.hostConfig.appliances;
                    console.log(`🛠️ Loaded ${this.hostAppliances.length} appliances from config`);
                }
            }
        } catch (error) {
            console.error('Error loading appliances:', error);
            this.hostAppliances = [];
        }
    }

   // In script.js - Update the getHostConfig method
getHostConfig() {
    try {
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        if (!savedConfig) return null;
        
        const config = JSON.parse(savedConfig);
        
        // Ensure consistent contact structure
        return {
            name: config.name || '',
            address: config.address || '',
            type: config.type || '',
            
            // Standardize contact information
            hostContact: config.hostContact || config.contact || '',
            maintenanceContact: config.maintenanceContact || '',
            emergencyContact: config.maintenanceContact || config.hostContact || config.contact || '',
            
            // Check-in/out
            checkinTime: config.checkinTime || config.checkInTime || '3:00 PM',
            checkoutTime: config.checkoutTime || config.checkOutTime || '11:00 AM',
            lateCheckout: config.lateCheckout || '',
            
            // Amenities
            amenities: {
                wifi: config.amenities?.wifi || config.wifiDetails || '',
                parking: config.amenities?.parking || '',
                other: config.amenities?.other || config.amenities || ''
            },
            
            // Rules
            houseRules: config.houseRules || '',
            
            // Appliances
            appliances: config.appliances || [],
            hasAppliances: (config.appliances && config.appliances.length > 0) || config.hasAppliances || false,
            
            // Metadata
            lastUpdated: config.lastUpdated || new Date().toISOString(),
            
            // Recommendations
            hasRecommendations: (config.recommendations && config.recommendations.length > 0) || config.hasRecommendations || false,
            
            // Backward compatibility
            contact: config.hostContact || config.contact || '',
            checkInOut: {
                checkIn: config.checkinTime || config.checkInTime || '3:00 PM',
                checkOut: config.checkoutTime || config.checkOutTime || '11:00 AM'
            }
        };
    } catch (error) {
        console.error('Error getting host config:', error);
        return null;
    }
}

    getRecommendationsText() {
        if (!this.hostRecommendations || this.hostRecommendations.length === 0) {
            console.log('⚠️ No recommendations to send to AI');
            return "";
        }
        
        let text = "HOST RECOMMENDATIONS FOR THIS PROPERTY:\n\n";
        this.hostRecommendations.forEach((place, index) => {
            text += `${index + 1}. ${place.name} (${place.category})\n`;
            if (place.description) text += `   ${place.description}\n`;
            if (place.notes) text += `   Note: ${place.notes}\n`;
            text += "\n";
        });
        
        console.log('📤 Recommendations being sent to AI:', this.hostRecommendations.length);
        return text;
    }

    getAppliancesText() {
        if (!this.hostAppliances || this.hostAppliances.length === 0) {
            return "";
        }
        
        let text = "HOST APPLIANCES FOR THIS PROPERTY:\n\n";
        this.hostAppliances.forEach(appliance => {
            text += `${appliance.name} (${appliance.type})\n`;
            if (appliance.instructions) text += `Instructions: ${appliance.instructions}\n`;
            if (appliance.troubleshooting) text += `Troubleshooting: ${appliance.troubleshooting}\n`;
            text += "\n";
        });
        return text;
    }

    initializeEventListeners() {
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
    }

    setupQuickQuestionButtons() {
        const quickQuestionsContainer = document.querySelector('.quick-questions');
        if (!quickQuestionsContainer) return;

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
    }

  // In script.js - Update the askApplianceQuestion method
askApplianceQuestion(question) {
    // Reload property data FIRST
    this.loadAllPropertyData();
    
    const messageInput = document.getElementById('messageInput');
    messageInput.value = question;
    document.getElementById('sendButton').disabled = false;
    
    // Add a small delay to ensure data is loaded
    setTimeout(() => {
        this.sendMessage();
    }, 100);
}

// Also update the setupQuickQuestionButtons to reload data:
setupQuickQuestionButtons() {
    const quickQuestionsContainer = document.querySelector('.quick-questions');
    if (!quickQuestionsContainer) return;

    const existingApplianceSection = quickQuestionsContainer.querySelector('.quick-appliance-section');
    if (existingApplianceSection) {
        existingApplianceSection.remove();
    }

    // Only show appliance section if we have appliances
    if (this.hostAppliances && this.hostAppliances.length > 0) {
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
    }
}

    createHeaderControls() {
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
        
        // Setup button
        const setupBtn = document.createElement('button');
        setupBtn.className = 'setup-btn';
        setupBtn.innerHTML = '⚙️ Setup';
        setupBtn.title = 'Configure your property information';
        setupBtn.addEventListener('click', () => window.location.href = '/admin');
        headerControls.appendChild(setupBtn);
        
        // Clear button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-chat-btn';
        clearBtn.innerHTML = '🗑️ Clear';
        clearBtn.title = 'Clear conversation history';
        clearBtn.addEventListener('click', () => this.clearChat());
        headerControls.appendChild(clearBtn);
        
        // Theme toggle
        const themeToggle = document.createElement('button');
        themeToggle.id = 'themeToggle';
        themeToggle.className = 'theme-toggle';
        themeToggle.innerHTML = '🌙 Dark';
        themeToggle.title = 'Toggle dark/light mode';
        themeToggle.addEventListener('click', () => this.toggleTheme());
        headerControls.appendChild(themeToggle);
        
        // Language selector
        const langSelect = document.createElement('select');
        langSelect.id = 'languageSelect';
        langSelect.className = 'language-select';
        langSelect.title = 'Select language';
        
        const languages = [
            { code: 'en', name: '🇺🇸 English' },
            { code: 'es', name: '🇪🇸 Español' },
            { code: 'fr', name: '🇫🇷 Français' }
        ];
        
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            langSelect.appendChild(option);
        });
        
        langSelect.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
        headerControls.appendChild(langSelect);
        
        // RELOAD button
        const reloadBtn = document.createElement('button');
        reloadBtn.className = 'setup-btn';
        reloadBtn.innerHTML = '🔄 Reload';
        reloadBtn.title = 'Reload property data';
        reloadBtn.addEventListener('click', () => {
            console.log('🔄 Manually reloading property data...');
            this.loadAllPropertyData();
            alert('Property data reloaded!');
        });
        headerControls.appendChild(reloadBtn);
        
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
    }

    // LANGUAGE SUPPORT
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

    // THEME MANAGEMENT
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

    // CHAT HISTORY
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

    // SEND MESSAGE - SIMPLIFIED
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        // Track question for FAQ learning
        FAQTracker.trackQuestion(message);
        
        messageInput.value = '';
        this.updateCharCount();
        document.getElementById('sendButton').disabled = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            const currentLanguage = this.getCurrentLanguage();
            
            // Check FAQ first
            const faqAnswer = FAQTracker.findAnswer(message);
            if (faqAnswer) {
                this.hideTypingIndicator();
                this.addMessage(faqAnswer, 'bot');
                return;
            }
            
            // Reload data for this message
            this.loadAllPropertyData();
            
            const hostConfig = this.getHostConfig();
            
            let systemMessage = '';
            
            const localKeywords = ['restaurant', 'food', 'eat', 'cafe', 'bar', 'beach', 'park', 'attraction', 'nearby', 'local', 'recommend'];
            const applianceKeywords = ['appliance', 'oven', 'microwave', 'stove', 'washer', 'dryer', 'laundry', 'fridge', 'thermostat'];
            
            if (anyKeywordInMessage(message, localKeywords) && this.hostRecommendations.length > 0) {
                systemMessage += `IMPORTANT: Use these specific recommendations for ${hostConfig?.name || 'this property'}:\n\n${this.getRecommendationsText()}`;
            }
            
            if (anyKeywordInMessage(message, applianceKeywords) && this.hostAppliances.length > 0) {
                if (systemMessage) systemMessage += "\n\n";
                systemMessage += `APPLIANCE INSTRUCTIONS:\n\n${this.getAppliancesText()}`;
            }
            
            // If asking about WiFi, include it specifically
            if (message.toLowerCase().includes('wifi') && hostConfig?.amenities?.wifi) {
                if (systemMessage) systemMessage += "\n\n";
                systemMessage += `WIFI INFORMATION:\nNetwork: ${hostConfig.amenities.wifi}`;
            }

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
                console.log('AI Response - Using config:', data.usingCustomConfig || false);
                
                FAQTracker.autoLearnFromAnswer(message, data.response);
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

// Helper function
function anyKeywordInMessage(message, keywords) {
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
}

// Quick question function
function askQuestion(question) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = question;
    document.getElementById('sendButton').disabled = false;
    
    const chat = window.chat || new RentalAIChat();
    chat.sendMessage();
}

// Initialize chat
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
        `;
        document.head.appendChild(style);
        
    } catch (error) {
        console.error('❌ Error initializing RentalAIChat:', error);
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

// FAQ TRACKER (keep this as it's independent of property management)
const FAQTracker = {
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
    
    showNotificationIfNeeded(count) {
        console.log(`💡 ${count} frequent questions need review. Visit /faq-manage.html`);
    },
    
    getKnowledgeBase() {
        return JSON.parse(localStorage.getItem('rental_ai_knowledge_base') || '[]');
    },
    
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
    
    findAnswer(question) {
        const knowledgeBase = this.getKnowledgeBase();
        if (knowledgeBase.length === 0) return null;
        
        const q = question.toLowerCase().trim();
        console.log('🔍 FAQ Search for:', q);
        
        const synonymGroups = {
            'trash': ['trash', 'garbage', 'rubbish', 'waste', 'refuse', 'litter', 'throw away', 'dispose', 'bin', 'dump', 'bags', 'full bags', 'garbage bags', 'trash bags', 'where does', 'where do', 'where to', 'disposal', 'dumpster', 'take out', 'put out'],
            'beach': ['beach', 'playa', 'shore', 'coast', 'seaside', 'ocean', 'sand', 'waves'],
            'restaurant': ['restaurant', 'food', 'eat', 'dining', 'meal', 'cafe', 'bar', 'bistro'],
            'wifi': ['wifi', 'internet', 'wireless', 'network', 'connection', 'online', 'web'],
            'parking': ['parking', 'car', 'vehicle', 'park', 'spot', 'garage'],
        };
        
        const questionPatterns = [
            { pattern: /^(what is|what's) (the|a|an)?/i, replace: '' },
            { pattern: /^(how do i|how to|how can i)/i, replace: '' },
            { pattern: /^(where is|where are|where can i|where should i|where do i)/i, replace: '' },
            { pattern: /^(when is|when are|when can i)/i, replace: '' },
            { pattern: /^(do you have|is there|are there)/i, replace: '' },
            { pattern: /^(can i|may i|could i)/i, replace: '' },
            { pattern: /[?,.!]/g, replace: '' },
            { pattern: /\s+/g, replace: ' ' }
        ];
        
        let normalizedQ = q;
        questionPatterns.forEach(pattern => {
            normalizedQ = normalizedQ.replace(pattern.pattern, pattern.replace);
        });
        normalizedQ = normalizedQ.trim();
        
        const scoredEntries = knowledgeBase.map(entry => {
            const entryQ = entry.question.toLowerCase().trim();
            let normalizedEntryQ = entryQ;
            
            questionPatterns.forEach(pattern => {
                normalizedEntryQ = normalizedEntryQ.replace(pattern.pattern, pattern.replace);
            });
            normalizedEntryQ = normalizedEntryQ.trim();
            
            let score = 0;
            
            if (normalizedQ === normalizedEntryQ) {
                score = 100;
            } else if (q === entryQ) {
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
            }
            
            score = Math.max(0, Math.min(100, Math.round(score)));
            
            return { entry, score, normalizedEntryQ };
        });
        
        scoredEntries.sort((a, b) => b.score - a.score);
        
        let threshold = 70;
        const applianceKeywords = ['oven', 'microwave', 'washer', 'dryer', 'laundry', 'fridge', 'thermostat', 'tv'];
        const isApplianceQuestion = applianceKeywords.some(keyword => q.includes(keyword));
        
        if (isApplianceQuestion) {
            threshold = 80;
        }
        
        const bestMatch = scoredEntries[0];
        
        if (bestMatch && bestMatch.score >= threshold) {
            bestMatch.entry.uses = (bestMatch.entry.uses || 0) + 1;
            bestMatch.entry.lastUsed = new Date().toISOString();
            localStorage.setItem('rental_ai_knowledge_base', JSON.stringify(knowledgeBase));
            return bestMatch.entry.answer;
        }
        
        return null;
    },
    
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
        });
        
        return expandedSet;
    },
    
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
            }
            
        } catch (error) {
            console.error('Error in auto-learn:', error);
        }
    }
};
