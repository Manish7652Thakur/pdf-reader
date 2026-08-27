import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
    const apiKey = process.env.GEMINI_API_KEY || "";
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey: apiKey
    });

    const dummyPdf = Buffer.from("%PDF-1.4\n%EOF", "utf8").toString("base64");

    // Try image_url format
    try {
        const message2 = new HumanMessage({
            content: [
                { type: "text", text: "What is this?" },
                { type: "image_url", image_url: { url: `data:application/pdf;base64,${dummyPdf}` } }
            ]
        });
        const res2 = await llm.invoke([message2]);
        console.log("image_url success.");
    } catch (e2: any) {
        console.error("image_url failed:", e2.message);
    }
}
test();
