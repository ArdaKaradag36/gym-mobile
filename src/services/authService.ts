import type { Session, User } from '@supabase/supabase-js';

import type { Profile } from '../types/database';
import { PROFILE_COLUMNS } from './queries';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type AuthResult =
  | {
      success: true;
      session: Session | null;
      user: User | null;
    }
  | { success: false; error: string };

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login')) {
    return 'E-posta veya şifre hatalı.';
  }
  return message;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase ayarlı değil.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }

  return { success: true, session: data.session, user: data.user };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: mapAuthError(error.message) };
  }
  return { success: true, session: null, user: null };
}

export async function fetchProfileForUser(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}
