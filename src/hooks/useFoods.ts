import { useCallback, useEffect, useState } from 'react';

import type { Food } from '../types/database';
import { fetchActiveFoods } from '../services/trainer';
import { isSupabaseConfigured } from '../services/supabaseClient';

export function useFoods() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setFoods([]);
        return;
      }
      const data = await fetchActiveFoods();
      setFoods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Besinler yüklenemedi');
      setFoods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { foods, loading, error, refresh };
}
