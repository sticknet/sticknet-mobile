import emojiRegex from 'emoji-regex';

const regex = emojiRegex();

export const formatAMPM = (date: string | number | Date): string => {
    if (process.env.LOCAL_TEST) return '11:00 AM';
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
};

export const formatMessageDate = (date: string | number | Date | {[key: string]: any}): string => {
    const dt = new Date();
    const currentDate = dt.getTime();
    const today = (dt.getHours() * 60 * 60 + dt.getMinutes() * 60 + dt.getSeconds()) * 1000;
    const oneDay = 60 * 60 * 24 * 1000;
    // @ts-ignore
    const d = date && !date['.sv'] ? new Date(date) : dt;
    const timestamp = d.getTime();
    if (currentDate - timestamp < today) {
        return 'Today';
    }
    if (currentDate - timestamp < oneDay + today) return 'Yesterday';

    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
};

export const isSingleEmoji = (string: string): number => {
    let match;
    let count = 0;
    let codePoints = 0;
    const isSingle = false;
    while ((match = regex.exec(string))) {
        count += 1;
        const emoji = match[0];
        codePoints += [...emoji].length;
    }
    if (string.length <= codePoints * 2 || isSingle) {
        return count;
    }
    return 0;
};
