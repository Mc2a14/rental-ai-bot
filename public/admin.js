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
                    
                    // Store the property ID for updates - try multiple possible fields
                    this.currentPropertyId = property.propertyId || property.id || property.property_id;
                    console.log(`📌 Stored property ID for updates: ${this.currentPropertyId}`);
                    console.log(`📌 Total properties for user: ${data.properties.length}`);
                    
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
                    if (property.recommendations && Array.isArray(property.recommendations)) {
                        this.recommendations = property.recommendations;
                        localStorage.setItem('rental_ai_recommendations', JSON.stringify(property.recommendations));
                        console.log(`📍 Loaded ${this.recommendations.length} recommendations from server`);
                    } else {
                        console.log('⚠️ No recommendations found in property data');
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
                    this.updateRecommendationsList();
                    this.updateAppliancesList();
                    this.updateFAQsList();
                    
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
        container.innerHTML = `
            <div class="no-faqs">
                <i class="fas fa-question-circle"></i>
                <p>No FAQs yet. Add some to help guests find answers quickly!</p>
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
    if (!container) return;
    
    if (this.recommendations.length === 0) {
        container.innerHTML = `<div class="no-recommendations"><p>No recommendations yet. Add some to help your guests discover local gems!</p></div>`;
        return;
    }

    container.innerHTML = this.recommendations.map((place, index) => `
        <div class="recommendation-item">
            <div class="place-info">
                <div class="place-header">
                    <strong>${place.name}</strong>
                    <span class="category-badge">${place.category}</span>
                </div>
                ${place.description ? `<div class="place-description">${place.description}</div>` : ''}
                ${place.notes ? `<div class="place-notes">💡 ${place.notes}</div>` : ''}
            </div>
            <button class="btn-danger" onclick="propertySetup.removeRecommendation(${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
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
    this.recommendations.push(newPlace);
    this.saveRecommendations();
    this.updateRecommendationsList();
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }

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
        localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
    } catch (error) {
        console.error('Error saving recommendations:', error);
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
        container.innerHTML = `<div class="no-appliances"><p>No appliances added yet. Add some above to help guests!</p></div>`;
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
    resetBtn.style.marginLeft = '10px';
    
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) navButtons.appendChild(resetBtn);
    
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
    
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) navButtons.appendChild(backupBtn);
    
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
