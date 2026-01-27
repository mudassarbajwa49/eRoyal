// Centralized logging utility
// Provides environment-aware logging to avoid console pollution in production

const isDev = __DEV__;

export const logger = {
    /**
     * Log general information (only in development)
     */
    log: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`ℹ️ ${message}`, ...args);
        }
    },

    /**
     * Log success messages (only in development)
     */
    success: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`✅ ${message}`, ...args);
        }
    },

    /**
     * Log warnings (only in development)
     */
    warn: (message: string, ...args: any[]) => {
        if (isDev) {
            console.warn(`⚠️ ${message}`, ...args);
        }
    },

    /**
     * Log errors (always logged, even in production)
     * In production, you'd send these to an error tracking service
     */
    error: (message: string, error?: any) => {
        if (isDev) {
            console.error(`❌ ${message}`, error);
        } else {
            // In production, send to error tracking service (e.g., Sentry, Firebase Crashlytics)
            console.error(message, error);
            // TODO: Integrate with error tracking service
            // Example: Sentry.captureException(error);
        }
    },

    /**
     * Log debug information (only in development)
     */
    debug: (message: string, ...args: any[]) => {
        if (isDev) {
            console.debug(`🔍 ${message}`, ...args);
        }
    },

    /**
     * Log cache operations (only in development)
     */
    cache: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`💾 ${message}`, ...args);
        }
    },

    /**
     * Log database operations (only in development)
     */
    db: (message: string, ...args: any[]) => {
        if (isDev) {
            console.log(`📄 ${message}`, ...args);
        }
    },
};
