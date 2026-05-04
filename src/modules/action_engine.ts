import { getAuthenticatedClient } from '../graph';
import { getDb, logAction } from '../db';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function identifyActionItems() {
    try {
        const client = await getAuthenticatedClient();
        const db = await getDb();

        // 1. Fetch recent conversations (combining inbox and sent)
        // We fetch messages and group by conversationId
        const messages = await client.api('/me/messages')
            .select('id,subject,from,bodyPreview,conversationId,receivedDateTime')
            .top(50)
            .get();

        const conversations: Record<string, any[]> = {};
        for (const msg of messages.value) {
            if (!conversations[msg.conversationId]) conversations[msg.conversationId] = [];
            conversations[msg.conversationId].push(msg);
        }

        console.log(`Analyzing ${Object.keys(conversations).length} conversation threads...`);

        for (const [convId, thread] of Object.entries(conversations)) {
            const threadText = thread.map(m => `${m.from.emailAddress.name}: ${m.bodyPreview}`).join('\n---\n');
            const subject = thread[0].subject;

            // 2. Call OpenAI to extract action items
            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are an executive assistant. Analyze the email thread and identify if there is a pending action for the user. If so, provide a summary, a priority (High, Medium, Low), and a suggested professional response." },
                    { role: "user", content: `Subject: ${subject}\n\nThread:\n${threadText}\n\nReturn JSON: { "hasAction": boolean, "summary": string, "priority": string, "suggestedResponse": string }` }
                ],
                response_format: { type: "json_object" }
            });

            const analysis = JSON.parse(completion.choices[0].message.content || '{}');

            if (analysis.hasAction) {
                await db.run(`
                    INSERT OR REPLACE INTO action_items (conversation_id, subject, summary, priority, recommended_response)
                    VALUES (?, ?, ?, ?, ?)
                `, [convId, subject, analysis.summary, analysis.priority, analysis.suggestedResponse]);
                
                await logAction('Intelligence', 'Action Identified', `New task found in: ${subject}`, 'SUCCESS');
            }
        }

        return { status: 'success', count: Object.keys(conversations).length };
    } catch (error: any) {
        console.error('Action identification failed:', error);
        throw error;
    }
}
