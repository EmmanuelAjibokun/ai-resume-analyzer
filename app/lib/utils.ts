/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB)
 * @param bytes -  The size in bytes
 * @returns A formatted string with the appropriate unit
 */

export function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    if (isNaN(bytes) || !isFinite(bytes)) return 'Invalid';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    // Determine the appropriate unit by calculating the log
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    // Format with 2 decimal places and round
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const generateUUID = () => crypto.randomUUID()