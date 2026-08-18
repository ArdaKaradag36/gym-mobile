import { useCallback, useEffect, useState } from 'react';

import type { Exercise } from '../types/database';
import { fetchActiveExercises } from '../services/trainer';
import { isSupabaseConfigured } from '../services/supabaseClient';

let cached: Exercise[] | null = null;
let inflight: Promise<Exercise[]> | null = null;

async function loadExercises(force = false) {
  if (!isSupabaseConfigured) return [];
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;
  inflight = fetchActiveExercises()
    .then((data) => {
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean; force?: boolean }) => {
    if (!opts?.silent && !cached) setLoading(true);
    setError(null);

    try {
      const data = await loadExercises(opts?.force);
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Egzersizler yüklenemedi');
      if (!cached) setExercises([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { exercises, loading, error, refresh };
}
