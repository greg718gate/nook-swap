import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

const FUNCTION_NAMES = ['notify-new-message', 'messaging-api'] as const;

export async function callMessagingApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  let lastError: Error | null = null;

  for (const functionName of FUNCTION_NAMES) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!error) {
      const payload = data as { error?: string } & T;
      if (payload?.error) {
        throw new Error(payload.error);
      }
      return payload as T;
    }

    const isNotFound =
      error instanceof FunctionsHttpError && error.context?.status === 404;

    if (isNotFound) {
      lastError = error;
      continue;
    }

    throw error;
  }

  throw lastError ?? new Error('Messaging service unavailable');
}
