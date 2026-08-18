import { useCallback, useEffect, useState } from 'react';

import {
  fetchStudentProfile,
  type StudentProfileWithTrainer,
} from '../services/workouts';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfileWithTrainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setProfile(null);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        return;
      }

      const data = await fetchStudentProfile(user.id);
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}
