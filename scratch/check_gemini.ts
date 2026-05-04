import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    try {
        console.log("Checking available models for your API key...");
        // The listModels method might not be in the current SDK version or restricted.
        // We can try to generate a tiny content to check if 'gemini-pro' works.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say hello");
        console.log("Success! 'gemini-pro' is available and responding.");
        console.log("Response:", result.response.text());
    } catch (error: any) {
        console.error("Error with 'gemini-pro':", error.message);
    }
}

listModels();
