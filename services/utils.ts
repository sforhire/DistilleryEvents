
/**
 * Safely retrieves environment variables across different browser/node environments.
 * Prevents "process is not defined" ReferenceErrors.
 */
export const getEnv = (key: string): string | undefined => {
  try {
    // Check globalThis (Modern browsers/Node)
    const g = globalThis as any;
    if (g.process?.env?.[key]) return g.process.env[key];
    
    // Check window (Browser)
    if (typeof window !== 'undefined') {
      if ((window as any).env?.[key]) return (window as any).env[key];
      if ((window as any).process?.env?.[key]) return (window as any).process.env[key];
    }
    
    // Check process directly (Old Node)
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  } catch (e) {
    // Silent fail
  }
  return undefined;
};

/**
 * Resilient ID generator that works even if crypto.randomUUID is blocked by browser policy.
 */
export const generateSafeId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) {}
  
  // Fallback for non-secure/restricted contexts
  return 'id-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
};
