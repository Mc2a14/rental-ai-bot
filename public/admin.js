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
        
        // Real-time validation
        this.setupRealTimeValidation();
        console.log("✅ All event listeners initialized");
    }

    setupRealTimeValidation() {
        console.log("🔄 Setting up real-time validation...");
        const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
        console.log(`📝 Found ${requiredFields.length} required fields`);
        
        requiredFields.forEach(field => {
            field.addEventListener('input', () => this.validateCurrentStep());
        });
        
        this.validateCurrentStep();
        console.log("✅ Real-time validation setup complete");
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

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = '#e74c3c';
            } else {
                field.style.borderColor = '#e1e5e9';
            }
        });

        // Update button states
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (nextBtn) nextBtn.disabled = !isValid;
        if (submitBtn) submitBtn.disabled = !isValid;

        console.log(`✅ Step validation: ${isValid ? 'VALID' : 'INVALID'}`);
        return isValid;
    }

    nextStep() {
        console.log("🔄 Moving to next step...");
        if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
            console.log(`✅ Moved to step ${this.currentStep}`);
        } else {
            console.log("❌ Cannot move to next step - validation failed");
        }
    }

    prevStep() {
        console.log("🔄 Moving to previous step...");
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
            console.log(`✅ Moved to step ${this.currentStep}`);
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
            } else {
                section.style.display = 'none';
            }
        });

        // Update navigation buttons
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) prevBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        if (nextBtn) nextBtn.style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        if (submitBtn) submitBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';

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
            alert('Please fill in all required fields before saving.');
            console.log("❌ Save blocked - validation failed");
            return;
        }

        const formData = this.getFormData();
        console.log("📝 Form data:", formData);
        
        const config = {
            name: formData.name,
            address: formData.address,
            type: formData.type,
            contact: {
                host: formData.hostContact,
                maintenance: formData.maintenanceContact
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
            rules: formData.houseRules.split('\n').filter(item => item.trim()),
            recommendations: this.recommendations
        };

        try {
            localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(config));
            localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
            
            this.showSuccessMessage();
            console.log('✅ Configuration saved successfully!', config);
        } catch (error) {
            console.error('❌ Error saving configuration:', error);
            alert('Error saving configuration. Please try again.');
        }
    }

    showSuccessMessage() {
        console.log("🔄 Showing success message...");
        const propertyConfig = document.getElementById('propertyConfig');
        const successMessage = document.getElementById('successMessage');
        
        if (propertyConfig) propertyConfig.style.display = 'none';
        if (successMessage) successMessage.style.display = 'block';
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
            alert('Please enter a place name');
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

        this.showTempMessage('Recommendation added successfully!');
        console.log("✅ Recommendation added:", newPlace);
    }

    removeRecommendation(index) {
        console.log(`🔄 Removing recommendation at index ${index}...`);
        if (confirm('Are you sure you want to remove this recommendation?')) {
            this.recommendations.splice(index, 1);
            this.saveRecommendations();
            this.updateRecommendationsList();
            this.showTempMessage('Recommendation removed');
            console.log("✅ Recommendation removed");
        }
    }

    showTempMessage(text) {
        console.log(`🔄 Showing temp message: ${text}`);
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-family: Arial, sans-serif;
        `;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
}

// Global function for the add recommendation button
function addRecommendation() {
    console.log("🔄 Global addRecommendation called");
    if (window.propertySetup) {
        window.propertySetup.addRecommendation();
    } else {
        console.log("❌ PropertySetup not initialized");
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM Content Loaded - Initializing PropertySetup...");
    try {
        window.propertySetup = new PropertySetup();
        console.log("✅ PropertySetup initialized successfully!");
    } catch (error) {
        console.error("❌ Error initializing PropertySetup:", error);
    }
});

console.log("✅ admin.js loaded completely");
