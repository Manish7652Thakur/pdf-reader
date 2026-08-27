import { NextRequest, NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const query = formData.get("query") as string;

        if (!file || !query) {
            return NextResponse.json({ error: "File and query are required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Call Gemini API via Langchain
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                answer: "System Error: Gemini API key is missing. Please add GEMINI_API_KEY to your .env.local file in the project root."
            }, { status: 200 });
        }

        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            maxOutputTokens: 2048,
            apiKey: apiKey
        });

        // Gemini natively supports PDF reading directly (via Langchain media type)
        const base64Data = buffer.toString("base64");

        const systemMsg = new SystemMessage(
            "You are an intelligent PDF analyst. Use the provided document to accurately answer the user's question. Only use information found in the document context. If the information is not present in the context, clearly state that you cannot find it in the document."
        );

        const humanMsg = new HumanMessage({
            content: [
                {
                    type: "text",
                    text: query
                },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:application/pdf;base64,${base64Data}`
                    }
                }
            ]
        });

        const response = await llm.invoke([systemMsg, humanMsg]);

        return NextResponse.json({ answer: response.content });
    } catch (error: any) {
        console.error("API Chat Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
    }
}
