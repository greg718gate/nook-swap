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
      return 'Operacja nie powiodła się — sprawdź dane i spróbuj ponownie';
    }
    return error.message;
  }

  return 'Nieznany błąd';
}

export function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Błąd logowania';

  if (message.includes('Invalid login credentials')) {
    return 'Nieprawidłowy email lub hasło';
  }
  if (message.includes('Email not confirmed')) {
    return 'Email nie został potwierdzony — użyj innego adresu lub załóż konto ponownie';
  }
  if (message.includes('weak') || message.includes('easy to guess')) {
    return 'Hasło jest zbyt słabe — użyj min. 8 znaków, liter i cyfr';
  }

  return message;
}
