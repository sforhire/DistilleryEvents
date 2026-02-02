/**
 * Safely retrieves environment variables across different browser/node environments.
 */
export const getEnv = (key: string): string | undefined => {
  try {
    // 1. Check for platform-injected process.env (common in polyfilled or node-like envs)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }

    // 2. Check window/globalThis properties
    const win = (typeof window !== 'undefined' ? window : globalThis) as any;
    if (win.process?.env?.[key]) return win.process.env[key];
    if (win.env?.[key]) return win.env[key];
    if (win.ENV?.[key]) return win.ENV[key];
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
 * Formats a start time and end time into a concise 12h window.
 */
export const formatTimeWindow = (startTime: string, endTime: string): string => {
  if (!startTime || !startTime.includes(':') || !endTime || !endTime.includes(':')) return "TBD";
  try {
    const parseTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
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

    if (s.ampm === e.ampm) {
      return `${s.h}-${e.h}${e.ampm}`;
    }
    return `${s.h}${s.ampm}-${e.h}${e.ampm}`;
  } catch (err) {
    return `${startTime}-${endTime}`;
  }
};