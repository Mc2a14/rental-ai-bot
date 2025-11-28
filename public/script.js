class RentalAIChat {
    constructor() {
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        this.maxStorageMessages = 50; // Limit to prevent storage overflow
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
    }

    initializeEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const charCount = document.getElementById('charCount');

        // Send message on button click
        sendButton.addEventListener('click', () => this.sendMessage());

        // Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Update character count
        messageInput.addEventListener('input', () => this.updateCharCount());

        // Enable/disable send button based on input
        messageInput.addEventListener('input', () => {
            sendButton.disabled = messageInput.value.trim().length === 0;
        });

        // Add clear chat button event listener
        this.addClearChatButton();
    }

    addClearChatButton() {
        // Create clear chat button in header
        const header = document.querySelector('.chat-header');
        const clearButton = document.createElement('button');
        clearButton.className = 'clear-chat-btn';
        clearButton.innerHTML = '<i class="fas fa-trash"></i> Clear Chat';
        clearButton.title = 'Clear conversation history';
        clearButton.addEventListener('click', () => this.clearChatHistory());
        
        // Add to status indicator area
        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.parentNode.insertBefore(clearButton, statusIndicator);
    }

    // CHAT HISTORY METHODS
    saveChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        const messages = [];
        
        // Get all message elements except the initial welcome message
        const messageElements = chatMessages.querySelectorAll('.message');
        
        messageElements.forEach((messageEl, index) => {
            // Skip the initial welcome message (first bot message)
            if (index === 0 && messageEl.classList.contains('bot-message')) {
                return;
            }
            
            const isBot = messageEl.classList.contains('bot-message');
            const contentEl = messageEl.querySelector('.message-content');
            const content = isBot ? contentEl.innerHTML : contentEl.textContent;
            const timestamp = messageEl.getAttribute('data-timestamp') || new Date().toISOString();
            
            messages.push({
                type: isBot ? 'bot' : 'user',
                content: content,
                timestamp: timestamp,
                formatted: isBot // Whether content is HTML formatted
            });
        });

        // Limit the number of messages stored
        if (messages.length > this.maxStorageMessages) {
            messages.splice(0, messages.length - this.maxStorageMessages);
        }

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(messages));
            this.updateStorageIndicator();
        } catch (error) {
            console.warn('Could not save chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const messages = JSON.parse(saved);
                const chatMessages = document.getElementById('chatMessages');
                
                // Clear existing messages except the welcome message
                const welcomeMessage = chatMessages.querySelector('.message:first-child');
                chatMessages.innerHTML = '';
                if (welcomeMessage) {
                    chatMessages.appendChild(welcomeMessage);
                }

                // Restore saved messages
                messages.forEach(msg => {
                    this.restoreMessage(msg);
                });

                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                this.updateStorageIndicator();
            }
        } catch (error) {
            console.warn('Could not load chat history:', error);
        }
    }

    restoreMessage(msg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}-message`;
        messageDiv.setAttribute('data-timestamp', msg.timestamp);

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = msg.type === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (msg.formatted) {
            messageContent.innerHTML = msg.content;
        } else {
            messageContent.textContent = msg.content;
        }

        // Add timestamp
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = this.formatTimestamp(msg.timestamp);
        messageContent.appendChild(timestamp);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        const chatMessages = document.getElementById('chatMessages');
        chatMessages.appendChild(messageDiv);
    }

    clearChatHistory() {
        if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
            try {
                localStorage.removeItem(this.storageKey);
                const chatMessages = document.getElementById('chatMessages');
                
                // Keep only the welcome message
                const welcomeMessage = chatMessages.querySelector('.message:first-child');
                chatMessages.innerHTML = '';
                if (welcomeMessage) {
                    chatMessages.appendChild(welcomeMessage);
                }
                
                this.updateStorageIndicator();
                this.showTempMessage('Chat history cleared', 'success');
            } catch (error) {
                console.warn('Could not clear chat history:', error);
                this.showTempMessage('Error clearing chat history', 'error');
            }
        }
    }

    updateStorageIndicator() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            const messages = saved ? JSON.parse(saved) : [];
            const indicator = document.querySelector('.storage-indicator') || this.createStorageIndicator();
            
            if (messages.length > 0) {
                indicator.textContent = `💾 ${messages.length} message${messages.length !== 1 ? 's' : ''} saved`;
                indicator.style.display = 'inline';
            } else {
                indicator.style.display = 'none';
            }
        } catch (error) {
            console.warn('Could not update storage indicator:', error);
        }
    }

    createStorageIndicator() {
        const indicator = document.createElement('span');
        indicator.className = 'storage-indicator';
        indicator.style.cssText = 'font-size: 0.7rem; opacity: 0.7; margin-left: 10px; display: none;';
        
        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.appendChild(indicator);
        
        return indicator;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    showTempMessage(text, type = 'info') {
        const tempMsg = document.createElement('div');
        tempMsg.className = `temp-message temp-message-${type}`;
        tempMsg.textContent = text;
        tempMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(tempMsg);

        setTimeout(() => {
            tempMsg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (tempMsg.parentNode) {
                    tempMsg.parentNode.removeChild(tempMsg);
                }
            }, 300);
        }, 3000);
    }

    updateCharCount() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');
        const length = messageInput.value.length;
        charCount.textContent = `${length}/500`;
        
        // Change color if approaching limit
        if (length > 450) {
            charCount.style.color = '#e74c3c';
        } else if (length > 400) {
            charCount.style.color = '#f39c12';
        } else {
            charCount.style.color = '#7f8c8d';
        }
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        // Clear input and disable send button
        messageInput.value = '';
        this.updateCharCount();
        document.getElementById('sendButton').disabled = true;

        // Add user message to chat with timestamp
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            // Hide typing indicator
            this.hideTypingIndicator();

            if (data.success) {
                this.addMessage(data.response, 'bot');
            } else {
                this.addMessage(
                    "I'm having trouble connecting right now. Please try again in a moment, or contact the host directly for urgent matters.",
                    'bot'
                );
                console.error('API Error:', data.error);
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(
                "Sorry, I'm experiencing connection issues. Please check your internet connection and try again.",
                'bot'
            );
            console.error('Network Error:', error);
        }
    }

    addMessage(content, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Add timestamp for persistence
        const timestamp = new Date().toISOString();
        messageDiv.setAttribute('data-timestamp', timestamp);

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (sender === 'bot') {
            // Format bot response with line breaks and lists
            const formattedContent = this.formatBotResponse(content);
            messageContent.innerHTML = formattedContent;
        } else {
            messageContent.textContent = content;
        }

        // Add timestamp to message
        const timeElement = document.createElement('div');
        timeElement.className = 'message-timestamp';
        timeElement.textContent = this.formatTimestamp(timestamp);
        messageContent.appendChild(timeElement);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to history (except initial welcome message)
        if (!(sender === 'bot' && chatMessages.children.length === 1)) {
            this.saveChatHistory();
        }
    }

    formatBotResponse(text) {
        // Convert line breaks to <br>
        let formatted = text.replace(/\n/g, '<br>');
        
        // Convert numbered lists with periods
        formatted = formatted.replace(/(\d+)\.\s/g, '<strong>$1.</strong> ');
        
        // Convert asterisk lists to proper list items
        formatted = formatted.replace(/\*\s(.+?)(?=<br>|$)/g, '• $1<br>');
        
        // Add some basic formatting for common patterns
        formatted = formatted.replace(/Emergency:/g, '<strong>🚨 Emergency:</strong>');
        formatted = formatted.replace(/Contact:/g, '<strong>📞 Contact:</strong>');
        formatted = formatted.replace(/Address:/g, '<strong>📍 Address:</strong>');
        formatted = formatted.replace(/Check-in:/g, '<strong>🕒 Check-in:</strong>');
        formatted = formatted.replace(/Check-out:/g, '<strong>🕒 Check-out:</strong>');
        formatted = formatted.replace(/WiFi:/g, '<strong>📶 WiFi:</strong>');
        formatted = formatted.replace(/Parking:/g, '<strong>🚗 Parking:</strong>');
        
        return formatted;
    }

    showTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'flex';
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        typingIndicator.style.display = 'none';
    }
}

// Global function for quick questions
function askQuestion(question) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = question;
    document.getElementById('sendButton').disabled = false;
    
    // Trigger the send message function
    const chat = window.chat || new RentalAIChat();
    chat.sendMessage();
}

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.chat = new RentalAIChat();
    
    // Add CSS animations for new features
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .message-timestamp {
            font-size: 0.7rem;
            opacity: 0.6;
            margin-top: 5px;
            text-align: right;
        }
        .clear-chat-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s;
            margin-right: 10px;
        }
        .clear-chat-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);
});

// Handle page visibility changes (for mobile)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
});
