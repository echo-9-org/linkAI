import { logAction } from '../db';
import { unsubscribeMail } from '../graph';

export async function processUnsubscribe(message: any) {
    const headers = message.internetMessageHeaders || [];
    const unsubscribeHeader = headers.find((h: any) => h.name.toLowerCase() === 'list-unsubscribe');

    if (!unsubscribeHeader) return false;

    // Use LLM to determine if this is "Noise" (Simulated for now)
    const isNoise = true; // TODO: Integrate OpenAI check

    if (isNoise) {
        await unsubscribeMail(unsubscribeHeader.value);
        await logAction('Unsubscribe', 'Sweep', `Unsubscribed from ${message.from.emailAddress.name}`, 'SUCCESS');
        return true;
    }

    return false;
}
