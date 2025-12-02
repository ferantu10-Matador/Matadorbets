import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: Chat | null = null;

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const initializeChat = () => {
  const ai = getAiClient();
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
    },
  });
};

export const sendMessageToGemini = async (message: string): Promise<{ text: string; groundingChunks: any[] }> => {
  if (!chatSession) {
    initializeChat();
  }

  try {
    if (!chatSession) throw new Error("Chat session failed to initialize");

    const result = await chatSession.sendMessage({ message });
    
    // Extract text
    const text = result.text || "No se pudo generar un análisis.";

    // Extract grounding chunks (sources)
    // The structure can vary, safely accessing it
    // @ts-ignore - The SDK types for grounding metadata can be nested differently in runtime responses
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, groundingChunks };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
