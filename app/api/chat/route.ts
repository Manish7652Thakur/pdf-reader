import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(req: NextRequest) {
    try {
        const { documentId, query } = await req.json();

        if (!documentId || !query) {
            return NextResponse.json({ error: "documentId and query are required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ answer: "System Error: Gemini API key is missing." }, { status: 200 });
        }

        // 1. Embed the user's question
        const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: "text-embedding-004" });
        const [queryVector] = await embeddings.embedDocuments([query]);

        // 2. Fetch all chunks for this document
        const chunks = await prisma.chunk.findMany({ where: { documentId } });
        if (chunks.length === 0) {
            return NextResponse.json({ answer: "I don't have this document indexed yet." });
        }

        // 3. Rank by cosine similarity, take top 5
        const ranked = chunks
            .map((c) => ({ content: c.content, score: cosineSimilarity(queryVector, c.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        const context = ranked.map((r) => r.content).join("\n\n---\n\n");

        // 4. Call Gemini with only the retrieved chunks, not the whole PDF
        const llm = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash", maxOutputTokens: 2048, apiKey });

        const systemMsg = new SystemMessage(
            "You are an intelligent PDF analyst. Use ONLY the provided context to answer the user's question. If the answer isn't in the context, say you cannot find it in the document."
        );
        const humanMsg = new HumanMessage(`Context:\n${context}\n\nQuestion: ${query}`);

        const response = await llm.invoke([systemMsg, humanMsg]);

        return NextResponse.json({ answer: response.content });
    } catch (error: any) {
        console.error("API Chat Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
    }
}