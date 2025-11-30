class RentalAIChat {
    constructor() {
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        this.themeKey = 'rental_ai_theme';
        this.languageKey = 'rental_ai_language';
        this.recommendationsKey = 'rental_ai_recommendations';
        
        console.log('🔄 Chat Initialized - localStorage:', !!window.localStorage);
        
        this.initializeCoreFeatures();
        this.createHeaderControls();
        this.loadAllPreferences();
        
        // Set up configuration monitoring
        this.setupConfigMonitoring();
    }

    // CORE INITIALIZATION
    initializeCoreFeatures() {
        this.loadPropertyConfig();
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
        console.log('✅ Core features initialized');
    }

    loadAllPreferences() {
        this.loadThemePreference();
        this.loadLanguagePreference();
        this.loadRecommendations();
        console.log('✅ All preferences loaded');
    }

    // CONFIGURATION MONITORING
    setupConfigMonitoring() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'rentalAIPropertyConfig' || e.key === 'rental_ai_recommendations') {
                console.log('🔄 Configuration updated remotely, refreshing...');
                this.refreshPropertyConfig();
                this.showTempMessage('Configuration updated!', 'success');
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshPropertyConfig();
            }
        });

        setInterval(() => {
            this.refreshPropertyConfig();
        }, 30000);
    }

    // HOST CONFIGURATION METHODS
    loadPropertyConfig() {
        try {
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            if (savedConfig) {
                const hostConfig = JSON.parse(savedConfig);
                this.hostConfig = hostConfig;
                this.updateUIWithPropertyData(hostConfig);
                console.log('🏠 Host configuration loaded:', hostConfig.name);
            } else {
                this.hostConfig = null;
                this.showConfigWarning();
                console.log('🏠 No host configuration found');
            }
        } catch (error) {
            console.error('❌ Error loading property config:', error);
            this.hostConfig = null;
            this.showConfigWarning();
        }
    }

    updateUIWithPropertyData(hostConfig) {
        const headerText = document.querySelector('.header-text h2');
        const headerSubtext = document.querySelector('.header-text p');
        const welcomePropertyName = document.getElementById('welcomePropertyName');
        
        if (headerText && hostConfig.name) {
            headerText.textContent = `Rental AI Assistant - ${hostConfig.name}`;
        }
        
        if (headerSubtext && hostConfig.name) {
            headerSubtext.textContent = `${hostConfig.name} • 24/7 Support`;
        }

        if (welcomePropertyName && hostConfig.name) {
            welcomePropertyName.textContent = hostConfig.name;
        }
        
        document.title = `Rental AI Assistant - ${hostConfig.name}`;
        this.hideConfigWarning();
    }

    showConfigWarning() {
        let warning = document.getElementById('configWarning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'configWarning';
            warning.className = 'config-warning';
            warning.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Property not configured. 
                <a href="admin.html" onclick="window.chat.openAdminPanel(); return false;">
                    Set up your property details
                </a> to enable the AI assistant.
            `;
            const chatContainer = document.querySelector('.chat-container');
            const chatMessages = document.querySelector('.chat-messages');
            if (chatContainer && chatMessages) {
                chatContainer.insertBefore(warning, chatMessages);
            }
        }
        warning.style.display = 'block';
    }

    hideConfigWarning() {
        const warning = document.getElementById('configWarning');
        if (warning) {
            warning.style.display = 'none';
        }
    }

    refreshPropertyConfig() {
        const oldName = this.hostConfig?.name;
        this.loadPropertyConfig();
        this.loadRecommendations();
        
        if (this.hostConfig?.name !== oldName) {
            console.log('🔄 Property config refreshed:', this.hostConfig?.name);
        }
    }

    getHostConfig() {
        try {
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            return savedConfig ? JSON.parse(savedConfig) : null;
        } catch (error) {
            console.error('❌ Error getting host config:', error);
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
            console.error('❌ Error loading recommendations:', error);
            this.hostRecommendations = [];
        }
    }

    saveRecommendations() {
        try {
            localStorage.setItem(this.recommendationsKey, JSON.stringify(this.hostRecommendations));
        } catch (error) {
            console.error('❌ Error saving recommendations:', error);
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

    // EVENT LISTENERS
    initializeEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        if (!messageInput || !sendButton) {
            console.error('❌ Required DOM elements not found');
            return;
        }

        sendButton.addEventListener('click', () => this.sendMessage());

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        messageInput.addEventListener('input', () => {
            this.updateCharCount();
            sendButton.disabled = messageInput.value.trim().length === 0;
        });

        messageInput.addEventListener('input', this.autoResizeTextarea.bind(this));

        console.log('✅ Event listeners initialized');
    }

    autoResizeTextarea() {
        const messageInput = document.getElementById('messageInput');
        if (messageInput.tagName === 'TEXTAREA') {
            messageInput.style.height = 'auto';
            messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
        }
    }

    // HEADER CONTROLS - FIXED WITH ERROR HANDLING
    createHeaderControls() {
        console.log('🔧 Creating header controls...');
        
        const header = document.querySelector('.chat-header');
        if (!header) {
            console.error('❌ chat-header element not found!');
            return;
        }

        // Remove any existing header controls to avoid duplicates
        const existingControls = document.querySelector('.header-controls');
        if (existingControls) {
            existingControls.remove();
        }

        const headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        
        // ONLY THESE 5 CONTROLS - NO RECOMMENDATIONS BUTTON
        const controls = [
            this.createControlButton('admin', '⚙️', 'Property settings', () => this.openAdminPanel()),
            this.createControlButton('refresh', '🔄', 'Refresh configuration', () => this.refreshPropertyConfig()),
            this.createControlButton('clear', '🗑️', 'Clear chat', () => this.clearChat()),
            this.createThemeToggle(),
            this.createLanguageSelector()
        ];
        
        controls.forEach(control => {
            if (control) headerControls.appendChild(control);
        });
        
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator && statusIndicator.parentNode === header) {
            header.insertBefore(headerControls, statusIndicator);
            console.log('✅ Header controls inserted before status indicator');
        } else {
            header.appendChild(headerControls);
            console.log('✅ Header controls appended to header');
        }
        
        console.log('✅ Header controls created successfully');
    }

    createControlButton(type, icon, title, onClick) {
        try {
            const button = document.createElement('button');
            button.className = `header-btn header-btn-${type}`;
            button.innerHTML = icon;
            button.title = title;
            button.addEventListener('click', onClick);
            return button;
        } catch (error) {
            console.error('❌ Error creating control button:', error);
            return null;
        }
    }

    createThemeToggle() {
        return this.createControlButton('theme', '🌙', 'Toggle dark/light mode', () => this.toggleTheme());
    }

    createLanguageSelector() {
        try {
            const select = document.createElement('select');
            select.className = 'language-select';
            select.title = 'Select language';
            
            const languages = [
                { code: 'en', name: '🇺🇸 English' },
                { code: 'es', name: '🇪🇸 Español' },
                { code: 'fr', name: '🇫🇷 Français' },
                { code: 'de', name: '🇩🇪 Deutsch' },
                { code: 'it', name: '🇮🇹 Italiano' }
            ];
            
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.name;
                select.appendChild(option);
            });
            
            select.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });

            return select;
        } catch (error) {
            console.error('❌ Error creating language selector:', error);
            return null;
        }
    }

    openAdminPanel() {
        window.open('admin.html', '_blank', 'width=800,height=900');
    }

    // LANGUAGE SUPPORT
    changeLanguage(langCode) {
        this.saveLanguagePreference(langCode);
        this.updateUIForLanguage(langCode);
        this.showTempMessage(`Language changed to ${this.getLanguageName(langCode)}`, 'success');
    }

    updateUIForLanguage(langCode) {
        const messageInput = document.getElementById('messageInput');
        const placeholders = {
            en: "Ask about your stay, local recommendations, or property details...",
            es: "Pregunte sobre su estadía, recomendaciones locales o detalles de la propiedad...",
            fr: "Demandez des informations sur votre séjour, des recommandations locales ou des détails sur la propriété...",
            de: "Fragen Sie nach Ihrem Aufenthalt, lokalen Empfehlungen oder Eigentumsdetails...",
            it: "Chiedi informazioni sul tuo soggiorno, raccomandazioni locali o dettagli sulla proprietà..."
        };
        
        if (messageInput) {
            messageInput.placeholder = placeholders[langCode] || placeholders.en;
        }
    }

    getLanguageName(langCode) {
        const languages = {
            en: 'English',
            es: 'Español', 
            fr: 'Français',
            de: 'Deutsch',
            it: 'Italiano'
        };
        return languages[langCode] || 'English';
    }

    loadLanguagePreference() {
        try {
            const savedLang = localStorage.getItem(this.languageKey) || 'en';
            const langSelect = document.querySelector('.language-select');
            if (langSelect) {
                langSelect.value = savedLang;
            }
            this.updateUIForLanguage(savedLang);
        } catch (error) {
            console.error('❌ Error loading language preference:', error);
        }
    }

    saveLanguagePreference(langCode) {
        try {
            localStorage.setItem(this.languageKey, langCode);
        } catch (error) {
            console.error('❌ Error saving language preference:', error);
        }
    }

    getCurrentLanguage() {
        const langSelect = document.querySelector('.language-select');
        return langSelect ? langSelect.value : 'en';
    }

    // THEME MANAGEMENT
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        this.updateThemeButton(newTheme);
        this.saveThemePreference(newTheme);
        
        const themeBtn = document.querySelector('.header-btn-theme');
        if (themeBtn) {
            themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
            themeBtn.title = `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`;
        }
    }

    updateThemeButton(theme) {
        const themeBtn = document.querySelector('.header-btn-theme');
        if (themeBtn) {
            themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    loadThemePreference() {
        try {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const savedTheme = localStorage.getItem(this.themeKey);
            const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
            
            document.documentElement.setAttribute('data-theme', theme);
            this.updateThemeButton(theme);
        } catch (error) {
            console.error('❌ Error loading theme preference:', error);
        }
    }

    saveThemePreference(theme) {
        try {
            localStorage.setItem(this.themeKey, theme);
        } catch (error) {
            console.error('❌ Error saving theme preference:', error);
        }
    }

    // CHAT MESSAGING
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        messageInput.value = '';
        this.updateCharCount();
        document.getElementById('sendButton').disabled = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            const response = await this.sendToAI(message);
            this.handleAIResponse(response);
        } catch (error) {
            this.handleAIError(error);
        } finally {
            this.hideTypingIndicator();
        }
    }

    async sendToAI(message) {
        const hostConfig = this.getHostConfig();
        const currentLanguage = this.getCurrentLanguage();
        
        const systemMessage = this.prepareSystemContext(message, hostConfig);

        console.log('🔄 Sending to AI:', {
            message,
            language: currentLanguage,
            hasHostConfig: !!hostConfig,
            recommendationsCount: this.hostRecommendations.length
        });

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
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    prepareSystemContext(message, hostConfig) {
        if (!hostConfig) {
            return "You are a rental AI assistant. The property configuration is not yet set up. Please guide users to configure their property.";
        }

        let systemMessage = `You are a rental AI assistant for ${hostConfig.name}. `;
        
        const localKeywords = ['restaurant', 'food', 'eat', 'cafe', 'bar', 'beach', 'park', 'attraction', 'nearby', 'local', 'recommend'];
        const isLocalQuery = localKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        if (isLocalQuery && this.hostRecommendations.length > 0) {
            systemMessage += `\n\nHOST RECOMMENDATIONS:\n${this.getRecommendationsText()}`;
        }

        return systemMessage;
    }

    handleAIResponse(data) {
        if (data.success) {
            this.addMessage(data.response, 'bot');
            console.log('✅ AI Response received');
        } else {
            throw new Error(data.error || 'Unknown error from AI');
        }
    }

    handleAIError(error) {
        console.error('❌ AI Request failed:', error);
        
        const errorMessage = this.getErrorMessage(error);
        this.addMessage(errorMessage, 'bot');
        
        this.showTempMessage('Connection issue - please try again', 'error');
    }

    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return "I'm having trouble connecting to the server. Please check your internet connection and try again.";
        } else if (error.message.includes('HTTP error')) {
            return "The server is temporarily unavailable. Please try again in a few moments.";
        } else {
            return "I'm experiencing some technical difficulties. Please try again shortly.";
        }
    }

    // MESSAGE DISPLAY
    addMessage(content, sender, isRestored = false) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

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
            messageContent.innerHTML = this.formatBotResponse(content);
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (!isRestored) {
            this.saveChatHistory();
        }
    }

    formatBotResponse(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/(\d+)\.\s/g, '<strong>$1.</strong> ')
            .replace(/Emergency:/g, '<strong>🚨 Emergency:</strong>')
            .replace(/Contact:/g, '<strong>📞 Contact:</strong>')
            .replace(/Address:/g, '<strong>📍 Address:</strong>')
            .replace(/Check-in:/g, '<strong>🕒 Check-in:</strong>')
            .replace(/Check-out:/g, '<strong>🕒 Check-out:</strong>')
            .replace(/WiFi:/g, '<strong>📶 WiFi:</strong>');
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
            
            this.showTempMessage('Chat history cleared', 'success');
        }
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
            console.error('❌ Error saving chat history:', error);
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
            }
        } catch (error) {
            console.error('❌ Error loading chat history:', error);
        }
    }

    // UTILITY METHODS
    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        if (!messageInput || !charCount) return;

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

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'flex';
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    showTempMessage(text, type = 'info') {
        document.querySelectorAll('.temp-message').forEach(msg => msg.remove());

        const tempMsg = document.createElement('div');
        tempMsg.className = `temp-message temp-message-${type}`;
        tempMsg.textContent = text;
        document.body.appendChild(tempMsg);

        setTimeout(() => {
            tempMsg.classList.add('temp-message-fadeout');
            setTimeout(() => {
                if (tempMsg.parentNode) {
                    tempMsg.parentNode.removeChild(tempMsg);
                }
            }, 300);
        }, 3000);
    }
}

// GLOBAL FUNCTIONS
function askQuestion(question) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = question;
        messageInput.focus();
        
        document.getElementById('sendButton').disabled = false;
        if (window.chat) {
            window.chat.updateCharCount();
        }
    }
}

function debugConfig() {
    const config = localStorage.getItem('rentalAIPropertyConfig');
    if (config) {
        const parsed = JSON.parse(config);
        console.log('🔧 Current Host Configuration:', parsed);
        alert(`Current Configuration:\nProperty: ${parsed.name}\nWiFi: ${parsed.amenities?.wifi || 'Not set'}\nRecommendations: ${parsed.recommendations?.length || 0}`);
    } else {
        console.log('🔧 No host configuration found');
        alert('No host configuration found. Please run setup first.');
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Rental AI Chat...');
    try {
        window.chat = new RentalAIChat();
        console.log('✅ Rental AI Chat initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize Rental AI Chat:', error);
    }
});
