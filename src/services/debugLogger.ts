// src/services/debugLogger.ts
export const debugLog = {
  info: (label: string, data: any) => {
    console.log(`[INFO] ${label}:`, JSON.stringify(data, null, 2));
  },
  error: (label: string, error: any) => {
    console.error(`[ERROR] ${label}:`, {
      message: error?.message || String(error),
      code: error?.code || 'UNKNOWN',
      details: error?.details || error?.error_description || 'No details',
      hint: error?.hint || 'No hint',
      status: error?.status || 'No status',
      fullError: error,
    });
  },
  warn: (label: string, data: any) => {
    console.warn(`[WARN] ${label}:`, data);
  },
};
