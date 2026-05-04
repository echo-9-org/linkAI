import { getAuthenticatedClient } from '../graph';
import { processUnsubscribe } from './unsubscriber';
import { findNextDemoSlot, checkSlotAvailability } from './scheduler';
import { logAction } from '../db';

export async function runInboxSweep(sinceDays: number = 1) {
    try {
        const client = await getAuthenticatedClient();
        
        // Calculate the filter date
        const date = new Date();
        date.setDate(date.getDate() - sinceDays);
        const filterDate = date.toISOString();

        // 1. Fetch messages within the time range
        const messages = await client.api('/me/messages')
            .filter(`receivedDateTime ge ${filterDate}`)
            .select('id,subject,from,internetMessageHeaders,bodyPreview,receivedDateTime')
            .top(100) // Increase top limit to capture more in the range
            .get();

        console.log(`Starting sweep of ${messages.value.length} messages...`);

        for (const message of messages.value) {
            // Check for Unsubscribe
            const unsubscribed = await processUnsubscribe(message);
            
            // Check for Demo Intent (Simulated LLM check)
            if (!unsubscribed && message.subject.toLowerCase().includes('demo')) {
                const slot = await findNextDemoSlot();
                const available = await checkSlotAvailability(slot);
                
                if (available) {
                    await logAction('Scheduler', 'Proposal', `Prepared draft for demo with ${message.from.emailAddress.name}`, 'PENDING');
                    // In a real scenario, we would call createDraft() here
                }
            }
        }

        await logAction('System', 'Sweep', 'Manual inbox sweep completed', 'SUCCESS');
        return { status: 'success', messageCount: messages.value.length };
    } catch (error: any) {
        console.error('Sweep failed:', error);
        await logAction('System', 'Sweep', `Failed: ${error.message}`, 'ERROR');
        throw error;
    }
}
