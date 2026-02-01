import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const { message } = await req.json();

        // Fallback if no API key
        if (!apiKey || apiKey === "no-key") {
            console.error("CRITICAL: GEMINI_API_KEY is missing or invalid in server environment.");
            return NextResponse.json({
                reply: "¡Hola! Para que pueda ayudarte, necesito que configures mi 'GEMINI_API_KEY' en el archivo .env.local y reinicies el servidor. Por ahora, TIANGUIS BEATS es tu plataforma premium de beats en México. ¿Cómo puedo ayudarte?",
                filters: {},
                intent: "info"
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Eres "Tianguis A&R", el marchante experto de "TianguisBeats", la plataforma #1 de beats en México.
        Tu tono es profesional, amable y conocedor de la escena urbana y regional mexicana.
        
        REGLAS DE BÚSQUEDA (SIEMPRE EN ESPAÑOL):
        Si el usuario busca un beat, extrae los campos en JSON:
        - genre (Trap, Reggaeton, Corridos, Hip Hop, R&B, Drill, Experimental)
        - mood (Agresivo, Triste, Feliz, Oscuro, Chill, Energético, Romántico)
        - bpm (Número)
        - reference_artist (Cualquier artista)
        
        REGLAS DE INFORMACIÓN DE PLANES:
        - Plan Gratis ($0): 5 Beats, solo MP3, 15% comisión.
        - Plan PRO ($149 MXN/mes): Beats ilimitados, WAV, 0% comisión.
        - Plan PREMIUM ($349 MXN/mes): Stems + Boost algoritmo + Estadísticas + Insignia Founder.
        
        REGLAS DE FORMATO:
        Responde SIEMPRE en este formato JSON exacto, sin texto extra. Tu respuesta en "reply" debe ser en ESPAÑOL DE MÉXICO:
        {
            "reply": "Tu respuesta amable y experta...",
            "filters": {
                "genre": string o null,
                "mood": string o null,
                "bpm": number o null,
                "reference_artist": string o null
            },
            "intent": "search" | "info"
        }
        
        Mensaje del usuario: "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extraer JSON del texto (por si Gemini incluye markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: text, filters: {}, intent: "info" };

        return NextResponse.json(jsonResponse);
    } catch (error: any) {
        console.error("Gemini Error:", error);
        const errorMessage = error.message || "error_desconocido";
        return NextResponse.json({
            reply: `Lo siento, tuve un pequeño problema con la IA (${errorMessage}). ¿Podrías intentar de nuevo o revisar la configuración de la API?`,
            filters: {},
            intent: "info"
        });
    }
}
