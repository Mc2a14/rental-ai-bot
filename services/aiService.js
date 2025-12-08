// AI Chat Service
const fetch = require('node-fetch');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.apiUrl = config.ai.apiUrl;
    this.apiKey = config.ai.apiKey;
    this.model = config.ai.model;
    this.maxTokens = config.ai.maxTokens;
    this.temperature = config.ai.temperature;
    this.timeout = config.ai.timeout;
  }

  async chat(message, hostConfig = null, systemMessage = '', language = 'en') {
    try {
      // Check if API key is configured
      if (!this.apiKey || this.apiKey === '') {
        logger.warn('AI API key not configured. Using fallback response.');
        return {
          success: true,
          response: this.getFallbackResponse(message, hostConfig, language),
          usingCustomConfig: !!hostConfig
        };
      }
      
      // Build system prompt
      let systemPrompt = this.buildSystemPrompt(hostConfig, systemMessage, language);
      
      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Make API request with timeout
      const fetchPromise = fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: false
        })
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.timeout);
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('AI API Error:', response.status, errorText);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        logger.error('Invalid AI response:', data);
        throw new Error('Invalid response from AI service');
      }

      return {
        success: true,
        response: data.choices[0].message.content.trim(),
        usingCustomConfig: !!hostConfig
      };

    } catch (error) {
      logger.error('AI Service Error:', error);
      
      // Handle timeout/abort errors
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return {
          success: false,
          response: this.getTimeoutMessage(language),
          error: 'Request timeout'
        };
      }
      
      // Return a helpful error message
      return {
        success: false,
        response: this.getErrorMessage(language),
        error: error.message
      };
    }
  }

  buildSystemPrompt(hostConfig, systemMessage, language) {
    let prompt = `You are a helpful AI assistant for short-term rental properties. `;
    
    // Language instruction
    const languageMap = {
      'en': 'Respond in English.',
      'es': 'Responde en Español.',
      'fr': 'Répondez en Français.'
    };
    prompt += languageMap[language] || languageMap['en'];

    // Property information
    if (hostConfig) {
      prompt += `\n\nPROPERTY INFORMATION:\n`;
      if (hostConfig.name) prompt += `Property Name: ${hostConfig.name}\n`;
      if (hostConfig.address) prompt += `Address: ${hostConfig.address}\n`;
      if (hostConfig.type) prompt += `Type: ${hostConfig.type}\n`;
      
      if (hostConfig.hostContact) {
        prompt += `\nHost Contact: ${hostConfig.hostContact}\n`;
      }
      if (hostConfig.maintenanceContact) {
        prompt += `Maintenance Contact: ${hostConfig.maintenanceContact}\n`;
      }
      if (hostConfig.emergencyContact) {
        prompt += `Emergency Contact: ${hostConfig.emergencyContact}\n`;
      }
      
      if (hostConfig.checkinTime) {
        prompt += `\nCheck-in Time: ${hostConfig.checkinTime}\n`;
      }
      if (hostConfig.checkoutTime) {
        prompt += `Check-out Time: ${hostConfig.checkoutTime}\n`;
      }
      if (hostConfig.lateCheckout) {
        prompt += `Late Check-out: ${hostConfig.lateCheckout}\n`;
      }
      
      if (hostConfig.amenities) {
        prompt += `\nAmenities:\n`;
        if (hostConfig.amenities.wifi) {
          prompt += `WiFi: ${hostConfig.amenities.wifi}\n`;
        }
        if (hostConfig.amenities.parking) {
          prompt += `Parking: ${hostConfig.amenities.parking}\n`;
        }
        if (hostConfig.amenities.other) {
          prompt += `Other: ${hostConfig.amenities.other}\n`;
        }
      }
      
      if (hostConfig.houseRules) {
        prompt += `\nHouse Rules:\n${hostConfig.houseRules}\n`;
      }
    }

    // Additional system message (recommendations, appliances, etc.)
    if (systemMessage) {
      prompt += `\n\n${systemMessage}`;
    }

    prompt += `\n\nBe friendly, helpful, and concise. Answer questions about the property, local recommendations, appliances, and any other guest inquiries. If you don't know something, politely say so and suggest contacting the host.`;

    return prompt;
  }

  getErrorMessage(language) {
    const messages = {
      'en': "I'm having trouble connecting right now. Please try again in a moment, or contact the host directly for immediate assistance.",
      'es': "Estoy teniendo problemas para conectarme ahora mismo. Por favor, inténtalo de nuevo en un momento, o contacta directamente al anfitrión para asistencia inmediata.",
      'fr': "J'ai des difficultés à me connecter en ce moment. Veuillez réessayer dans un instant, ou contactez directement l'hôte pour une assistance immédiate."
    };
    return messages[language] || messages['en'];
  }

  getTimeoutMessage(language) {
    const messages = {
      'en': "The request took too long. Please try again with a simpler question, or contact the host directly.",
      'es': "La solicitud tardó demasiado. Por favor, inténtalo de nuevo con una pregunta más simple, o contacta directamente al anfitrión.",
      'fr': "La demande a pris trop de temps. Veuillez réessayer avec une question plus simple, ou contactez directement l'hôte."
    };
    return messages[language] || messages['en'];
  }

  getFallbackResponse(message, hostConfig, language) {
    const lowerMessage = message.toLowerCase();
    const responses = {
      'en': {
        wifi: hostConfig?.amenities?.wifi 
          ? `WiFi Information: ${hostConfig.amenities.wifi}`
          : 'WiFi information is not available. Please contact the host.',
        checkin: hostConfig?.checkinTime 
          ? `Check-in time is ${hostConfig.checkinTime}. Check-out time is ${hostConfig.checkoutTime || '11:00 AM'}.`
          : 'Check-in/out times are not available. Please contact the host.',
        contact: hostConfig?.hostContact 
          ? `Host Contact: ${hostConfig.hostContact}${hostConfig.maintenanceContact ? `\nMaintenance: ${hostConfig.maintenanceContact}` : ''}`
          : 'Contact information is not available. Please check your booking confirmation.',
        default: 'I understand your question. For detailed assistance, please contact the host directly using the contact information provided in your booking confirmation.'
      },
      'es': {
        wifi: hostConfig?.amenities?.wifi 
          ? `Información WiFi: ${hostConfig.amenities.wifi}`
          : 'La información WiFi no está disponible. Por favor contacte al anfitrión.',
        checkin: hostConfig?.checkinTime 
          ? `La hora de check-in es ${hostConfig.checkinTime}. La hora de check-out es ${hostConfig.checkoutTime || '11:00 AM'}.`
          : 'Los horarios de check-in/out no están disponibles. Por favor contacte al anfitrión.',
        contact: hostConfig?.hostContact 
          ? `Contacto del Anfitrión: ${hostConfig.hostContact}${hostConfig.maintenanceContact ? `\nMantenimiento: ${hostConfig.maintenanceContact}` : ''}`
          : 'La información de contacto no está disponible. Por favor revise su confirmación de reserva.',
        default: 'Entiendo su pregunta. Para asistencia detallada, por favor contacte directamente al anfitrión usando la información de contacto proporcionada en su confirmación de reserva.'
      },
      'fr': {
        wifi: hostConfig?.amenities?.wifi 
          ? `Informations WiFi: ${hostConfig.amenities.wifi}`
          : "Les informations WiFi ne sont pas disponibles. Veuillez contacter l'hôte.",
        checkin: hostConfig?.checkinTime 
          ? `L'heure d'enregistrement est ${hostConfig.checkinTime}. L'heure de départ est ${hostConfig.checkoutTime || '11:00 AM'}.`
          : "Les heures d'enregistrement/départ ne sont pas disponibles. Veuillez contacter l'hôte.",
        contact: hostConfig?.hostContact 
          ? `Contact de l'hôte: ${hostConfig.hostContact}${hostConfig.maintenanceContact ? `\nMaintenance: ${hostConfig.maintenanceContact}` : ''}`
          : "Les informations de contact ne sont pas disponibles. Veuillez vérifier votre confirmation de réservation.",
        default: "Je comprends votre question. Pour une assistance détaillée, veuillez contacter directement l'hôte en utilisant les informations de contact fournies dans votre confirmation de réservation."
      }
    };

    const langResponses = responses[language] || responses['en'];
    
    if (lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
      return langResponses.wifi;
    }
    if (lowerMessage.includes('check') && (lowerMessage.includes('in') || lowerMessage.includes('out'))) {
      return langResponses.checkin;
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('number')) {
      return langResponses.contact;
    }
    
    return langResponses.default;
  }
}

module.exports = new AIService();

