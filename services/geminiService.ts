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

    const result = await chatSession.sendMessage({ message });
    
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