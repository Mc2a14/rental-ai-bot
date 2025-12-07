console.log("🔄 admin.js loading in Incognito mode...");

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
    
    // THEN initialize validation
    setTimeout(() => {
        this.setupRealTimeValidation();
        this.validateCurrentStep(); // Force initial validation
    }, 200);
    
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
        
        /* Next button disabled state - MAKE IT OBVIOUS */
        #nextBtn:disabled {
            background-color: #95a5a6 !important;
            cursor: not-allowed !important;
            opacity: 0.6;
            transform: none !important;
            border: 2px solid #7f8c8d !important;
        }
        
        #nextBtn:disabled:hover {
            background-color: #95a5a6 !important;
            transform: none !important;
            box-shadow: none !important;
        }
        
        #nextBtn:enabled {
            background-color: #3498db !important;
            cursor: pointer !important;
            opacity: 1;
            border: 2px solid #2980b9 !important;
        }
        
        #submitBtn:disabled {
            background-color: #95a5a6 !important;
            cursor: not-allowed !important;
            opacity: 0.6;
        }
    `;
    document.head.appendChild(style);
    console.log("✅ Preview styles added");
}

initializeEventListeners() {
    console.log("🔄 Setting up event listeners...");
    
    // Get buttons with a delay to ensure they exist
    setTimeout(() => {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        console.log("📝 Buttons found after timeout:", { 
            nextBtn: !!nextBtn, 
            prevBtn: !!prevBtn, 
            submitBtn: !!submitBtn 
        });
        
        if (nextBtn) {
            console.log("🔍 Next button details:", {
                id: nextBtn.id,
                disabled: nextBtn.disabled,
                type: nextBtn.type,
                outerHTML: nextBtn.outerHTML.substring(0, 150)
            });
            
            // SIMPLE DIRECT EVENT LISTENER - NO COMPLEXITY
            nextBtn.addEventListener('click', (e) => {
                console.log("👉👉👉 NEXT BUTTON CLICKED at " + Date.now());
                console.log("Event details:", e);
                e.preventDefault();
                e.stopImmediatePropagation();
                
                // Call nextStep
                this.nextStep();
            }, true); // Use capture phase
            
            console.log("✅ Next button listener added (simple)");
        } else {
            console.error("❌ CRITICAL: nextBtn not found!");
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.prevStep();
            });
            console.log("✅ Previous button listener added");
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveConfiguration(e);
            });
            console.log("✅ Submit button listener added");
        }
        
    }, 300); // Wait 300ms for DOM to be ready
    
    console.log("✅ Event listeners setup initiated");
}

setupRealTimeValidation() {
    console.log("🔄 Setting up real-time validation...");
    
    const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
    console.log(`📝 Found ${requiredFields.length} required fields`);
    
    requiredFields.forEach(field => {
        // Add input event
        field.addEventListener('input', () => {
            this.validateField(field);
            this.validateCurrentStep();
        });
        
        // Add change event (for select)
        field.addEventListener('change', () => {
            this.validateField(field);
            this.validateCurrentStep();
        });
        
        // Initial validation
        setTimeout(() => this.validateField(field), 100);
    });
    
    console.log("✅ Real-time validation setup complete");
}

validateField(field) {
    if (!field) return false;
    
    const value = field.value.trim();
    const validationMsg = field.parentNode.querySelector('.validation-message');
    
    // Special handling for select
    if (field.tagName === 'SELECT') {
        const isValid = field.value !== '' && field.value !== 'Select a property type';
        
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
    
    // For input/textarea
    const isValid = value.length > 0;
    
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
    
    console.log(`Checking ${requiredFields.length} fields:`);
    
    requiredFields.forEach(field => {
        const isValid = this.validateField(field);
        console.log(`  - ${field.id}: "${field.value}" = ${isValid}`);
        if (!isValid) allValid = false;
    });
    
    // Update Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = !allValid;
        console.log(`🔘 Next button ${allValid ? 'ENABLED' : 'DISABLED'}`);
    }
    
    console.log(`✅ Step ${this.currentStep} ${allValid ? 'VALID' : 'INVALID'}`);
    return allValid;
}

autoLoadExistingConfig() {
    console.log("🔄 Auto-loading existing config...");
    
    try {
        const savedConfig = localStorage.getItem('rentalAIPropertyConfig');
        
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            console.log('📁 Found config for:', config.name);
            
            // Populate fields
            document.getElementById('propertyName').value = config.name || '';
            document.getElementById('propertyAddress').value = config.address || '';
            document.getElementById('propertyType').value = config.type || 'Vacation Home';
            
            console.log('✅ Config loaded');
        } else {
            console.log('ℹ️ No saved config - starting fresh');
        }
    } catch (error) {
        console.error('❌ Error loading config:', error);
    }
}

nextStep() {
    console.log("🔄 nextStep() called at " + Date.now());
    
    // Validate first
    const isValid = this.validateCurrentStep();
    console.log(`Can proceed? ${isValid ? 'YES' : 'NO'}`);
    
    if (this.currentStep < this.totalSteps && isValid) {
        this.currentStep++;
        this.updateStepDisplay();
        console.log(`✅ Moved to step ${this.currentStep}`);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.log("❌ Cannot proceed - validation failed");
        
        // Find and highlight first invalid field
        const currentSection = document.getElementById(`section${this.currentStep}`);
        if (currentSection) {
            const invalidFields = currentSection.querySelectorAll('.field-invalid');
            if (invalidFields.length > 0) {
                invalidFields[0].focus();
            }
        }
        
        // Show message
        this.showTempMessage('Please fill all required fields', 'warning');
    }
}

prevStep() {
    console.log("🔄 prevStep() called");
    if (this.currentStep > 1) {
        this.currentStep--;
        this.updateStepDisplay();
        console.log(`✅ Moved to step ${this.currentStep}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

