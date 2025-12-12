console.log("🔄 admin.js loading...");

class PropertySetup {
   constructor() {
    console.log("✅ PropertySetup constructor called");
    this.currentStep = 1;
    this.totalSteps = 3;
    this.recommendations = [];
    this.appliances = [];
    this.faqs = []; // Store FAQs
    this.currentPropertyId = null; // Store the current property ID for updates
    this.allProperties = []; // Store all user properties for selector
    this.currentLanguage = 'en'; // Store current language preference
    
    // Try to restore propertyId from localStorage on initialization
    try {
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.propertyId || config.id) {
                this.currentPropertyId = config.propertyId || config.id;
                console.log(`📌 Restored propertyId from localStorage: ${this.currentPropertyId}`);
            }
        }
    } catch (e) {
        console.warn('Could not restore propertyId from localStorage:', e);
    }
    
    // Load data AFTER checking user is authenticated
    if (this.isUserAuthenticated()) {
        this.loadRecommendations();
        this.loadAppliances();
        this.loadFAQs();
    }
    
    console.log("🔄 Initializing event listeners...");
    this.initializeEventListeners();
    this.updateStepDisplay();
    this.updateRecommendationsList();
    this.updateAppliancesList();
    this.updateFAQsList();
    this.addPreviewStyles();
    
    // Load existing config (async - don't await, let it load in background)
    this.autoLoadExistingConfig().catch(err => {
        console.error('Error loading existing config:', err);
    });
    
    // Setup validation
    setTimeout(() => {
        this.setupRealTimeValidation();
    }, 100);
    
    this.setupAdditionalButtons();
    this.setupNavButtonScroll();
    console.log("✅ PropertySetup initialized successfully");
}

isUserAuthenticated() {
    return typeof isAuthenticated === 'function' && isAuthenticated();
}

addPreviewStyles() {
    console.log("🔄 Adding preview styles...");
    const style = document.createElement('style');
    style.textContent = `
        .preview-item {
            padding: 8px 0;
            border-bottom: 1px solid #e1e5e9;
        }
        .preview-item:last-child {
            border-bottom: none;
        }
        .preview-item strong {
            color: #2c3e50;
            display: inline-block;
            width: 120px;
        }
        .section-description {
            color: #7f8c8d;
            margin-bottom: 20px;
            font-style: italic;
        }
        .field-invalid {
            border-color: #e74c3c !important;
            background-color: #fff0f0 !important;
        }
        .field-valid {
            border-color: #2ecc71 !important;
            background-color: #f8fff9 !important;
        }
        .validation-message {
            color: #e74c3c;
            font-size: 0.8rem;
            margin-top: 5px;
            display: none;
            font-weight: 500;
        }
        .validation-message.show {
            display: block;
        }
        
        /* Fix for Next button */
        #nextBtn {
            cursor: pointer !important;
        }
        
        #nextBtn:disabled {
            background-color: #95a5a6 !important;
            cursor: not-allowed !important;
            opacity: 0.7;
        }
        
        #nextBtn:enabled:hover {
            background-color: #2980b9 !important;
            transform: translateY(-2px);
        }
    `;
    document.head.appendChild(style);
    console.log("✅ Preview styles added");
}

initializeEventListeners() {
    console.log("🔄 Setting up event listeners...");
    
    // Use a function to ensure 'this' context is correct
    const self = this;
    
    // Wait a bit to ensure DOM is fully ready
    setTimeout(() => {
        // Navigation buttons - SIMPLE WORKING VERSION
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        console.log("📝 Buttons found:", { nextBtn: !!nextBtn, prevBtn: !!prevBtn, submitBtn: !!submitBtn });
        
        if (nextBtn) {
            // Remove any existing listeners
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            
            // Add event listener with multiple methods for compatibility
            newNextBtn.addEventListener('click', function(e) {
                console.log("👉 Next button CLICKED!");
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                self.nextStep();
                return false;
            });
            
            // Also add onclick as backup
            newNextBtn.onclick = function(e) {
                console.log("👉 Next button CLICKED (onclick)!");
                e.preventDefault();
                e.stopPropagation();
                self.nextStep();
                return false;
            };
            
            // Ensure button is not disabled and visible
            newNextBtn.disabled = false;
            newNextBtn.style.pointerEvents = 'auto';
            newNextBtn.style.cursor = 'pointer';
            
            console.log("✅ Next button listener added (multiple methods)");
        } else {
            console.error("❌ Next button NOT FOUND!");
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.prevStep();
            });
            console.log("✅ Previous button listener added");
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', function(e) {
                console.log("💾 Save Configuration button clicked!");
                e.preventDefault();
                self.saveConfiguration(e);
            });
            console.log("✅ Submit button listener added");
        }
        
        // FAQ button
        const addFAQBtn = document.getElementById('addFAQBtn');
        if (addFAQBtn) {
            addFAQBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("❓ Add FAQ button clicked");
                if (self) {
                    self.addFAQ();
                } else if (window.propertySetup) {
                    window.propertySetup.addFAQ();
                } else {
                    alert('System not ready. Please wait for page to load.');
                }
            });
            console.log("✅ Add FAQ button listener added");
        } else {
            console.log("⚠️ Add FAQ button not found");
        }
        
        // Property selector
        const propertySelector = document.getElementById('propertySelector');
        if (propertySelector) {
            propertySelector.addEventListener('change', (e) => {
                const selectedPropertyId = e.target.value;
                if (selectedPropertyId && selectedPropertyId !== 'new') {
                    self.switchProperty(selectedPropertyId);
                }
            });
            console.log("✅ Property selector listener added");
        }
        
        // New Property button
        const newPropertyBtn = document.getElementById('newPropertyBtn');
        if (newPropertyBtn) {
            newPropertyBtn.addEventListener('click', () => {
                self.createNewProperty();
            });
            console.log("✅ New Property button listener added");
        }
        
        console.log("✅ All event listeners initialized");
    }, 200);
}

setupRealTimeValidation() {
    console.log("🔄 Setting up real-time validation...");
    
    const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
    console.log(`📝 Found ${requiredFields.length} required fields`);
    
    // Debounce validation to prevent excessive calls
    let validationTimeout;
    const debouncedValidate = () => {
        clearTimeout(validationTimeout);
        validationTimeout = setTimeout(() => {
            this.validateCurrentStep();
        }, 300); // Wait 300ms after last input
    };
    
    requiredFields.forEach(field => {
        // Add validation message element
        if (!field.parentNode.querySelector('.validation-message')) {
            const validationMsg = document.createElement('div');
            validationMsg.className = 'validation-message';
            validationMsg.textContent = 'This field is required';
            field.parentNode.appendChild(validationMsg);
        }
        
        // Event listeners with debouncing
        field.addEventListener('input', () => {
            this.validateField(field);
            debouncedValidate(); // Debounced validation
            // Update preview in real-time when on step 3
            if (this.currentStep === 3) {
                this.updatePreview();
            }
        });
        
        field.addEventListener('change', () => {
            this.validateField(field);
            this.validateCurrentStep(); // Immediate validation on change
            // Update preview in real-time when on step 3
            if (this.currentStep === 3) {
                this.updatePreview();
            }
        });
        
        // Initial validation
        this.validateField(field);
    });
    
    // Initial validation (only once)
    this.validateCurrentStep();
    console.log("✅ Real-time validation setup complete");
}

validateField(field) {
    const value = field.value.trim();
    const isValid = value.length > 0;
    const validationMsg = field.parentNode.querySelector('.validation-message');
    
    // Special handling for select
    if (field.tagName === 'SELECT') {
        const selectIsValid = field.value !== '';
        
        if (selectIsValid) {
            field.classList.remove('field-invalid');
            field.classList.add('field-valid');
            if (validationMsg) validationMsg.classList.remove('show');
        } else {
            field.classList.remove('field-valid');
            field.classList.add('field-invalid');
            if (validationMsg) validationMsg.classList.add('show');
        }
        
        return selectIsValid;
    }
    
    // For input/textarea
    if (isValid) {
        field.classList.remove('field-invalid');
        field.classList.add('field-valid');
        if (validationMsg) validationMsg.classList.remove('show');
    } else {
        field.classList.remove('field-valid');
        field.classList.add('field-invalid');
        if (validationMsg) validationMsg.classList.add('show');
    }
    
    return isValid;
}

validateCurrentStep() {
    // Only log validation in debug mode to reduce console spam
    if (window.DEBUG_MODE) {
        console.log(`🔄 Validating step ${this.currentStep}...`);
    }
    
    const currentSection = document.getElementById(`section${this.currentStep}`);
    if (!currentSection) return false;
    
    const requiredFields = currentSection.querySelectorAll('input[required], textarea[required], select[required]');
    let allValid = true;
    
    requiredFields.forEach(field => {
        if (!this.validateField(field)) {
            allValid = false;
        }
    });
    
    // Only log result occasionally to reduce spam
    if (window.DEBUG_MODE || Math.random() < 0.01) {
        console.log(`🔘 Validation: ${allValid ? 'PASSED' : 'FAILED'}`);
    }
    
    return allValid;
}

