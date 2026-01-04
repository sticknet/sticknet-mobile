import {formatAMPM, formatMessageDate, isSingleEmoji} from './index';

describe('Date Formatting and Emoji Functions', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    beforeAll(() => {
        jest.setSystemTime(new Date('2024-06-14T12:00:00Z'));
    });

    test('formatAMPM returns "11:00 AM" when LOCAL_TEST is set', () => {
        process.env.LOCAL_TEST = 'true';
        expect(formatAMPM('2024-06-14T08:00:00Z')).toBe('11:00 AM');
        delete process.env.LOCAL_TEST;
    });

    test('formatAMPM returns formatted time in AM/PM format', () => {
        expect(formatAMPM('2024-06-14T08:00:00Z')).toBe('8:00 AM');
        expect(formatAMPM('2024-06-14T13:30:00Z')).toBe('1:30 PM');
    });

    test('formatMessageDate returns "Today" for the current date', () => {
        expect(formatMessageDate('2024-06-14T08:00:00Z')).toBe('Today');
    });

    test('formatMessageDate returns "Yesterday" for the previous date', () => {
        expect(formatMessageDate('2024-06-13T12:00:00Z')).toBe('Yesterday');
    });

    test('formatMessageDate returns formatted date for older dates', () => {
        expect(formatMessageDate('2024-06-12T12:00:00Z')).toBe('12/6/24');
    });

    test('formatMessageDate returns "Today" for date with .sv key', () => {
        expect(formatMessageDate({'.sv': 'timestamp'})).toBe('Today');
    });

    test('isSingleEmoji returns count of single emojis', () => {
        expect(isSingleEmoji('🙂')).toBe(1);
        expect(isSingleEmoji('🙂🙂')).toBe(2);
        expect(isSingleEmoji('🙂👍')).toBe(2);
    });

    test('isSingleEmoji returns 0 for non-emoji strings', () => {
        expect(isSingleEmoji('Hello')).toBe(0);
        expect(isSingleEmoji('🙂 Hello')).toBe(0);
    });
});
