import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PrismaClient } from "@prisma/client";
// Note: pdf-parse is required dynamically inside the function to bypass Turbopack and test-runner issues

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "File is required" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key is missing" }, { status: 500 });
        }

        // 1. Extract raw text from the PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Dynamically require the internal lib of pdf-parse v1.1.1
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require("pdf-parse/lib/pdf-parse");
        const parsed = await pdfParse(buffer);
        const rawText = parsed.text;

        if (!rawText || rawText.trim().length === 0) {
            return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
        }

        // 2. Chunk the text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 150,
        });
        const chunks = await splitter.splitText(rawText);

        // 3. Embed each chunk
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey,
            model: "text-embedding-004",
        });
        const vectors = await embeddings.embedDocuments(chunks);

        // 4. Store Document + Chunks in Postgres
        const document = await prisma.document.create({
            data: {
                name: file.name,
                chunks: {
                    create: chunks.map((content, i) => ({
                        content,
                        embedding: vectors[i],
                    })),
                },
            },
        });

        return NextResponse.json({ documentId: document.id, chunkCount: chunks.length });
    } catch (error: any) {
        console.error("Upload/Ingest Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
    }
}