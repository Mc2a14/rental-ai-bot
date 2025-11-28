class RentalAIChat {
    constructor() {
        this.apiUrl = window.location.origin + '/chat/ai';
        this.storageKey = 'rental_ai_chat_history';
        
        console.log('🔄 Chat Initialized - localStorage:', !!window.localStorage);
        
        this.initializeEventListeners();
        this.updateCharCount();
        this.loadChatHistory();
        this.addClearButton();
    }

    initializeEventListeners() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

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
    }

    addClearButton() {
        // Create clear chat button
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '🗑️ Clear Chat';
        clearBtn.title = 'Clear conversation history';
        clearBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.4);
            color: white;
            padding: 8px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-right: 10px;
            transition: all 0.2s;
        `;
        clearBtn.addEventListener('mouseenter', () => {
            clearBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        clearBtn.addEventListener('mouseleave', () => {
            clearBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        clearBtn.addEventListener('click', () => this.clearChat());
        
        // Add to header next to status indicator
        const header = document.querySelector('.chat-header');
        const statusIndicator = document.querySelector('.status-indicator');
        header.insertBefore(clearBtn, statusIndicator);
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history? This cannot be undone.')) {
            localStorage.removeItem(this.storageKey);
            const chatMessages = document.getElementById('chatMessages');
            
            // Keep only the welcome message
            const welcomeMessage = chatMessages.querySelector('.message:first-child');
            chatMessages.innerHTML = '';
            if (welcomeMessage) {
                chatMessages.appendChild(welcomeMessage);
            }
            
            this.showTempMessage('Chat history cleared successfully!', 'success');
        }
    }

    showTempMessage(text, type = 'info') {
        const tempMsg = document.createElement('div');
        tempMsg.textContent = text;
        tempMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(tempMsg);

        setTimeout(() => {
            tempMsg.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (tempMsg.parentNode) {
                    tempMsg.parentNode.removeChild(tempMsg);
                }
            }, 300);
        }, 3000);
    }

    saveChatHistory() {
        try {
            const chatMessages = document.getElementById('chatMessages');
            const messages = [];
            
            // Get all message elements except the initial welcome message
            const messageElements = chatMessages.querySelectorAll('.message');
            
            messageElements.forEach((messageEl, index) => {
                // Skip the initial welcome message (first message)
                if (index === 0) return;
                
                const isBot = messageEl.classList.contains('bot-message');
                const contentEl = messageEl.querySelector('.message-content');
                const content = contentEl.textContent || contentEl.innerText;
                
                messages.push({
                    type: isBot ? 'bot' : 'user',
                    content: content,
                    timestamp: new Date().toISOString()
                });
            });

            localStorage.setItem(this.storageKey, JSON.stringify(messages));
            console.log('💾 Chat history saved:', messages.length, 'messages');
            
        } catch (error) {
            console.error('Error saving chat history:', error);
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
                    this.addMessage(msg.content, msg.type, true); // true = isRestored
                });

                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
                console.log('📂 Chat history loaded:', messages.length, 'messages');
                
                this.showTempMessage(`Loaded ${messages.length} previous messages`, 'info');
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
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

        // Add user message to chat
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

    addMessage(content, sender, isRestored = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'bot' 
            ? '<i class="fas fa-robot"></i>' 
            : '<i class="fas fa-user"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (sender === 'bot') {
            // Format bot response with line breaks
            const formattedContent = this.formatBotResponse(content);
            messageContent.innerHTML = formattedContent;
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to history (except when restoring or it's the welcome message)
        if (!isRestored && chatMessages.children.length > 1) {
            this.saveChatHistory();
        }
    }

    formatBotResponse(text) {
        // Convert line breaks to <br>
        let formatted = text.replace(/\n/g, '<br>');
        
        // Convert numbered lists with periods
        formatted = formatted.replace(/(\d+)\.\s/g, '<strong>$1.</strong> ');
        
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
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
});
