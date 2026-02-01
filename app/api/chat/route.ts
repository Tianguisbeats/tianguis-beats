import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase para búsquedas (Solo lectura pública)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
Eres "Tianguis AI", el asistente experto de Tianguis Beats, la plataforma #1 de beats en México.
Tu objetivo es ayudar a artistas a encontrar el sonido perfecto y resolver dudas sobre la plataforma.

CONOCIMIENTO DE BÚSQUEDA:
- Puedes sugerir géneros como Trap, Reggaeton, Corridos, Hip Hop.
- Si el usuario pide un BPM (ej. 145 BPM), confirma que tenemos opciones en ese rango.
- Si el usuario pide un género y BPM, dile que buscarás en el catálogo.

FORMATO DE RESPUESTA:
- Sé amable, profesional y usa un tono mexicano moderno/cool (ej. "¡Qué onda!", "Claro que sí", "Chécate esto").
- Si encuentras beats (te pasaremos datos si están disponibles), lístalos brevemente.
- Si no tienes datos en tiempo real, invita al usuario a usar los filtros de la página /beats.

IMPORTANTE:
- Si el usuario pide buscar algo específico, siempre termina tu respuesta sugiriendo que use la barra de búsqueda principal para resultados exactos.
`;

export async function POST(req: Request) {
    try {
        const key = process.env.GEMINI_API_KEY;
        console.log("DEBUG: GEMINI_API_KEY present:", !!key);

        if (!key) {
            return NextResponse.json({ error: "No API Key configured" }, { status: 500 });
        }

        const { messages } = await req.json();
        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1].content;

        // Supabase Context
        let contextBeats = "";
        try {
            const { data: beats } = await supabase
                .from("beats")
                .select("title, genre, bpm, producer:producer_id(artistic_name)")
                .eq("is_public", true)
                .limit(5);

            if (beats && beats.length > 0) {
                contextBeats = "\n\nCONTEXTO DE BEATS ACTUALES EN TIANGUIS:\n" +
                    beats.map(b => `- ${b.title} (${b.genre}) by ${(b.producer as any)?.artistic_name || 'Anon'} - ${b.bpm} BPM`).join("\n");
            }
        } catch (err) {
            console.error("Context fetch error:", err);
        }

        // Use a widely compatible model name
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: SYSTEM_PROMPT + contextBeats }],
                },
                {
                    role: "model",
                    parts: [{ text: "¡Entendido! Soy Tianguis AI. ¿En qué puedo ayudarte hoy?" }],
                },
            ],
        });

        const result = await chat.sendMessage(lastMessage);
        const text = result.response.text();

        return NextResponse.json({ text });
    } catch (error: any) {
        console.error("API CHAT ERROR:", error);
        return NextResponse.json({
            error: "Error de comunicación con la IA",
            details: error.message
        }, { status: 500 });
    }
}
