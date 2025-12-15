console.log("🔄 admin.js loading...");

class PropertySetup {
   constructor() {
    console.log("✅ PropertySetup constructor called");
    this.currentStep = 1;
    this.totalSteps = 3;
    this.recommendations = [];
    this.appliances = [];
    this.faqs = []; // Store FAQs
    this.instructions = []; // Store general instructions (like FAQs)
    this.images = []; // Store images
    this.currentPropertyId = null; // Store the current property ID for updates
    this.allProperties = []; // Store all user properties for selector
    
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
        this.loadInstructions();
        this.loadImages();
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
    
    // Setup progress indicator
    this.setupProgressIndicator();
    
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
        
        // Add Instruction button
        const addInstructionBtn = document.getElementById('addInstructionBtn');
        if (addInstructionBtn) {
            addInstructionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("📝 Add Instruction button clicked");
                if (self) {
                    self.addInstruction();
                } else if (window.propertySetup) {
                    window.propertySetup.addInstruction();
                } else {
                    alert('System not ready. Please wait for page to load.');
                }
            });
            console.log("✅ Add Instruction button listener added");
        } else {
            console.log("⚠️ Add Instruction button not found");
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

calculateProgress() {
    // Define all fields and their weights
    const fields = {
        // Required fields (must be filled)
        required: [
            { id: 'propertyName', weight: 15 },
            { id: 'hostContact', weight: 15 },
            { id: 'checkInTime', weight: 15 },
            { id: 'checkOutTime', weight: 15 }
        ],
        // Optional fields (nice to have)
        optional: [
            { id: 'propertyAddress', weight: 5 },
            { id: 'propertyType', weight: 3 },
            { id: 'maintenanceContact', weight: 3 },
            { id: 'lateCheckout', weight: 2 },
            { id: 'wifiDetails', weight: 5 },
            { id: 'amenities', weight: 5 },
            { id: 'houseRules', weight: 5 },
            { id: 'recommendations', weight: 5, isArray: true },
            { id: 'appliances', weight: 5, isArray: true },
            { id: 'faqs', weight: 5, isArray: true },
            { id: 'instructions', weight: 5, isArray: true },
            { id: 'images', weight: 5, isArray: true }
        ]
    };
    
    let progress = 0;
    let maxProgress = 0;
    
    // Calculate required fields (must be 100% to save)
    fields.required.forEach(field => {
        maxProgress += field.weight;
        const element = document.getElementById(field.id);
        if (element && element.value && element.value.trim()) {
            progress += field.weight;
        }
    });
    
    // Calculate optional fields
    fields.optional.forEach(field => {
        maxProgress += field.weight;
        if (field.isArray) {
            // Check if array has items
            const array = field.id === 'recommendations' ? this.recommendations :
                         field.id === 'appliances' ? this.appliances :
                         field.id === 'faqs' ? this.faqs :
                         field.id === 'instructions' ? this.instructions :
                         field.id === 'images' ? this.images : [];
            if (array && array.length > 0) {
                progress += field.weight;
            }
        } else {
            const element = document.getElementById(field.id);
            if (element && element.value && element.value.trim()) {
                progress += field.weight;
            }
        }
    });
    
    const percentage = maxProgress > 0 ? Math.round((progress / maxProgress) * 100) : 0;
    return { percentage, progress, maxProgress };
}

updateProgressIndicator() {
    const { percentage } = this.calculateProgress();
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${percentage}%`;
        
        // Change color based on progress
        if (percentage < 40) {
            progressBar.style.background = '#e74c3c'; // Red
        } else if (percentage < 70) {
            progressBar.style.background = '#f39c12'; // Orange
        } else {
            progressBar.style.background = '#2ecc71'; // Green
        }
    }
}

setupProgressIndicator() {
    // Update progress on any field change
    const allFields = document.querySelectorAll('input, textarea, select');
    allFields.forEach(field => {
        field.addEventListener('input', () => {
            this.updateProgressIndicator();
        });
        field.addEventListener('change', () => {
            this.updateProgressIndicator();
        });
    });
    
    // Initial update
    setTimeout(() => {
        this.updateProgressIndicator();
    }, 500);
    
    // Update when arrays change (recommendations, FAQs, etc.)
    // This will be called from methods that modify arrays
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
                    
                    // Load Images from server
                    if (property.images && Array.isArray(property.images)) {
                        this.images = property.images;
                        localStorage.setItem('rental_ai_images', JSON.stringify(property.images));
                        console.log(`🖼️ Loaded ${this.images.length} images from server`);
                    } else {
                        console.log('⚠️ No images found in property data');
                        this.images = [];
                    }
                    
                    // Load Instructions (prefer structured array, fallback to string)
                    if (property.instructions && Array.isArray(property.instructions)) {
                        this.instructions = property.instructions;
                        localStorage.setItem('rental_ai_instructions', JSON.stringify(property.instructions));
                        console.log(`📝 Loaded ${this.instructions.length} instructions from server`);
                    } else if (property.generalInstructions) {
                        // Convert old string format to array format
                        const instructions = property.generalInstructions.split('\n\n').filter(i => i.trim()).map(inst => {
                            const parts = inst.split(':');
                            if (parts.length >= 2) {
                                return { title: parts[0].trim(), content: parts.slice(1).join(':').trim() };
                            }
                            return { title: 'General Instruction', content: inst.trim() };
                        });
                        this.instructions = instructions;
                        localStorage.setItem('rental_ai_instructions', JSON.stringify(this.instructions));
                        console.log(`📝 Converted ${this.instructions.length} instructions from old format`);
                    } else {
                        this.instructions = [];
                    }
                    
                    // Update the UI to show loaded recommendations, appliances, FAQs, and images
                    // Use a small delay to ensure DOM is ready
                    setTimeout(() => {
                        console.log('🔄 Updating UI lists...');
                        console.log('🔄 Recommendations before update:', this.recommendations.length);
                        this.updateRecommendationsList();
                        this.updateAppliancesList();
                        this.updateFAQsList();
                        this.updateInstructionsList();
                        this.updateImagesList();
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
            
            // Load Images from config if available
            if (config.images && Array.isArray(config.images)) {
                this.images = config.images;
                console.log(`🖼️ Loaded ${this.images.length} images from localStorage config`);
            } else {
                // Also try loading from separate localStorage key
                const savedImages = localStorage.getItem('rental_ai_images');
                if (savedImages) {
                    this.images = JSON.parse(savedImages);
                    console.log(`🖼️ Loaded ${this.images.length} images from localStorage key`);
                }
            }
            
            // Load Instructions (prefer structured array, fallback to string)
            if (config.instructions && Array.isArray(config.instructions)) {
                this.instructions = config.instructions;
                console.log(`📝 Loaded ${this.instructions.length} instructions from localStorage config`);
            } else if (config.generalInstructions) {
                // Convert old string format to array format
                const instructions = config.generalInstructions.split('\n\n').filter(i => i.trim()).map(inst => {
                    const parts = inst.split(':');
                    if (parts.length >= 2) {
                        return { title: parts[0].trim(), content: parts.slice(1).join(':').trim() };
                    }
                    return { title: 'General Instruction', content: inst.trim() };
                });
                this.instructions = instructions;
                console.log(`📝 Converted ${this.instructions.length} instructions from old format`);
            } else {
                // Also try loading from separate localStorage key
                const savedInstructions = localStorage.getItem('rental_ai_instructions');
                if (savedInstructions) {
                    this.instructions = JSON.parse(savedInstructions);
                    console.log(`📝 Loaded ${this.instructions.length} instructions from localStorage key`);
                }
            }
            
            // Update the UI to show loaded recommendations, appliances, FAQs, instructions, and images
            this.updateRecommendationsList();
            this.updateAppliancesList();
            this.updateFAQsList();
            this.updateInstructionsList();
            this.updateImagesList();
            
            // If we have a property ID but no allProperties array, try to load from server
            // This ensures the property selector is populated
            if (this.currentPropertyId && (!this.allProperties || this.allProperties.length === 0)) {
                console.log('🔄 Property ID found but no allProperties, fetching from server...');
                // Try to get user and fetch properties
                try {
                    let user = null;
                    if (typeof getCurrentUser === 'function') {
                        user = getCurrentUser();
                    }
                    if (user && (user.userId || user.id)) {
                        const userId = user.userId || user.id;
                        const response = await fetch(`/api/user/${userId}/properties`, {
                            method: 'GET',
                            credentials: 'include',
                            cache: 'no-cache'
                        });
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success && data.properties && data.properties.length > 0) {
                                const seenIds = new Set();
                                this.allProperties = data.properties.filter(p => {
                                    const propertyId = p.propertyId || p.id;
                                    if (!propertyId || seenIds.has(propertyId)) {
                                        return false;
                                    }
                                    seenIds.add(propertyId);
                                    return true;
                                });
                                this.populatePropertySelector();
                            }
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Could not fetch properties for selector:', error);
                }
            } else if (this.allProperties && this.allProperties.length > 0) {
                // Properties already loaded, just populate selector
                this.populatePropertySelector();
            }
            
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
    
    // Instructions are now handled as an array, not a single field
    // This is kept for backward compatibility but won't be used
    
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
        console.log(`📍 Current step: ${this.currentStep}`);
        
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
            const shouldShow = index + 1 === this.currentStep;
            section.style.display = shouldShow ? 'block' : 'none';
            if (shouldShow && index + 1 === 3) {
                console.log("✅ Step 3 is now visible - General Instructions and Image Management should be visible");
                // Ensure images list is updated when step 3 is shown
                setTimeout(() => {
                    this.updateImagesList();
                }, 100);
            }
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
            // Also update images list when step 3 is shown
            this.updateImagesList();
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
            <strong>General Instructions:</strong> ${this.instructions.length} instructions
        </div>
        <div class="preview-item">
            <strong>Images:</strong> ${this.images.length} images
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
    
    // Only validate required fields (not optional ones)
    const requiredFields = ['propertyName', 'hostContact', 'checkInTime', 'checkOutTime'];
    let missingRequired = [];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field || !field.value || !field.value.trim()) {
            missingRequired.push(fieldId);
        }
    });
    
    if (missingRequired.length > 0) {
        this.showTempMessage('Please fill in all required fields: Property Name, Host Contact, Check-in Time, and Check-out Time.', 'error');
        // Scroll to first missing field
        const firstMissing = document.getElementById(missingRequired[0]);
        if (firstMissing) {
            firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstMissing.focus();
        }
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
        
        // General Instructions (as array, like FAQs)
        generalInstructions: this.instructions.length > 0 ? this.instructions.map(i => `${i.title}: ${i.content}`).join('\n\n') : '',
        instructions: this.instructions, // Store as structured array
        
        // Appliances, Recommendations, FAQs & Images
        appliances: this.appliances,
        recommendations: this.recommendations,
        faqs: this.faqs,
        images: this.images,
        
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
        localStorage.setItem('rental_ai_instructions', JSON.stringify(this.instructions));
        localStorage.setItem('rental_ai_images', JSON.stringify(this.images));
        
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
    this.updateProgressIndicator(); // Update progress when FAQs change
    const container = document.getElementById('faqs-list');
    if (!container) return;
    
    if (this.faqs.length === 0) {
        container.innerHTML = `
            <div class="no-faqs">
                <i class="fas fa-question-circle"></i>
                <p>No FAQs added yet. Add some above to help your guests!</p>
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

// General Instructions Management (similar to FAQs)
loadInstructions() {
    try {
        const saved = localStorage.getItem('rental_ai_instructions');
        this.instructions = saved ? JSON.parse(saved) : [];
        console.log(`📝 Loaded ${this.instructions.length} instructions`);
    } catch (error) {
        console.error('Error loading instructions:', error);
        this.instructions = [];
    }
}

updateInstructionsList() {
    this.updateProgressIndicator(); // Update progress when instructions change
    const container = document.getElementById('instructions-list');
    if (!container) {
        console.warn('⚠️ instructions-list container not found');
        return;
    }
    
    if (this.instructions.length === 0) {
        container.innerHTML = `
            <div class="no-instructions">
                <i class="fas fa-info-circle"></i>
                <p>No instructions added yet. Add instructions to help guests find parking, building access, key locations, etc.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = this.instructions.map((instruction, index) => `
        <div class="instruction-item">
            <div class="instruction-item-header">
                <div class="instruction-title-text">${escapeHtml(instruction.title)}</div>
                <div class="instruction-actions">
                    <button class="btn-small btn-edit" onclick="editInstruction(${index})" title="Edit Instruction">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-small btn-delete" onclick="removeInstruction(${index})" title="Delete Instruction">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="instruction-content-text">${escapeHtml(instruction.content)}</div>
        </div>
    `).join('');
}

addInstruction() {
    const titleInput = document.getElementById('instruction-title');
    const contentInput = document.getElementById('instruction-content');
    
    if (!titleInput || !contentInput) return;
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
        this.showTempMessage('Please enter both title and instruction details', 'warning');
        return;
    }
    
    const newInstruction = { title, content };
    this.instructions.push(newInstruction);
    this.saveInstructions();
    this.updateInstructionsList();
    
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }
    
    // Clear form
    titleInput.value = '';
    contentInput.value = '';
    
    this.showTempMessage('Instruction added successfully!', 'success');
}

editInstruction(index) {
    const instruction = this.instructions[index];
    if (!instruction) return;
    
    const titleInput = document.getElementById('instruction-title');
    const contentInput = document.getElementById('instruction-content');
    
    if (titleInput) titleInput.value = instruction.title;
    if (contentInput) contentInput.value = instruction.content;
    
    // Remove the old instruction
    this.instructions.splice(index, 1);
    this.updateInstructionsList();
    
    // Scroll to form
    if (titleInput) {
        titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleInput.focus();
    }
    
    this.showTempMessage('Instruction loaded for editing. Update and click "Add Instruction" to save.', 'info');
}

removeInstruction(index) {
    if (!confirm('Are you sure you want to delete this instruction?')) {
        return;
    }
    
    this.instructions.splice(index, 1);
    this.saveInstructions();
    this.updateInstructionsList();
    
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }
    
    this.showTempMessage('Instruction removed', 'success');
}

saveInstructions() {
    try {
        localStorage.setItem('rental_ai_instructions', JSON.stringify(this.instructions));
        console.log(`📝 Saved ${this.instructions.length} instructions`);
    } catch (error) {
        console.error('Error saving instructions:', error);
    }
}

// Image Management
loadImages() {
    try {
        const saved = localStorage.getItem('rental_ai_images');
        this.images = saved ? JSON.parse(saved) : [];
        console.log(`🖼️ Loaded ${this.images.length} images`);
    } catch (error) {
        console.error('Error loading images:', error);
        this.images = [];
    }
}

updateImagesList() {
    const container = document.getElementById('images-list');
    if (!container) {
        console.warn('⚠️ images-list container not found');
        return;
    }
    
    if (this.images.length === 0) {
        container.innerHTML = `
            <div class="no-images">
                <i class="fas fa-images"></i>
                <p>No images added yet. Upload images to help guests find parking, key locks, building entrances, etc.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = this.images.map((image, index) => `
        <div class="image-item">
            <img src="${image.url}" alt="${escapeHtml(image.label)}" class="image-preview" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\'%3E%3Crect fill=\'%23ddd\' width=\'150\' height=\'150\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' dy=\'10.5\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3EImage%3C/text%3E%3C/svg%3E';">
            <div class="image-info">
                <div class="image-label">${escapeHtml(image.label)}</div>
                ${image.description ? `<div class="image-description">${escapeHtml(image.description)}</div>` : ''}
                <div class="image-actions">
                    <button class="btn-small btn-delete" onclick="removeImage(${index})" title="Delete Image">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

async uploadImage() {
    const labelInput = document.getElementById('image-label');
    const descriptionInput = document.getElementById('image-description');
    const fileInput = document.getElementById('image-file');
    const statusDiv = document.getElementById('image-upload-status');
    
    if (!labelInput || !fileInput) return;
    
    const label = labelInput.value.trim();
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const file = fileInput.files[0];
    
    if (!label) {
        this.showTempMessage('Please enter an image label (e.g., "Parking Lot", "Key Lock")', 'warning');
        return;
    }
    
    if (!file) {
        this.showTempMessage('Please select an image file', 'warning');
        return;
    }
    
    if (!this.currentPropertyId) {
        this.showTempMessage('Please save your property first before uploading images', 'warning');
        return;
    }
    
    // Show loading status
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.className = 'image-upload-status loading';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading image...';
    }
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('propertyId', this.currentPropertyId);
        formData.append('label', label);
        formData.append('description', description);
        
        const response = await fetch('/api/property/upload-image', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to upload image');
        }
        
        // Add image to local array
        this.images.push(result.image);
        this.updateProgressIndicator(); // Update progress when image is added
        this.saveImages();
        this.updateImagesList();
        
        // Clear form
        labelInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        fileInput.value = '';
        
        // Show success
        if (statusDiv) {
            statusDiv.className = 'image-upload-status success';
            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Image uploaded successfully!';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
        
        this.showTempMessage('Image uploaded successfully!', 'success');
        
        // Update preview if on step 3
        if (this.currentStep === 3) {
            this.updatePreview();
        }
        
    } catch (error) {
        console.error('Error uploading image:', error);
        if (statusDiv) {
            statusDiv.className = 'image-upload-status error';
            statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`;
        }
        this.showTempMessage('Failed to upload image: ' + error.message, 'error');
    }
}

removeImage(index) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }
    
    const image = this.images[index];
    if (!image) return;
    
    // Remove from array
    this.images.splice(index, 1);
    this.updateProgressIndicator(); // Update progress when image is removed
    this.saveImages();
    this.updateImagesList();
    
    // Update preview if on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }
    
    this.showTempMessage('Image removed', 'success');
}

