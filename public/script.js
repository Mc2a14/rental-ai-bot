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

    // UPDATED: sendMessage method with proper property config refresh including appliances
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
            
            // Prepare system messages with recommendations AND appliances for relevant queries
            let systemMessage = '';
            
            // Check if question is about local recommendations
            const localKeywords = ['restaurant', 'food', 'eat', 'cafe', 'bar', 
                'beach', 'park', 'attraction', 'nearby', 'local', 
                'recommend', 'things to do', 'activity', 'tour', 
                'sightseeing', 'place to visit', 'what to do', 'see',
                'visit', 'explore', 'destination'];
            
            // ADDED: Check if question is about appliances
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
            
            // ADDED: Include appliances context for appliance questions
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
                hasAppliances: this.hostAppliances.length, // ADDED
                hasSystemMessage: !!systemMessage
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

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'bot');
                console.log('🌍 Response language:', data.detectedLanguage);
                console.log('🏠 Using custom config:', data.usingCustomConfig);
                console.log('🛠️ Using appliances data:', data.usingAppliances || false); // ADDED
                
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
        formatted = formatted.replace(/Address:/g,
