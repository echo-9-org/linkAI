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

/**
 * Creates a draft email in Outlook.
 */
export async function createDraft(subject: string, body: string, recipientEmail: string) {
    const client = await getAuthenticatedClient();

    const draft = {
        subject: subject,
        body: {
            contentType: 'HTML',
            content: body
        },
        toRecipients: [
            {
                emailAddress: {
                    address: recipientEmail
                }
            }
        ]
    };

    return client.api('/me/messages').post(draft);
}

/**
 * Creates a calendar event in Outlook.
 */
export async function createCalendarEvent(subject: string, start: string, durationMinutes: number) {
    const client = await getAuthenticatedClient();
    
    const startTime = new Date(start);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const event = {
        subject: subject,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC'
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC'
        }
    };

    return client.api('/me/events').post(event);
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
