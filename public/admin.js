class PropertySetup {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.recommendations = this.loadRecommendations();
        
        this.initializeEventListeners();
        this.updateStepDisplay();
        this.updateRecommendationsList();
    }

    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
        
        // Form submission
        document.getElementById('propertyConfig').addEventListener('submit', (e) => this.saveConfiguration(e));
        
        // Real-time validation
        this.setupRealTimeValidation();
    }

    setupRealTimeValidation() {
        // Add input event listeners for real-time validation
        const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
        requiredFields.forEach(field => {
            field.addEventListener('input', () => this.validateCurrentStep());
        });
    }

    validateCurrentStep() {
        const currentSection = document.getElementById(`section${this.currentStep}`);
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

        document.getElementById('nextBtn').disabled = !isValid;
        if (this.currentStep === this.totalSteps) {
            document.getElementById('submitBtn').disabled = !isValid;
        }

        return isValid;
    }

    nextStep() {
        if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
            this.currentStep++;
            this.updateStepDisplay();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStepDisplay();
        }
    }

    updateStepDisplay() {
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
        document.getElementById('prevBtn').style.display = this.currentStep > 1 ? 'block' : 'none';
        document.getElementById('nextBtn').style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        document.getElementById('submitBtn').style.display = this.currentStep === this.totalSteps ? 'block' : 'none';

        // Update preview on step 3
        if (this.currentStep === 3) {
            this.updatePreview();
        }

        // Re-validate current step
        this.validateCurrentStep();
    }

    updatePreview() {
        const previewContent = document.getElementById('previewContent');
        const previewSection = document.getElementById('previewSection');
        
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
    }

    getFormData() {
        return {
            name: document.getElementById('propertyName').value,
            address: document.getElementById('propertyAddress').value,
            type: document.getElementById('propertyType').value,
            hostContact: document.getElementById('hostContact').value,
            maintenanceContact: document.getElementById('maintenanceContact').value,
            checkInTime: document.getElementById('checkInTime').value,
            checkOutTime: document.getElementById('checkOutTime').value,
            lateCheckout: document.getElementById('lateCheckout').value,
            wifiDetails: document.getElementById('wifiDetails').value,
            amenities: document.getElementById('amenities').value,
            houseRules: document.getElementById('houseRules').value
        };
    }

    saveConfiguration(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) {
            alert('Please fill in all required fields before saving.');
            return;
        }

        const formData = this.getFormData();
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
            console.log('✅ Configuration saved:', config);
        } catch (error) {
            console.error('Error saving configuration:', error);
            alert('Error saving configuration. Please try again.');
        }
    }

    showSuccessMessage() {
        document.getElementById('propertyConfig').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
    }

    // Recommendations management
    loadRecommendations() {
        try {
            const saved = localStorage.getItem('rental_ai_recommendations');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading recommendations:', error);
            return [];
        }
    }

    saveRecommendations() {
        try {
            localStorage.setItem('rental_ai_recommendations', JSON.stringify(this.recommendations));
        } catch (error) {
            console.error('Error saving recommendations:', error);
        }
    }

    updateRecommendationsList() {
        const container = document.getElementById('recommendations-list');
        
        if (this.recommendations.length === 0) {
            container.innerHTML = `
                <div class="no-recommendations">
                    <p>No recommendations yet. Add some to help your guests discover local gems!</p>
                </div>
            `;
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
        const name = document.getElementById('place-name').value.trim();
        const category = document.getElementById('place-category').value;
        const description = document.getElementById('place-description').value.trim();
        const notes = document.getElementById('place-notes').value.trim();

        if (!name) {
            alert('Please enter a place name');
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
        document.getElementById('place-name').value = '';
        document.getElementById('place-description').value = '';
        document.getElementById('place-notes').value = '';

        // Show confirmation
        this.showTempMessage('Recommendation added successfully!');
    }

    removeRecommendation(index) {
        if (confirm('Are you sure you want to remove this recommendation?')) {
            this.recommendations.splice(index, 1);
            this.saveRecommendations();
            this.updateRecommendationsList();
            this.showTempMessage('Recommendation removed');
        }
    }

    showTempMessage(text) {
        // Simple temporary message
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
        `;
        message.textContent = text;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

// Global function for the add recommendation button
function addRecommendation() {
    if (window.propertySetup) {
        window.propertySetup.addRecommendation();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.propertySetup = new PropertySetup();
});
