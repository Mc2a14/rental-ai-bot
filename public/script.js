// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const clearChatButton = document.getElementById('clearChat');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeText = document.getElementById('themeText');

// Theme toggle functionality
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark';
    }
});

// Clear chat functionality
clearChatButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the chat?')) {
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-title">Welcome to Rental AI Assistant</div>
                <p>How can I help you with your rental needs today?</p>
            </div>
        `;
    }
});

// Send message functionality
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';

    // Simulate AI response after a short delay
    setTimeout(() => {
        showTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator();
            addMessage(getAIResponse(message), 'ai');
        }, 1500);
    }, 500);
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');
    messageContent.textContent = text;
    
    const messageTime = document.createElement('div');
    messageTime.classList.add('message-time');
    messageTime.textContent = getCurrentTime();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.id = 'typingIndicator';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('typing-dot');
        typingDiv.appendChild(dot);
    }
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Get current time for message timestamp
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate AI response based on user input
function getAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('apartment') || lowerMessage.includes('rental') || lowerMessage.includes('property')) {
        return "I can help you find the perfect rental property. What's your budget and preferred location?";
    } else if (lowerMessage.includes('budget')) {
        return "Based on your budget, I can suggest several options in different neighborhoods. Would you like to see properties in the city center or suburbs?";
    } else if (lowerMessage.includes('amenities') || lowerMessage.includes('features')) {
        return "Our properties come with various amenities like parking, gym access, and laundry facilities. Which amenities are most important to you?";
    } else if (lowerMessage.includes('lease') || lowerMessage.includes('contract')) {
        return "Standard leases are for 12 months, but we offer flexible options. Would you like more information about our lease terms?";
    } else if (lowerMessage.includes('application') || lowerMessage.includes('apply')) {
        return "The application process is simple. You'll need to provide proof of income and references. Would you like me to send you the application form?";
    } else {
        return "I'm here to help with all your rental needs. Could you provide more details about what you're looking for?";
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});
