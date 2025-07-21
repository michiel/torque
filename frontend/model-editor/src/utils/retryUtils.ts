/**
 * Utility functions for handling retries and network failures
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors but not on validation or permission errors
    const message = error.message.toLowerCase();
    return (
      message.includes('networkerror') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('enotfound') ||
      message.includes('econnrefused')
    );
  }
};

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if this is the last attempt or if the error is not retryable
      if (attempt > opts.maxRetries || !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = opts.delayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      
      console.warn(`Operation failed (attempt ${attempt}/${opts.maxRetries + 1}), retrying in ${delay}ms:`, lastError.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error is a network-related error that might be temporary
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('networkerror') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('enotfound') ||
    message.includes('econnrefused')
  );
}

/**
 * Check if an error is a validation error that shouldn't be retried
 */
export function isValidationError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('bad request') ||
    message.includes('400')
  );
}

/**
 * Check if an error is a permission error
 */
export function isPermissionError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('401') ||
    message.includes('403')
  );
}