async autoLoadExistingConfig() {
    console.log("🔄 Auto-loading existing config...");
    
    // First check if user is logged in
    if (!this.isUserAuthenticated()) {
        console.log("⚠️ User not authenticated, skipping auto-load");
        return;
    }
    
    try {
        // Get current user - check both sync and async methods
        let user = null;
        if (typeof getCurrentUser === 'function') {
            user = getCurrentUser();
        }
        
        // If no user from sync method, try to get from session
        if (!user || !user.userId) {
            try {
                const response = await fetch('/api/user/me', {
                    method: 'GET',
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.user) {
                        user = data.user;
                    }
                }
            } catch (error) {
                console.warn('Could not get user from session:', error);
            }
        }
        
        if (!user || (!user.userId && !user.id)) {
            console.log("⚠️ No user ID available, skipping auto-load");
            return;
        }
        
        const userId = user.userId || user.id;
        
        // PRIORITY 1: Try to load from server (database)
        try {
            console.log(`🔄 Loading properties from server for user: ${userId}`);
            
            // Check if there's a propertyId in the URL (e.g., from guest link)
            const urlParams = new URLSearchParams(window.location.search);
            const urlPropertyId = urlParams.get('propertyId');
            if (urlPropertyId) {
                console.log(`📌 Found propertyId in URL: ${urlPropertyId}`);
                this.currentPropertyId = urlPropertyId;
            }
            
            const response = await fetch(`/api/user/${userId}/properties`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-cache' // Ensure fresh data
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.properties && data.properties.length > 0) {
                    // If we have a propertyId from URL, try to find that specific property
                    let property = null;
                    if (this.currentPropertyId) {
                        property = data.properties.find(p => 
                            (p.propertyId || p.id) === this.currentPropertyId
                        );
                        if (property) {
                            console.log(`✅ Found property matching URL propertyId: ${property.name}`);
                        } else {
                            console.warn(`⚠️ Property ${this.currentPropertyId} not found in user's properties, using most recent`);
                        }
                    }
                    
                    // If no match or no URL propertyId, use the most recent property
                    if (!property) {
                        property = data.properties[0]; // Properties are sorted by created_at DESC
                        console.log(`✅ Using most recent property: ${property.name}`);
                    }
                    
                    console.log(`📋 Property object keys:`, Object.keys(property));
                    console.log(`📋 Property.id: ${property.id}`);
                    console.log(`📋 Property.propertyId: ${property.propertyId}`);
                    
                    // Store all properties for selector - deduplicate by propertyId/id
                    const seenIds = new Set();
                    this.allProperties = data.properties.filter(p => {
                        const propertyId = p.propertyId || p.id;
                        if (!propertyId || seenIds.has(propertyId)) {
                            return false; // Skip duplicates
                        }
                        seenIds.add(propertyId);
                        return true;
                    });
                    console.log(`📋 Deduplicated properties: ${this.allProperties.length} unique out of ${data.properties.length} total`);
                    
                    // Store the property ID for updates - try multiple possible fields
                    this.currentPropertyId = property.propertyId || property.id || property.property_id;
                    console.log(`📌 Stored property ID for updates: ${this.currentPropertyId}`);
                    console.log(`📌 Total properties for user: ${data.properties.length}`);
                    
                    // Populate property selector
                    this.populatePropertySelector();
                    
                    // If there are multiple properties, log them
                    if (data.properties.length > 1) {
                        console.warn(`⚠️ User has ${data.properties.length} properties. Using: ${this.currentPropertyId}`);
                        data.properties.forEach((p, idx) => {
                            const pId = p.propertyId || p.id;
                            const isCurrent = pId === this.currentPropertyId ? ' ← CURRENT' : '';
                            console.log(`  Property ${idx + 1}: ${p.name} (ID: ${pId})${isCurrent}`);
                        });
                    }
                    
                    // Also save to localStorage for backward compatibility
                    localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(property));
                    
                    // Populate form fields from server data
                    // Use a small delay to ensure DOM is ready
                    setTimeout(() => {
                        this.populateFormFromConfig(property);
                    }, 100);
                    
                    // Load recommendations and appliances
                    console.log('🔍 Checking recommendations in property:', {
                        hasRecommendations: !!property.recommendations,
                        isArray: Array.isArray(property.recommendations),
                        type: typeof property.recommendations,
                        value: property.recommendations
                    });
                    
                    if (property.recommendations && Array.isArray(property.recommendations)) {
                        this.recommendations = property.recommendations;
                        localStorage.setItem('rental_ai_recommendations', JSON.stringify(property.recommendations));
                        console.log(`📍 Loaded ${this.recommendations.length} recommendations from server`);
                        console.log(`📍 Recommendations data:`, JSON.stringify(this.recommendations, null, 2));
                    } else {
                        console.log('⚠️ No recommendations found in property data');
                        console.log('⚠️ Property recommendations value:', property.recommendations);
                        this.recommendations = [];
                    }
                    
                    if (property.appliances && Array.isArray(property.appliances)) {
                        this.appliances = property.appliances;
                        localStorage.setItem('rental_ai_appliances', JSON.stringify(property.appliances));
                        console.log(`🛠️ Loaded ${this.appliances.length} appliances from server`);
                    } else {
                        console.log('⚠️ No appliances found in property data');
                        this.appliances = [];
                    }
                    
                    // Load FAQs from server
                    if (property.faqs && Array.isArray(property.faqs)) {
                        this.faqs = property.faqs;
                        localStorage.setItem('rental_ai_faqs', JSON.stringify(property.faqs));
                        console.log(`❓ Loaded ${this.faqs.length} FAQs from server`);
                    } else {
                        console.log('⚠️ No FAQs found in property data');
                        this.faqs = [];
                    }
                    
                    // Update the UI to show loaded recommendations, appliances, and FAQs
                    // Use a small delay to ensure DOM is ready
                    setTimeout(() => {
                        console.log('🔄 Updating UI lists...');
                        console.log('🔄 Recommendations before update:', this.recommendations.length);
                        this.updateRecommendationsList();
                        this.updateAppliancesList();
                        this.updateFAQsList();
                        console.log('✅ UI lists updated');
                    }, 200);
                    
                    console.log('✅ Configuration loaded from server');
                    
                    // Validate fields
                    setTimeout(() => {
                        this.validateCurrentStep();
                    }, 200);
                    return; // Successfully loaded from server
                }
            }
        } catch (serverError) {
            console.warn('⚠️ Failed to load from server, trying localStorage:', serverError);
        }
        
        // PRIORITY 2: Fall back to localStorage (for backward compatibility)
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        
        if (savedConfig) {
            console.log('📁 Found saved configuration in localStorage, loading...');
            const config = JSON.parse(savedConfig);
            
            // Store property ID from localStorage if available
            if (config.propertyId || config.id) {
                this.currentPropertyId = config.propertyId || config.id;
                console.log(`📌 Stored property ID from localStorage: ${this.currentPropertyId}`);
            }
            
            // Populate form fields
            // Use a small delay to ensure DOM is ready
            setTimeout(() => {
                this.populateFormFromConfig(config);
            }, 100);
            
            // Load recommendations and appliances from config if available
            if (config.recommendations && Array.isArray(config.recommendations)) {
                this.recommendations = config.recommendations;
                console.log(`📍 Loaded ${this.recommendations.length} recommendations from localStorage config`);
            } else {
                // Also try loading from separate localStorage key
                const savedRecs = localStorage.getItem('rental_ai_recommendations');
                if (savedRecs) {
                    this.recommendations = JSON.parse(savedRecs);
                    console.log(`📍 Loaded ${this.recommendations.length} recommendations from localStorage key`);
                }
            }
            
            if (config.appliances && Array.isArray(config.appliances)) {
                this.appliances = config.appliances;
                console.log(`🛠️ Loaded ${this.appliances.length} appliances from localStorage config`);
            } else {
                // Also try loading from separate localStorage key
                const savedApps = localStorage.getItem('rental_ai_appliances');
                if (savedApps) {
                    this.appliances = JSON.parse(savedApps);
                    console.log(`🛠️ Loaded ${this.appliances.length} appliances from localStorage key`);
                }
            }
            
            // Load FAQs from config if available
            if (config.faqs && Array.isArray(config.faqs)) {
                this.faqs = config.faqs;
                console.log(`❓ Loaded ${this.faqs.length} FAQs from localStorage config`);
            } else {
                // Also try loading from separate localStorage key
                const savedFAQs = localStorage.getItem('rental_ai_faqs');
                if (savedFAQs) {
                    this.faqs = JSON.parse(savedFAQs);
                    console.log(`❓ Loaded ${this.faqs.length} FAQs from localStorage key`);
                }
            }
            
            // Update the UI to show loaded recommendations and appliances
            this.updateRecommendationsList();
            this.updateAppliancesList();
            this.updateFAQsList();
            
            console.log('✅ Configuration loaded from localStorage');
            
            // Validate fields
            setTimeout(() => {
                this.validateCurrentStep();
            }, 200);
        } else {
            console.log('ℹ️ No existing configuration found');
        }
    } catch (error) {
        console.error('❌ Error auto-loading configuration:', error);
    }
}

populateFormFromConfig(config) {
    console.log('🔄 populateFormFromConfig called with:', config);
    
    if (!config) {
        console.error('❌ No config provided!');
        return;
    }
    
    // Populate form fields from config object
    const propertyNameField = document.getElementById('propertyName');
    if (propertyNameField) {
        propertyNameField.value = config.name || '';
        console.log(`✅ Set propertyName to: "${config.name || ''}"`);
    } else {
        console.error('❌ propertyName field not found in DOM!');
    }
    
    const propertyAddressField = document.getElementById('propertyAddress');
    if (propertyAddressField) {
        propertyAddressField.value = config.address || '';
        console.log(`✅ Set propertyAddress to: "${config.address || ''}"`);
    } else {
        console.error('❌ propertyAddress field not found in DOM!');
    }
    
    const propertyTypeField = document.getElementById('propertyType');
    if (propertyTypeField) {
        propertyTypeField.value = config.type || 'Vacation Home';
        console.log(`✅ Set propertyType to: "${config.type || 'Vacation Home'}"`);
    } else {
        console.error('❌ propertyType field not found in DOM!');
    }
    
    const hostContactField = document.getElementById('hostContact');
    if (hostContactField) {
        hostContactField.value = config.hostContact || '';
        console.log(`✅ Set hostContact to: "${config.hostContact || ''}"`);
    } else {
        console.error('❌ hostContact field not found in DOM!');
    }
    
    const maintenanceContactField = document.getElementById('maintenanceContact');
    if (maintenanceContactField) {
        maintenanceContactField.value = config.maintenanceContact || '';
        console.log(`✅ Set maintenanceContact to: "${config.maintenanceContact || ''}"`);
    } else {
        console.error('❌ maintenanceContact field not found in DOM!');
    }
    
    const checkInTimeField = document.getElementById('checkInTime');
    if (checkInTimeField) {
        checkInTimeField.value = config.checkinTime || config.checkInTime || '3:00 PM';
        console.log(`✅ Set checkInTime to: "${config.checkinTime || config.checkInTime || '3:00 PM'}"`);
    } else {
        console.error('❌ checkInTime field not found in DOM!');
    }
    
    const checkOutTimeField = document.getElementById('checkOutTime');
    if (checkOutTimeField) {
        checkOutTimeField.value = config.checkoutTime || config.checkOutTime || '11:00 AM';
        console.log(`✅ Set checkOutTime to: "${config.checkoutTime || config.checkOutTime || '11:00 AM'}"`);
    } else {
        console.error('❌ checkOutTime field not found in DOM!');
    }
    
    const lateCheckoutField = document.getElementById('lateCheckout');
    if (lateCheckoutField) {
        lateCheckoutField.value = config.lateCheckout || '';
        console.log(`✅ Set lateCheckout to: "${config.lateCheckout || ''}"`);
    } else {
        console.error('❌ lateCheckout field not found in DOM!');
    }
    
    const wifiDetailsField = document.getElementById('wifiDetails');
    if (wifiDetailsField) {
        wifiDetailsField.value = config.amenities?.wifi || config.wifiDetails || '';
        console.log(`✅ Set wifiDetails to: "${config.amenities?.wifi || config.wifiDetails || ''}"`);
    } else {
        console.error('❌ wifiDetails field not found in DOM!');
    }
    
    const amenitiesField = document.getElementById('amenities');
    if (amenitiesField) {
        amenitiesField.value = config.amenities?.other || config.amenities || '';
        console.log(`✅ Set amenities to: "${config.amenities?.other || config.amenities || ''}"`);
    } else {
        console.error('❌ amenities field not found in DOM!');
    }
    
    const houseRulesField = document.getElementById('houseRules');
    if (houseRulesField) {
        houseRulesField.value = config.houseRules || '';
        console.log(`✅ Set houseRules to: "${config.houseRules || ''}"`);
    } else {
        console.error('❌ houseRules field not found in DOM!');
    }
    
    console.log('✅ Form population complete');
}

