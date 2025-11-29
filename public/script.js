class RentalAIChat {
    constructor() {
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        this.themeKey = 'rental_ai_theme';
        this.languageKey = 'rental_ai_language';
        this.recommendationsKey = 'rental_ai_recommendations';
        
        console.log('🔄 Chat Initialized - localStorage:', !!window.localStorage);
        
        this.loadPropertyConfig();
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
        this.createHeaderControls();
        this.loadThemePreference();
        this.loadLanguagePreference();
        this.loadRecommendations();
        
        // Refresh config to ensure we have the latest data
        this.refreshPropertyConfig();
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
        
        console.log('🔄 Refreshed property config:', this.hostConfig?.name);
        console.log('🔄 Refreshed recommendations:', this.hostRecommendations.length);
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

    initializeEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Send message on button click
        sendButton.addEventListener('click', () => this.sendMessage());

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
    }

    // HEADER CONTROLS METHODS
    createHeaderControls() {
        const headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        
        // Add Setup button (links to admin page)
        const setupBtn = this.createSetupButton();
        headerControls.appendChild(setupBtn);
        
        // Add Recommendations button
        const recBtn = this.createRecommendationsButton();
        headerControls.appendChild(recBtn);
        
        // Add Clear Chat button
        const clearBtn = this.createClearButton();
        headerControls.appendChild(clearBtn);
        
        // Add Theme Toggle button
        const themeToggle = this.createThemeToggle();
        headerControls.appendChild(themeToggle);
        
        // Add Language Selector
        const langSelect = this.createLanguageSelector();
        headerControls.appendChild(langSelect);
        
        // Add to header
        const header = document.querySelector('.chat-header');
        const statusIndicator = document.querySelector('.status-indicator');
        header.insertBefore(headerControls, statusIndicator);
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

    createRecommendationsButton() {
        const recBtn = document.createElement('button');
        recBtn.className = 'recommendations-btn';
        recBtn.innerHTML = '📍 Recommendations';
        recBtn.title = 'Manage local recommendations';
        recBtn.addEventListener('click', () => {
            this.showRecommendationsModal();
        });
        return recBtn;
    }

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

    // Recommendations Modal
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
            en: "Ask about your stay, local recommendations, or property details...",
            es: "Pregunte sobre su estadía, recomendaciones locales o detalles de la propiedad...",
            fr: "Demandez des informations sur votre séjour, des recommandations locales ou des détails sur la propriété..."
        };
        messageInput.placeholder = placeholders[langCode] || placeholders.en;

        // Update quick question buttons
        this.updateQuickQuestions(langCode);
    }

    updateQuickQuestions(langCode) {
        const quickQuestions = {
            en: {
                checkin: "Check-in/out times",
                wifi: "WiFi Information", 
                restaurants: "Nearby Restaurants",
                emergency: "Emergency Contacts"
            },
            es: {
                checkin: "Horarios de check-in/out",
                wifi: "Información del WiFi",
                restaurants: "Restaurantes cercanos",
                emergency: "Contactos de emergencia"
            },
            fr: {
                checkin: "Horaires check-in/out",
                wifi: "Informations WiFi",
                restaurants: "Restaurants à proximité",
                emergency: "Contacts d'urgence"
            }
        };

        const questions = quickQuestions[langCode] || quickQuestions.en;
        
        // Update quick question buttons
        const buttons = document.querySelectorAll('.quick-btn');
        if (buttons.length >= 4) {
            buttons[0].textContent = questions.checkin;
            buttons[1].textContent = questions.wifi;
            buttons[2].textContent = questions.restaurants;
            buttons[3].textContent = questions.emergency;
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

    // UPDATED: sendMessage method with proper property config refresh
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
            const currentLanguage = this.getCurrentLanguage();
            
            // Get FRESH host configuration every time (don't rely on cached this.hostConfig)
            const hostConfig = this.getHostConfig();
            
            // Prepare system message with recommendations for local queries
            let systemMessage = '';
            const localKeywords = ['restaurant', 'food', 'eat', 'cafe', 'bar', 'beach', 'park', 'attraction', 'nearby', 'close to', 'local', 'recommend', 'suggestion', 'place to go'];
            
            if (anyKeywordInMessage(message, localKeywords) && this.hostRecommendations.length > 0) {
                systemMessage = `When users ask about local places, share these host recommendations:\n\n${this.getRecommendationsText()}`;
            }

            // DEBUG: Log what we're sending to the backend
            console.log('🔄 Sending to AI:', {
                message: message,
                language: currentLanguage,
                hostConfig: hostConfig, // This should have the updated property name
                hasRecommendations: this.hostRecommendations.length
            });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    language: currentLanguage,
                    hostConfig: hostConfig, // Send fresh host config
                    systemMessage: systemMessage
                })
            });

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'bot');
                console.log('🌍 Response language:', data.detectedLanguage);
                console.log('🏠 Using custom config:', data.usingCustomConfig);
                
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
            this.addMessage(
                "Sorry, I'm experiencing connection issues. Please check your internet connection and try again.",
                'bot'
            );
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
        
        return formatted;
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'flex';
        document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').style.display = 'none';
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
    if (config) {
        const parsed = JSON.parse(config);
        console.log('🔧 Current Host Configuration:', parsed);
        alert(`Current Configuration:\nProperty: ${parsed.name}\nWiFi: ${parsed.amenities?.wifi || 'Not set'}`);
    } else {
        console.log('🔧 No host configuration found');
        alert('No host configuration found. Please run setup first.');
    }
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chat = new RentalAIChat();
    
    // Add CSS animations and modal styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .setup-btn, .recommendations-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: var(--text-inverse);
            padding: 6px 10px;
            border-radius: 10px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            margin-right: 8px;
        }
        
        .setup-btn:hover, .recommendations-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        /* Recommendations Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }

        .modal-content {
            background: var(--bg-primary);
            border-radius: 12px;
            padding: 0;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
        }

        .modal-header h3 {
            margin: 0;
            color: var(--text-primary);
        }

        .close-modal {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-secondary);
        }

        .modal-body {
            padding: 20px;
        }

        .add-recommendation-form {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border-color);
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 14px;
        }

        .form-textarea {
            height: 80px;
            resize: vertical;
        }

        .add-rec-btn {
            background: var(--accent-primary);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }

        .add-rec-btn:hover {
            background: var(--accent-secondary);
        }

        .recommendation-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 15px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            margin-bottom: 10px;
            background: var(--bg-secondary);
        }

        .place-info {
            flex: 1;
        }

        .place-info strong {
            color: var(--text-primary);
        }

        .category {
            color: var(--text-secondary);
            font-size: 0.9em;
        }

        .notes {
            color: var(--accent-primary);
            font-style: italic;
            margin: 5px 0 0 0;
            font-size: 0.9em;
        }

        .remove-rec-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .remove-rec-btn:hover {
            background: #c82333;
        }

        .no-recommendations {
            text-align: center;
            color: var(--text-secondary);
            font-style: italic;
            padding: 20px;
        }
    `;
    document.head.appendChild(style);
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
