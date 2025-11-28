class PropertyConfigurator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.config = {};
        
        this.initializeEventListeners();
        this.loadSavedConfig();
    }

    initializeEventListeners() {
        document.getElementById('nextBtn').addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevStep());
        document.getElementById('propertyConfig').addEventListener('submit', (e) => this.saveConfig(e));
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;

        this.currentStep++;
        this.updateUI();
    }

    prevStep() {
        this.currentStep--;
        this.updateUI();
    }

    validateCurrentStep() {
        const currentSection = document.getElementById(`section${this.currentStep}`);
        const requiredInputs = currentSection.querySelectorAll('input[required], textarea[required]');
        
        for (let input of requiredInputs) {
            if (!input.value.trim()) {
                alert(`Please fill in: ${input.previousElementSibling.textContent}`);
                input.focus();
                return false;
            }
        }
        
        // Save step data
        this.saveStepData();
        return true;
    }

    saveStepData() {
        switch(this.currentStep) {
            case 1:
                this.config.name = document.getElementById('propertyName').value;
                this.config.address = document.getElementById('propertyAddress').value;
                this.config.type = document.getElementById('propertyType').value;
                break;
            case 2:
                this.config.contacts = {
                    host: document.getElementById('hostContact').value,
                    maintenance: document.getElementById('maintenanceContact').value
                };
                this.config.schedule = {
                    checkIn: document.getElementById('checkInTime').value,
                    checkOut: document.getElementById('checkOutTime').value,
                    lateCheckOut: document.getElementById('lateCheckout').value || "Not available"
                };
                break;
            case 3:
                this.config.amenities = {
                    wifi: document.getElementById('wifiDetails').value,
                    essentials: this.parseList(document.getElementById('amenities').value)
                };
                this.config.rules = {
                    general: this.parseList(document.getElementById('houseRules').value)
                };
                break;
        }
    }

    parseList(text) {
        // Handle both new lines and commas
        return text.split(/[\n,]/)
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .map(item => item.startsWith('•') ? item : '• ' + item);
    }

    updateUI() {
        // Update steps
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.currentStep);
        });

        // Update sections
        document.querySelectorAll('.form-section').forEach((section, index) => {
            section.style.display = index + 1 === this.currentStep ? 'block' : 'none';
        });

        // Update buttons
        document.getElementById('prevBtn').style.display = this.currentStep > 1 ? 'block' : 'none';
        document.getElementById('nextBtn').style.display = this.currentStep < this.totalSteps ? 'block' : 'none';
        document.getElementById('submitBtn').style.display = this.currentStep === this.totalSteps ? 'block' : 'none';

        // Show preview on last step
        if (this.currentStep === this.totalSteps) {
            this.showPreview();
        }
    }

    showPreview() {
        const previewContent = document.getElementById('previewContent');
        const previewSection = document.getElementById('previewSection');
        
        previewContent.innerHTML = `
            <div style="margin-bottom: 15px;">
                <strong>Property:</strong> ${this.config.name}<br>
                <strong>Address:</strong> ${this.config.address}<br>
                <strong>Type:</strong> ${this.config.type}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Host Contact:</strong> ${this.config.contacts?.host}<br>
                <strong>Maintenance:</strong> ${this.config.contacts?.maintenance}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Check-in:</strong> ${this.config.schedule?.checkIn}<br>
                <strong>Check-out:</strong> ${this.config.schedule?.checkOut}
            </div>
            <div>
                <strong>WiFi:</strong> ${this.config.amenities?.wifi}<br>
                <strong>Amenities:</strong> ${this.config.amenities?.essentials?.slice(0, 3).join(', ')}...
            </div>
        `;
        
        previewSection.style.display = 'block';
    }

    saveConfig(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) return;

        // Save the complete configuration
        this.saveStepData();
        
        // Store in localStorage
        localStorage.setItem('rentalAIPropertyConfig', JSON.stringify(this.config));
        
        // Show success message
        document.getElementById('propertyConfig').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        
        console.log('Property configuration saved:', this.config);
    }

    loadSavedConfig() {
        const saved = localStorage.getItem('rentalAIPropertyConfig');
        if (saved) {
            this.config = JSON.parse(saved);
            
            // Populate form fields
            if (this.config.name) document.getElementById('propertyName').value = this.config.name;
            if (this.config.address) document.getElementById('propertyAddress').value = this.config.address;
            if (this.config.type) document.getElementById('propertyType').value = this.config.type;
            if (this.config.contacts?.host) document.getElementById('hostContact').value = this.config.contacts.host;
            if (this.config.contacts?.maintenance) document.getElementById('maintenanceContact').value = this.config.contacts.maintenance;
            if (this.config.schedule?.checkIn) document.getElementById('checkInTime').value = this.config.schedule.checkIn;
            if (this.config.schedule?.checkOut) document.getElementById('checkOutTime').value = this.config.schedule.checkOut;
            if (this.config.schedule?.lateCheckOut) document.getElementById('lateCheckout').value = this.config.schedule.lateCheckOut;
            if (this.config.amenities?.wifi) document.getElementById('wifiDetails').value = this.config.amenities.wifi;
            if (this.config.amenities?.essentials) document.getElementById('amenities').value = this.config.amenities.essentials.join('\n');
            if (this.config.rules?.general) document.getElementById('houseRules').value = this.config.rules.general.join('\n');
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    new PropertyConfigurator();
});
