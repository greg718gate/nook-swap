import { FunctionsHttpError } from '@supabase/supabase-js';

export async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === 'string' && body.error.length > 0) {
        return body.error;
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('non-2xx')) {
      return 'Operation failed — check your details and try again';
    }
    return error.message;
  }

  return 'Unknown error';
}

export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Sign-in error';

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password';
  }
  if (message.includes('Email not confirmed')) {
    return 'Email not confirmed — use a different address or create a new account';
  }
  if (message.includes('weak') || message.includes('easy to guess')) {
    return 'Password is too weak — use at least 8 characters with letters and numbers';
  }

  return message;
}
