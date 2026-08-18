import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { fetchProfileForUser, signOut as authSignOut } from '../services/authService';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import type { Profile } from '../types/database';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  booting: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  applySession: (session: Session | null) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  booting: true,
  error: null,

  applySession: async (session) => {
    set({ session, error: null });
    if (!session?.user) {
      set({ profile: null });
      return;
    }

    try {
      let profile: Profile | null = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        profile = await fetchProfileForUser(session.user.id);
        if (profile?.role) break;
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (!profile?.role) {
        set({
          profile: null,
          error:
            'Signed in, but no profile role was found. Ask an admin to set your role in profiles.',
        });
        return;
      }

      set({ profile, error: null });
    } catch (err) {
      set({
        profile: null,
        error: err instanceof Error ? err.message : 'Failed to load profile role.',
      });
    }
  },

  hydrate: async () => {
    if (!isSupabaseConfigured) {
      set({
        booting: false,
        error: 'Supabase is not configured. Check your .env keys.',
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    await get().applySession(session);
    set({ booting: false });
  },

  signOut: async () => {
    await authSignOut();
    set({ session: null, profile: null, error: null });
  },
}));
