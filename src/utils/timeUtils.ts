export function getCurrent5MinInterval(): Date {
    const now = new Date();
    const minutes = Math.floor(now.getMinutes() / 5) * 5;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), minutes, 0, 0);
}