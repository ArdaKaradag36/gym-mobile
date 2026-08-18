import { useCallback, useEffect, useState } from 'react';

import type { Exercise } from '../types/database';
import { fetchActiveExercises } from '../services/trainer';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setExercises([]);
        return;
      }
      const data = await fetchActiveExercises();
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { exercises, loading, error, refresh };
}
