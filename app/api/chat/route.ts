import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "no-key");

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        // Fallback if no API key
        if (!process.env.GEMINI_API_KEY) {
            console.warn("GEMINI_API_KEY not found. Using mock response.");
            return NextResponse.json({
                reply: "¡Hola! Actualmente estoy en modo de demostración porque no detecté mi llave de API. Pero puedo decirte que TianguisBeats es la plataforma #1 para vender y comprar beats en México. ¿Buscas algo en específico?",
                filters: {},
                intent: "info"
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Eres un experto A&R (Artist & Repertoire) de "TianguisBeats", una plataforma premium de beats en México.
        Tu tarea es ayudar a los usuarios (raperos, cantantes, productores) a encontrar el beat perfecto o resolver dudas sobre el sitio.
        
        REGLAS DE BÚSQUEDA:
        Si el usuario busca un beat, extrae los siguientes campos en formato JSON:
        - genre (Valores permitidos: Trap, Reggaeton, Corridos, Hip Hop, R&B, Drill, Experimental)
        - mood (Valores permitidos: Agresivo, Triste, Feliz, Oscuro, Chill, Energético, Romántico)
        - bpm (Solo el número)
        - reference_artist (Cualquier artista mencionado)
        
        REGLAS DE INFORMACIÓN:
        Responde dudas sobre planes basándote en:
        - Plan Gratis ($0): 5 Beats, solo MP3, 15% comisión.
        - Plan PRO ($149 MXN/mes): Beats ilimitados, WAV, 0% comisión.
        - Plan PREMIUM ($349 MXN/mes): Todo lo anterior + Archivos Stems + Boost algoritmo + Estadísticas + Insignia Founder.
        
        REGLAS DE FORMATO:
        Responde SIEMPRE en este formato JSON exacto, sin texto extra fuera del JSON:
        {
            "reply": "Tu respuesta amable y profesional en español",
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
        return NextResponse.json({
            reply: "Lo siento, tuve un pequeño error técnico o de conexión. ¿Podrías repetirme eso?",
            filters: {},
            intent: "info"
        });
    }
}