nextStep() {
    console.log("🔄 Moving to next step...");
    console.log("Current step:", this.currentStep, "Total steps:", this.totalSteps);
    
    // Always allow moving forward, but validate first
    const isValid = this.validateCurrentStep();
    console.log("Validation result:", isValid);
    
    if (this.currentStep < this.totalSteps) {
        if (isValid) {
            this.currentStep++;
            this.updateStepDisplay();
            console.log(`✅ Moved to step ${this.currentStep}`);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.log("❌ Cannot move to next step - validation failed");
            this.showTempMessage('Please fill in all required fields before continuing', 'warning');
            // Scroll to first invalid field
            const firstInvalid = document.querySelector('.field-invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalid.focus();
            }
        }
    } else {
        console.log("Already on last step");
    }
}

prevStep() {
    console.log("🔄 Moving to previous step...");
    if (this.currentStep > 1) {
        this.currentStep--;
        this.updateStepDisplay();
        console.log(`✅ Moved to step ${this.currentStep}`);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

    updateStepDisplay() {
        console.log("🔄 Updating step display...");
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Show/hide sections
        document.querySelectorAll('.form-section').forEach((section, index) => {
            section.style.display = (index + 1 === this.currentStep) ? 'block' : 'none';
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = this.currentStep < this.totalSteps ? 'flex' : 'none';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';

        // Update preview on step 3
        if (this.currentStep === 3) {
            this.updatePreview();
        }

        // Scroll to top of page - multiple methods for compatibility
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            // Also scroll admin container if it exists
            const adminContainer = document.querySelector('.admin-container');
            if (adminContainer) {
                adminContainer.scrollTop = 0;
            }
        }, 100);

        // Validate new step (but don't disable button)
        setTimeout(() => {
            this.validateCurrentStep();
            // Ensure Next button is always enabled
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        }, 100);

        console.log("✅ Step display updated");
    }

updatePreview() {
    console.log("🔄 Updating preview...");
    const previewContent = document.getElementById('previewContent');
    const previewSection = document.getElementById('previewSection');
    
    if (!previewContent || !previewSection) return;
    
    const formData = this.getFormData();
    
    let previewHTML = `
        <div class="preview-item">
            <strong>Property Name:</strong> ${formData.name || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Address:</strong> ${formData.address || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Property Type:</strong> ${formData.type || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Host Contact:</strong> ${formData.hostContact || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Maintenance Contact:</strong> ${formData.maintenanceContact || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Check-in:</strong> ${formData.checkInTime || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Check-out:</strong> ${formData.checkOutTime || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>WiFi Details:</strong> ${formData.wifiDetails || 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Amenities:</strong> ${formData.amenities ? '✓ Set' : 'Not set'}
        </div>
        <div class="preview-item">
            <strong>House Rules:</strong> ${formData.houseRules ? '✓ Set' : 'Not set'}
        </div>
        <div class="preview-item">
            <strong>Recommendations:</strong> ${this.recommendations.length} places
        </div>
        <div class="preview-item">
            <strong>Appliances:</strong> ${this.appliances.length} appliances
        </div>
    `;

    previewContent.innerHTML = previewHTML;
    previewSection.style.display = 'block';
    console.log("✅ Preview updated");
}

getFormData() {
    return {
        name: document.getElementById('propertyName')?.value || '',
        address: document.getElementById('propertyAddress')?.value || '',
        type: document.getElementById('propertyType')?.value || '',
        hostContact: document.getElementById('hostContact')?.value || '',
        maintenanceContact: document.getElementById('maintenanceContact')?.value || '',
        checkInTime: document.getElementById('checkInTime')?.value || '',
        checkOutTime: document.getElementById('checkOutTime')?.value || '',
        lateCheckout: document.getElementById('lateCheckout')?.value || '',
        wifiDetails: document.getElementById('wifiDetails')?.value || '',
        amenities: document.getElementById('amenities')?.value || '',
        houseRules: document.getElementById('houseRules')?.value || ''
    };
}

async saveConfiguration(e) {
    console.log("💾 Save configuration started!");
    if (e) e.preventDefault();
    
    // Check authentication
    if (!this.isUserAuthenticated()) {
        this.showTempMessage('You must be logged in to save.', 'error');
        return;
    }
    
    if (!this.validateCurrentStep()) {
        this.showTempMessage('Please fill in all required fields before saving.', 'error');
        return;
    }

    const formData = this.getFormData();
    const user = getCurrentUser();
    
    if (!user || !user.userId) {
        this.showTempMessage('Authentication error. Please login again.', 'error');
        return;
    }
    
    // Build complete property data
    const propertyData = {
        // Basic info
        name: formData.name,
        address: formData.address,
        type: formData.type,
        
        // Contact info
        hostContact: formData.hostContact,
        maintenanceContact: formData.maintenanceContact,
        emergencyContact: formData.maintenanceContact || formData.hostContact,
        
        // Check-in/out
        checkinTime: this.formatTime(formData.checkInTime) || '3:00 PM',
        checkoutTime: this.formatTime(formData.checkOutTime) || '11:00 AM',
        lateCheckout: formData.lateCheckout,
        
        // Amenities
        amenities: {
            wifi: formData.wifiDetails || 'Not set',
            parking: '',
            other: formData.amenities || ''
        },
        
        // Rules
        houseRules: formData.houseRules || '',
        
        // Appliances, Recommendations & FAQs
        appliances: this.appliances,
        recommendations: this.recommendations,
        faqs: this.faqs,
        
        // Metadata
        lastUpdated: new Date().toISOString()
    };

    try {
        console.log('🔄 Saving to server...');
        
        // Save to SERVER (cross-device access)
        // Include propertyId if we're updating an existing property
        const requestBody = {
            userId: user.userId,
            propertyData: propertyData
        };
        
        // If we have an existing property ID, include it for update
        if (this.currentPropertyId) {
            requestBody.propertyId = this.currentPropertyId;
            console.log(`🔄 Updating existing property: ${this.currentPropertyId}`);
            console.log(`📊 Recommendations count: ${propertyData.recommendations?.length || 0}`);
            console.log(`📊 Appliances count: ${propertyData.appliances?.length || 0}`);
            console.log(`📊 FAQs count: ${propertyData.faqs?.length || 0}`);
        } else {
            console.log('🆕 Creating new property (no currentPropertyId found)');
            console.log(`📊 Recommendations count: ${propertyData.recommendations?.length || 0}`);
            console.log(`📊 Appliances count: ${propertyData.appliances?.length || 0}`);
        }
        
        const response = await fetch('/api/property/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to save to server');
        }
        
        console.log('✅ Saved to server, property ID:', result.propertyId);
        console.log('📊 Updated recommendations count:', this.recommendations.length);
        console.log('📊 Updated appliances count:', this.appliances.length);
        
        // Store the property ID for future updates
        this.currentPropertyId = result.propertyId;
        console.log(`📌 Updated currentPropertyId to: ${this.currentPropertyId}`);
        
        // ALSO save to localStorage (for backward compatibility)
        localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(propertyData));
        localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
        localStorage.setItem('rental_ai_appliances', JSON.stringify(this.appliances));
        
        // Generate guest link
        const guestLink = `${window.location.origin}/property/${result.propertyId}`;
        
        // Show success with guest link
        this.showSuccessMessage(guestLink, formData.name);
        
        console.log('✅ Configuration saved successfully!');
        
    } catch (error) {
        console.error('❌ Error saving configuration:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        let errorMessage = 'Error saving configuration. ';
        if (error.message) {
            errorMessage += error.message;
        } else if (error.response) {
            errorMessage += 'Server error. Please try again.';
        } else {
            errorMessage += 'Please check your connection and try again.';
        }
        
        this.showTempMessage(errorMessage, 'error');
        alert('Save failed: ' + errorMessage + '\n\nCheck the browser console for details.');
    }
}

formatTime(timeString) {
    if (!timeString) return '';
    if (timeString.includes('AM') || timeString.includes('PM') || 
        timeString.includes('am') || timeString.includes('pm')) {
        return timeString;
    }
    
    const match = timeString.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
    if (!match) return timeString;
    
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    let ampm = match[3] ? match[3].toUpperCase() : '';
    
    if (!ampm) {
        if (hours >= 12) {
            ampm = hours > 12 ? 'PM' : 'PM';
            hours = hours > 12 ? hours - 12 : hours;
        } else {
            ampm = 'AM';
            hours = hours === 0 ? 12 : hours;
        }
    }
    
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

showSuccessMessage(guestLink, propertyName) {
    console.log("🔄 Showing success message...");
    const propertyConfig = document.getElementById('propertyConfig');
    const successMessage = document.getElementById('successMessage');
    
    if (propertyConfig) propertyConfig.style.display = 'none';
    if (successMessage) {
        successMessage.style.display = 'block';
        
        // Clear any existing preview content
        const existingPreview = successMessage.querySelector('.saved-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        const previewHtml = `
            <div style="text-align: left; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #2ecc71;">
                <h4 style="color: #2c3e50; margin-bottom: 15px;">✅ Configuration Saved!</h4>
                
                <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h5 style="margin-top: 0; color: #3498db;">📋 Guest Link:</h5>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <input type="text" id="guestLinkInput" readonly value="${guestLink}" 
                               style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white; font-family: monospace;">
                        <button id="copyLinkBtn" 
                                style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <p style="font-size: 0.9em; color: #7f8c8d; margin-top: 8px; margin-bottom: 0;">
                        Share this link with your guests. They can open it on ANY device (iPhone, Android, computer)!
                    </p>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 15px;">
                    <h5 style="color: #2c3e50; margin-bottom: 10px;">📝 What was saved:</h5>
                    <p><strong>Property Name:</strong> ${propertyName}</p>
                    <p><strong>Recommendations:</strong> ${this.recommendations.length} places saved</p>
                    <p><strong>Appliances:</strong> ${this.appliances.length} appliances saved</p>
                </div>
            </div>
        `;
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'saved-preview';
        previewDiv.innerHTML = previewHtml;
        
        // Find the button to insert before, or just append
        const button = successMessage.querySelector('button:not(#copyLinkBtn)');
        if (button && button.parentNode === successMessage) {
            successMessage.insertBefore(previewDiv, button);
        } else {
            // Just append if button doesn't exist or isn't a direct child
            successMessage.insertBefore(previewDiv, successMessage.firstChild);
        }
        
        // Attach copy button handler (after DOM is updated)
        setTimeout(() => {
            const copyBtn = document.getElementById('copyLinkBtn');
            const linkInput = document.getElementById('guestLinkInput');
            if (copyBtn && linkInput) {
                copyBtn.addEventListener('click', function() {
                    linkInput.select();
                    linkInput.setSelectionRange(0, 99999); // For mobile devices
                    try {
                        document.execCommand('copy');
                        // Try modern clipboard API
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(guestLink).then(() => {
                                const originalText = copyBtn.innerHTML;
                                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                                copyBtn.style.background = '#2ecc71';
                                setTimeout(() => {
                                    copyBtn.innerHTML = originalText;
                                    copyBtn.style.background = '#3498db';
                                }, 2000);
                            });
                        } else {
                            // Fallback for older browsers
                            const originalText = copyBtn.innerHTML;
                            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                            copyBtn.style.background = '#2ecc71';
                            setTimeout(() => {
                                copyBtn.innerHTML = originalText;
                                copyBtn.style.background = '#3498db';
                            }, 2000);
                        }
                    } catch (err) {
                        console.error('Failed to copy:', err);
                        alert('Failed to copy. Please select and copy manually.');
                    }
                });
                console.log('✅ Copy button handler attached');
            }
        }, 100);
    }
}

// FAQ Management
loadFAQs() {
    try {
        const saved = localStorage.getItem('rental_ai_faqs');
        this.faqs = saved ? JSON.parse(saved) : [];
        console.log(`❓ Loaded ${this.faqs.length} FAQs`);
    } catch (error) {
        console.error('Error loading FAQs:', error);
        this.faqs = [];
    }
}

async loadFAQsFromServer(propertyId) {
    try {
        const response = await fetch(`/api/analytics/property/${propertyId}/faqs`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.faqs && data.faqs.length > 0) {
                this.faqs = data.faqs.map(faq => ({
                    question: faq.question,
                    answer: faq.answer,
                    language: faq.language || 'en'
                }));
                localStorage.setItem('rental_ai_faqs', JSON.stringify(this.faqs));
                console.log(`❓ Loaded ${this.faqs.length} FAQs from server`);
            }
        }
    } catch (error) {
        console.error('Error loading FAQs from server:', error);
    }
}

updateFAQsList() {
    const container = document.getElementById('faqs-list');
    if (!container) return;
    
    if (this.faqs.length === 0) {
        const translations = this.getTranslation('noFAQs');
        container.innerHTML = `
            <div class="no-faqs">
                <i class="fas fa-question-circle"></i>
                <p>${translations}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = this.faqs.map((faq, index) => `
        <div class="faq-item">
            <div class="faq-item-header">
                <div class="faq-question-text">${escapeHtml(faq.question)}</div>
                <div class="faq-actions">
                    <button class="btn-small btn-edit" onclick="editFAQ(${index})" title="Edit FAQ">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="removeFAQ(${index})" title="Delete FAQ">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="faq-answer-text">${escapeHtml(faq.answer)}</div>
            <div class="faq-meta-info">
                <span class="faq-language-badge">${faq.language === 'es' ? '🇪🇸 Español' : faq.language === 'fr' ? '🇫🇷 Français' : '🇺🇸 English'}</span>
            </div>
        </div>
    `).join('');
}

addFAQ() {
    const questionInput = document.getElementById('faq-question');
    const answerInput = document.getElementById('faq-answer');
    const languageInput = document.getElementById('faq-language');
    
    if (!questionInput || !answerInput) return;
    
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    const language = languageInput ? languageInput.value : 'en';
    
    if (!question || !answer) {
        this.showTempMessage('Please enter both question and answer', 'warning');
        return;
    }
    
    const newFAQ = { question, answer, language };
    this.faqs.push(newFAQ);
    this.saveFAQs();
    this.updateFAQsList();
    
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }
    
    // Clear form
    questionInput.value = '';
    answerInput.value = '';
    if (languageInput) languageInput.value = 'en';
    
    this.showTempMessage('FAQ added successfully!', 'success');
}

editFAQ(index) {
    const faq = this.faqs[index];
    if (!faq) return;
    
    const questionInput = document.getElementById('faq-question');
    const answerInput = document.getElementById('faq-answer');
    const languageInput = document.getElementById('faq-language');
    
    if (questionInput) questionInput.value = faq.question;
    if (answerInput) answerInput.value = faq.answer;
    if (languageInput) languageInput.value = faq.language || 'en';
    
    // Remove the old FAQ
    this.faqs.splice(index, 1);
    this.updateFAQsList();
    
    // Scroll to form
    if (questionInput) {
        questionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        questionInput.focus();
    }
    
    this.showTempMessage('FAQ loaded for editing. Update and click "Add FAQ" to save.', 'info');
}

removeFAQ(index) {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
        return;
    }
    
    this.faqs.splice(index, 1);
    this.saveFAQs();
    this.updateFAQsList();
    
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }
    
    this.showTempMessage('FAQ removed', 'success');
}

saveFAQs() {
    try {
        localStorage.setItem('rental_ai_faqs', JSON.stringify(this.faqs));
        console.log(`❓ Saved ${this.faqs.length} FAQs`);
    } catch (error) {
        console.error('Error saving FAQs:', error);
    }
}

// Recommendations management
loadRecommendations() {
    try {
        const saved = localStorage.getItem('rental_ai_recommendations');
        this.recommendations = saved ? JSON.parse(saved) : [];
        console.log(`📍 Loaded ${this.recommendations.length} recommendations`);
    } catch (error) {
        console.error('Error loading recommendations:', error);
        this.recommendations = [];
    }
}

updateRecommendationsList() {
    const container = document.getElementById('recommendations-list');
    if (!container) {
        console.warn('⚠️ recommendations-list container not found');
        return;
    }
    
    console.log('🔄 updateRecommendationsList called with:', {
        count: this.recommendations.length,
        recommendations: this.recommendations
    });
    
    if (this.recommendations.length === 0) {
        const translations = this.getTranslation('noRecommendations');
        container.innerHTML = `<div class="no-recommendations"><p>${translations}</p></div>`;
        console.log('⚠️ No recommendations to display');
        return;
    }

    container.innerHTML = this.recommendations.map((place, index) => {
        console.log(`📍 Rendering recommendation ${index + 1}:`, place);
        return `
        <div class="recommendation-item">
            <div class="place-info">
                <div class="place-header">
                    <strong>${place.name || 'Unnamed Place'}</strong>
                    ${place.category ? `<span class="category-badge">${place.category}</span>` : ''}
                </div>
                ${place.description ? `<div class="place-description">${place.description}</div>` : ''}
                ${place.notes ? `<div class="place-notes">💡 ${place.notes}</div>` : ''}
            </div>
            <button class="btn-danger" onclick="propertySetup.removeRecommendation(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    }).join('');
    
    console.log(`✅ Updated recommendations list with ${this.recommendations.length} items`);
}

addRecommendation() {
    const nameInput = document.getElementById('place-name');
    const categoryInput = document.getElementById('place-category');
    const descriptionInput = document.getElementById('place-description');
    const notesInput = document.getElementById('place-notes');

    if (!nameInput || !categoryInput) return;

    const name = nameInput.value.trim();
    const category = categoryInput.value;
    const description = descriptionInput?.value.trim() || '';
    const notes = notesInput?.value.trim() || '';

    if (!name) {
        this.showTempMessage('Please enter a place name', 'warning');
        return;
    }

    const newPlace = { name, category, description, notes };
    console.log('➕ Adding new recommendation:', newPlace);
    console.log('📋 Current recommendations before add:', this.recommendations.length);
    
    this.recommendations.push(newPlace);
    console.log('📋 Current recommendations after add:', this.recommendations.length);
    console.log('📋 All recommendations:', JSON.stringify(this.recommendations, null, 2));
    
    // Clear form inputs
    if (nameInput) nameInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (notesInput) notesInput.value = '';
    if (categoryInput) categoryInput.value = '';
    
    // Save to localStorage
    this.saveRecommendations();
    
    // Update the UI immediately - use setTimeout to ensure DOM is ready
    setTimeout(() => {
        this.updateRecommendationsList();
        console.log('✅ Recommendation list UI updated');
    }, 100);
    
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }

    this.showTempMessage(`Added ${name} to recommendations`, 'success');
    console.log('✅ Recommendation added successfully');

    if (nameInput) nameInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (notesInput) notesInput.value = '';

    this.showTempMessage('Recommendation added successfully!', 'success');
}

removeRecommendation(index) {
    if (confirm('Are you sure you want to remove this recommendation?')) {
        this.recommendations.splice(index, 1);
        this.saveRecommendations();
        this.updateRecommendationsList();
        // Update preview if on step 3
        if (this.currentStep === 3) {
            this.updatePreview();
        }
        this.showTempMessage('Recommendation removed', 'success');
    }
}

saveRecommendations() {
    try {
        console.log('💾 Saving recommendations to localStorage:', this.recommendations.length);
        console.log('💾 Recommendations data:', JSON.stringify(this.recommendations, null, 2));
        localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
        console.log('✅ Recommendations saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving recommendations:', error);
    }
}

// Appliance management
loadAppliances() {
    try {
        const saved = localStorage.getItem('rental_ai_appliances');
        this.appliances = saved ? JSON.parse(saved) : [];
        console.log(`🛠️ Loaded ${this.appliances.length} appliances`);
    } catch (error) {
        console.error('Error loading appliances:', error);
        this.appliances = [];
    }
}

updateAppliancesList() {
    const container = document.getElementById('appliances-list');
    if (!container) return;
    
    if (this.appliances.length === 0) {
        const translations = this.getTranslation('noAppliances');
        container.innerHTML = `<div class="no-appliances"><p>${translations}</p></div>`;
        return;
    }

    container.innerHTML = this.appliances.map((appliance, index) => `
        <div class="appliance-item">
            <div class="appliance-info">
                <div class="appliance-header">
                    <strong>${appliance.name}</strong>
                    <span class="type-badge">${appliance.type}</span>
                </div>
                ${appliance.photo ? `<div><img src="${appliance.photo}" alt="${appliance.name}"></div>` : ''}
                <div class="appliance-instructions">${appliance.instructions}</div>
                ${appliance.troubleshooting ? `<div class="appliance-troubleshooting"><strong>Troubleshooting:</strong><br>${appliance.troubleshooting}</div>` : ''}
            </div>
            <button class="btn-danger" onclick="propertySetup.removeAppliance(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

addAppliance() {
    const nameInput = document.getElementById('appliance-name');
    const typeInput = document.getElementById('appliance-type');
    const instructionsInput = document.getElementById('appliance-instructions');
    const troubleshootingInput = document.getElementById('appliance-troubleshooting');
    const photoInput = document.getElementById('appliance-photo');

    const name = nameInput.value.trim();
    const type = typeInput.value;
    const instructions = instructionsInput.value.trim();
    const photo = photoInput ? photoInput.value.trim() : '';
    const troubleshooting = troubleshootingInput.value.trim();

    if (!name || !instructions) {
        this.showTempMessage('Please enter appliance name and instructions', 'warning');
        return;
    }

    const newAppliance = { name, type, instructions, photo: photo || null, troubleshooting: troubleshooting || null };
    this.appliances.push(newAppliance);
    this.saveAppliances();
    this.updateAppliancesList();
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }

    nameInput.value = '';
    instructionsInput.value = '';
    troubleshootingInput.value = '';
    if (photoInput) photoInput.value = '';

    this.showTempMessage('Appliance added successfully!', 'success');
}

removeAppliance(index) {
    if (confirm('Are you sure you want to remove this appliance?')) {
        this.appliances.splice(index, 1);
        this.saveAppliances();
        this.updateAppliancesList();
        this.showTempMessage('Appliance removed', 'success');
    }
}

saveAppliances() {
    try {
        localStorage.setItem('rental_ai_appliances', JSON.stringify(this.appliances));
    } catch (error) {
        console.error('Error saving appliances:', error);
    }
}

showTempMessage(text, type = 'success') {
    console.log(`🔄 Showing temp message: ${text}`);
    const message = document.createElement('div');
    const backgroundColor = type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#2ecc71';
    
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${backgroundColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
    `;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
        if (message.parentNode) message.parentNode.removeChild(message);
    }, 4000);
}

setupAdditionalButtons() {
    this.setupResetButton();
    this.setupBackupButton();
}

setupResetButton() {
    if (document.getElementById('resetBtn')) return;
    
    const resetBtn = document.createElement('button');
    resetBtn.id = 'resetBtn';
    resetBtn.className = 'btn btn-danger';
    resetBtn.innerHTML = '<i class="fas fa-trash"></i> Reset All Data';
    
    // Add to nav buttons area, next to Download Backup
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        // Find or create a container for utility buttons (Reset, Backup)
        let utilityButtons = document.getElementById('utilityButtons');
        if (!utilityButtons) {
            utilityButtons = document.createElement('div');
            utilityButtons.id = 'utilityButtons';
            utilityButtons.style.cssText = 'display: flex; gap: 10px; width: 100%; margin-top: 10px;';
            navButtons.appendChild(utilityButtons);
        }
        utilityButtons.appendChild(resetBtn);
    }
    
    resetBtn.addEventListener('click', () => {
        if (confirm('⚠️ WARNING: This will delete ALL your property data. Are you sure?')) {
            localStorage.removeItem('rentalAIPropertyConfig');
            localStorage.removeItem('rental_ai_appliances');
            localStorage.removeItem('rental_ai_recommendations');
            
            document.querySelectorAll('input, textarea, select').forEach(field => {
                if (field.type !== 'button' && field.type !== 'submit') {
                    field.value = '';
                }
            });
            
            this.currentStep = 1;
            this.updateStepDisplay();
            this.appliances = [];
            this.recommendations = [];
            this.updateAppliancesList();
            this.updateRecommendationsList();
            
            this.showTempMessage('All data has been reset.', 'success');
        }
    });
}

setupBackupButton() {
    if (document.getElementById('backupBtn')) return;
    
    const backupBtn = document.createElement('button');
    backupBtn.id = 'backupBtn';
    backupBtn.className = 'btn btn-info';
    backupBtn.innerHTML = '<i class="fas fa-download"></i> Download Backup';
    backupBtn.style.marginLeft = '10px';
    
    // Add to nav buttons area, next to Reset button
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        // Find or create a container for utility buttons (Reset, Backup)
        let utilityButtons = document.getElementById('utilityButtons');
        if (!utilityButtons) {
            utilityButtons = document.createElement('div');
            utilityButtons.id = 'utilityButtons';
            utilityButtons.style.cssText = 'display: flex; gap: 10px; width: 100%; margin-top: 10px;';
            navButtons.appendChild(utilityButtons);
        }
        utilityButtons.appendChild(backupBtn);
    }
    
    backupBtn.addEventListener('click', () => {
        const config = {
            property: JSON.parse(localStorage.getItem('rentalAIPropertyConfig') || '{}'),
            appliances: JSON.parse(localStorage.getItem('rental_ai_appliances') || '[]'),
            recommendations: JSON.parse(localStorage.getItem('rental_ai_recommendations') || '[]'),
            faqs: JSON.parse(localStorage.getItem('rental_ai_faqs') || '[]'),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `rental-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showTempMessage('Backup downloaded!', 'success');
    });
}

setupNavButtonScroll() {
    // Buttons are now always visible, so we don't need scroll detection
    // But we can still use this to ensure buttons are visible
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.classList.add('visible');
    }
}

// Property management methods
populatePropertySelector() {
    const selector = document.getElementById('propertySelector');
    const selectorWrapper = document.getElementById('propertySelectorWrapper');
    const newPropertyBtn = document.getElementById('newPropertyBtn');
    
    if (!selector) return;
    
    // Clear existing options
    selector.innerHTML = '';
    
    if (this.allProperties && this.allProperties.length > 0) {
        // Deduplicate properties by propertyId/id
        const seenIds = new Set();
        const uniqueProperties = this.allProperties.filter(property => {
            const propertyId = property.propertyId || property.id;
            if (!propertyId || seenIds.has(propertyId)) {
                return false; // Skip duplicates
            }
            seenIds.add(propertyId);
            return true;
        });
        
        console.log(`📋 Total properties: ${this.allProperties.length}, Unique: ${uniqueProperties.length}`);
        
        // Add each unique property as an option
        uniqueProperties.forEach(property => {
            const option = document.createElement('option');
            const propertyId = property.propertyId || property.id;
            option.value = propertyId;
            option.textContent = property.name || 'Unnamed Property';
            if (propertyId === this.currentPropertyId) {
                option.selected = true;
            }
            selector.appendChild(option);
        });
        
        // Show selector wrapper and new property button
        if (selectorWrapper) {
            selectorWrapper.style.display = 'block';
        }
        if (newPropertyBtn) {
            newPropertyBtn.style.display = 'inline-flex';
        }
    } else {
        // No properties, hide selector wrapper
        if (selectorWrapper) {
            selectorWrapper.style.display = 'none';
        }
        if (newPropertyBtn) {
            newPropertyBtn.style.display = 'inline-flex'; // Still show new property button
        }
    }
}

async switchProperty(propertyId) {
    if (!propertyId) return;
    
    console.log(`🔄 Switching to property: ${propertyId}`);
    
    // Find the property in allProperties
    const property = this.allProperties.find(p => 
        (p.propertyId || p.id) === propertyId
    );
    
    if (!property) {
        console.error(`❌ Property ${propertyId} not found`);
        this.showTempMessage('Property not found', 'error');
        return;
    }
    
    // Update current property ID
    this.currentPropertyId = propertyId;
    
    // Clear form
    this.clearForm();
    
    // Load property data
    this.populateFormFromConfig(property);
    
    // Load recommendations, appliances, and FAQs
    console.log('🔍 switchProperty - Checking recommendations:', {
        hasRecommendations: !!property.recommendations,
        isArray: Array.isArray(property.recommendations),
        value: property.recommendations
    });
    
    if (property.recommendations && Array.isArray(property.recommendations)) {
        this.recommendations = property.recommendations;
        localStorage.setItem('rental_ai_recommendations', JSON.stringify(property.recommendations));
        console.log(`📍 Loaded ${this.recommendations.length} recommendations when switching property`);
        console.log(`📍 Recommendations data:`, JSON.stringify(this.recommendations, null, 2));
    } else {
        console.log('⚠️ No recommendations found when switching property');
        this.recommendations = [];
    }
    
    // Update UI with a small delay to ensure DOM is ready
    setTimeout(() => {
        this.updateRecommendationsList();
    }, 100);
    
    if (property.appliances && Array.isArray(property.appliances)) {
        this.appliances = property.appliances;
        this.updateAppliancesList();
    } else {
        this.appliances = [];
        this.updateAppliancesList();
    }
    
    if (property.faqs && Array.isArray(property.faqs)) {
        this.faqs = property.faqs;
        this.updateFAQsList();
    } else {
        this.faqs = [];
        this.updateFAQsList();
    }
    
    // Update selector to show current property
    const selector = document.getElementById('propertySelector');
    if (selector) {
        selector.value = propertyId;
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Go to step 1
    this.currentStep = 1;
    this.updateStepDisplay();
    
    this.showTempMessage(`Switched to ${property.name}`, 'success');
    console.log(`✅ Switched to property: ${property.name}`);
}

// Language management
updateUIForLanguage(lang) {
    const translations = {
        en: {
            subtitle: 'Property Setup',
            newProperty: 'New Property',
            viewAnalytics: 'View Analytics',
            setupSteps: 'Setup GuestBud in 3 simple steps',
            step1: 'Basic Info',
            step2: 'Details',
            step3: 'Review',
            basicInfo: 'Basic Property Information',
            propertyName: 'Property Name *',
            propertyNamePlaceholder: 'e.g., Sunset Beach Villa',
            propertyNameHelp: 'This will be displayed to your guests',
            propertyAddress: 'Property Address *',
            propertyAddressPlaceholder: 'e.g., 123 Ocean View Drive, Miami Beach, FL 33139',
            propertyType: 'Property Type *',
            selectPropertyType: 'Select a property type',
            propertyTypeValidation: 'Please select a property type',
            contactInfo: 'Contact Information',
            hostContact: 'Host Contact Information *',
            hostContactPlaceholder: 'e.g., John Smith - (555) 123-4567',
            hostContactHelp: 'How guests can reach you directly',
            maintenanceContact: 'Maintenance Contact *',
            maintenanceContactPlaceholder: 'e.g., (555) 987-6543 (24/7)',
            checkinCheckout: 'Check-in & Check-out',
            checkinTime: 'Check-in Time *',
            checkinTimePlaceholder: 'e.g., 3:00 PM',
            checkoutTime: 'Check-out Time *',
            checkoutTimePlaceholder: 'e.g., 11:00 AM',
            lateCheckout: 'Late Check-out Policy',
            lateCheckoutPlaceholder: 'e.g., Available upon request ($50 fee after 1 PM)',
            amenitiesWifi: 'Amenities & WiFi',
            wifiDetails: 'WiFi Details *',
            wifiDetailsPlaceholder: 'e.g., Network: VillaChamitos_Guest, Password: Welcome2024',
            wifiDetailsHelp: 'Your guests will need this information to connect to WiFi',
            wifiExamples: 'Example WiFi formats:',
            keyAmenities: 'Key Amenities *',
            amenitiesPlaceholder: 'Enter each amenity on a new line or separated by commas',
            amenitiesHelp: 'List the most important amenities your guests should know about',
            houseRules: 'House Rules',
            houseRulesLabel: 'House Rules *',
            houseRulesPlaceholder: 'Enter each house rule on a new line',
            houseRulesHelp: 'List your specific house rules for guests to follow. These will be shared when guests ask about rules.',
            previous: 'Previous',
            next: 'Next',
            save: 'Save',
            saveConfiguration: 'Save Configuration',
            addRecommendation: 'Add Recommendation',
            yourCurrentRecommendations: 'Your Current Recommendations',
            noRecommendations: 'No recommendations yet. Add some to help your guests discover local gems!',
            recommendationName: 'Name/Title *',
            recommendationNamePlaceholder: 'e.g., Toto Beach',
            recommendationDescription: 'Description',
            recommendationDescriptionPlaceholder: 'e.g., Beautiful beach with white sand and clear water',
            recommendationCategory: 'Category',
            recommendationNotes: 'Additional Notes',
            recommendationNotesPlaceholder: 'e.g., Best time to visit: early morning',
            addAppliance: 'Add Appliance',
            yourCurrentAppliances: 'Your Appliance Instructions',
            noAppliances: 'No appliances added yet. Add some above to help guests!',
            applianceName: 'Appliance Name *',
            applianceNamePlaceholder: 'e.g., Washing Machine',
            applianceInstructions: 'Instructions *',
            applianceInstructionsPlaceholder: 'e.g., Use delicate cycle for clothes. Detergent is in the cabinet above.',
            addFAQ: 'Add FAQ',
            yourCurrentFAQs: 'Your Current FAQs',
            noFAQs: 'No FAQs added yet. Add some above to help your guests!',
            faqQuestion: 'Question *',
            faqQuestionPlaceholder: 'e.g., What time is check-in?',
            faqAnswer: 'Answer *',
            faqAnswerPlaceholder: 'e.g., Check-in is at 3:00 PM. You can check in anytime after 3 PM.',
            faqLanguage: 'Language',
            remove: 'Remove',
            edit: 'Edit'
        },
        es: {
            subtitle: 'Configuración de Propiedad',
            newProperty: 'Nueva Propiedad',
            viewAnalytics: 'Ver Analíticas',
            setupSteps: 'Configura GuestBud en 3 pasos simples',
            step1: 'Información Básica',
            step2: 'Detalles',
            step3: 'Revisar',
            basicInfo: 'Información Básica de la Propiedad',
            propertyName: 'Nombre de la Propiedad *',
            propertyNamePlaceholder: 'ej., Villa Playa Sunset',
            propertyNameHelp: 'Esto se mostrará a tus huéspedes',
            propertyAddress: 'Dirección de la Propiedad *',
            propertyAddressPlaceholder: 'ej., 123 Ocean View Drive, Miami Beach, FL 33139',
            propertyType: 'Tipo de Propiedad *',
            selectPropertyType: 'Selecciona un tipo de propiedad',
            propertyTypeValidation: 'Por favor selecciona un tipo de propiedad',
            contactInfo: 'Información de Contacto',
            hostContact: 'Información de Contacto del Anfitrión *',
            hostContactPlaceholder: 'ej., Juan Pérez - (555) 123-4567',
            hostContactHelp: 'Cómo los huéspedes pueden contactarte directamente',
            maintenanceContact: 'Contacto de Mantenimiento *',
            maintenanceContactPlaceholder: 'ej., (555) 987-6543 (24/7)',
            checkinCheckout: 'Check-in y Check-out',
            checkinTime: 'Hora de Check-in *',
            checkinTimePlaceholder: 'ej., 3:00 PM',
            checkoutTime: 'Hora de Check-out *',
            checkoutTimePlaceholder: 'ej., 11:00 AM',
            lateCheckout: 'Política de Check-out Tardío',
            lateCheckoutPlaceholder: 'ej., Disponible bajo solicitud ($50 después de la 1 PM)',
            amenitiesWifi: 'Amenidades y WiFi',
            wifiDetails: 'Detalles de WiFi *',
            wifiDetailsPlaceholder: 'ej., Red: VillaChamitos_Guest, Contraseña: Bienvenido2024',
            wifiDetailsHelp: 'Tus huéspedes necesitarán esta información para conectarse al WiFi',
            wifiExamples: 'Ejemplos de formatos WiFi:',
            keyAmenities: 'Amenidades Principales *',
            amenitiesPlaceholder: 'Ingresa cada amenidad en una nueva línea o separadas por comas',
            amenitiesHelp: 'Lista las amenidades más importantes que tus huéspedes deben conocer',
            houseRules: 'Reglas de la Casa',
            houseRulesLabel: 'Reglas de la Casa *',
            houseRulesPlaceholder: 'Ingresa cada regla en una nueva línea',
            houseRulesHelp: 'Lista tus reglas específicas para que los huéspedes las sigan. Estas se compartirán cuando los huéspedes pregunten sobre las reglas.',
            previous: 'Anterior',
            next: 'Siguiente',
            save: 'Guardar',
            saveConfiguration: 'Guardar Configuración',
            addRecommendation: 'Agregar Recomendación',
            yourCurrentRecommendations: 'Tus Recomendaciones Actuales',
            noRecommendations: 'Aún no hay recomendaciones. ¡Agrega algunas para ayudar a tus huéspedes a descubrir lugares locales!',
            recommendationName: 'Nombre/Título *',
            recommendationNamePlaceholder: 'ej., Playa Toto',
            recommendationDescription: 'Descripción',
            recommendationDescriptionPlaceholder: 'ej., Hermosa playa con arena blanca y agua cristalina',
            recommendationCategory: 'Categoría',
            recommendationNotes: 'Notas Adicionales',
            recommendationNotesPlaceholder: 'ej., Mejor hora para visitar: temprano en la mañana',
            addAppliance: 'Agregar Electrodoméstico',
            yourCurrentAppliances: 'Tus Instrucciones de Electrodomésticos',
            noAppliances: 'Aún no se han agregado electrodomésticos. ¡Agrega algunos arriba para ayudar a los huéspedes!',
            applianceName: 'Nombre del Electrodoméstico *',
            applianceNamePlaceholder: 'ej., Lavadora',
            applianceInstructions: 'Instrucciones *',
            applianceInstructionsPlaceholder: 'ej., Usa ciclo delicado para la ropa. El detergente está en el gabinete de arriba.',
            addFAQ: 'Agregar FAQ',
            yourCurrentFAQs: 'Tus FAQs Actuales',
            noFAQs: 'Aún no se han agregado FAQs. ¡Agrega algunas arriba para ayudar a tus huéspedes!',
            faqQuestion: 'Pregunta *',
            faqQuestionPlaceholder: 'ej., ¿A qué hora es el check-in?',
            faqAnswer: 'Respuesta *',
            faqAnswerPlaceholder: 'ej., El check-in es a las 3:00 PM. Puedes hacer check-in en cualquier momento después de las 3 PM.',
            faqLanguage: 'Idioma',
            remove: 'Eliminar',
            edit: 'Editar'
        },
        fr: {
            subtitle: 'Configuration de la Propriété',
            newProperty: 'Nouvelle Propriété',
            viewAnalytics: 'Voir les Analyses',
            setupSteps: 'Configurez GuestBud en 3 étapes simples',
            step1: 'Informations de Base',
            step2: 'Détails',
            step3: 'Révision',
            basicInfo: 'Informations de Base sur la Propriété',
            propertyName: 'Nom de la Propriété *',
            propertyNamePlaceholder: 'ex., Villa Plage Sunset',
            propertyNameHelp: 'Ceci sera affiché à vos invités',
            propertyAddress: 'Adresse de la Propriété *',
            propertyAddressPlaceholder: 'ex., 123 Ocean View Drive, Miami Beach, FL 33139',
            propertyType: 'Type de Propriété *',
            selectPropertyType: 'Sélectionnez un type de propriété',
            propertyTypeValidation: 'Veuillez sélectionner un type de propriété',
            contactInfo: 'Informations de Contact',
            hostContact: 'Informations de Contact de l\'Hôte *',
            hostContactPlaceholder: 'ex., Jean Dupont - (555) 123-4567',
            hostContactHelp: 'Comment les invités peuvent vous contacter directement',
            maintenanceContact: 'Contact de Maintenance *',
            maintenanceContactPlaceholder: 'ex., (555) 987-6543 (24/7)',
            checkinCheckout: 'Enregistrement et Départ',
            checkinTime: 'Heure d\'Enregistrement *',
            checkinTimePlaceholder: 'ex., 15:00',
            checkoutTime: 'Heure de Départ *',
            checkoutTimePlaceholder: 'ex., 11:00',
            lateCheckout: 'Politique de Départ Tardif',
            lateCheckoutPlaceholder: 'ex., Disponible sur demande (50$ après 13h)',
            amenitiesWifi: 'Équipements et WiFi',
            wifiDetails: 'Détails WiFi *',
            wifiDetailsPlaceholder: 'ex., Réseau: VillaChamitos_Guest, Mot de passe: Bienvenue2024',
            wifiDetailsHelp: 'Vos invités auront besoin de ces informations pour se connecter au WiFi',
            wifiExamples: 'Exemples de formats WiFi:',
            keyAmenities: 'Équipements Principaux *',
            amenitiesPlaceholder: 'Entrez chaque équipement sur une nouvelle ligne ou séparés par des virgules',
            amenitiesHelp: 'Listez les équipements les plus importants que vos invités devraient connaître',
            houseRules: 'Règles de la Maison',
            houseRulesLabel: 'Règles de la Maison *',
            houseRulesPlaceholder: 'Entrez chaque règle sur une nouvelle ligne',
            houseRulesHelp: 'Listez vos règles spécifiques pour que les invités les suivent. Celles-ci seront partagées lorsque les invités demanderont des règles.',
            previous: 'Précédent',
            next: 'Suivant',
            save: 'Enregistrer',
            saveConfiguration: 'Enregistrer la Configuration',
            addRecommendation: 'Ajouter une Recommandation',
            yourCurrentRecommendations: 'Vos Recommandations Actuelles',
            noRecommendations: 'Aucune recommandation pour le moment. Ajoutez-en pour aider vos invités à découvrir des endroits locaux!',
            recommendationName: 'Nom/Titre *',
            recommendationNamePlaceholder: 'ex., Plage Toto',
            recommendationDescription: 'Description',
            recommendationDescriptionPlaceholder: 'ex., Belle plage avec sable blanc et eau claire',
            recommendationCategory: 'Catégorie',
            recommendationNotes: 'Notes Supplémentaires',
            recommendationNotesPlaceholder: 'ex., Meilleur moment pour visiter: tôt le matin',
            addAppliance: 'Ajouter un Appareil',
            yourCurrentAppliances: 'Vos Instructions d\'Appareils',
            noAppliances: 'Aucun appareil ajouté pour le moment. Ajoutez-en ci-dessus pour aider les invités!',
            applianceName: 'Nom de l\'Appareil *',
            applianceNamePlaceholder: 'ex., Machine à Laver',
            applianceInstructions: 'Instructions *',
            applianceInstructionsPlaceholder: 'ex., Utilisez le cycle délicat pour les vêtements. La lessive est dans le placard au-dessus.',
            addFAQ: 'Ajouter une FAQ',
            yourCurrentFAQs: 'Vos FAQs Actuelles',
            noFAQs: 'Aucune FAQ ajoutée pour le moment. Ajoutez-en ci-dessus pour aider vos invités!',
            faqQuestion: 'Question *',
            faqQuestionPlaceholder: 'ex., À quelle heure est l\'enregistrement?',
            faqAnswer: 'Réponse *',
            faqAnswerPlaceholder: 'ex., L\'enregistrement est à 15h00. Vous pouvez vous enregistrer à tout moment après 15h.',
            faqLanguage: 'Langue',
            remove: 'Supprimer',
            edit: 'Modifier'
        }
    };
    
    const t = translations[lang] || translations.en;
    
    // Update header
    const subtitle = document.getElementById('adminSubtitle');
    if (subtitle) subtitle.textContent = t.subtitle;
    
    const newPropertyBtn = document.getElementById('newPropertyBtn');
    if (newPropertyBtn) {
        newPropertyBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.newProperty}`;
    }
    
    const viewAnalytics = document.querySelector('a[href="/analytics.html"]');
    if (viewAnalytics) {
        viewAnalytics.innerHTML = `<i class="fas fa-chart-line"></i> ${t.viewAnalytics}`;
    }
    
    const setupStepsText = document.querySelector('.admin-header p');
    if (setupStepsText) setupStepsText.textContent = t.setupSteps;
    
    // Update step labels
    const step1Text = document.querySelector('#step1 .step-text');
    if (step1Text) step1Text.textContent = t.step1;
    const step2Text = document.querySelector('#step2 .step-text');
    if (step2Text) step2Text.textContent = t.step2;
    const step3Text = document.querySelector('#step3 .step-text');
    if (step3Text) step3Text.textContent = t.step3;
    
    // Update form labels and placeholders
    this.updateFormLabels(t);
}

updateFormLabels(t) {
    // Step 1: Basic Information
    const basicInfoH3 = document.querySelector('#section1 h3');
    if (basicInfoH3) basicInfoH3.innerHTML = `<i class="fas fa-home"></i> ${t.basicInfo}`;
    
    const propertyNameLabel = document.querySelector('label[for="propertyName"]');
    if (propertyNameLabel) propertyNameLabel.textContent = t.propertyName;
    const propertyNameInput = document.getElementById('propertyName');
    if (propertyNameInput) propertyNameInput.placeholder = t.propertyNamePlaceholder;
    const propertyNameHelp = document.querySelector('#propertyName').nextElementSibling;
    if (propertyNameHelp && propertyNameHelp.classList.contains('form-help')) {
        propertyNameHelp.textContent = t.propertyNameHelp;
    }
    
    const propertyAddressLabel = document.querySelector('label[for="propertyAddress"]');
    if (propertyAddressLabel) propertyAddressLabel.textContent = t.propertyAddress;
    const propertyAddressInput = document.getElementById('propertyAddress');
    if (propertyAddressInput) propertyAddressInput.placeholder = t.propertyAddressPlaceholder;
    
    const propertyTypeLabel = document.querySelector('label[for="propertyType"]');
    if (propertyTypeLabel) propertyTypeLabel.textContent = t.propertyType;
    const propertyTypeSelect = document.getElementById('propertyType');
    if (propertyTypeSelect && propertyTypeSelect.firstElementChild) {
        propertyTypeSelect.firstElementChild.textContent = t.selectPropertyType;
    }
    const propertyTypeValidation = document.getElementById('propertyTypeValidation');
    if (propertyTypeValidation) propertyTypeValidation.textContent = t.propertyTypeValidation;
    
    // Step 2: Contact Information
    const contactInfoH3 = document.querySelector('#section2 h3');
    if (contactInfoH3) contactInfoH3.innerHTML = `<i class="fas fa-phone"></i> ${t.contactInfo}`;
    
    const hostContactLabel = document.querySelector('label[for="hostContact"]');
    if (hostContactLabel) hostContactLabel.textContent = t.hostContact;
    const hostContactInput = document.getElementById('hostContact');
    if (hostContactInput) hostContactInput.placeholder = t.hostContactPlaceholder;
    const hostContactHelp = document.querySelector('#hostContact').nextElementSibling;
    if (hostContactHelp && hostContactHelp.classList.contains('form-help')) {
        hostContactHelp.textContent = t.hostContactHelp;
    }
    
    const maintenanceContactLabel = document.querySelector('label[for="maintenanceContact"]');
    if (maintenanceContactLabel) maintenanceContactLabel.textContent = t.maintenanceContact;
    const maintenanceContactInput = document.getElementById('maintenanceContact');
    if (maintenanceContactInput) maintenanceContactInput.placeholder = t.maintenanceContactPlaceholder;
    
    const checkinCheckoutH3 = document.querySelector('#section2 h3:nth-of-type(2)');
    if (checkinCheckoutH3) checkinCheckoutH3.innerHTML = `<i class="fas fa-clock"></i> ${t.checkinCheckout}`;
    
    const checkinTimeLabel = document.querySelector('label[for="checkInTime"]');
    if (checkinTimeLabel) checkinTimeLabel.textContent = t.checkinTime;
    const checkinTimeInput = document.getElementById('checkInTime');
    if (checkinTimeInput) checkinTimeInput.placeholder = t.checkinTimePlaceholder;
    
    const checkoutTimeLabel = document.querySelector('label[for="checkOutTime"]');
    if (checkoutTimeLabel) checkoutTimeLabel.textContent = t.checkoutTime;
    const checkoutTimeInput = document.getElementById('checkOutTime');
    if (checkoutTimeInput) checkoutTimeInput.placeholder = t.checkoutTimePlaceholder;
    
    const lateCheckoutLabel = document.querySelector('label[for="lateCheckout"]');
    if (lateCheckoutLabel) lateCheckoutLabel.textContent = t.lateCheckout;
    const lateCheckoutInput = document.getElementById('lateCheckout');
    if (lateCheckoutInput) lateCheckoutInput.placeholder = t.lateCheckoutPlaceholder;
    
    // Step 3: Amenities & WiFi
    const amenitiesWifiH3 = document.querySelector('#section3 h3');
    if (amenitiesWifiH3) amenitiesWifiH3.innerHTML = `<i class="fas fa-wifi"></i> ${t.amenitiesWifi}`;
    
    const wifiDetailsLabel = document.querySelector('label[for="wifiDetails"]');
    if (wifiDetailsLabel) wifiDetailsLabel.textContent = t.wifiDetails;
    const wifiDetailsInput = document.getElementById('wifiDetails');
    if (wifiDetailsInput) wifiDetailsInput.placeholder = t.wifiDetailsPlaceholder;
    const wifiDetailsHelp = document.querySelector('#wifiDetails').nextElementSibling;
    if (wifiDetailsHelp && wifiDetailsHelp.classList.contains('form-help')) {
        wifiDetailsHelp.textContent = t.wifiDetailsHelp;
    }
    
    const keyAmenitiesLabel = document.querySelector('label[for="amenities"]');
    if (keyAmenitiesLabel) keyAmenitiesLabel.textContent = t.keyAmenities;
    const amenitiesTextarea = document.getElementById('amenities');
    if (amenitiesTextarea) amenitiesTextarea.placeholder = t.amenitiesPlaceholder;
    const amenitiesHelp = document.querySelector('#amenities').nextElementSibling;
    if (amenitiesHelp && amenitiesHelp.classList.contains('form-help')) {
        amenitiesHelp.textContent = t.amenitiesHelp;
    }
    
    const houseRulesH3 = document.querySelector('#section3 h3:nth-of-type(2)');
    if (houseRulesH3) houseRulesH3.innerHTML = `<i class="fas fa-clipboard-list"></i> ${t.houseRules}`;
    
    const houseRulesLabel = document.querySelector('label[for="houseRules"]');
    if (houseRulesLabel) houseRulesLabel.textContent = t.houseRulesLabel;
    const houseRulesTextarea = document.getElementById('houseRules');
    if (houseRulesTextarea) houseRulesTextarea.placeholder = t.houseRulesPlaceholder;
    const houseRulesHelp = document.querySelector('#houseRules').nextElementSibling;
    if (houseRulesHelp && houseRulesHelp.classList.contains('form-help')) {
        houseRulesHelp.textContent = t.houseRulesHelp;
    }
    
    // Recommendations section
    const addRecommendationBtn = document.querySelector('#addRecommendationBtn');
    if (addRecommendationBtn) addRecommendationBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.addRecommendation}`;
    const currentRecommendationsH4 = document.querySelector('.current-recommendations h4');
    if (currentRecommendationsH4) currentRecommendationsH4.textContent = t.yourCurrentRecommendations;
    const recommendationNameLabel = document.querySelector('label[for="recommendation-name"]');
    if (recommendationNameLabel) recommendationNameLabel.textContent = t.recommendationName;
    const recommendationNameInput = document.getElementById('recommendation-name');
    if (recommendationNameInput) recommendationNameInput.placeholder = t.recommendationNamePlaceholder;
    const recommendationDescriptionLabel = document.querySelector('label[for="recommendation-description"]');
    if (recommendationDescriptionLabel) recommendationDescriptionLabel.textContent = t.recommendationDescription;
    const recommendationDescriptionInput = document.getElementById('recommendation-description');
    if (recommendationDescriptionInput) recommendationDescriptionInput.placeholder = t.recommendationDescriptionPlaceholder;
    const recommendationCategoryLabel = document.querySelector('label[for="recommendation-category"]');
    if (recommendationCategoryLabel) recommendationCategoryLabel.textContent = t.recommendationCategory;
    const recommendationNotesLabel = document.querySelector('label[for="recommendation-notes"]');
    if (recommendationNotesLabel) recommendationNotesLabel.textContent = t.recommendationNotes;
    const recommendationNotesInput = document.getElementById('recommendation-notes');
    if (recommendationNotesInput) recommendationNotesInput.placeholder = t.recommendationNotesPlaceholder;
    
    // Appliances section
    const addApplianceBtn = document.querySelector('#addApplianceBtn');
    if (addApplianceBtn) addApplianceBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.addAppliance}`;
    const currentAppliancesH4 = document.querySelector('.current-appliances h4');
    if (currentAppliancesH4) currentAppliancesH4.textContent = t.yourCurrentAppliances;
    const applianceNameLabel = document.querySelector('label[for="appliance-name"]');
    if (applianceNameLabel) applianceNameLabel.textContent = t.applianceName;
    const applianceNameInput = document.getElementById('appliance-name');
    if (applianceNameInput) applianceNameInput.placeholder = t.applianceNamePlaceholder;
    const applianceInstructionsLabel = document.querySelector('label[for="appliance-instructions"]');
    if (applianceInstructionsLabel) applianceInstructionsLabel.textContent = t.applianceInstructions;
    const applianceInstructionsInput = document.getElementById('appliance-instructions');
    if (applianceInstructionsInput) applianceInstructionsInput.placeholder = t.applianceInstructionsPlaceholder;
    
    // FAQs section
    const addFAQBtn = document.getElementById('addFAQBtn');
    if (addFAQBtn) addFAQBtn.innerHTML = `<i class="fas fa-plus"></i> ${t.addFAQ}`;
    const currentFAQsH4 = document.querySelector('.current-faqs h4');
    if (currentFAQsH4) currentFAQsH4.textContent = t.yourCurrentFAQs;
    const faqQuestionLabel = document.querySelector('label[for="faq-question"]');
    if (faqQuestionLabel) faqQuestionLabel.textContent = t.faqQuestion;
    const faqQuestionInput = document.getElementById('faq-question');
    if (faqQuestionInput) faqQuestionInput.placeholder = t.faqQuestionPlaceholder;
    const faqAnswerLabel = document.querySelector('label[for="faq-answer"]');
    if (faqAnswerLabel) faqAnswerLabel.textContent = t.faqAnswer;
    const faqAnswerInput = document.getElementById('faq-answer');
    if (faqAnswerInput) faqAnswerInput.placeholder = t.faqAnswerPlaceholder;
    const faqLanguageLabel = document.querySelector('label[for="faq-language"]');
    if (faqLanguageLabel) faqLanguageLabel.textContent = t.faqLanguage;
    
    // Section headers and descriptions
    const recommendedPlacesH3 = document.querySelector('#section3 h3:nth-of-type(3)');
    if (recommendedPlacesH3) recommendedPlacesH3.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${t.recommendedPlaces}`;
    const recommendedPlacesDesc = document.querySelector('#section3 .section-description');
    if (recommendedPlacesDesc && recommendedPlacesDesc.textContent.includes('Add your favorite')) {
        recommendedPlacesDesc.textContent = t.recommendedPlacesDesc;
    }
    
    const applianceInstructionsH3 = document.querySelector('#section3 h3:nth-of-type(1)');
    if (applianceInstructionsH3 && applianceInstructionsH3.textContent.includes('Appliance')) {
        applianceInstructionsH3.innerHTML = `<i class="fas fa-tools"></i> ${t.applianceInstructions}`;
    }
    const applianceInstructionsDesc = document.querySelector('#section3 .section-description');
    if (applianceInstructionsDesc && applianceInstructionsDesc.textContent.includes('Add instructions for appliances')) {
        applianceInstructionsDesc.textContent = t.applianceInstructionsDesc;
    }
    
    const faqSectionH3 = document.querySelector('#section3 h3:nth-of-type(4)');
    if (faqSectionH3) faqSectionH3.innerHTML = `<i class="fas fa-question-circle"></i> ${t.faqSection}`;
    const faqSectionDesc = document.querySelector('.faq-management .section-description');
    if (faqSectionDesc) faqSectionDesc.textContent = t.faqSectionDesc;
    
    // Recommendation form labels
    const addNewRecommendationH4 = document.querySelector('.add-recommendation-form h4');
    if (addNewRecommendationH4) addNewRecommendationH4.textContent = t.addNewRecommendation;
    const placeNameLabel = document.querySelector('label[for="place-name"]');
    if (placeNameLabel) placeNameLabel.textContent = t.placeName;
    const placeNameInput = document.getElementById('place-name');
    if (placeNameInput) placeNameInput.placeholder = t.placeNamePlaceholder;
    const placeCategoryLabel = document.querySelector('label[for="place-category"]');
    if (placeCategoryLabel) placeCategoryLabel.textContent = t.placeCategory;
    const placeDescriptionLabel = document.querySelector('label[for="place-description"]');
    if (placeDescriptionLabel) placeDescriptionLabel.textContent = t.placeDescription;
    const placeDescriptionInput = document.getElementById('place-description');
    if (placeDescriptionInput) placeDescriptionInput.placeholder = t.placeDescriptionPlaceholder;
    const placeNotesLabel = document.querySelector('label[for="place-notes"]');
    if (placeNotesLabel) placeNotesLabel.textContent = t.placeNotes;
    const placeNotesInput = document.getElementById('place-notes');
    if (placeNotesInput) placeNotesInput.placeholder = t.placeNotesPlaceholder;
    
    // Appliance form labels
    const addNewApplianceH4 = document.querySelector('.add-appliance-form h4');
    if (addNewApplianceH4) addNewApplianceH4.textContent = t.addNewAppliance;
    const applianceTypeLabel = document.querySelector('label[for="appliance-type"]');
    if (applianceTypeLabel) applianceTypeLabel.textContent = t.applianceType;
    const troubleshootingLabel = document.querySelector('label[for="appliance-troubleshooting"]');
    if (troubleshootingLabel) troubleshootingLabel.textContent = t.troubleshootingTips;
    const troubleshootingInput = document.getElementById('appliance-troubleshooting');
    if (troubleshootingInput) troubleshootingInput.placeholder = t.troubleshootingPlaceholder;
    
    // FAQ form labels
    const addNewFAQH4 = document.querySelector('.add-faq-form h4');
    if (addNewFAQH4) addNewFAQH4.textContent = t.addNewFAQ;
    
    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${t.previous}`;
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.innerHTML = `${t.next} <i class="fas fa-arrow-right"></i>`;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerHTML = `<i class="fas fa-check"></i> ${t.save}`;
    
    // Update empty state messages
    this.updateEmptyStateMessages(t);
}

getTranslation(key) {
    const translations = {
        en: {
            noRecommendations: 'No recommendations yet. Add some to help your guests discover local gems!',
            noAppliances: 'No appliances added yet. Add some above to help guests!',
            noFAQs: 'No FAQs added yet. Add some above to help your guests!',
            remove: 'Remove',
            edit: 'Edit'
        },
        es: {
            noRecommendations: 'Aún no hay recomendaciones. ¡Agrega algunas para ayudar a tus huéspedes a descubrir lugares locales!',
            noAppliances: 'Aún no se han agregado electrodomésticos. ¡Agrega algunos arriba para ayudar a los huéspedes!',
            noFAQs: 'Aún no se han agregado FAQs. ¡Agrega algunas arriba para ayudar a tus huéspedes!',
            remove: 'Eliminar',
            edit: 'Editar'
        },
        fr: {
            noRecommendations: 'Aucune recommandation pour le moment. Ajoutez-en pour aider vos invités à découvrir des endroits locaux!',
            noAppliances: 'Aucun appareil ajouté pour le moment. Ajoutez-en ci-dessus pour aider les invités!',
            noFAQs: 'Aucune FAQ ajoutée pour le moment. Ajoutez-en ci-dessus pour aider vos invités!',
            remove: 'Supprimer',
            edit: 'Modifier'
        }
    };
    const lang = this.currentLanguage || 'en';
    return translations[lang]?.[key] || translations.en[key] || key;
}

createNewProperty() {
    // Clear current property ID to create a new one
    this.currentPropertyId = null;
    
    // Clear form
    this.clearForm();
    
    // Reset arrays
    this.recommendations = [];
    this.appliances = [];
    this.faqs = [];
    
    // Update UI
    this.updateRecommendationsList();
    this.updateAppliancesList();
    this.updateFAQsList();
    
    // Update selector
    const selector = document.getElementById('propertySelector');
    if (selector) {
        selector.value = '';
    }
    
    // Scroll to top and go to step 1
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentStep = 1;
    this.updateStepDisplay();
    
    this.showTempMessage('Creating new property - fill in the form and save', 'info');
    console.log('✅ Ready to create new property');
}

clearForm() {
    // Clear all form fields
    const form = document.getElementById('propertyConfig');
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
            input.classList.remove('field-valid', 'field-invalid');
        });
    }
}
}

// Make functions globally available
function addFAQ() {
    if (window.propertySetup) {
        window.propertySetup.addFAQ();
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function editFAQ(index) {
    if (window.propertySetup) {
        window.propertySetup.editFAQ(index);
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function removeFAQ(index) {
    if (window.propertySetup) {
        window.propertySetup.removeFAQ(index);
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions
function addRecommendation() {
    if (window.propertySetup) {
        window.propertySetup.addRecommendation();
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function addAppliance() {
    if (window.propertySetup) {
        window.propertySetup.addAppliance();
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    if (window.propertySetup) {
        window.propertySetup.showTempMessage('Link copied to clipboard!', 'success');
    }
}

// Make functions globally available
function addFAQ() {
    if (window.propertySetup) {
        window.propertySetup.addFAQ();
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function editFAQ(index) {
    if (window.propertySetup) {
        window.propertySetup.editFAQ(index);
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function removeFAQ(index) {
    if (window.propertySetup) {
        window.propertySetup.removeFAQ(index);
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// SIMPLE initialization - This may not fire if script loads dynamically
// So we also initialize in admin.html after script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM loaded - Checking if PropertySetup should initialize");
    
    // Only initialize if not already initialized and user is authenticated
    if (!window.propertySetup && typeof isAuthenticated === 'function' && isAuthenticated()) {
        try {
            console.log("🔄 Initializing PropertySetup from DOMContentLoaded...");
            window.propertySetup = new PropertySetup();
            console.log("✅ PropertySetup initialized successfully from DOMContentLoaded!");
        } catch (error) {
            console.error("❌ Error initializing PropertySetup:", error);
        }
    } else {
        if (window.propertySetup) {
            console.log("✅ PropertySetup already initialized");
        } else {
            console.log("🔒 User not authenticated or waiting for dynamic load");
        }
    }
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
    console.log("📄 DOM still loading, will initialize on DOMContentLoaded");
} else {
    // DOM is already loaded (script loaded dynamically)
    console.log("📄 DOM already loaded, initializing immediately");
    if (!window.propertySetup && typeof isAuthenticated === 'function' && isAuthenticated()) {
        try {
            window.propertySetup = new PropertySetup();
            console.log("✅ PropertySetup initialized immediately!");
        } catch (error) {
            console.error("❌ Error initializing PropertySetup immediately:", error);
        }
    }
}
