console.log("🔄 admin.js is loading...");

class PropertySetup {
   constructor() {
    console.log("✅ PropertySetup constructor called");
    this.currentStep = 1;
    this.totalSteps = 3;
    this.recommendations = this.loadRecommendations();
    this.appliances = this.loadAppliances();
    
    console.log("🔄 Initializing event listeners...");
    this.initializeEventListeners();
    this.updateStepDisplay();
    this.updateRecommendationsList();
    this.updateAppliancesList();
    this.addPreviewStyles();
    
    // Load existing config FIRST
    this.autoLoadExistingConfig();
    
    // THEN initialize validation (so it sees the pre-filled values)
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
        this.setupRealTimeValidation();
    }, 100);
    
    this.setupAdditionalButtons();
    console.log("✅ PropertySetup initialized successfully");
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
        /* Style for pre-filled fields */
        input:not(:placeholder-shown).field-valid,
        textarea:not(:placeholder-shown).field-valid,
        select.field-valid {
            background-color: #f8fff9 !important;
        }
    `;
    document.head.appendChild(style);
    console.log("✅ Preview styles added");
}

initializeEventListeners() {
    console.log("🔄 Setting up event listeners...");
    
    // Navigation buttons
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    console.log("📝 Buttons found:", { nextBtn, prevBtn, submitBtn });
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => this.nextStep());
        console.log("✅ Next button listener added");
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => this.prevStep());
        console.log("✅ Previous button listener added");
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            console.log("💾 Save Configuration button clicked!");
            this.saveConfiguration(e);
        });
        console.log("✅ Submit button listener added");
    }
    
    console.log("✅ All event listeners initialized");
    // Note: setupRealTimeValidation is called separately with delay
}

setupRealTimeValidation() {
    console.log("🔄 Setting up real-time validation...");
    
    const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
    console.log(`📝 Found ${requiredFields.length} required fields`);
    
    requiredFields.forEach(field => {
        // Add validation message element
        if (!field.parentNode.querySelector('.validation-message')) {
            const validationMsg = document.createElement('div');
            validationMsg.className = 'validation-message';
            validationMsg.textContent = 'This field is required';
            field.parentNode.appendChild(validationMsg);
        }
        
        // Enhanced event listeners
        field.addEventListener('input', () => {
            this.validateField(field);
            this.validateCurrentStep();
        });
        
        field.addEventListener('blur', () => this.validateField(field));
        
        // Initial validation - check if field has value
        this.validateField(field);
    });
    
    this.validateCurrentStep();
    console.log("✅ Real-time validation setup complete");
}

validateField(field) {
    // Get the actual value (trim whitespace)
    const value = field.value.trim();
    const isValid = value.length > 0;
    const validationMsg = field.parentNode.querySelector('.validation-message');
    
    // Special handling for select elements
    if (field.tagName === 'SELECT') {
        // For select elements, check if a value is selected (not empty string)
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
    
    // For input and textarea elements
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
    console.log("🔄 Validating current step...");
    const currentSection = document.getElementById(`section${this.currentStep}`);
    if (!currentSection) {
        console.log("❌ Current section not found");
        return false;
    }
    
    const requiredFields = currentSection.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    console.log(`📝 Checking ${requiredFields.length} required fields in step ${this.currentStep}:`);
    
    requiredFields.forEach(field => {
        const isFieldValid = this.validateField(field);
        console.log(`  - ${field.id}: "${field.value}" -> ${isFieldValid ? 'VALID' : 'INVALID'}`);
        
        if (!isFieldValid) {
            isValid = false;
        }
    });

    // Update button states
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (nextBtn) {
        nextBtn.disabled = !isValid;
        nextBtn.title = isValid ? 'Continue to next step' : 'Please fill in all required fields';
    }
    
    if (submitBtn) {
        submitBtn.disabled = !isValid;
        submitBtn.title = isValid ? 'Save configuration' : 'Please fill in all required fields';
    }

    console.log(`✅ Step ${this.currentStep} validation: ${isValid ? 'VALID' : 'INVALID'}`);
    return isValid;
}

autoLoadExistingConfig() {
    console.log("🔄 Attempting to auto-load existing configuration...");
    
    try {
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        const savedAppliances = localStorage.getItem('rental_ai_appliances');
        const savedRecommendations = localStorage.getItem('rental_ai_recommendations');
        
        if (savedConfig) {
            console.log('📁 Found saved configuration, loading...');
            const config = JSON.parse(savedConfig);
            
            // Populate basic info (Step 1)
            document.getElementById('propertyName').value = config.name || '';
            document.getElementById('propertyAddress').value = config.address || '';
            document.getElementById('propertyType').value = config.type || 'Apartment';
            
            // Populate contact info (Step 2)
            document.getElementById('hostContact').value = config.hostContact || '';
            document.getElementById('maintenanceContact').value = config.maintenanceContact || '';
            document.getElementById('checkInTime').value = config.checkinTime || config.checkInTime || '3:00 PM';
            document.getElementById('checkOutTime').value = config.checkoutTime || config.checkOutTime || '11:00 AM';
            document.getElementById('lateCheckout').value = config.lateCheckout || '';
            
            // Populate details (Step 3)
            document.getElementById('wifiDetails').value = config.amenities?.wifi || config.wifiDetails || '';
            document.getElementById('amenities').value = config.amenities?.other || config.amenities || '';
            document.getElementById('houseRules').value = config.houseRules || '';
            
            console.log('✅ Configuration loaded into form');
            
            // Quick validation fix - remove red styling from pre-filled fields
            setTimeout(() => {
                const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
                requiredFields.forEach(field => {
                    if (field.value.trim().length > 0) {
                        field.classList.remove('field-invalid');
                        field.classList.add('field-valid');
                        const validationMsg = field.parentNode.querySelector('.validation-message');
                        if (validationMsg) validationMsg.classList.remove('show');
                    }
                });
            }, 50);
            
            // Show edit mode indicator
            this.showEditModeIndicator();
        }
        
        if (!savedConfig && !savedAppliances && !savedRecommendations) {
            console.log('ℹ️ No existing configuration found - starting fresh');
        }
        
    } catch (error) {
        console.error('❌ Error auto-loading configuration:', error);
    }
}

    nextStep() {
        console.log("🔄 Moving to next step...");
        if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
            console.log(`✅ Moved to step ${this.currentStep}`);
            
            // Auto-scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            console.log("❌ Cannot move to next step - validation failed");
            this.showTempMessage('Please fill in all required fields before continuing', 'warning');
        }
    }

    prevStep() {
        console.log("🔄 Moving to previous step...");
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            console.log(`✅ Moved to step ${this.currentStep}`);
            
            // Auto-scroll to top
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
            if (index + 1 === this.currentStep) {
                section.style.display = 'block';
                
                // Ensure WiFi section is visible
                if (index + 1 === 3) {
                    const wifiInput = document.getElementById('wifiDetails');
                    if (wifiInput) {
                        wifiInput.style.display = 'block';
                        wifiInput.style.visibility = 'visible';
                        wifiInput.style.opacity = '1';
                    }
                }
            } else {
                section.style.display = 'none';
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
        }

        this.validateCurrentStep();
        console.log("✅ Step display updated");
    }

    updatePreview() {
        console.log("🔄 Updating preview...");
        const previewContent = document.getElementById('previewContent');
        const previewSection = document.getElementById('previewSection');
        
        if (!previewContent || !previewSection) {
            console.log("❌ Preview elements not found");
            return;
        }
        
        const formData = this.getFormData();
        
        let previewHTML = `
            <div class="preview-item">
                <strong>Property Name:</strong> ${formData.name || 'Not set'}
            </div>
            <div class="preview-item">
                <strong>Address:</strong> ${formData.address || 'Not set'}
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
        console.log("🔄 Getting form data...");
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
        
        if (!this.validateCurrentStep()) {
            this.showTempMessage('Please fill in all required fields before saving.', 'error');
            console.log("❌ Save blocked - validation failed");
            return;
        }

        const formData = this.getFormData();
        console.log("📝 Form data:", formData);
        
        // Save configuration in the correct format
        const config = {
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
            
            // Appliances
            appliances: this.appliances,
            hasAppliances: this.appliances.length > 0,
            
            // Metadata
            lastUpdated: new Date().toISOString(),
            
            // Recommendations count
            hasRecommendations: this.recommendations.length > 0,
            
            // Simple fields for compatibility
            contact: formData.hostContact,
            checkInOut: {
                checkIn: this.formatTime(formData.checkInTime) || '3:00 PM',
                checkOut: this.formatTime(formData.checkOutTime) || '11:00 AM'
            }
        };

        try {
            // Save the main config to localStorage
            localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(config));
            
            // Save recommendations separately to localStorage
            localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
            
            // Save appliances separately to localStorage
            this.saveAppliances();
            
            console.log('✅ Configuration saved to localStorage!', config);
            
            // ALSO SAVE TO SERVER (for cross-tab sync and persistence)
            console.log('🔄 Saving to server...');
            
            try {
                // Save property config to server
                const configResponse = await fetch('/admin/save-property-config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(config)
                });
                
                // Save recommendations to server
                const recommendationsResponse = await fetch('/admin/save-recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.recommendations)
                });
                
                // Save appliances to server
                const appliancesResponse = await fetch('/admin/save-appliances', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.appliances)
                });
                
                console.log('✅ Configuration saved to server!');
                
            } catch (serverError) {
                console.error('⚠️ Could not save to server:', serverError);
                // Continue anyway - at least localStorage worked
            }
            
            // Show success message with guest link
            this.showSuccessMessage();
            
            // Notify the main chat window if it's open
            this.notifyMainChat();
            
        } catch (error) {
            console.error('❌ Error saving configuration:', error);
            this.showTempMessage('Error saving configuration. Please try again.', 'error');
        }
    }

    formatTime(timeString) {
        if (!timeString) return '';
        
        // If already in AM/PM format, return as-is
        if (timeString.includes('AM') || timeString.includes('PM') || 
            timeString.includes('am') || timeString.includes('pm')) {
            return timeString;
        }
        
        // Try to parse HH:MM format
        const match = timeString.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/i);
        if (!match) return timeString;
        
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        let ampm = match[3] ? match[3].toUpperCase() : '';
        
        // If no AM/PM specified and it's 24-hour format
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

    notifyMainChat() {
        // Trigger storage event to notify the main chat
        window.dispatchEvent(new Event('storage'));
        
        // Also try to notify the parent window if we're in a popup
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({ type: 'configUpdated' }, '*');
            } catch (e) {
                console.log('Could not notify parent window:', e);
            }
        }
    }

    showSuccessMessage() {
        console.log("🔄 Showing success message...");
        const propertyConfig = document.getElementById('propertyConfig');
        const successMessage = document.getElementById('successMessage');
        
        if (propertyConfig) propertyConfig.style.display = 'none';
        if (successMessage) {
            successMessage.style.display = 'block';
            
            // Generate guest link
            const guestLink = `${window.location.origin}/`;
            
            // Update success message with guest link
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
                            <input type="text" readonly value="${guestLink}" 
                                   style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white; font-family: monospace;">
                            <button onclick="copyToClipboard('${guestLink}')" 
                                    style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                        </div>
                        <p style="font-size: 0.9em; color: #7f8c8d; margin-top: 8px; margin-bottom: 0;">
                            Share this link with your guests to access the AI assistant
                        </p>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 15px;">
                        <h5 style="color: #2c3e50; margin-bottom: 10px;">📝 What was saved:</h5>
                        <p><strong>Property Name:</strong> ${document.getElementById('propertyName')?.value || 'Not set'}</p>
                        <p><strong>Recommendations:</strong> ${this.recommendations.length} places saved</p>
                        <p><strong>Appliances:</strong> ${this.appliances.length} appliances saved</p>
                    </div>
                </div>
            `;
            
            const previewDiv = document.createElement('div');
            previewDiv.className = 'saved-preview';
            previewDiv.innerHTML = previewHtml;
            successMessage.insertBefore(previewDiv, successMessage.querySelector('button'));
        }
        console.log("✅ Success message shown");
    }

    // Recommendations management
    loadRecommendations() {
        try {
            const saved = localStorage.getItem('rental_ai_recommendations');
            const recommendations = saved ? JSON.parse(saved) : [];
            console.log(`📍 Loaded ${recommendations.length} recommendations`);
            return recommendations;
        } catch (error) {
            console.error('Error loading recommendations:', error);
            return [];
        }
    }

    async saveRecommendations() {
        try {
            localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
            console.log(`📍 Saved ${this.recommendations.length} recommendations to localStorage`);
            
            // Also save to server
            try {
                await fetch('/admin/save-recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.recommendations)
                });
                console.log(`📍 Saved ${this.recommendations.length} recommendations to server`);
            } catch (serverError) {
                console.error('⚠️ Could not save recommendations to server:', serverError);
            }
        } catch (error) {
            console.error('Error saving recommendations:', error);
        }
    }

    updateRecommendationsList() {
        const container = document.getElementById('recommendations-list');
        if (!container) {
            console.log("❌ Recommendations container not found");
            return;
        }
        
        if (this.recommendations.length === 0) {
            container.innerHTML = `
                <div class="no-recommendations">
                    <p>No recommendations yet. Add some to help your guests discover local gems!</p>
                </div>
            `;
            console.log("📍 No recommendations to display");
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
        
        console.log(`📍 Displayed ${this.recommendations.length} recommendations`);
    }

    async addRecommendation() {
        console.log("🔄 Adding recommendation...");
        const nameInput = document.getElementById('place-name');
        const categoryInput = document.getElementById('place-category');
        const descriptionInput = document.getElementById('place-description');
        const notesInput = document.getElementById('place-notes');

        if (!nameInput || !categoryInput) {
            console.log("❌ Recommendation form elements not found");
            return;
        }

        const name = nameInput.value.trim();
        const category = categoryInput.value;
        const description = descriptionInput?.value.trim() || '';
        const notes = notesInput?.value.trim() || '';

        if (!name) {
            this.showTempMessage('Please enter a place name', 'warning');
            console.log("❌ Recommendation not added - missing name");
            return;
        }

        const newPlace = {
            name,
            category,
            description,
            notes
        };

        this.recommendations.push(newPlace);
        await this.saveRecommendations();
        this.updateRecommendationsList();

        // Clear form
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (notesInput) notesInput.value = '';

        this.showTempMessage('Recommendation added successfully!', 'success');
        console.log("✅ Recommendation added:", newPlace);
    }

    async removeRecommendation(index) {
        console.log(`🔄 Removing recommendation at index ${index}...`);
        if (confirm('Are you sure you want to remove this recommendation?')) {
            this.recommendations.splice(index, 1);
            await this.saveRecommendations();
            this.updateRecommendationsList();
            this.showTempMessage('Recommendation removed', 'success');
            console.log("✅ Recommendation removed");
        }
    }

    // Appliance management
    loadAppliances() {
        try {
            const saved = localStorage.getItem('rental_ai_appliances');
            this.appliances = saved ? JSON.parse(saved) : [];
            console.log(`🛠️ Loaded ${this.appliances.length} appliances`);
            return this.appliances;
        } catch (error) {
            console.error('Error loading appliances:', error);
            this.appliances = [];
            return [];
        }
    }

    async saveAppliances() {
        try {
            localStorage.setItem('rental_ai_appliances', JSON.stringify(this.appliances));
            console.log(`🛠️ Saved ${this.appliances.length} appliances to localStorage`);
            
            // Also save to server
            try {
                await fetch('/admin/save-appliances', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.appliances)
                });
                console.log(`🛠️ Saved ${this.appliances.length} appliances to server`);
            } catch (serverError) {
                console.error('⚠️ Could not save appliances to server:', serverError);
            }
        } catch (error) {
            console.error('Error saving appliances:', error);
        }
    }

    updateAppliancesList() {
        const container = document.getElementById('appliances-list');
        if (!container) {
            console.log("❌ Appliances container not found");
            return;
        }
        
        if (this.appliances.length === 0) {
            container.innerHTML = `
                <div class="no-appliances" style="text-align: center; padding: 40px 20px; color: #7f8c8d;">
                    <p>No appliances added yet. Add some above to help guests!</p>
                </div>
            `;
            console.log("🛠️ No appliances to display");
            return;
        }

        container.innerHTML = this.appliances.map((appliance, index) => `
            <div class="appliance-item" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px; margin-bottom: 10px; background: #f8f9fa; border: 1px solid #e1e5e9; border-radius: 8px;">
                <div class="appliance-info" style="flex: 1;">
                    <div class="appliance-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <strong>${appliance.name}</strong>
                        <span class="type-badge" style="background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: 500;">${appliance.type}</span>
                    </div>
                    ${appliance.photo ? `<div style="margin: 10px 0;"><img src="${appliance.photo}" alt="${appliance.name}" style="max-width: 200px; border-radius: 5px; border: 1px solid #ddd;"></div>` : ''}
                    <div class="appliance-instructions" style="color: #2c3e50; margin: 5px 0; line-height: 1.4; font-size: 0.9em; white-space: pre-line;">${appliance.instructions}</div>
                    ${appliance.troubleshooting ? `<div class="appliance-troubleshooting" style="color: #e74c3c; margin: 10px 0 0 0; font-size: 0.9em;"><strong>Troubleshooting:</strong><br>${appliance.troubleshooting}</div>` : ''}
                </div>
                <button class="btn-danger" onclick="propertySetup.removeAppliance(${index})" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8em;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        console.log(`🛠️ Displayed ${this.appliances.length} appliances`);
    }

    async addAppliance() {
        console.log("🛠️ Adding appliance...");
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
            console.log("❌ Appliance not added - missing required fields");
            return;
        }

        const newAppliance = {
            name,
            type,
            instructions,
            photo: photo || null,
            troubleshooting: troubleshooting || null
        };

        this.appliances.push(newAppliance);
        await this.saveAppliances();
        this.updateAppliancesList();

        // Clear form
        nameInput.value = '';
        instructionsInput.value = '';
        troubleshootingInput.value = '';
        if (photoInput) photoInput.value = '';

        this.showTempMessage('Appliance added successfully!', 'success');
        console.log("✅ Appliance added:", newAppliance);
    }

    async removeAppliance(index) {
        console.log(`🛠️ Removing appliance at index ${index}...`);
        if (confirm('Are you sure you want to remove this appliance?')) {
            this.appliances.splice(index, 1);
            await this.saveAppliances();
            this.updateAppliancesList();
            this.showTempMessage('Appliance removed', 'success');
            console.log("✅ Appliance removed");
        }
    }

    showTempMessage(text, type = 'success') {
        console.log(`🔄 Showing temp message: ${text} (${type})`);
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
            word-wrap: break-word;
        `;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 4000);
    }

    showEditModeIndicator() {
        const hasConfig = localStorage.getItem('rentalAIPropertyConfig');
        
        if (hasConfig) {
            // Create edit mode banner
            const banner = document.createElement('div');
            banner.className = 'edit-mode-banner';
            banner.innerHTML = `
                <div style="background: #d1ecf1; border-left: 4px solid #3498db; padding: 12px 15px; border-radius: 5px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-edit" style="color: #0c5460;"></i>
                    <div>
                        <strong style="color: #0c5460;">Edit Mode</strong> - You are editing your existing configuration.
                        <span style="color: #0c5460; opacity: 0.8; font-size: 0.9em; display: block;">Changes will update your current setup.</span>
                    </div>
                </div>
            `;
            
            // Insert at the top of the admin container
            const adminContainer = document.querySelector('.admin-container');
            if (adminContainer) {
                const firstChild = adminContainer.firstChild;
                adminContainer.insertBefore(banner, firstChild);
            }
        }
    }

    setupAdditionalButtons() {
        this.setupResetButton();
        this.setupBackupButton();
    }

    setupResetButton() {
        // Create reset button
        const resetBtn = document.createElement('button');
        resetBtn.id = 'resetBtn';
        resetBtn.className = 'btn btn-danger';
        resetBtn.innerHTML = '<i class="fas fa-trash"></i> Reset All Data';
        
        // Add it to the button group
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) {
            navButtons.appendChild(resetBtn);
        }
        
        resetBtn.addEventListener('click', () => {
            if (confirm('⚠️ WARNING: This will delete ALL your property data, appliances, and recommendations. This cannot be undone! Are you sure?')) {
                // Clear all localStorage data
                localStorage.removeItem('rentalAIPropertyConfig');
                localStorage.removeItem('rental_ai_appliances');
                localStorage.removeItem('rental_ai_recommendations');
                
                // Clear form fields
                document.querySelectorAll('input, textarea, select').forEach(field => {
                    if (field.type !== 'button' && field.type !== 'submit' && field.id !== 'appliance-photo') {
                        field.value = '';
                    }
                });
                
                // Reset to step 1
                this.currentStep = 1;
                this.updateStepDisplay();
                
                // Clear appliances and recommendations lists
                this.appliances = [];
                this.recommendations = [];
                this.updateAppliancesList();
                this.updateRecommendationsList();
                
                // Remove edit mode banner
                const banner = document.querySelector('.edit-mode-banner');
                if (banner) banner.remove();
                
                // Show confirmation
                this.showTempMessage('All data has been reset. You can now start fresh.', 'success');
                console.log('🧹 All data reset successfully');
            }
        });
    }

    setupBackupButton() {
        // Create backup button
        const backupBtn = document.createElement('button');
        backupBtn.id = 'backupBtn';
        backupBtn.className = 'btn btn-info';
        backupBtn.innerHTML = '<i class="fas fa-download"></i> Download Backup';
        
        // Add it to the button group
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) {
            navButtons.appendChild(backupBtn);
        }
        
        backupBtn.addEventListener('click', () => {
            const config = {
                property: JSON.parse(localStorage.getItem('rentalAIPropertyConfig') || '{}'),
                appliances: JSON.parse(localStorage.getItem('rental_ai_appliances') || '[]'),
                recommendations: JSON.parse(localStorage.getItem('rental_ai_recommendations') || '[]'),
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
            
            this.showTempMessage('Backup downloaded successfully!', 'success');
        });
    }
}

// Global function for the add recommendation button
function addRecommendation() {
    console.log("🔄 Global addRecommendation called");
    if (window.propertySetup) {
        window.propertySetup.addRecommendation();
    } else {
        console.log("❌ PropertySetup not initialized");
        alert('System not ready. Please wait for page to load completely.');
    }
}

// Global function for the add appliance button
function addAppliance() {
    console.log("🛠️ Global addAppliance called");
    if (window.propertySetup) {
        window.propertySetup.addAppliance();
    } else {
        console.log("❌ PropertySetup not initialized");
        alert('System not ready. Please wait for page to load completely.');
    }
}

// Helper function to copy to clipboard
function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show confirmation
    if (window.propertySetup) {
        window.propertySetup.showTempMessage('Link copied to clipboard!', 'success');
    }
}

// SINGLE DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Content Loaded - Initializing PropertySetup...");
    try {
        window.propertySetup = new PropertySetup();
        console.log("✅ PropertySetup initialized successfully!");
        
        // Extra safety: Ensure WiFi field is visible
        setTimeout(() => {
            const wifiInput = document.getElementById('wifiDetails');
            if (wifiInput) {
                wifiInput.style.display = 'block';
                wifiInput.style.visibility = 'visible';
                wifiInput.style.opacity = '1';
            }
        }, 100);
    } catch (error) {
        console.error("❌ Error initializing PropertySetup:", error);
    }
});
