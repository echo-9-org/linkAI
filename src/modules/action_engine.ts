import { getAuthenticatedClient } from '../graph';
import { getDb, logAction } from '../db';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function callLLM(systemPrompt: string, userPrompt: string) {
    const db = await getDb();
    const setting = await db.get('SELECT value FROM settings WHERE key = "llm_provider"');
    const provider = setting?.value || 'openai';

    if (provider === 'gemini') {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
        return result.response.text();
    } else {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });
        return completion.choices[0].message.content;
    }
}

export async function identifyActionItems() {
    try {
        const client = await getAuthenticatedClient();
        const db = await getDb();

        const rules = await db.all('SELECT * FROM priority_rules ORDER BY rank ASC');
        const rulesText = rules.map(r => `${r.category}: ${r.description}`).join('\n');

        const messages = await client.api('/me/messages')
            .select('id,subject,from,bodyPreview,conversationId,receivedDateTime')
            .top(50)
            .get();

        const conversations: Record<string, any[]> = {};
        for (const msg of messages.value) {
            if (!conversations[msg.conversationId]) conversations[msg.conversationId] = [];
            conversations[msg.conversationId].push(msg);
        }

        for (const [convId, thread] of Object.entries(conversations)) {
            const threadText = thread.map(m => `${m.from.emailAddress.name} (${m.receivedDateTime}): ${m.bodyPreview}`).join('\n---\n');
            const subject = thread[0].subject;

            const systemPrompt = `You are an elite executive assistant for James Morris. 
Analyze the email thread and identify if there is a pending action for James Morris. 

CRITICAL: 
1. The suggested response MUST be written BY James Morris TO the other party. 
2. Do NOT write the response to James Morris. 
3. Identify the most recent sender and address them appropriately.

Use these priority rules to categorize the task:
${rulesText}

Return JSON: { "hasAction": boolean, "summary": string, "priority": string, "suggestedResponse": string }`;

            const responseText = await callLLM(systemPrompt, `Subject: ${subject}\n\nThread:\n${threadText}`);
            const analysis = JSON.parse(responseText || '{}');

            if (analysis.hasAction) {
                await db.run(`
                    INSERT OR REPLACE INTO action_items (conversation_id, subject, summary, priority, recommended_response)
                    VALUES (?, ?, ?, ?, ?)
                `, [convId, subject, analysis.summary, analysis.priority, analysis.suggestedResponse]);
            }
        }

        return { status: 'success' };
    } catch (error: any) {
        console.error('Action identification failed:', error);
        throw error;
    }
}
