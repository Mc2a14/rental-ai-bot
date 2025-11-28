class RentalAIChat {
    constructor() {
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        this.themeKey = 'rental_ai_theme';
        this.languageKey = 'rental_ai_language';
        this.recommendationsKey = 'rental_ai_recommendations';
        
        console.log('🔄 Chat Initialized - localStorage:', !!window.localStorage);
        
        this.loadPropertyConfig(); // Load host configuration first
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
        this.createHeaderControls();
        this.loadThemePreference();
        this.loadLanguagePreference();
        this.loadRecommendations(); // Load host recommendations
    }

    // HOST RECOMMENDATIONS METHODS
    loadRecommendations() {
        try {
            const saved = localStorage.getItem(this.recommendationsKey);
            if (saved) {
                this.hostRecommendations = JSON.parse(saved);
                console.log('📍 Host recommendations loaded:', this.hostRecommendations.length);
            } else {
                // Default recommendations
                this.hostRecommendations = [
                    {
                        name: "Joe's Pizza",
                        category: "Restaurant",
                        description: "Best New York-style pizza in town",
                        notes: "Try the pepperoni and mushroom slice"
                    },
                    {
                        name: "Sunset Beach",
                        category: "Beach", 
                        description: "Quiet beach perfect for evening walks",
                        notes: "Best time to visit is 6 PM for sunset"
                    }
                ];
                this.saveRecommendations();
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.hostRecommendations = [];
        }
    }

    saveRecommendations() {
        try {
            localStorage.setItem(this.recommendationsKey, JSON.stringify(this.hostRecommendations));
        } catch (error) {
            console.error('Error saving recommendations:', error);
        }
    }

    getRecommendationsText() {
        if (!this.hostRecommendations || this.hostRecommendations.length === 0) {
            return "No host recommendations available yet.";
        }
        
        let text = "HOST RECOMMENDATIONS:\n\n";
        this.hostRecommendations.forEach(place => {
            text += `📍 ${place.name} (${place.category})\n`;
            if (place.description) text += `📝 ${place.description}\n`;
            if (place.notes) text += `💡 ${place.notes}\n`;
            text += "\n";
        });
        return text;
    }

    // Update the sendMessage method to include recommendations
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        messageInput.value = '';
        this.updateCharCount();
        document.getElementById('sendButton').disabled = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            const currentLanguage = this.getCurrentLanguage();
            
            // Get host configuration
            const hostConfig = this.getHostConfig();
            
            // Prepare system message with recommendations for local queries
            let systemMessage = '';
            const localKeywords = ['restaurant', 'food', 'eat', 'cafe', 'bar', 'beach', 'park', 'attraction', 'nearby', 'close to', 'local', 'recommend', 'suggestion', 'place to go'];
            
            if (anyKeywordInMessage(message, localKeywords)) {
                systemMessage = `When users ask about local places, restaurants, attractions, or recommendations, share the host's personal recommendations. Be enthusiastic about these since they're curated by the host.\n\n${this.getRecommendationsText()}`;
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: message,
                    language: currentLanguage,
                    hostConfig: hostConfig, // Send host config to backend
                    systemMessage: systemMessage // Send recommendations context
                })
            });

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'bot');
                console.log('🌍 Response language:', data.detectedLanguage);
                console.log('🏠 Using custom config:', data.usingCustomConfig);
                
                // Show notification if using custom config
                if (data.usingCustomConfig && hostConfig) {
                    console.log('✅ AI is using your custom property configuration');
                }
            } else {
                this.addMessage(
                    "I'm having trouble connecting right now. Please try again in a moment.",
                    'bot'
                );
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(
                "Sorry, I'm experiencing connection issues. Please check your internet connection and try again.",
                'bot'
            );
        }
    }

    // Update the header controls to include recommendations management
    createHeaderControls() {
        const headerControls = document.createElement('div');
        headerControls.className = 'header-controls';
        
        // Add Setup button (links to admin page)
        const setupBtn = this.createSetupButton();
        headerControls.appendChild(setupBtn);
        
        // Add Recommendations button
        const recBtn = this.createRecommendationsButton();
        headerControls.appendChild(recBtn);
        
        // Add Clear Chat button
        const clearBtn = this.createClearButton();
        headerControls.appendChild(clearBtn);
        
        // Add Theme Toggle button
        const themeToggle = this.createThemeToggle();
        headerControls.appendChild(themeToggle);
        
        // Add Language Selector
        const langSelect = this.createLanguageSelector();
        headerControls.appendChild(langSelect);
        
        // Add to header
        const header = document.querySelector('.chat-header');
        const statusIndicator = document.querySelector('.status-indicator');
        header.insertBefore(headerControls, statusIndicator);
    }

    createRecommendationsButton() {
        const recBtn = document.createElement('button');
        recBtn.className = 'recommendations-btn';
        recBtn.innerHTML = '📍 Recommendations';
        recBtn.title = 'Manage local recommendations';
        recBtn.addEventListener('click', () => {
            this.showRecommendationsModal();
        });
        return recBtn;
    }

    showRecommendationsModal() {
        // Create modal for managing recommendations
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Manage Local Recommendations</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="add-recommendation-form">
                        <h4>Add New Recommendation</h4>
                        <div class="form-group">
                            <input type="text" id="rec-name" placeholder="Place Name *" class="form-input">
                        </div>
                        <div class="form-group">
                            <select id="rec-category" class="form-select">
                                <option value="Restaurant">Restaurant</option>
                                <option value="Cafe">Cafe</option>
                                <option value="Bar">Bar</option>
                                <option value="Beach">Beach</option>
                                <option value="Park">Park</option>
                                <option value="Attraction">Attraction</option>
                                <option value="Shop">Shop</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <textarea id="rec-description" placeholder="Description" class="form-textarea"></textarea>
                        </div>
                        <div class="form-group">
                            <input type="text" id="rec-notes" placeholder="Special notes or tips" class="form-input">
                        </div>
                        <button class="add-rec-btn">Add Recommendation</button>
                    </div>
                    
                    <div class="recommendations-list">
                        <h4>Current Recommendations</h4>
                        <div id="current-recommendations"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.updateRecommendationsList();

        // Event listeners for modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.add-rec-btn').addEventListener('click', () => {
            this.addRecommendationFromModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    updateRecommendationsList() {
        const container = document.getElementById('current-recommendations');
        if (!container) return;

        if (this.hostRecommendations.length === 0) {
            container.innerHTML = '<p class="no-recommendations">No recommendations yet. Add some above!</p>';
            return;
        }

        container.innerHTML = '';
        this.hostRecommendations.forEach((place, index) => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="place-info">
                    <strong>${place.name}</strong> <span class="category">(${place.category})</span>
                    ${place.description ? `<p>${place.description}</p>` : ''}
                    ${place.notes ? `<p class="notes">💡 ${place.notes}</p>` : ''}
                </div>
                <button class="remove-rec-btn" data-index="${index}">Remove</button>
            `;
            container.appendChild(item);
        });

        // Add remove event listeners
        container.querySelectorAll('.remove-rec-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeRecommendation(index);
            });
        });
    }

    addRecommendationFromModal() {
        const name = document.getElementById('rec-name').value.trim();
        const category = document.getElementById('rec-category').value;
        const description = document.getElementById('rec-description').value.trim();
        const notes = document.getElementById('rec-notes').value.trim();

        if (!name) {
            this.showTempMessage('Please enter a place name', 'error');
            return;
        }

        const newPlace = {
            name,
            category,
            description,
            notes
        };

        this.hostRecommendations.push(newPlace);
        this.saveRecommendations();
        this.updateRecommendationsList();

        // Clear form
        document.getElementById('rec-name').value = '';
        document.getElementById('rec-description').value = '';
        document.getElementById('rec-notes').value = '';

        this.showTempMessage('Recommendation added successfully!', 'success');
    }

    removeRecommendation(index) {
        if (confirm('Are you sure you want to remove this recommendation?')) {
            this.hostRecommendations.splice(index, 1);
            this.saveRecommendations();
            this.updateRecommendationsList();
            this.showTempMessage('Recommendation removed', 'info');
        }
    }

    // ... rest of your existing methods remain the same
}

// Helper function to check for local keywords
function anyKeywordInMessage(message, keywords) {
    const lowerMessage = message.toLowerCase();
    return keywords.some(keyword => lowerMessage.includes(keyword));
}
