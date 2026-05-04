import 'isomorphic-fetch';
import { Client } from '@microsoft/microsoft-graph-client';
import { getDb } from './db';
import { getValidToken } from './auth';

/**
 * Returns an authenticated Microsoft Graph client.
 */
export async function getAuthenticatedClient() {
    const accessToken = await getValidToken();

    return Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        },
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
