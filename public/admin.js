console.log("🔄 admin.js is loading...");

class PropertySetup {
    constructor() {
        console.log("✅ PropertySetup constructor called");
        this.currentStep = 1;
        this.totalSteps = 3;
        this.recommendations = this.loadRecommendations();
        
        console.log("🔄 Initializing event listeners...");
        this.initializeEventListeners();
        this.updateStepDisplay();
        this.updateRecommendationsList();
        this.addPreviewStyles();
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
            /* Validation styles */
            .field-invalid {
                border-color: #e74c3c !important;
                background-color: #fff0f0 !important;
            }
            .field-valid {
                border-color: #2ecc71 !important;
            }
            .validation-message {
                color: #e74c3c;
                font-size: 0.8rem;
                margin-top: 5px;
                display: none;
            }
            .validation-message.show {
                display: block;
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
        
        // Real-time validation with enhanced feedback
        this.setupRealTimeValidation();
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
            
            // Enhanced event listeners
            field.addEventListener('input', () => {
                this.validateField(field);
                this.validateCurrentStep();
            });
            
            field.addEventListener('blur', () => this.validateField(field));
            
            // Initial validation
            this.validateField(field);
        });
        
        this.validateCurrentStep();
        console.log("✅ Real-time validation setup complete");
    }

    validateField(field) {
        const isValid = field.value.trim().length > 0;
        const validationMsg = field.parentNode.querySelector('.validation-message');
        
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

        // Update button states with better UX
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

    nextStep() {
        console.log("🔄 Moving to next step...");
        if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
            console.log(`✅ Moved to step ${this.currentStep}`);
            
            // Auto-scroll to top for better UX
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
            
            // Auto-scroll to top for better UX
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
                
                // Ensure WiFi section is visible (extra safety)
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
                <strong>Property:</strong> ${formData.name || 'Not set'}
            </div>
            <div class="preview-item">
                <strong>Address:</strong> ${formData.address || 'Not set'}
            </div>
            <div class="preview-item">
                <strong>Host Contact:</strong> ${formData.hostContact || 'Not set'}
            </div>
            <div class="preview-item">
                <strong>Check-in:</strong> ${formData.checkInTime || 'Not set'} | <strong>Check-out:</strong> ${formData.checkOutTime || 'Not set'}
            </div>
            <div class="preview-item">
                <strong>WiFi:</strong> ${formData.wifiDetails || 'Not set'}
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

    saveConfiguration(e) {
        console.log("💾 Save configuration started!");
        if (e) e.preventDefault();
        
        if (!this.validateCurrentStep()) {
            this.showTempMessage('Please fill in all required fields before saving.', 'error');
            console.log("❌ Save blocked - validation failed");
            return;
        }

        const formData = this.getFormData();
        console.log("📝 Form data:", formData);
        
        // FIXED: Save in the correct format that the main chat expects
        const config = {
            name: formData.name,
            address: formData.address,
            type: formData.type,
            contact: {
                host: formData.hostContact,
                maintenance: formData.maintenanceContact,
                emergency: formData.maintenanceContact // Add emergency contact explicitly
            },
            checkInOut: {
                checkIn: formData.checkInTime,
                checkOut: formData.checkOutTime,
                lateCheckout: formData.lateCheckout
            },
            amenities: {
                wifi: formData.wifiDetails,
                list: formData.amenities.split('\n').filter(item => item.trim())
            },
            rules: {
                houseRules: formData.houseRules.split('\n').filter(item => item.trim())
            },
            recommendations: this.recommendations
        };

        try {
            // Save both the main config and recommendations separately
            localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(config));
            localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
            
            console.log('✅ Configuration saved successfully!', config);
            
            // Show detailed success message
            this.showSuccessMessage();
            
            // Notify the main chat window if it's open
            this.notifyMainChat();
            
        } catch (error) {
            console.error('❌ Error saving configuration:', error);
            this.showTempMessage('Error saving configuration. Please try again.', 'error');
        }
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
            
            // Add a preview of what was saved
            const formData = this.getFormData();
            const previewHtml = `
                <div style="text-align: left; background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4 style="color: #2c3e50; margin-bottom: 10px;">What was saved:</h4>
                    <p><strong>Property:</strong> ${formData.name}</p>
                    <p><strong>WiFi:</strong> ${formData.wifiDetails || 'Not set'}</p>
                    <p><strong>Emergency Contact:</strong> ${formData.maintenanceContact || 'Not set'}</p>
                    <p><strong>House Rules:</strong> ${formData.houseRules ? '✓ Saved' : 'Not set'}</p>
                    <p><strong>Recommendations:</strong> ${this.recommendations.length} places</p>
                </div>
            `;
            
            const existingPreview = successMessage.querySelector('.saved-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
            
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

    saveRecommendations() {
        try {
            localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
            console.log(`📍 Saved ${this.recommendations.length} recommendations`);
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

    addRecommendation() {
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
        this.saveRecommendations();
        this.updateRecommendationsList();

        // Clear form
        if (nameInput) nameInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
        if (notesInput) notesInput.value = '';

        this.showTempMessage('Recommendation added successfully!', 'success');
        console.log("✅ Recommendation added:", newPlace);
    }

    removeRecommendation(index) {
        console.log(`🔄 Removing recommendation at index ${index}...`);
        if (confirm('Are you sure you want to remove this recommendation?')) {
            this.recommendations.splice(index, 1);
            this.saveRecommendations();
            this.updateRecommendationsList();
            this.showTempMessage('Recommendation removed', 'success');
            console.log("✅ Recommendation removed");
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

// Initialize when page loads
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

console.log("✅ admin.js loaded completely");
