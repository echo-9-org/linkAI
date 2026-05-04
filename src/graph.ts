import 'isomorphic-fetch';
import { Client } from '@microsoft/microsoft-graph-client';
import { getDb } from './db';

export async function getAuthenticatedClient() {
    const db = await getDb();
    const authRecord = await db.get('SELECT * FROM auth_state WHERE id = 1');

    if (!authRecord || !authRecord.access_token) {
        throw new Error('No authentication token found. Please run authentication flow.');
    }

    // Check if token is expired
    if (Date.now() > authRecord.expires_at) {
        // Implement token refresh logic here
        throw new Error('Token expired. Refresh mechanism not yet implemented.');
    }

    return Client.init({
        authProvider: (done) => {
            done(null, authRecord.access_token);
        }
    });
}

export async function createDraft(subject: string, content: string, recipients: string[]) {
    const client = await getAuthenticatedClient();
    const draft = {
        subject,
        body: {
            contentType: 'HTML',
            content
        },
        toRecipients: recipients.map(email => ({
            emailAddress: { address: email }
        }))
    };

    return client.api('/me/messages').post(draft);
}

export async function getCalendarView(start: string, end: string) {
    const client = await getAuthenticatedClient();
    return client.api('/me/calendarView')
        .query({
            startDateTime: start,
            endDateTime: end
        })
        .get();
}

export async function unsubscribeMail(unsubscribeHeader: string) {
    // Logic to handle mailto: or http: unsubscribe links
    console.log(`Executing unsubscribe for: ${unsubscribeHeader}`);
    // Simplified: we log it and move to archive in the caller
}