updateStepDisplay() {
    console.log("🔄 Updating to step " + this.currentStep);
    
    // Show/hide sections
    for (let i = 1; i <= 3; i++) {
        const section = document.getElementById('section' + i);
        if (section) {
            section.style.display = (i === this.currentStep) ? 'block' : 'none';
        }
    }
    
    // Update buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) prevBtn.style.display = this.currentStep > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = this.currentStep < 3 ? 'flex' : 'none';
    if (submitBtn) submitBtn.style.display = this.currentStep === 3 ? 'flex' : 'none';
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 === this.currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Update preview on step 3
    if (this.currentStep === 3) {
        this.updatePreview();
    }
    
    // Validate new step
    setTimeout(() => this.validateCurrentStep(), 100);
    
    console.log("✅ Step display updated");
}

updatePreview() {
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
    `;

    previewContent.innerHTML = previewHTML;
    previewSection.style.display = 'block';
}

getFormData() {
    return {
        name: document.getElementById('propertyName')?.value || '',
        address: document.getElementById('propertyAddress')?.value || '',
        type: document.getElementById('propertyType')?.value || ''
    };
}

// KEEP ALL THE REST OF YOUR ORIGINAL METHODS EXACTLY AS THEY WERE
// (loadRecommendations, saveRecommendations, updateRecommendationsList, addRecommendation, removeRecommendation,
// loadAppliances, saveAppliances, updateAppliancesList, addAppliance, removeAppliance,
// saveConfiguration, formatTime, notifyMainChat, showSuccessMessage,
// showTempMessage, showEditModeIndicator, setupAdditionalButtons, setupResetButton, setupBackupButton)

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
        
        try {
            await fetch('/admin/save-recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.recommendations)
            });
        } catch (serverError) {
            console.error('⚠️ Could not save to server:', serverError);
        }
    } catch (error) {
        console.error('Error saving recommendations:', error);
    }
}

updateRecommendationsList() {
    const container = document.getElementById('recommendations-list');
    if (!container) return;
    
    if (this.recommendations.length === 0) {
        container.innerHTML = `<div class="no-recommendations"><p>No recommendations yet.</p></div>`;
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

async addRecommendation() {
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
    await this.saveRecommendations();
    this.updateRecommendationsList();

    if (nameInput) nameInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (notesInput) notesInput.value = '';

    this.showTempMessage('Recommendation added successfully!', 'success');
}

async removeRecommendation(index) {
    if (confirm('Are you sure you want to remove this recommendation?')) {
        this.recommendations.splice(index, 1);
        await this.saveRecommendations();
        this.updateRecommendationsList();
        this.showTempMessage('Recommendation removed', 'success');
    }
}

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
        
        try {
            await fetch('/admin/save-appliances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.appliances)
            });
        } catch (serverError) {
            console.error('⚠️ Could not save to server:', serverError);
        }
    } catch (error) {
        console.error('Error saving appliances:', error);
    }
}

updateAppliancesList() {
    const container = document.getElementById('appliances-list');
    if (!container) return;
    
    if (this.appliances.length === 0) {
        container.innerHTML = `<div class="no-appliances"><p>No appliances added yet.</p></div>`;
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

async addAppliance() {
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
    await this.saveAppliances();
    this.updateAppliancesList();

    nameInput.value = '';
    instructionsInput.value = '';
    troubleshootingInput.value = '';
    if (photoInput) photoInput.value = '';

    this.showTempMessage('Appliance added successfully!', 'success');
}

async removeAppliance(index) {
    if (confirm('Are you sure you want to remove this appliance?')) {
        this.appliances.splice(index, 1);
        await this.saveAppliances();
        this.updateAppliancesList();
        this.showTempMessage('Appliance removed', 'success');
    }
}

async saveConfiguration(e) {
    if (e) e.preventDefault();
    
    if (!this.validateCurrentStep()) {
        this.showTempMessage('Please fill in all required fields before saving.', 'error');
        return;
    }

    const formData = this.getFormData();
    
    const config = {
        name: formData.name,
        address: formData.address,
        type: formData.type,
        hostContact: formData.hostContact,
        maintenanceContact: formData.maintenanceContact,
        emergencyContact: formData.maintenanceContact || formData.hostContact,
        checkinTime: this.formatTime(formData.checkInTime) || '3:00 PM',
        checkoutTime: this.formatTime(formData.checkOutTime) || '11:00 AM',
        lateCheckout: formData.lateCheckout,
        amenities: {
            wifi: formData.wifiDetails || 'Not set',
            parking: '',
            other: formData.amenities || ''
        },
        houseRules: formData.houseRules || '',
        appliances: this.appliances,
        hasAppliances: this.appliances.length > 0,
        lastUpdated: new Date().toISOString(),
        hasRecommendations: this.recommendations.length > 0,
        contact: formData.hostContact,
        checkInOut: {
            checkIn: this.formatTime(formData.checkInTime) || '3:00 PM',
            checkOut: this.formatTime(formData.checkOutTime) || '11:00 AM'
        }
    };

    try {
        localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(config));
        localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
        this.saveAppliances();
        
        console.log('✅ Configuration saved to localStorage!');
        
        try {
            await fetch('/admin/save-property-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            await fetch('/admin/save-recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.recommendations)
            });
            await fetch('/admin/save-appliances', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.appliances)
            });
        } catch (serverError) {
            console.error('⚠️ Could not save to server:', serverError);
        }
        
        this.showSuccessMessage();
        this.notifyMainChat();
        
    } catch (error) {
        console.error('❌ Error saving configuration:', error);
        this.showTempMessage('Error saving configuration. Please try again.', 'error');
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

notifyMainChat() {
    window.dispatchEvent(new Event('storage'));
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
        const guestLink = `${window.location.origin}/`;
        
        const previewHtml = `
            <div style="text-align: left; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #2ecc71;">
                <h4 style="color: #2c3e50; margin-bottom: 15px;">✅ Configuration Saved!</h4>
                <div style="background: #e8f4fd; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <h5 style="margin-top: 0; color: #3498db;">📋 Guest Link:</h5>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <input type="text" readonly value="${guestLink}" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: white; font-family: monospace;">
                        <button onclick="copyToClipboard('${guestLink}')" style="padding: 8px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <p style="font-size: 0.9em; color: #7f8c8d; margin-top: 8px; margin-bottom: 0;">
                        Share this link with your guests to access the AI assistant
                    </p>
                </div>
            </div>
        `;
        
        const previewDiv = document.createElement('div');
        previewDiv.className = 'saved-preview';
        previewDiv.innerHTML = previewHtml;
        successMessage.insertBefore(previewDiv, successMessage.querySelector('button'));
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

showEditModeIndicator() {
    const hasConfig = localStorage.getItem('rentalAIPropertyConfig');
    if (hasConfig) {
        const banner = document.createElement('div');
        banner.className = 'edit-mode-banner';
        banner.innerHTML = `
            <div style="background: #d1ecf1; border-left: 4px solid #3498db; padding: 12px 15px; border-radius: 5px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-edit" style="color: #0c5460;"></i>
                <div>
                    <strong style="color: #0c5460;">Edit Mode</strong> - You are editing your existing configuration.
                </div>
            </div>
        `;
        const adminContainer = document.querySelector('.admin-container');
        if (adminContainer) {
            adminContainer.insertBefore(banner, adminContainer.firstChild);
        }
    }
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
            
            const banner = document.querySelector('.edit-mode-banner');
            if (banner) banner.remove();
            
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
    console.log("🔄 Global addRecommendation called");
    if (window.propertySetup) {
        window.propertySetup.addRecommendation();
    } else {
        alert('System not ready. Please wait for page to load.');
    }
}

function addAppliance() {
    console.log("🛠️ Global addAppliance called");
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

// Add TEST function for debugging
window.testNextButton = function() {
    console.log("🔍 TEST: Manual test of Next button");
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        console.log("Next button found, disabled:", nextBtn.disabled);
        console.log("Clicking it...");
        nextBtn.click();
    } else {
        console.error("Next button not found!");
    }
};

// SIMPLE initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM loaded - Initializing PropertySetup");
    
    // Add a TEST button for debugging
    setTimeout(() => {
        const testBtn = document.createElement('button');
        testBtn.textContent = '🔍 TEST';
        testBtn.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px; border-radius: 5px; font-size: 12px;';
        testBtn.onclick = function() {
            console.log("🔍 TEST button clicked");
            const nextBtn = document.getElementById('nextBtn');
            if (nextBtn) {
                alert('Next button exists!\nDisabled: ' + nextBtn.disabled + '\nClicking it...');
                nextBtn.click();
            } else {
                alert('Next button NOT FOUND!');
            }
        };
        document.body.appendChild(testBtn);
    }, 1000);
    
    try {
        window.propertySetup = new PropertySetup();
        console.log("✅ PropertySetup initialized!");
    } catch (error) {
        console.error("❌ Error initializing PropertySetup:", error);
        alert("Error loading setup. Check console.");
    }
});