saveImages() {
    try {
        localStorage.setItem('rental_ai_images', JSON.stringify(this.images));
        console.log(`🖼️ Saved ${this.images.length} images`);
    } catch (error) {
        console.error('Error saving images:', error);
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
    this.updateProgressIndicator(); // Update progress when recommendations change
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
        container.innerHTML = `<div class="no-recommendations"><p>No recommendations yet. Add some to help your guests discover local gems!</p></div>`;
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
    this.updateProgressIndicator(); // Update progress when appliances change
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
            this.faqs = [];
            this.instructions = [];
            this.images = [];
            this.updateAppliancesList();
            this.updateRecommendationsList();
            this.updateFAQsList();
            this.updateInstructionsList();
            this.updateImagesList();
            
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
    
    if (property.instructions && Array.isArray(property.instructions)) {
        this.instructions = property.instructions;
        this.updateInstructionsList();
    } else if (property.generalInstructions) {
        // Convert old format
        const instructions = property.generalInstructions.split('\n\n').filter(i => i.trim()).map(inst => {
            const parts = inst.split(':');
            if (parts.length >= 2) {
                return { title: parts[0].trim(), content: parts.slice(1).join(':').trim() };
            }
            return { title: 'General Instruction', content: inst.trim() };
        });
        this.instructions = instructions;
        this.updateInstructionsList();
    } else {
        this.instructions = [];
        this.updateInstructionsList();
    }
    
    if (property.images && Array.isArray(property.images)) {
        this.images = property.images;
        this.updateImagesList();
    } else {
        this.images = [];
        this.updateImagesList();
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

// REMOVED: All multi-language translation functions have been removed

createNewProperty() {
    // Clear current property ID to create a new one
    this.currentPropertyId = null;
    
    // Clear form
    this.clearForm();
    
    // Reset arrays
    this.recommendations = [];
    this.appliances = [];
    this.faqs = [];
    this.instructions = [];
    this.images = [];
    
    // Update UI
    this.updateRecommendationsList();
    this.updateAppliancesList();
    this.updateFAQsList();
    this.updateInstructionsList();
    this.updateImagesList();
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

// Make PropertySetup available globally
window.PropertySetup = PropertySetup;

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

// ================================================
// NOTIFICATIONS SYSTEM
// ================================================

let notificationsInterval = null;

function initNotifications() {
    console.log('🔔 initNotifications called');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const closeNotifications = document.getElementById('closeNotifications');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const refreshNotificationsBtn = document.getElementById('refreshNotificationsBtn');
    
    console.log('Notifications button found:', !!notificationsBtn);
    console.log('Notifications panel found:', !!notificationsPanel);
    
    if (!notificationsBtn) {
        console.warn('⚠️ Notifications button not found - retrying in 500ms');
        setTimeout(initNotifications, 500);
        return;
    }
    
    if (!notificationsPanel) {
        console.warn('⚠️ Notifications panel not found - retrying in 500ms');
        setTimeout(initNotifications, 500);
        return;
    }
    
    console.log('✅ Notifications system initialized');
    
    // Toggle notifications panel
    notificationsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔔 Notifications button clicked');
        const isVisible = notificationsPanel.style.display !== 'none' && notificationsPanel.style.display !== '';
        console.log('Current visibility:', isVisible, 'Display:', notificationsPanel.style.display);
        notificationsPanel.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            console.log('Loading notifications...');
            loadNotifications();
        }
    });
    
    // Close panel
    if (closeNotifications) {
        closeNotifications.addEventListener('click', () => {
            notificationsPanel.style.display = 'none';
        });
    }
    
    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            await markAllNotificationsRead();
            loadNotifications();
        });
    }
    
    // Clear all notifications
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete all notifications? This cannot be undone.')) {
                await clearAllNotifications();
                loadNotifications();
            }
        });
    }
    
    // Refresh notifications
    if (refreshNotificationsBtn) {
        refreshNotificationsBtn.addEventListener('click', () => {
            loadNotifications();
        });
    }
    
    // Load notifications on page load
    loadNotificationCount();
    
    // Auto-refresh notification count every 30 seconds
    notificationsInterval = setInterval(() => {
        loadNotificationCount();
    }, 30000);
}

