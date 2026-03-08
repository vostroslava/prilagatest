import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: "API ключ Gemini не настроен локально." },
                { status: 401 }
            );
        }

        const { profileData } = await req.json();

        if (!profileData) {
            return NextResponse.json(
                { error: "Нет данных профиля для анализа." },
                { status: 400 }
            );
        }

        const prompt = `You are an expert psychological profiler and behavioral analyst. 
Please provide a deep, insightful, and empathetic analysis based on the following psychometric test results.
Return your response in Russian. Structure it clearly using Markdown (headers, bullet points, bold text for emphasis).
Focus on:
1. Core Strengths & Superpowers (how this person natural shines)
2. Blind Spots & Vulnerabilities (what they should watch out for)
3. Interpersonal Dynamics (how they interact, conflict resolution style)
4. Growth Recommendations (actionable advice for personal development)

Do not just repeat their scores back to them. Synthesize the "Big Five", "IPIP-IPC", and "Conflict Module" data into a cohesive narrative about who this person is in the real world.

System Context: You are an insightful behavioral analyst analyzing self-understanding profiles.

Profile Data:
${JSON.stringify(profileData, null, 2)}
`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        const aiAnalysis = result.response.text();

        return NextResponse.json({ analysis: aiAnalysis || "Не удалось получить текстовый ответ от AI." });
    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Ошибка при выполнении AI-анализа через Gemini." },
            { status: 500 }
        );
    }
}
