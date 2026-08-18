import { useCallback, useEffect, useState } from 'react';

import type { Food } from '../types/database';
import { fetchActiveFoods } from '../services/trainer';
import { isSupabaseConfigured } from '../services/supabaseClient';

let cached: Food[] | null = null;
let inflight: Promise<Food[]> | null = null;

async function loadFoods(force = false) {
  if (!isSupabaseConfigured) return [];
  if (!force && cached) return cached;
  if (!force && inflight) return inflight;
  inflight = fetchActiveFoods()
    .then((data) => {
      cached = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useFoods() {
  const [foods, setFoods] = useState<Food[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean; force?: boolean }) => {
    if (!opts?.silent && !cached) setLoading(true);
    setError(null);

    try {
      const data = await loadFoods(opts?.force);
      setFoods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Besinler yüklenemedi');
      if (!cached) setFoods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { foods, loading, error, refresh };
}
