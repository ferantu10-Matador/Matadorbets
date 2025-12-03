import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Match } from "../types";

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

export const fetchTopMatches = async (): Promise<Match[]> => {
    try {
        const ai = getAiClient();
        const now = new Date();
        const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        // Robust prompt asking for JSON specifically with strict ISO 8601 Timestamp
        const prompt = `Fecha actual: ${dateString}.
        Busca en Google "Partidos de fútbol hoy calendario completo resultados".
        
        Tu misión es listar TODOS los partidos oficiales que se juegan HOY en las siguientes competiciones prioritarias:
        1. 🇪🇸 España: La Liga, Copa del Rey.
        2. 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Inglaterra: Premier League, FA Cup, EFL Cup.
        3. 🇮🇹 Italia: Serie A, Coppa Italia.
        4. 🇩🇪 Alemania: Bundesliga, DFB Pokal.
        5. 🇫🇷 Francia: Ligue 1, Coupe de France.
        6. 🇪🇺 Europa: Champions League, Europa League, Conference League.
        7. 🌎 Latam: Copa Libertadores, Sudamericana, Liga Argentina, Liga MX, Brasileirao.
        
        Si hoy hay partidos de estas ligas, INCLÚYELOS TODOS (hasta un máximo de 25).
        Si hay pocos partidos "Top", rellena con ligas secundarias europeas (Holanda, Portugal, Turquía).
        
        Responde ÚNICAMENTE con un array JSON válido. 
        NO añadas bloques markdown (\`\`\`json), NI texto introductorio. Solo el array crudo.
        
        IMPORTANTE: Para la hora, usa el campo "utc_timestamp" en formato ISO 8601 estricto (Ej: 2023-10-27T19:00:00Z). Asegúrate de que sean horas UTC reales.
        
        Formato requerido:
        [
          {
            "home": "Equipo Local",
            "away": "Equipo Visitante",
            "utc_timestamp": "ISO_8601_STRING_UTC", 
            "league": "Competición",
            "fact": "Dato breve (ej: 'El local lleva 5 victorias seguidas')"
          }
        ]`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // responseMimeType: "application/json", // REMOVED: Conflict with googleSearch
                tools: [{ googleSearch: {} }],
                // CRITICAL: Disable safety settings here too
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
                ]
            }
        });

        let text = response.text;
        if (!text) return [];

        // Defensive cleaning: remove markdown code blocks if the model ignores the instruction
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Find the start and end of the JSON array to avoid parsing errors if there is extra text
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1) {
            text = text.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(text) as Match[];
    } catch (error) {
        console.error("Error fetching matches:", error);
        return [];
    }
}