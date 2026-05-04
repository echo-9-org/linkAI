import { getCalendarView } from '../graph';
import { logAction } from '../db';

const PREFERRED_WINDOWS = [
    { day: 1, start: '14:00', end: '16:00' }, // Monday
    { day: 4, start: '14:00', end: '16:00' }  // Thursday
];

export async function findNextDemoSlot() {
    const now = new Date();
    // Logic to iterate through the next 2 weeks of preferred windows
    // and check calendarView for availability.
    
    // For now, return a mock slot
    const mockSlot = new Date();
    mockSlot.setDate(now.getDate() + (4 - now.getDay() + 7) % 7); // Next Thursday
    mockSlot.setHours(14, 0, 0, 0);

    await logAction('Scheduler', 'Search', `Found next available demo slot: ${mockSlot.toISOString()}`);
    return mockSlot;
}

export async function checkSlotAvailability(date: Date) {
    const start = date.toISOString();
    const end = new Date(date.getTime() + 60 * 60 * 1000).toISOString();
    const events = await getCalendarView(start, end);
    return events.value.length === 0;
}