async function loadNotificationCount() {
    try {
        const propertyId = window.propertySetup?.currentPropertyId;
        if (!propertyId) return;
        
        const response = await fetch(`/api/analytics/property/${propertyId}/notifications/unread-count`);
        const data = await response.json();
        
        if (data.success) {
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                if (data.count > 0) {
                    badge.textContent = data.count > 99 ? '99+' : data.count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

async function loadNotifications() {
    try {
        console.log('📋 Loading notifications...');
        const propertyId = window.propertySetup?.currentPropertyId;
        console.log('Property ID:', propertyId);
        
        if (!propertyId) {
            const list = document.getElementById('notificationsList');
            if (list) {
                list.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><p>No property selected. Please select a property first.</p></div>';
            }
            return;
        }
        
        const response = await fetch(`/api/analytics/property/${propertyId}/notifications?limit=50`);
        const data = await response.json();
        
        const list = document.getElementById('notificationsList');
        if (!list) return;
        
        if (!data.success || !data.notifications || data.notifications.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-bell-slash" style="font-size: 32px; margin-bottom: 10px; opacity: 0.5;"></i><p>No notifications yet</p><p style="font-size: 12px; margin-top: 10px;">Guests can notify you when they check in or check out</p></div>';
            return;
        }
        
        list.innerHTML = data.notifications.map(notif => {
            const date = new Date(notif.timestamp);
            const timeAgo = getTimeAgo(date);
            const icon = notif.notification_type === 'check_in' ? '🔵' : '🟢';
            const typeText = notif.notification_type === 'check_in' ? 'Check-in' : 'Check-out';
            const bgColor = notif.notification_type === 'check_in' ? '#e3f2fd' : '#e8f5e9';
            const borderColor = notif.notification_type === 'check_in' ? '#2196f3' : '#4caf50';
            
            return `
                <div id="notif_${notif.id}" style="padding: 15px; margin: 10px; border-radius: 8px; border-left: 4px solid ${borderColor}; background: ${bgColor}; ${notif.read ? 'opacity: 0.7;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <span style="font-size: 20px;">${icon}</span>
                            <strong style="color: #2c3e50;">${typeText}</strong>
                            ${!notif.read ? '<span style="background: #f39c12; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-left: 8px;">NEW</span>' : ''}
                        </div>
                        <div style="display: flex; gap: 5px; align-items: center;">
                            <span style="font-size: 11px; color: #7f8c8d;">${timeAgo}</span>
                            ${!notif.read ? `<button onclick="markNotificationRead(${notif.id})" style="background: #3498db; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 5px;" title="Mark as read">✓</button>` : ''}
                            <button onclick="deleteNotification(${notif.id})" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 5px;" title="Delete">×</button>
                        </div>
                    </div>
                    ${notif.guest_message ? `<p style="margin: 8px 0 0 0; color: #34495e; font-size: 13px; font-style: italic;">"${escapeHtml(notif.guest_message)}"</p>` : ''}
                    <div style="margin-top: 8px; font-size: 11px; color: #95a5a6;">${date.toLocaleString()}</div>
                </div>
            `;
        }).join('');
        
        // Update badge count
        loadNotificationCount();
    } catch (error) {
        console.error('Error loading notifications:', error);
        document.getElementById('notificationsList').innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;"><p>Error loading notifications</p></div>';
    }
}

async function markAllNotificationsRead() {
    try {
        const propertyId = window.propertySetup?.currentPropertyId;
        if (!propertyId) return;
        
        const response = await fetch(`/api/analytics/property/${propertyId}/notifications/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ All notifications marked as read');
        }
    } catch (error) {
        console.error('Error marking notifications as read:', error);
    }
}

// Mark a single notification as read
async function markNotificationRead(notificationId) {
    try {
        const propertyId = window.propertySetup?.currentPropertyId;
        if (!propertyId) return;
        
        const response = await fetch(`/api/analytics/property/${propertyId}/notifications/mark-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationIds: [notificationId] })
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Notification marked as read');
            loadNotifications();
            loadNotificationCount();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Delete a single notification
async function deleteNotification(notificationId) {
    try {
        const propertyId = window.propertySetup?.currentPropertyId;
        if (!propertyId) return;
        
        const response = await fetch(`/api/analytics/property/${propertyId}/notifications/${notificationId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Notification deleted');
            loadNotifications();
            loadNotificationCount();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

// Clear all notifications (delete all)
async function clearAllNotifications() {
    try {
        const propertyId = window.propertySetup?.currentPropertyId;
        if (!propertyId) return;
        
        const response = await fetch(`/api/analytics/property/${propertyId}/notifications/clear-all`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ All notifications cleared');
            loadNotificationCount();
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Initialize notifications when DOM is ready
// Wait for PropertySetup to initialize first
function initializeNotificationsSystem() {
    // Wait for PropertySetup to be available
    if (typeof window.propertySetup === 'undefined') {
        setTimeout(initializeNotificationsSystem, 200);
        return;
    }
    
    // Wait a bit more for property to load
    setTimeout(() => {
        console.log('🔔 Initializing notifications system...');
        initNotifications();
    }, 1000);
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotificationsSystem);
} else {
    initializeNotificationsSystem();
}

// Global wrapper functions for image management
function uploadImage() {
    if (window.propertySetup) {
        window.propertySetup.uploadImage();
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function removeImage(index) {
    if (window.propertySetup) {
        window.propertySetup.removeImage(index);
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}
