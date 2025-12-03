import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Match } from "../types";
import { supabase } from "./supabaseClient";

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
  }
};

export const sendMessageToGemini = async (message: string): Promise<{ text: string; groundingChunks: any[] }> => {
  if (!chatSession) {
    initializeChat();
  }

  try {
    if (!chatSession) {
        throw new Error("API_KEY_MISSING");
    }

    const now = new Date();
    const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    const contextMessage = `[SISTEMA: Fecha y Hora Real del Usuario: ${dateString}, ${timeString}. Usa ESTA fecha como referencia absoluta para "hoy", "mañana" o búsquedas en Google.]\n\n${message}`;

    const result = await chatSession.sendMessage({ message: contextMessage });
    
    const text = result.text || "No se pudo generar un análisis.";
    // @ts-ignore
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

// --- SMART CACHING LOGIC ---

// Helper: Normalize ID (slug)
const generateMatchId = (home: string, away: string, date: string): string => {
    // Clean string: lowercase, remove accents, remove special chars, spaces to dashes
    const clean = (str: string) => str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, "-") // Non-alphanumeric to dash
        .replace(/-+/g, "-") // Remove double dashes
        .replace(/^-|-$/g, ""); // Trim dashes
    
    // Use the date part only (YYYY-MM-DD)
    const datePart = new Date(date).toISOString().split('T')[0];
    
    return `${clean(home)}-vs-${clean(away)}-${datePart}`;
};

export const analyzeMatch = async (home: string, away: string, league: string, utc_timestamp?: string): Promise<{ text: string; groundingChunks: any[] }> => {
    const ai = getAiClient();
    const now = new Date();
    // Default to today if no timestamp provided
    const matchDate = utc_timestamp ? utc_timestamp : now.toISOString();
    const matchId = generateMatchId(home, away, matchDate);

    console.log(`🔍 Buscando análisis para ID: ${matchId}`);

    // 1. CHECK SUPABASE (Smart Fetch)
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('global_predictions')
                .select('*')
                .eq('match_id', matchId)
                .single();

            if (data && !error) {
                const lastUpdated = new Date(data.last_updated);
                const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

                // If fresh (< 4 hours), return DB data
                if (hoursDiff < 4) {
                    console.log("✅ Análisis encontrado en Caché (Fresco)");
                    // Parse if it was stored as stringified JSON or just return text if simply stored
                    return { 
                        text: data.analysis_data, 
                        groundingChunks: [] // We might not store chunks in DB for simplicity, or could add a column
                    };
                } else {
                    console.log("⚠️ Análisis encontrado pero CADUCADO (>4h). Regenerando...");
                }
            }
        } catch (err) {
            console.warn("Supabase check failed (offline? config missing?), falling back to direct AI.", err);
        }
    } else {
        console.log("ℹ️ Supabase no configurado. Saltando caché global.");
    }

    // 2. CALL AI (Gemini)
    // We use a fresh generateContent call instead of the chat session to ensure 
    // we can control temperature and it's an isolated request.
    try {
        const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const prompt = `
        [SISTEMA: Fecha Actual: ${dateString}]
        Analiza el partido ${home} vs ${away} de la liga ${league}.
        Sigue ESTRUCTRICTAMENTE el formato 'Matador' definido en tus instrucciones del sistema.
        Usa Deep Dive: Busca árbitros, bajas, xG y cuotas actualizadas.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0, // MAX CONSISTENCY
                tools: [{ googleSearch: {} }],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' }
                ]
            }
        });

        const text = response.text || "Análisis no disponible.";
        // @ts-ignore
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // 3. UPSERT TO SUPABASE (Only if configured)
        if (supabase) {
            try {
                 // We use upsert to handle both Insert (new) and Update (expired)
                const { error: upsertError } = await supabase
                    .from('global_predictions')
                    .upsert({
                        match_id: matchId,
                        analysis_data: text,
                        last_updated: new Date().toISOString()
                    }, { onConflict: 'match_id' });
                
                if (upsertError) console.error("Error saving to Supabase:", upsertError);

            } catch (dbErr) {
                console.error("Failed to save to DB:", dbErr);
            }
        }

        return { text, groundingChunks };

    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
};

export const fetchTopMatches = async (): Promise<Match[]> => {
    try {
        const ai = getAiClient();
        const now = new Date();
        const dateString = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
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
                tools: [{ googleSearch: {} }],
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

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
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
