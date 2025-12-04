// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2'
import { GoogleGenAI } from 'npm:@google/genai'

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialize Supabase Client (Service Role for admin access)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Initialize Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is missing')
    }
    const ai = new GoogleGenAI({ apiKey: geminiApiKey })

    // 3. Fetch Pending Task
    // We lock the row immediately or just select it. For simplicity, we select pending.
    const { data: task, error: fetchError } = await supabase
      .from('marketing_queue')
      .select('*')
      .eq('status', 'PENDING')
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is no rows found
      throw fetchError
    }

    if (!task) {
      return new Response(
        JSON.stringify({ message: 'Sin tareas pendientes', success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing task ID: ${task.id} for match ${task.match_id}`)

    // 4. Mark as PROCESSING to avoid race conditions (optional but good practice)
    await supabase
      .from('marketing_queue')
      .update({ status: 'PROCESSING' })
      .eq('id', task.id)

    // 5. Generate Copy with Gemini
    const systemPrompt = `
      Actúa como el Community Manager de "MatadorBets", una app de análisis de fútbol irreverente, moderna y ganadora.
      
      OBJETIVO:
      Escribe un Tweet (post de X) corto, viral y con emojis sobre este pronóstico de fútbol.
      
      TONO:
      Seguro, directo, un poco picante/chulo (estilo "El Matador") pero profesional en el dato.
      No uses saludos aburridos como "Hola a todos". Ve al grano.
      
      REQUISITOS:
      - Máximo 280 caracteres.
      - Incluye los hashtags: #MatadorBets #Fútbol #ApuestasDeportivas
      - Usa emojis relacionados (🐂, ⚽, 💰, 🔥).
      - Basa el texto en el siguiente resumen del análisis.
    `

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Resumen del Pronóstico: ${task.prediction_summary}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8 // Slightly creative
      }
    })

    const generatedText = response.text || "No se pudo generar el copy."

    // 6. Save Result & Update Status
    const { error: updateError } = await supabase
      .from('marketing_queue')
      .update({
        content_text: generatedText,
        status: 'READY_TO_POST',
        updated_at: new Date().toISOString()
      })
      .eq('id', task.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Copy generado correctamente',
        data: {
          taskId: task.id,
          generatedText: generatedText
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error generating marketing copy:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})