/**
 * Gemini AI Chatbot Service
 * Handles communication with Google Gemini API (Free Tier)
 * Configured as a housing society assistant for eRoyal residents
 */

import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

// ── System Prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are "eRoyal Assistant", a friendly, professional, and knowledgeable AI helper for residents of eRoyal Housing Society.

Your role is to assist residents with general housing society questions and guidance. You should be:
- Polite and welcoming
- Concise (people read on phones — keep answers short and clear)
- Helpful with practical advice
- Professional but approachable

You can help residents with:

1. **Society Rules & Regulations**
   - Parking rules and regulations
   - Noise policies and quiet hours
   - Pet policies
   - Guest and visitor policies
   - Renovation and construction guidelines
   - Common area usage rules
   - Waste disposal and recycling guidelines

2. **Bill & Payment Guidance**
   - How monthly bills work (maintenance, utilities, etc.)
   - Payment methods and procedures
   - Due dates and late fee policies
   - How to view and track bills in the app

3. **Complaints & Maintenance**
   - How to file a complaint through the app
   - Types of maintenance requests (plumbing, electrical, etc.)
   - Expected response timelines
   - Emergency maintenance procedures
   - How to track complaint status

4. **Community Living Tips**
   - Good neighbor practices
   - Community event participation
   - Amenity usage guidelines (gym, pool, community hall, etc.)
   - Safety and security tips

5. **Vehicle Management**
   - How to register vehicles in the app
   - Visitor parking guidelines
   - Vehicle entry/exit procedures
   - Parking spot allocation

6. **Marketplace**
   - How to list items for sale
   - Buying guidelines
   - Listing rules and prohibited items

7. **App Navigation**
   - How to use different features of the eRoyal app
   - Where to find bills, complaints, announcements, etc.

Guidelines you MUST follow:
- Keep responses SHORT and mobile-friendly (max 2-3 short paragraphs)
- Use bullet points for lists
- Never share or ask for personal data, passwords, or financial details
- If asked about specific account details (exact bill amounts, personal info), politely tell the resident to check the relevant section in the app
- If a question is outside housing society scope, politely say: "I'm here to help with housing society related questions. For other queries, please contact the relevant service."
- Use emojis sparingly to keep the tone friendly 😊
- If unsure about something specific to this society, provide general best-practice housing society guidance
- Always encourage residents to contact the admin office for official/urgent matters`;

// ── Configuration ──────────────────────────────────────────────
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash'; // Latest model — confirmed working ✅

// ── Types ──────────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
}

// ── Service ────────────────────────────────────────────────────
class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private chatSession: ChatSession | null = null;
    private messageHistory: ChatMessage[] = [];

    /**
     * Initialize the Gemini AI client
     */
    private initialize(): GoogleGenerativeAI {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'paste_your_gemini_api_key_here') {
            throw new Error(
                'Gemini API key not configured. Please add your API key to the .env file as EXPO_PUBLIC_GEMINI_API_KEY'
            );
        }

        if (!this.genAI) {
            this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        }
        return this.genAI;
    }

    /**
     * Start a new chat session with the system prompt
     */
    startNewChat(): void {
        const genAI = this.initialize();
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: SYSTEM_PROMPT,
        });

        this.chatSession = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 1024,
                temperature: 0.7, // Balanced between creative and factual
                topP: 0.95,
                topK: 40,
            },
        });

        this.messageHistory = [];
    }

    /**
     * Send a message and get AI response
     */
    async sendMessage(userMessage: string): Promise<string> {
        try {
            // Initialize chat session if not started
            if (!this.chatSession) {
                this.startNewChat();
            }

            // Add user message to history
            const userMsg: ChatMessage = {
                id: `user_${Date.now()}`,
                role: 'user',
                text: userMessage,
                timestamp: new Date(),
            };
            this.messageHistory.push(userMsg);

            // Send to Gemini
            const result = await this.chatSession!.sendMessage(userMessage);
            const response = result.response;
            const responseText = response.text();

            // Add AI response to history
            const aiMsg: ChatMessage = {
                id: `model_${Date.now()}`,
                role: 'model',
                text: responseText,
                timestamp: new Date(),
            };
            this.messageHistory.push(aiMsg);

            return responseText;
        } catch (error: any) {
            // Log full error details for debugging
            console.error('Gemini API Error:', JSON.stringify(error?.message || error));

            const msg: string = error?.message || '';
            const status: number = error?.status || error?.statusCode || 0;

            // API key invalid
            if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
                throw new Error('Invalid API key. Please check your Gemini API key in the .env file.');
            }
            // Rate limit / quota — check status code 429 OR explicit quota keywords
            if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota exceeded')) {
                throw new Error('Rate limit reached. Please wait a moment and try again.');
            }
            // Network error
            if (msg.includes('Failed to fetch') || msg.includes('Network request failed')) {
                throw new Error('Network error. Please check your internet connection.');
            }
            // Model not found
            if (msg.includes('not found') || msg.includes('404')) {
                throw new Error('AI model unavailable. Please try again later.');
            }

            throw new Error(`AI error: ${msg || 'Something went wrong. Please try again.'}`);
        }
    }

    /**
     * Get the current conversation history
     */
    getHistory(): ChatMessage[] {
        return [...this.messageHistory];
    }

    /**
     * Clear conversation and start fresh
     */
    clearChat(): void {
        this.chatSession = null;
        this.messageHistory = [];
    }

    /**
     * Check if the API key is configured
     */
    isConfigured(): boolean {
        return !!GEMINI_API_KEY && GEMINI_API_KEY !== 'paste_your_gemini_api_key_here';
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
