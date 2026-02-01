
/**
 * Safely retrieves environment variables across different browser/node environments.
 */
export const getEnv = (key: string): string | undefined => {
  try {
    const g = globalThis as any;
    if (g.process?.env?.[key]) return g.process.env[key];
    if (typeof window !== 'undefined') {
      if ((window as any).env?.[key]) return (window as any).env[key];
      if ((window as any).process?.env?.[key]) return (window as any).process.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  } catch (e) {}
  return undefined;
};

/**
 * Resilient ID generator.
 */
export const generateSafeId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {}
  return 'id-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};

/**
 * Formats a start time and duration into a 12h window (e.g., "6:00 PM — 9:00 PM")
 */
export const formatTimeWindow = (startTime: string, duration: number): string => {
  if (!startTime || !startTime.includes(':')) return "TBD";
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start.getTime() + (duration || 0) * 60 * 60 * 1000);
    
    const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const fmtStart = start.toLocaleTimeString('en-US', options);
    const fmtEnd = end.toLocaleTimeString('en-US', options);
    
    return `${fmtStart} — ${fmtEnd}`;
  } catch (e) {
    return startTime;
  }
};
