import { findNextDemoSlot } from '../src/modules/scheduler';
import * as db from '../src/db';

jest.mock('../src/db');

describe('Scheduler Module', () => {
    test('findNextDemoSlot should return a Monday (1) or Thursday (4)', async () => {
        const slot = await findNextDemoSlot();
        const day = slot.getDay();
        expect([1, 4]).toContain(day);
    });

    test('findNextDemoSlot should return a time in the afternoon (14:00)', async () => {
        const slot = await findNextDemoSlot();
        expect(slot.getHours()).toBe(14);
        expect(slot.getMinutes()).toBe(0);
    });
});
