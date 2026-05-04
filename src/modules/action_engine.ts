import { getAuthenticatedClient } from '../graph';
import { getDb, logAction } from '../db';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";

async function callLLM(systemPrompt: string, userPrompt: string, retries: number = 3) {
    const db = await getDb();
    const settings = await db.all('SELECT * FROM settings');
    const settingsMap = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
    
    const provider = settingsMap.llm_provider || 'openai';
    const openaiKey = settingsMap.openai_api_key || process.env.OPENAI_API_KEY;
    const geminiKey = settingsMap.gemini_api_key || process.env.GEMINI_API_KEY;

    for (let i = 0; i < retries; i++) {
        try {
            if (provider === 'gemini') {
                if (!geminiKey) throw new Error('Gemini API Key is missing. Add it in Settings.');
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
                return result.response.text();
            } else {
                if (!openaiKey) throw new Error('OpenAI API Key is missing. Add it in Settings.');
                const openai = new OpenAI({ apiKey: openaiKey });
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
        } catch (error: any) {
            if (i === retries - 1) throw error;
            console.log(`LLM call failed (attempt ${i + 1}/${retries}). Retrying in 2s...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

export async function identifyActionItems() {
    try {
        const client = await getAuthenticatedClient();
        const db = await getDb();

        const rules = await db.all('SELECT * FROM priority_rules ORDER BY rank ASC');
        const rulesText = rules.map(r => `Rule #${r.rank} (${r.category}): ${r.description}`).join('\n');

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
            const lastMsg = thread[thread.length - 1];
            if (!lastMsg || !lastMsg.from?.emailAddress?.address) continue;

            const threadText = thread.map(m => `${m.from?.emailAddress?.name || 'Unknown'} (${m.receivedDateTime}): ${m.bodyPreview}`).join('\n---\n');
            const subject = thread[0].subject;
            const senderEmail = lastMsg.from.emailAddress.address.toLowerCase();
            const senderDomain = `@${senderEmail.split('@')[1]}`;

            const priorityContact = await db.get(`
                SELECT * FROM contacts 
                WHERE (email = ? OR (email = ? AND is_domain = 1)) 
                AND is_priority = 1
            `, [senderEmail, senderDomain]);

            const vipTag = priorityContact ? `\n[VIP SENDER: ${priorityContact.name || senderEmail} - ALWAYS START WITH HIGH BASE SCORE]` : '';

            const systemPrompt = `You are an elite executive assistant for James Morris. 
Analyze the email thread and identify if there is a pending action for James Morris. 

PRIORITY FORMULA:
1. Base Score: If VIP Sender (see tag), start at 70 points. Else, start at 30 points.
2. Rule Weights: Check the thread against the following ORDERED rules. Rule #1 is the most important.
${rulesText}

3. Scoring: 
   - Matching a top-3 rule adds 20-30 points.
   - Matching a lower rule adds 10 points.
   - High Priority: Score > 80
   - Medium Priority: Score 40-80
   - Low Priority: Score < 40

CRITICAL: 
1. The suggested response MUST be written BY James Morris TO the other party. 
2. Do NOT write the response to James Morris. 
3. Identify the most recent sender and address them appropriately.

Return JSON: { "hasAction": boolean, "summary": string, "priority": "High" | "Medium" | "Low", "score": number, "suggestedResponse": string }`;

            const responseText = await callLLM(systemPrompt, `Subject: ${subject}\n\nThread:\n${threadText}`);
            const cleanJson = (responseText || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
            
            try {
                const analysis = JSON.parse(cleanJson);
                if (analysis.hasAction) {
                    await db.run(`
                        INSERT OR REPLACE INTO action_items (conversation_id, subject, summary, priority, score, recommended_response)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [convId, subject, analysis.summary, analysis.priority, analysis.score, analysis.suggestedResponse]);
                }
            } catch (parseError) {
                console.error('Failed to parse AI response:', cleanJson);
                await logAction('Intelligence', 'Error', `AI returned invalid data for: ${subject}`, 'ERROR');
            }
        }

        return { status: 'success' };
    } catch (error: any) {
        console.error('Action identification failed:', error);
        throw error;
    }
}
