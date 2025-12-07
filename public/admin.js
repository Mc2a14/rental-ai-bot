console.log("🔄 admin.js loading...");

class PropertySetup {
   constructor() {
    console.log("✅ PropertySetup constructor called");
    this.currentStep = 1;
    this.totalSteps = 3;
    this.recommendations = [];
    this.appliances = [];
    
    // Load data AFTER checking user is authenticated
    if (this.isUserAuthenticated()) {
        this.loadRecommendations();
        this.loadAppliances();
    }
    
    console.log("🔄 Initializing event listeners...");
    this.initializeEventListeners();
    this.updateStepDisplay();
    this.updateRecommendationsList();
    this.updateAppliancesList();
    this.addPreviewStyles();
    
    // Load existing config
    this.autoLoadExistingConfig();
    
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
    
    // Navigation buttons - SIMPLE WORKING VERSION
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    console.log("📝 Buttons found:", { nextBtn: !!nextBtn, prevBtn: !!prevBtn, submitBtn: !!submitBtn });
    
    if (nextBtn) {
        // SIMPLE click handler - THIS WORKS
        nextBtn.onclick = (e) => {
            console.log("👉 Next button CLICKED!");
            e.preventDefault();
            this.nextStep();
        };
        console.log("✅ Next button listener added (simple)");
    }
    
    if (prevBtn) {
        prevBtn.onclick = (e) => {
            e.preventDefault();
            this.prevStep();
        };
        console.log("✅ Previous button listener added");
    }
    
    if (submitBtn) {
        submitBtn.onclick = (e) => {
            console.log("💾 Save Configuration button clicked!");
            e.preventDefault();
            this.saveConfiguration(e);
        };
        console.log("✅ Submit button listener added");
    }
    
    console.log("✅ All event listeners initialized");
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
        
        // Event listeners
        field.addEventListener('input', () => {
            this.validateField(field);
            this.validateCurrentStep();
        });
        
        field.addEventListener('change', () => {
            this.validateField(field);
            this.validateCurrentStep();
        });
        
        // Initial validation
        this.validateField(field);
    });
    
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
    console.log(`🔄 Validating step ${this.currentStep}...`);
    const currentSection = document.getElementById(`section${this.currentStep}`);
    if (!currentSection) return false;
    
    const requiredFields = currentSection.querySelectorAll('input[required], textarea[required], select[required]');
    let allValid = true;
    
    requiredFields.forEach(field => {
        if (!this.validateField(field)) {
            allValid = false;
        }
    });
    
    // Update Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = !allValid;
        console.log(`🔘 Next button ${allValid ? 'ENABLED' : 'DISABLED'}`);
    }
    
    return allValid;
}

autoLoadExistingConfig() {
    console.log("🔄 Auto-loading existing config...");
    
    // First check if user is logged in
    if (!this.isUserAuthenticated()) {
        console.log("⚠️ User not authenticated, skipping auto-load");
        return;
    }
    
    try {
        // Try to load from localStorage first (for backward compatibility)
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        
        if (savedConfig) {
            console.log('📁 Found saved configuration in localStorage, loading...');
            const config = JSON.parse(savedConfig);
            
            // Populate form fields
            document.getElementById('propertyName').value = config.name || '';
            document.getElementById('propertyAddress').value = config.address || '';
            document.getElementById('propertyType').value = config.type || 'Vacation Home';
            document.getElementById('hostContact').value = config.hostContact || '';
            document.getElementById('maintenanceContact').value = config.maintenanceContact || '';
            document.getElementById('checkInTime').value = config.checkinTime || config.checkInTime || '3:00 PM';
            document.getElementById('checkOutTime').value = config.checkoutTime || config.checkOutTime || '11:00 AM';
            document.getElementById('lateCheckout').value = config.lateCheckout || '';
            document.getElementById('wifiDetails').value = config.amenities?.wifi || config.wifiDetails || '';
            document.getElementById('amenities').value = config.amenities?.other || config.amenities || '';
            document.getElementById('houseRules').value = config.houseRules || '';
            
            console.log('✅ Configuration loaded from localStorage');
            
            // Validate fields
            setTimeout(() => {
                this.validateCurrentStep();
            }, 200);
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
        
        // Scroll to top
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

    // Validate new step
    setTimeout(() => {
        this.validateCurrentStep();
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
        
        // Appliances & Recommendations
        appliances: this.appliances,
        recommendations: this.recommendations,
        
        // Metadata
        lastUpdated: new Date().toISOString()
    };

    try {
        console.log('🔄 Saving to server...');
        
        // Save to SERVER (cross-device access)
        const response = await fetch('/api/property/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.userId,
                propertyData: propertyData
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to save to server');
        }
        
        console.log('✅ Saved to server, property ID:', result.propertyId);
        
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
        this.showTempMessage('Error saving configuration: ' + error.message, 'error');
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
        successMessage.insertBefore(previewDiv, successMessage.querySelector('button'));
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

// SIMPLE initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM loaded - Initializing PropertySetup");
    
    // Check if user is authenticated first
    if (typeof isAuthenticated === 'function' && isAuthenticated()) {
        try {
            window.propertySetup = new PropertySetup();
            console.log("✅ PropertySetup initialized successfully!");
        } catch (error) {
            console.error("❌ Error initializing PropertySetup:", error);
            alert("Error loading setup. Please refresh.");
        }
    } else {
        console.log("🔒 User not authenticated - PropertySetup not initialized");
    }
});
