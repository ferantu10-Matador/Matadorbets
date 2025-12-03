import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

const getAiClient = () => {
  // @ts-ignore process is a node global
  const apiKey = process.env.API_KEY;
  
  // Check if API key is present
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const initializeChat = () => {
  try {
    const ai = getAiClient();
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        // Disable safety settings to prevent blocking gambling/betting content
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
        ]
      },
    });
  } catch (error) {
    console.error("Failed to initialize chat session:", error);
    // We don't throw here to allow the UI to handle the error gracefully when sending a message
  }
};

export const sendMessageToGemini = async (message: string): Promise<{ text: string; groundingChunks: any[] }> => {
  if (!chatSession) {
    initializeChat();
  }

  try {
    if (!chatSession) {
        // Double check after init attempt
        throw new Error("API_KEY_MISSING");
    }

    // INJECT REAL-TIME CONTEXT
    // This fixes the "future date" hallucination by telling the AI exactly what 'today' is.
    const now = new Date();
    const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const contextMessage = `[SISTEMA: Fecha y Hora Real del Usuario: ${dateString}, ${timeString}. Usa ESTA fecha como referencia absoluta para "hoy", "mañana" o búsquedas en Google.]\n\n${message}`;

    const result = await chatSession.sendMessage({ message: contextMessage });
    
    // Extract text
    const text = result.text || "No se pudo generar un análisis.";

    // Extract grounding chunks (sources)
    // The structure can vary, safely accessing it
    // @ts-ignore - The SDK types for grounding metadata can be nested differently in runtime responses
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, groundingChunks };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message === "API_KEY_MISSING") {
        throw new Error("API_KEY_MISSING");
    }
    throw error;
  }
};