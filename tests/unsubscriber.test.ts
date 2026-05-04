import { processUnsubscribe } from '../src/modules/unsubscriber';
import * as db from '../src/db';
import * as graph from '../src/graph';

jest.mock('../src/db');
jest.mock('../src/graph');

describe('Unsubscriber Module', () => {
    test('processUnsubscribe should detect List-Unsubscribe header', async () => {
        const mockMessage = {
            internetMessageHeaders: [
                { name: 'List-Unsubscribe', value: '<mailto:unsub@example.com>' }
            ],
            from: { emailAddress: { name: 'Newsletter' } }
        };

        const result = await processUnsubscribe(mockMessage);
        expect(result).toBe(true);
        expect(graph.unsubscribeMail).toHaveBeenCalledWith('<mailto:unsub@example.com>');
        expect(db.logAction).toHaveBeenCalled();
    });

    test('processUnsubscribe should return false if no header found', async () => {
        const mockMessage = {
            internetMessageHeaders: [],
            from: { emailAddress: { name: 'Friend' } }
        };

        const result = await processUnsubscribe(mockMessage);
        expect(result).toBe(false);
    });
});
