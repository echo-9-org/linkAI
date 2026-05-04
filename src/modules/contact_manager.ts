import { getAuthenticatedClient } from '../graph';
import { getDb, logAction } from '../db';

export async function syncRecentContacts(days: number = 60) {
    try {
        const client = await getAuthenticatedClient();
        const db = await getDb();
        
        const date = new Date();
        date.setDate(date.getDate() - days);
        const filterDate = date.toISOString();

        console.log(`Syncing contacts from the last ${days} days...`);

        // 1. Fetch Sent Items (Recipients)
        const sentMessages = await client.api('/me/mailFolders/sentitems/messages')
            .filter(`receivedDateTime ge ${filterDate}`)
            .select('toRecipients,ccRecipients')
            .top(100)
            .get();

        // 2. Fetch Inbox (Senders)
        const receivedMessages = await client.api('/me/messages')
            .filter(`receivedDateTime ge ${filterDate}`)
            .select('from')
            .top(100)
            .get();

        const contactMap: Record<string, string> = {};

        // Process Sent
        for (const msg of sentMessages.value) {
            const recipients = [...(msg.toRecipients || []), ...(msg.ccRecipients || [])];
            for (const r of recipients) {
                if (r.emailAddress?.address) {
                    contactMap[r.emailAddress.address.toLowerCase()] = r.emailAddress.name || r.emailAddress.address;
                }
            }
        }

        // Process Received
        for (const msg of receivedMessages.value) {
            if (msg.from?.emailAddress?.address) {
                contactMap[msg.from.emailAddress.address.toLowerCase()] = msg.from.emailAddress.name || msg.from.emailAddress.address;
            }
        }

        // 3. Upsert into DB
        for (const [email, name] of Object.entries(contactMap)) {
            await db.run(`
                INSERT INTO contacts (email, name, last_seen)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(email) DO UPDATE SET 
                    last_seen = CURRENT_TIMESTAMP,
                    name = CASE WHEN name IS NULL OR name = email THEN ? ELSE name END
            `, [email, name, name]);
        }

        await logAction('System', 'Contact Sync', `Synced ${Object.keys(contactMap).length} contacts.`, 'SUCCESS');
        return { count: Object.keys(contactMap).length };
    } catch (error: any) {
        console.error('Contact sync failed:', error);
        throw error;
    }
}

export async function toggleContactPriority(email: string, isPriority: boolean, isDomain: boolean = false) {
    const db = await getDb();
    await db.run(`
        UPDATE contacts SET is_priority = ?, is_domain = ? WHERE email = ?
    `, [isPriority ? 1 : 0, isDomain ? 1 : 0, email]);
}
