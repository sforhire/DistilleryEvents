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
 * Formats a start time and duration into a concise 12h window (e.g., "12-3pm" or "6:30-9pm")
 */
export const formatTimeWindow = (startTime: string, duration: number): string => {
  if (!startTime || !startTime.includes(':')) return "TBD";
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + (duration || 0) * 60 * 60 * 1000);
    
    const formatPart = (d: Date) => {
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'pm' : 'am';
      h = h % 12;
      h = h ? h : 12;
      const mStr = m === 0 ? '' : `:${m.toString().padStart(2, '0')}`;
      return { h: `${h}${mStr}`, ampm };
    };

    const s = formatPart(start);
    const e = formatPart(end);

    // If both are in the same am/pm block, we can be more concise (e.g. 12-3pm)
    if (s.ampm === e.ampm) {
      return `${s.h}-${e.h}${e.ampm}`;
    }
    return `${s.h}${s.ampm}-${e.h}${e.ampm}`;
  } catch (err) {
    return startTime;
  }
};