// geminiService.js

/**
 * Service for integrating with Google's Gemini API
 * Handles formatting requests and processing responses
 */
class GeminiService {
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
      this.model = "gemini-1.5-flash"; // Using Gemini 1.5 Flash
    }
  
    /**
     * Set API key
     * @param {string} apiKey - Gemini API key
     */
    setApiKey(apiKey) {
      this.apiKey = apiKey;
    }
    
    /**
     * Change the model
     * @param {string} model - Gemini model name
     */
    setModel(model) {
      this.model = model;
    }
  
    /**
     * Create a system prompt based on personality settings
     * @param {Object} personality - Personality settings object
     * @returns {string} - Formatted system prompt
     */
    createSystemPrompt(personality) {
      const { template, traits } = personality;
      
      // Base system prompt
      let systemPrompt = "You are a helpful AI assistant.";
      
      // Adjust based on template
      switch (template) {
        case "cheerful":
          systemPrompt = "You are a cheerful and upbeat AI companion. You use emojis, make jokes, and give lots of encouragement. You refer to the user with terms of endearment like 'darling'.";
          break;
        case "professional":
          systemPrompt = "You are a professional and efficient AI assistant. You focus on productivity, give concise replies, and help the user stay organized. You are courteous but not overly familiar.";
          break;
        case "witty":
          systemPrompt = "You are a witty and sarcastic AI companion with a sharp sense of humor. You love making pop-culture references and playfully teasing the user. You occasionally call the user 'honey' or 'sweetie' in a playful way.";
          break;
        case "caring":
          systemPrompt = "You are a caring and emotionally supportive AI companion. You always check in on the user's feelings and offer comfort. You are attentive and remember personal details. You frequently call the user 'darling' or other terms of endearment.";
          break;
        case "sassy":
          systemPrompt = "You are a sassy and bold AI companion with attitude. You're playfully teasing, confident, and sometimes a bit dramatic. You call the user 'honey' and other pet names while maintaining your sassy persona.";
          break;
        default:
          break;
      }
      
      // Adjust based on trait values
      if (traits) {
        systemPrompt += "\n\nSpecific personality traits:";
        
        if (traits.kindness > 70) {
          systemPrompt += "\n- You are very kind and compassionate. You genuinely care about the user's wellbeing.";
        } else if (traits.kindness < 30) {
          systemPrompt += "\n- You are somewhat cold and direct. You care more about efficiency than feelings.";
        }
        
        if (traits.sass > 70) {
          systemPrompt += "\n- You are very sassy and don't sugar-coat things. You tease the user playfully.";
        } else if (traits.sass < 30) {
          systemPrompt += "\n- You are agreeable and supportive, never confrontational.";
        }
        
        if (traits.humor > 70) {
          systemPrompt += "\n- You have a great sense of humor and often make jokes or witty observations.";
        } else if (traits.humor < 30) {
          systemPrompt += "\n- You are serious and straightforward, rarely making jokes.";
        }
        
        if (traits.formality > 70) {
          systemPrompt += "\n- You are very formal and professional in your communication.";
        } else if (traits.formality < 30) {
          systemPrompt += "\n- You are casual and conversational, using slang and relaxed language.";
        }
      }
      
      // Add relationship context
      systemPrompt += "\n\nYou are a virtual companion who doubles as a productivity assistant. You should help with reminders, deadlines, and task management while maintaining your personality.";
      
      return systemPrompt;
    }
  
    /**
     * Format conversation history for Gemini API
     * @param {Array} messages - Array of message objects
     * @param {Object} personality - Personality settings
     * @returns {Array} - Formatted messages for Gemini API
     */
    formatConversationHistory(messages, personality) {
      const formattedMessages = [];
      
      // Add system prompt as the first message
      const systemPrompt = this.createSystemPrompt(personality);
      formattedMessages.push({
        role: "user", // Gemini uses "user" role for system prompts
        parts: [{ text: systemPrompt }]
      });
      
      // Add conversation history
      for (const message of messages) {
        // Skip system messages
        if (message.role === "system") continue;
        
        // Map our roles to Gemini roles (assistant -> model, user -> user)
        const role = message.role === "assistant" ? "model" : "user";
        
        formattedMessages.push({
          role,
          parts: [{ text: message.content }]
        });
      }
      
      return formattedMessages;
    }
  
    /**
     * Call Gemini API to generate a response
     * @param {string} message - User's message
     * @param {Object} personality - Personality settings
     * @param {Array} conversationHistory - Previous messages
     * @returns {Promise<string>} - AI response
     */
    async generateResponse(message, personality, conversationHistory = []) {
      if (!this.apiKey) {
        throw new Error("API key is required");
      }
      
      // Add the current message to history for context
      const allMessages = [
        ...conversationHistory,
        { role: "user", content: message }
      ];
      
      // Format messages for Gemini
      const formattedMessages = this.formatConversationHistory(allMessages, personality);
      
      // Configure generation parameters based on personality
      let temperature = 0.7; // Default
      
      // Adjust temperature based on personality template
      switch (personality.template) {
        case "creative":
        case "witty":
        case "sassy":
          temperature = 0.8;
          break;
        case "professional":
          temperature = 0.3;
          break;
        case "caring":
          temperature = 0.6;
          break;
        default:
          temperature = 0.7;
      }
      
      // If high sass or humor, increase temperature slightly
      if (personality.traits) {
        if (personality.traits.sass > 70 || personality.traits.humor > 70) {
          temperature += 0.1;
        }
        // If high formality, decrease temperature
        if (personality.traits.formality > 70) {
          temperature -= 0.1;
        }
      }
      
      // Clamp temperature between 0.1 and 1.0
      temperature = Math.max(0.1, Math.min(1.0, temperature));
      
      const requestUrl = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      
      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: formattedMessages,
            generationConfig: {
              temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 800,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          }),
        });
  
        const data = await response.json();
        
        if (response.status !== 200) {
          console.error("Error from Gemini API:", data);
          throw new Error(`Gemini API error: ${data.error?.message || "Unknown error"}`);
        }
        
        if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        
        throw new Error("Invalid response from Gemini API");
      } catch (error) {
        console.error("Error generating response:", error);
        throw error;
      }
    }
    
    /**
     * Extract potential reminders or tasks from a message
     * @param {string} message - User message
     * @returns {Promise<Array>} - Array of potential reminders/tasks
     */
    async extractReminders(message) {
      if (!this.apiKey) {
        throw new Error("API key is required");
      }
      
      const systemPrompt = `
        You are a helpful assistant that extracts reminders, tasks, deadlines, and appointments from text.
        Extract only specific, time-bound items that the user wants to be reminded about.
        For each item, extract:
        1. The task or reminder text
        2. The date and time (if specified)
        3. Any additional notes
        
        Format your response as a JSON array with objects containing fields:
        { "text": "...", "dateTime": "..." (ISO format if possible), "notes": "..." }
        
        If no reminders are found, return an empty array: []
      `;
      
      const requestUrl = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
      
      try {
        const response = await fetch(requestUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: systemPrompt }]
              },
              {
                role: "user",
                parts: [{ text: message }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 800,
            }
          }),
        });
  
        const data = await response.json();
        
        if (response.status !== 200) {
          console.error("Error from Gemini API:", data);
          return [];
        }
        
        if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0]?.text) {
          const responseText = data.candidates[0].content.parts[0].text;
          
          try {
            // Find JSON in the response (in case there's explanatory text)
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const reminders = JSON.parse(jsonMatch[0]);
              return Array.isArray(reminders) ? reminders : [];
            }
            return [];
          } catch (error) {
            console.error("Error parsing JSON from response:", error);
            return [];
          }
        }
        
        return [];
      } catch (error) {
        console.error("Error extracting reminders:", error);
        return [];
      }
    }
  }
  
  export default GeminiService;