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
        this.hostFAQs = [];
        
        console.log('🔍 Step 1: Loading property data from rentalAIPropertyConfig...');
        // Load property data asynchronously - don't block initialization
        this.loadAllPropertyData().catch(err => {
            console.error('Error loading property data:', err);
        });
        
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

    async loadAllPropertyData() {
        console.log('=== LOADING PROPERTY DATA ===');
        console.log('📍 Current URL:', window.location.pathname);
        
        // Don't clear if we already have server-loaded data
        const pathParts = window.location.pathname.split('/').filter(p => p); // Remove empty strings
        console.log('📍 Path parts:', pathParts);
        
        // Check if we're on a property page: /property/abc123
        // pathParts will be ['property', 'abc123'] if URL is /property/abc123
        const isPropertyPage = pathParts.length >= 2 && pathParts[0] === 'property' && pathParts[1];
        
        console.log('📍 Is property page?', isPropertyPage);
        
        // Only clear if we're NOT on a property page (localStorage mode)
        if (!isPropertyPage) {
            this.hostConfig = null;
            this.hostRecommendations = [];
            this.hostAppliances = [];
        }
        
        if (isPropertyPage) {
            const propertyId = pathParts[1]; // Get property ID from path
            console.log(`📱 Loading property from URL: ${propertyId}`);
            
            // Load property from server using property ID
            // Don't clear existing data - just load if missing
            if (!this.hostConfig) {
                await this.loadPropertyFromServer(propertyId);
            } else {
                console.log('✅ Property data already loaded, skipping reload');
            }
        } else {
            // Load from localStorage (for backward compatibility)
            this.loadPropertyConfig();
            this.loadRecommendations();
            this.loadAppliances();
        }
        
        console.log('=== PROPERTY DATA LOADED ===');
    }

    // Add this new method to script.js
    async loadPropertyFromServer(propertyId) {
        try {
            // Clean property ID (remove any URL encoding or special characters)
            const cleanPropertyId = propertyId.trim();
            console.log(`🔄 Loading property from server...`);
            console.log(`📋 Raw Property ID: "${propertyId}"`);
            console.log(`📋 Clean Property ID: "${cleanPropertyId}"`);
            console.log(`🌐 Fetch URL: ${window.location.origin}/api/property/${cleanPropertyId}`);
            
            // Encode property ID for URL (in case it has special characters)
            const encodedPropertyId = encodeURIComponent(cleanPropertyId);
            const apiUrl = `${window.location.origin}/api/property/${encodedPropertyId}`;
            console.log(`🌐 Encoded URL: ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                cache: 'no-cache', // Prevent Safari from caching
                credentials: 'same-origin' // Include cookies if needed
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 Response data:', data);
            console.log('📦 Response success:', data.success);
            console.log('📦 Response has property:', !!data.property);
            
            if (data.success && data.property) {
                this.hostConfig = data.property;
                this.hostRecommendations = data.property.recommendations || [];
                this.hostAppliances = data.property.appliances || [];
                this.hostFAQs = data.property.faqs || [];
                
                console.log(`✅ Loaded property "${data.property.name}" from server`);
                console.log(`📍 Recommendations: ${this.hostRecommendations.length}`);
                console.log(`🛠️ Appliances: ${this.hostAppliances.length}`);
                console.log(`❓ FAQs: ${this.hostFAQs.length}`);
                
                // Update UI immediately with server data
                this.updateUIWithPropertyInfo();
            } else {
                console.error('❌ Property not found on server');
                console.error('❌ Response:', JSON.stringify(data, null, 2));
                console.error('❌ Property ID requested:', cleanPropertyId);
                // Show more detailed error
                this.showPropertyLoadError(data.message || 'Property not found', cleanPropertyId);
            }
        } catch (error) {
            console.error('❌ Error loading property from server:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                url: `${window.location.origin}/api/property/${propertyId}`
            });
            // Don't fall back to localStorage on property pages - show error instead
            const cleanPropertyId = propertyId ? propertyId.trim() : 'unknown';
            this.showPropertyLoadError(error.message || 'Network error', cleanPropertyId);
        }
    }
    
    showPropertyLoadError(errorMessage = 'Property not found', propertyId = 'unknown') {
        console.error('❌ Failed to load property data from server');
        console.error('❌ Error message:', errorMessage);
        console.error('❌ Property ID:', propertyId);
        console.error('❌ Full URL:', `${window.location.origin}/api/property/${propertyId}`);
        console.error('❌ Current pathname:', window.location.pathname);
        
        // Update UI to show error state with more details
        const headerText = document.querySelector('.header-text h2') || document.getElementById('headerTitle');
        const headerSubtext = document.querySelector('.header-text p') || document.getElementById('propertySubtitle');
        
        if (headerText) {
            headerText.textContent = 'Rental AI Assistant - Property Not Found';
        }
        if (headerSubtext) {
            headerSubtext.textContent = `Unable to load property. ID: ${propertyId.substring(0, 20)}...`;
        }
        
        // Also show error in chat area for debugging (visible in Safari)
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // Remove any existing error messages
            const existingErrors = chatMessages.querySelectorAll('.debug-error');
            existingErrors.forEach(el => el.remove());
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message bot debug-error';
            errorDiv.style.color = '#e74c3c';
            errorDiv.style.padding = '15px';
            errorDiv.style.margin = '10px';
            errorDiv.style.border = '1px solid #e74c3c';
            errorDiv.style.borderRadius = '8px';
            errorDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
            errorDiv.innerHTML = `
                <strong>🔍 Debug Information:</strong><br><br>
                <strong>Property ID:</strong> ${propertyId}<br>
                <strong>Error:</strong> ${errorMessage}<br>
                <strong>API URL:</strong> ${window.location.origin}/api/property/${propertyId}<br>
                <strong>Current URL:</strong> ${window.location.href}<br><br>
                <small>💡 To see console logs:<br>
                <strong>Safari (Mac):</strong> Safari > Settings > Advanced > Enable "Show Develop menu" > Develop > Show Web Inspector<br>
                <strong>iPhone:</strong> Settings > Safari > Advanced > Web Inspector (connect to Mac Safari)</small>
            `;
            chatMessages.appendChild(errorDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Add this new method to update UI
    updateUIWithPropertyInfo() {
        if (!this.hostConfig) {
            console.log('⚠️ No host config to update UI with');
            // Clear default values if no property loaded
            const headerText = document.querySelector('.header-text h2') || document.getElementById('headerTitle');
            const headerSubtext = document.querySelector('.header-text p') || document.getElementById('propertySubtitle');
            const welcomePropertyName = document.getElementById('welcomePropertyName');
            
            if (headerText) {
                headerText.textContent = 'Rental AI Assistant';
            }
            if (headerSubtext) {
                headerSubtext.textContent = '24/7 Support';
            }
            if (welcomePropertyName) {
                welcomePropertyName.textContent = 'this property';
            }
            return;
        }
        
        console.log('🎨 Updating UI with property:', this.hostConfig.name);
        
        // Update header
        const headerText = document.querySelector('.header-text h2') || document.getElementById('headerTitle');
        const headerSubtext = document.querySelector('.header-text p') || document.getElementById('propertySubtitle');
        
        if (headerText && this.hostConfig.name) {
            headerText.textContent = `Rental AI Assistant - ${this.hostConfig.name}`;
            console.log('✅ Updated header title');
        }
        
        if (headerSubtext && this.hostConfig.name) {
            headerSubtext.textContent = `${this.hostConfig.name} • 24/7 Support`;
            console.log('✅ Updated header subtitle');
        }
        
        // Update welcome message
        const welcomePropertyName = document.getElementById('welcomePropertyName');
        if (welcomePropertyName && this.hostConfig.name) {
            welcomePropertyName.textContent = this.hostConfig.name;
            console.log('✅ Updated welcome message');
            
            // Also update the intro text to include the property name
            const welcomeIntro = document.getElementById('welcomeMessageIntro');
            if (welcomeIntro) {
                // Get current language to use correct intro text
                const currentLang = this.loadLanguagePreference();
                const welcomeMessages = {
                    en: { intro: "Hello! I'm your Rental AI Assistant for", introSuffix: "I can help you with:" },
                    es: { intro: "¡Hola! Soy tu Asistente de IA para Alquileres de", introSuffix: "Puedo ayudarte con:" },
                    fr: { intro: "Bonjour! Je suis votre Assistant IA de Location pour", introSuffix: "Je peux vous aider avec:" }
                };
                const welcome = welcomeMessages[currentLang] || welcomeMessages.en;
                welcomeIntro.innerHTML = `${welcome.intro} <strong id="welcomePropertyName">${this.hostConfig.name}</strong>. ${welcome.introSuffix}`;
            }
        }
        
        // Update page title
        if (this.hostConfig.name) {
            document.title = `Rental AI Assistant - ${this.hostConfig.name}`;
            console.log('✅ Updated page title');
        }
        
        // Display FAQs if available
        this.displayFAQs();
    }
    
    displayFAQs() {
        console.log('🔍 displayFAQs() called');
        const viewFAQsBtn = document.getElementById('viewFAQsBtn');
        const faqsSection = document.getElementById('faqsSection');
        const faqsList = document.getElementById('faqsList');
        
        console.log('🔍 FAQ elements found:', { 
            viewFAQsBtn: !!viewFAQsBtn, 
            faqsSection: !!faqsSection, 
            faqsList: !!faqsList,
            hostFAQs: this.hostFAQs?.length || 0
        });
        
        // Show/hide the FAQ button based on whether FAQs exist
        if (viewFAQsBtn) {
            if (!this.hostFAQs || this.hostFAQs.length === 0) {
                viewFAQsBtn.style.display = 'none';
                console.log('❌ Hiding FAQ button - no FAQs');
            } else {
                viewFAQsBtn.style.display = 'inline-block';
                console.log('✅ Showing FAQ button');
                // Remove any existing listeners first by cloning
                const newBtn = viewFAQsBtn.cloneNode(true);
                viewFAQsBtn.parentNode.replaceChild(newBtn, viewFAQsBtn);
                const freshBtn = document.getElementById('viewFAQsBtn');
                
                // Make sure it's not treated as a quick question button
                if (freshBtn) {
                    // Remove data-question attribute if it exists (so quick question handler ignores it)
                    freshBtn.removeAttribute('data-question');
                    
                    // Attach click handler with high priority
                    freshBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation(); // Prevent other handlers
                        console.log('🔘 FAQ button clicked!');
                        this.showFAQs();
                    }, true); // Use capture phase to run before other handlers
                    console.log('✅ FAQ button click handler attached');
                }
            }
        } else {
            console.warn('⚠️ viewFAQsBtn not found in DOM');
        }
        
        // Don't auto-display FAQs, just prepare them for when button is clicked
        if (!faqsList) return;
        
        // Prepare FAQ list content (but don't show it yet)
        if (!this.hostFAQs || this.hostFAQs.length === 0) {
            return;
        }
        
        // Filter FAQs by current language
        const currentLanguage = this.getCurrentLanguage();
        const relevantFAQs = this.hostFAQs.filter(faq => 
            !faq.language || faq.language === currentLanguage || faq.language === 'en'
        );
        
        if (relevantFAQs.length === 0) {
            return;
        }
        
        // Store FAQs for display when button is clicked
        this.preparedFAQs = relevantFAQs;
    }
    
    showFAQs() {
        console.log('🔍 showFAQs() called');
        const faqsSection = document.getElementById('faqsSection');
        const faqsList = document.getElementById('faqsList');
        const closeFAQsBtn = document.getElementById('closeFAQsBtn');
        
        console.log('🔍 FAQ elements:', { faqsSection: !!faqsSection, faqsList: !!faqsList, closeFAQsBtn: !!closeFAQsBtn });
        console.log('🔍 hostFAQs:', this.hostFAQs);
        console.log('🔍 preparedFAQs:', this.preparedFAQs);
        
        if (!faqsSection || !faqsList) {
            console.error('❌ FAQ section or list not found');
            return;
        }
        
        if (!this.preparedFAQs || this.preparedFAQs.length === 0) {
            // Prepare FAQs if not already prepared
            if (!this.hostFAQs || this.hostFAQs.length === 0) {
                console.warn('⚠️ No FAQs available');
                return;
            }
            const currentLanguage = this.getCurrentLanguage();
            this.preparedFAQs = this.hostFAQs.filter(faq => 
                !faq.language || faq.language === currentLanguage || faq.language === 'en'
            );
            console.log('🔍 Prepared FAQs:', this.preparedFAQs);
        }
        
        if (!this.preparedFAQs || this.preparedFAQs.length === 0) {
            console.warn('⚠️ No prepared FAQs to display');
            return;
        }
        
        // Display FAQs
        faqsList.innerHTML = this.preparedFAQs.map(faq => {
            const questionEscaped = this.escapeHtml(faq.question);
            const answerPreview = faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer;
            const answerEscaped = this.escapeHtml(answerPreview);
            const questionForClick = faq.question.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            return `
                <div style="padding: 12px; background: white; border-radius: 5px; cursor: pointer; transition: background 0.2s; border: 1px solid #e1e5e9;" 
                     onmouseover="this.style.background='#e8f4fd'; this.style.borderColor='#3498db'" 
                     onmouseout="this.style.background='white'; this.style.borderColor='#e1e5e9'"
                     onclick="window.rentalAIChat && window.rentalAIChat.askQuestion('${questionForClick}')">
                    <strong style="color: #2c3e50; display: block; margin-bottom: 5px; font-size: 14px;">${questionEscaped}</strong>
                    <span style="color: #7f8c8d; font-size: 13px; line-height: 1.4;">${answerEscaped}</span>
                </div>
            `;
        }).join('');
        
        faqsSection.style.display = 'block';
        console.log('✅ FAQ section displayed');
        
        // Scroll to FAQs section
        setTimeout(() => {
            faqsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
        
        // Attach close button handler
        if (closeFAQsBtn && !closeFAQsBtn.hasAttribute('data-listener-attached')) {
            closeFAQsBtn.setAttribute('data-listener-attached', 'true');
            closeFAQsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideFAQs();
            });
        }
    }
    
    hideFAQs() {
        const faqsSection = document.getElementById('faqsSection');
        if (faqsSection) {
            faqsSection.style.display = 'none';
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    // Load FAQs
    loadFAQs() {
        try {
            this.hostFAQs = [];
            
            // Check if FAQs are in the config
            if (this.hostConfig && this.hostConfig.faqs) {
                this.hostFAQs = this.hostConfig.faqs;
                console.log(`❓ Loaded ${this.hostFAQs.length} FAQs from config`);
            } else {
                // Try loading from localStorage
                const saved = localStorage.getItem('rental_ai_faqs');
                if (saved) {
                    this.hostFAQs = JSON.parse(saved);
                    console.log(`❓ Loaded ${this.hostFAQs.length} FAQs from localStorage`);
                }
            }
        } catch (error) {
            console.error('Error loading FAQs:', error);
            this.hostFAQs = [];
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
        // PRIORITY 1: Use server-loaded data (for property links)
        if (this.hostConfig) {
            console.log('✅ Using server-loaded host config:', this.hostConfig.name);
            return this.hostConfig;
        }
        
        // PRIORITY 2: Fall back to localStorage (for backward compatibility)
        try {
            const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
            if (!savedConfig) {
                console.log('⚠️ No host config available');
                return null;
            }
            
            const config = JSON.parse(savedConfig);
            console.log('📁 Using localStorage host config:', config.name);
            
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

        // Attach event listeners to existing quick question buttons
        // Use data attribute to prevent duplicate listeners
        // IMPORTANT: Read data-question from button at click time, not when listener is attached
        // Exclude the FAQ button (viewFAQsBtn) from quick question handlers
        const quickButtons = quickQuestionsContainer.querySelectorAll('.quick-btn:not(#viewFAQsBtn)');
        quickButtons.forEach(btn => {
            if (!btn.hasAttribute('data-listener-attached')) {
                btn.setAttribute('data-listener-attached', 'true');
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event bubbling
                    // Read the current data-question value (in case language changed)
                    const question = this.getAttribute('data-question');
                    console.log('Quick question clicked:', question);
                    if (question) {
                        askQuestion(question);
                    }
                });
            }
        });

        // Attach event listeners to appliance buttons
        // IMPORTANT: Read data-question from button at click time, not when listener is attached
        const applianceButtons = quickQuestionsContainer.querySelectorAll('.appliance-quick-btn');
        applianceButtons.forEach(btn => {
            if (!btn.hasAttribute('data-listener-attached')) {
                btn.setAttribute('data-listener-attached', 'true');
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event bubbling
                    // Read the current data-question value (in case language changed)
                    const question = this.getAttribute('data-question');
                    console.log('Appliance question clicked:', question);
                    if (question) {
                        askQuestion(question);
                    }
                });
            }
        });

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
                button.setAttribute('data-listener-attached', 'true');
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event bubbling
                    // Read the current data-question value (in case language changed)
                    const question = this.getAttribute('data-question');
                    console.log('Appliance question clicked:', question);
                    if (question) {
                        askQuestion(question);
                    }
                });
                applianceGrid.appendChild(button);
            });
            
            applianceSection.appendChild(applianceGrid);
            quickQuestionsContainer.appendChild(applianceSection);
        }
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
    
    // createHeaderControls() should come next
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
        
        // Clear button - check if static one exists first
        let clearBtn = document.getElementById('clearChatBtn');
        if (clearBtn) {
            // Remove old event listeners and reattach
            const newClearBtn = clearBtn.cloneNode(true);
            clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
            clearBtn = newClearBtn;
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearChat();
            });
        } else {
            // Create new clear button
            clearBtn = document.createElement('button');
            clearBtn.id = 'clearChatBtn';
            clearBtn.className = 'clear-chat-btn';
            clearBtn.innerHTML = '🗑️ Clear';
            clearBtn.title = 'Clear conversation history';
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearChat();
            });
            headerControls.appendChild(clearBtn);
        }
        
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
        
        // Removed Reload button - no longer needed as property loading is working correctly
        
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
        
        // Update welcome message
        const welcomeMessages = {
            en: {
                intro: "Hello! I'm your Rental AI Assistant for",
                introSuffix: "I can help you with:",
                item1: "🏠 Property information & amenities",
                item2: "🕒 Check-in/check-out details",
                item3: "🍽️ Local restaurant recommendations",
                item4: "🚗 Transportation & directions",
                item5: "🚨 Emergency contacts & procedures",
                item6: "📋 House rules & guidelines",
                item7: "🛠️ Appliance instructions & troubleshooting",
                closing: "How can I assist you with your stay today?"
            },
            es: {
                intro: "¡Hola! Soy tu Asistente de IA para Alquileres de",
                introSuffix: "Puedo ayudarte con:",
                item1: "🏠 Información de la propiedad y comodidades",
                item2: "🕒 Detalles de check-in/check-out",
                item3: "🍽️ Recomendaciones de restaurantes locales",
                item4: "🚗 Transporte y direcciones",
                item5: "🚨 Contactos de emergencia y procedimientos",
                item6: "📋 Reglas de la casa y pautas",
                item7: "🛠️ Instrucciones de electrodomésticos y solución de problemas",
                closing: "¿Cómo puedo ayudarte con tu estadía hoy?"
            },
            fr: {
                intro: "Bonjour! Je suis votre Assistant IA de Location pour",
                introSuffix: "Je peux vous aider avec:",
                item1: "🏠 Informations sur la propriété et équipements",
                item2: "🕒 Détails d'enregistrement/départ",
                item3: "🍽️ Recommandations de restaurants locaux",
                item4: "🚗 Transport et directions",
                item5: "🚨 Contacts d'urgence et procédures",
                item6: "📋 Règles de la maison et directives",
                item7: "🛠️ Instructions d'appareils et dépannage",
                closing: "Comment puis-je vous aider avec votre séjour aujourd'hui?"
            }
        };
        
        const welcome = welcomeMessages[langCode] || welcomeMessages.en;
        const propertyName = document.getElementById('welcomePropertyName');
        const propertyNameText = propertyName ? propertyName.textContent : '';
        
        const welcomeIntro = document.getElementById('welcomeMessageIntro');
        if (welcomeIntro) {
            welcomeIntro.innerHTML = `${welcome.intro} <strong id="welcomePropertyName">${propertyNameText}</strong>. ${welcome.introSuffix}`;
        }
        
        const welcomeItem1 = document.getElementById('welcomeItem1');
        if (welcomeItem1) welcomeItem1.textContent = welcome.item1;
        const welcomeItem2 = document.getElementById('welcomeItem2');
        if (welcomeItem2) welcomeItem2.textContent = welcome.item2;
        const welcomeItem3 = document.getElementById('welcomeItem3');
        if (welcomeItem3) welcomeItem3.textContent = welcome.item3;
        const welcomeItem4 = document.getElementById('welcomeItem4');
        if (welcomeItem4) welcomeItem4.textContent = welcome.item4;
        const welcomeItem5 = document.getElementById('welcomeItem5');
        if (welcomeItem5) welcomeItem5.textContent = welcome.item5;
        const welcomeItem6 = document.getElementById('welcomeItem6');
        if (welcomeItem6) welcomeItem6.textContent = welcome.item6;
        const welcomeItem7 = document.getElementById('welcomeItem7');
        if (welcomeItem7) welcomeItem7.textContent = welcome.item7;
        
        const welcomeClosing = document.getElementById('welcomeMessageClosing');
        if (welcomeClosing) welcomeClosing.textContent = welcome.closing;
        
        // Update quick question buttons with both text AND data-question
        const quickQuestions = {
            en: {
                checkin: { text: "Check-in/out times", question: "What time is check-in and check-out?" },
                wifi: { text: "WiFi Information", question: "What are the WiFi details?" },
                restaurants: { text: "Nearby Restaurants", question: "What restaurants are nearby?" },
                emergency: { text: "Emergency Contacts", question: "What are the emergency contacts?" },
                applianceHelp: { text: "🛠️ Appliance Help", question: "How do I use the appliances?" },
                ovenHelp: { text: "🍳 Oven/Microwave", question: "How do I use the oven or microwave?" },
                washerHelp: { text: "🧺 Washer/Dryer", question: "How do I use the washer and dryer?" },
                thermostatHelp: { text: "🌡️ Thermostat", question: "How do I adjust the thermostat?" }
            },
            es: {
                checkin: { text: "Horarios de check-in/out", question: "¿A qué hora es el check-in y check-out?" },
                wifi: { text: "Información del WiFi", question: "¿Cuáles son los detalles del WiFi?" },
                restaurants: { text: "Restaurantes cercanos", question: "¿Qué restaurantes hay cerca?" },
                emergency: { text: "Contactos de emergencia", question: "¿Cuáles son los contactos de emergencia?" },
                applianceHelp: { text: "🛠️ Ayuda con Electrodomésticos", question: "¿Cómo uso los electrodomésticos?" },
                ovenHelp: { text: "🍳 Horno/Microondas", question: "¿Cómo uso el horno o microondas?" },
                washerHelp: { text: "🧺 Lavadora/Secadora", question: "¿Cómo uso la lavadora y secadora?" },
                thermostatHelp: { text: "🌡️ Termostato", question: "¿Cómo ajusto el termostato?" }
            },
            fr: {
                checkin: { text: "Horaires check-in/out", question: "Quelles sont les heures d'enregistrement et de départ?" },
                wifi: { text: "Informations WiFi", question: "Quels sont les détails du WiFi?" },
                restaurants: { text: "Restaurants à proximité", question: "Quels restaurants sont à proximité?" },
                emergency: { text: "Contacts d'urgence", question: "Quels sont les contacts d'urgence?" },
                applianceHelp: { text: "🛠️ Aide aux Appareils", question: "Comment utiliser les appareils?" },
                ovenHelp: { text: "🍳 Four/Micro-ondes", question: "Comment utiliser le four ou le micro-ondes?" },
                washerHelp: { text: "🧺 Lave-linge/Sèche-linge", question: "Comment utiliser la machine à laver et le sèche-linge?" },
                thermostatHelp: { text: "🌡️ Thermostat", question: "Comment régler le thermostat?" }
            }
        };
        
        const questions = quickQuestions[langCode] || quickQuestions.en;
        
        // Update existing quick question buttons - both text AND data-question
        const buttons = document.querySelectorAll('.quick-btn');
        if (buttons.length >= 4) {
            buttons[0].textContent = questions.checkin.text;
            buttons[0].setAttribute('data-question', questions.checkin.question);
            buttons[1].textContent = questions.wifi.text;
            buttons[1].setAttribute('data-question', questions.wifi.question);
            buttons[2].textContent = questions.restaurants.text;
            buttons[2].setAttribute('data-question', questions.restaurants.question);
            buttons[3].textContent = questions.emergency.text;
            buttons[3].setAttribute('data-question', questions.emergency.question);
        }
        
        // Update appliance quick question buttons - both text AND data-question
        const applianceButtons = document.querySelectorAll('.appliance-quick-btn');
        if (applianceButtons.length >= 4) {
            applianceButtons[0].textContent = questions.applianceHelp.text;
            applianceButtons[0].setAttribute('data-question', questions.applianceHelp.question);
            applianceButtons[1].textContent = questions.ovenHelp.text;
            applianceButtons[1].setAttribute('data-question', questions.ovenHelp.question);
            applianceButtons[2].textContent = questions.washerHelp.text;
            applianceButtons[2].setAttribute('data-question', questions.washerHelp.question);
            applianceButtons[3].textContent = questions.thermostatHelp.text;
            applianceButtons[3].setAttribute('data-question', questions.thermostatHelp.question);
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
            
            // Check host FAQs first (more specific than FAQTracker)
            const hostFAQAnswer = this.findFAQAnswer(message, currentLanguage);
            if (hostFAQAnswer) {
                this.hideTypingIndicator();
                this.addMessage(hostFAQAnswer, 'bot');
                return;
            }
            
            // Check FAQTracker as fallback
            const faqAnswer = FAQTracker.findAnswer(message);
            if (faqAnswer) {
                this.hideTypingIndicator();
                this.addMessage(faqAnswer, 'bot');
                return;
            }
            
            // Only reload data if we don't have it yet (for property links)
            // Don't reload on every message - it's expensive and can cause race conditions
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const isPropertyPage = pathParts.length >= 2 && pathParts[0] === 'property' && pathParts[1];
            
            if (isPropertyPage && !this.hostConfig) {
                console.log('🔄 Property page detected but no data loaded, loading now...');
                await this.loadPropertyFromServer(pathParts[1]);
            } else if (!isPropertyPage && !this.hostConfig) {
                // Only reload from localStorage if not on property page and no data
                await this.loadAllPropertyData();
            }
            
            const hostConfig = this.getHostConfig();
            
            // Log what we're sending to AI for debugging
            if (hostConfig) {
                console.log('📤 Sending to AI - Property:', hostConfig.name);
                console.log('📤 Recommendations:', this.hostRecommendations.length);
                console.log('📤 Appliances:', this.hostAppliances.length);
            } else {
                console.warn('⚠️ No host config available for AI request');
            }
            
            let systemMessage = '';
            
            // Multi-language keywords for local recommendations
            const localKeywords = [
                // English
                'restaurant', 'food', 'eat', 'cafe', 'bar', 'beach', 'park', 'attraction', 'nearby', 'local', 'recommend', 'place', 'places',
                // Spanish
                'restaurante', 'comida', 'comer', 'café', 'bar', 'playa', 'parque', 'atracción', 'cerca', 'local', 'recomendar', 'lugar', 'lugares',
                // French
                'restaurant', 'nourriture', 'manger', 'café', 'bar', 'plage', 'parc', 'attraction', 'près', 'local', 'recommand', 'lieu', 'lieux'
            ];
            
            // Multi-language keywords for appliances
            const applianceKeywords = [
                // English
                'appliance', 'oven', 'microwave', 'stove', 'washer', 'dryer', 'laundry', 'fridge', 'thermostat', 'refrigerator', 'dishwasher',
                // Spanish
                'electrodoméstico', 'electrodomésticos', 'horno', 'microondas', 'estufa', 'lavadora', 'secadora', 'lavandería', 'refrigerador', 'nevera', 'termostato', 'lavavajillas',
                // French
                'appareil', 'appareils', 'four', 'micro-ondes', 'cuisinière', 'lave-linge', 'sèche-linge', 'buanderie', 'réfrigérateur', 'frigo', 'thermostat', 'lave-vaisselle'
            ];
            
            if (anyKeywordInMessage(message, localKeywords) && this.hostRecommendations.length > 0) {
                systemMessage += `IMPORTANT: Use these specific recommendations for ${hostConfig?.name || 'this property'}:\n\n${this.getRecommendationsText()}`;
            }
            
            if (anyKeywordInMessage(message, applianceKeywords) && this.hostAppliances.length > 0) {
                if (systemMessage) systemMessage += "\n\n";
                systemMessage += `APPLIANCE INSTRUCTIONS:\n\n${this.getAppliancesText()}`;
            }
            
            // If asking about WiFi, include it specifically (multi-language)
            const wifiKeywords = ['wifi', 'wi-fi', 'internet', 'red', 'conexión', 'connexion', 'réseau'];
            if (anyKeywordInMessage(message, wifiKeywords) && hostConfig?.amenities?.wifi) {
                if (systemMessage) systemMessage += "\n\n";
                systemMessage += `WIFI INFORMATION:\nNetwork: ${hostConfig.amenities.wifi}`;
            }
            
            // Include FAQs in system message for better context
            if (this.hostFAQs && this.hostFAQs.length > 0) {
                // Filter FAQs by language if available
                const relevantFAQs = this.hostFAQs.filter(faq => 
                    !faq.language || faq.language === currentLanguage || faq.language === 'en'
                );
                
                if (relevantFAQs.length > 0) {
                    if (systemMessage) systemMessage += "\n\n";
                    systemMessage += "HOST FAQS (Use these answers when guests ask similar questions):\n\n";
                    relevantFAQs.forEach((faq, index) => {
                        systemMessage += `${index + 1}. Q: ${faq.question}\n   A: ${faq.answer}\n\n`;
                    });
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            // Get propertyId for analytics tracking (reuse pathParts from above)
            const propertyId = isPropertyPage ? pathParts[1] : (this.hostConfig?.id || this.hostConfig?.propertyId || null);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    language: currentLanguage,
                    hostConfig: hostConfig,
                    systemMessage: systemMessage,
                    propertyId: propertyId
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.success) {
                // Store questionId for feedback tracking
                const questionId = data.questionId || null;
                this.addMessage(data.response, 'bot', false, questionId);
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

    addMessage(content, sender, isRestored = false, questionId = null) {
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
            
            // Add feedback buttons if questionId is provided
            if (questionId && !isRestored) {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'feedback-buttons';
                feedbackDiv.style.marginTop = '10px';
                feedbackDiv.style.display = 'flex';
                feedbackDiv.style.gap = '10px';
                feedbackDiv.style.alignItems = 'center';
                
                const helpfulBtn = document.createElement('button');
                helpfulBtn.textContent = '👍 Helpful';
                helpfulBtn.className = 'feedback-btn helpful';
                helpfulBtn.style.cssText = 'padding: 5px 12px; border: 1px solid #2ecc71; background: white; color: #2ecc71; border-radius: 4px; cursor: pointer; font-size: 12px;';
                helpfulBtn.addEventListener('click', () => this.submitFeedback(questionId, true, helpfulBtn, notHelpfulBtn));
                
                const notHelpfulBtn = document.createElement('button');
                notHelpfulBtn.textContent = '👎 Not helpful';
                notHelpfulBtn.className = 'feedback-btn not-helpful';
                notHelpfulBtn.style.cssText = 'padding: 5px 12px; border: 1px solid #e74c3c; background: white; color: #e74c3c; border-radius: 4px; cursor: pointer; font-size: 12px;';
                notHelpfulBtn.addEventListener('click', () => this.submitFeedback(questionId, false, helpfulBtn, notHelpfulBtn));
                
                feedbackDiv.appendChild(helpfulBtn);
                feedbackDiv.appendChild(notHelpfulBtn);
                messageContent.appendChild(feedbackDiv);
            }
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

    findFAQAnswer(message, language = 'en') {
        if (!this.hostFAQs || this.hostFAQs.length === 0) {
            return null;
        }
        
        const lowerMessage = message.toLowerCase();
        
        // Find FAQs that match the question (by language and keyword matching)
        const matchingFAQs = this.hostFAQs.filter(faq => {
            // Check language match
            if (faq.language && faq.language !== language && faq.language !== 'en') {
                return false;
            }
            
            // Check if question keywords match FAQ question
            const faqQuestionLower = faq.question.toLowerCase();
            const questionWords = lowerMessage.split(/\s+/).filter(w => w.length > 3);
            
            // If at least 2 significant words match, consider it a match
            const matchingWords = questionWords.filter(word => faqQuestionLower.includes(word));
            return matchingWords.length >= 2 || lowerMessage.includes(faqQuestionLower.substring(0, 10));
        });
        
        if (matchingFAQs.length > 0) {
            // Return the first matching FAQ answer
            return matchingFAQs[0].answer;
        }
        
        return null;
    }

    async submitFeedback(questionId, helpful, helpfulBtn, notHelpfulBtn) {
        try {
            const response = await fetch('/api/analytics/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId, helpful })
            });

            const data = await response.json();
            
            if (data.success) {
                // Disable both buttons
                helpfulBtn.disabled = true;
                notHelpfulBtn.disabled = true;
                
                // Highlight the selected button
                if (helpful) {
                    helpfulBtn.style.background = '#2ecc71';
                    helpfulBtn.style.color = 'white';
                    helpfulBtn.textContent = '✓ Helpful';
                } else {
                    notHelpfulBtn.style.background = '#e74c3c';
                    notHelpfulBtn.style.color = 'white';
                    notHelpfulBtn.textContent = '✓ Not helpful';
                }
                
                this.showTempMessage(helpful ? 'Thank you for your feedback!' : 'Thanks, we\'ll improve!', 'success');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    }
}

// Helper function
function anyKeywordInMessage(message, keywords) {
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
}

// Quick question function - Make it global and robust
// Add debouncing to prevent duplicate calls
let isSendingQuestion = false;

function askQuestion(question) {
    // Prevent duplicate calls
    if (isSendingQuestion) {
        console.log('⚠️ Question already being sent, ignoring duplicate');
        return;
    }
    
    isSendingQuestion = true;
    console.log('askQuestion called with:', question);
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    
    if (!messageInput) {
        console.error('Message input not found');
        isSendingQuestion = false;
        return;
    }
    
    messageInput.value = question;
    if (sendButton) {
        sendButton.disabled = false;
    }
    
    // Use existing chat instance or create new one
    if (window.chat && typeof window.chat.sendMessage === 'function') {
        console.log('Using existing chat instance');
        window.chat.sendMessage().finally(() => {
            // Reset flag after message is sent
            setTimeout(() => {
                isSendingQuestion = false;
            }, 1000);
        });
    } else {
        console.log('Creating new chat instance');
        window.chat = new RentalAIChat();
        // Wait a bit for initialization, then send
        setTimeout(() => {
            if (window.chat && typeof window.chat.sendMessage === 'function') {
                window.chat.sendMessage().finally(() => {
                    // Reset flag after message is sent
                    setTimeout(() => {
                        isSendingQuestion = false;
                    }, 1000);
                });
            } else {
                isSendingQuestion = false;
            }
        }, 100);
    }
}

// Make it globally available
window.askQuestion = askQuestion;

// Initialize chat
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Initializing RentalAIChat...');
    try {
        window.chat = new RentalAIChat();
        console.log('✅ RentalAIChat initialized successfully!');
        
        // Attach quick question button listeners after chat is initialized
        setTimeout(() => {
            // Don't attach listeners here - they're already attached in setupQuickQuestionButtons()
            // This was causing duplicate listeners
            console.log('✅ Quick question buttons already set up by RentalAIChat');
        }, 500);
        
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
