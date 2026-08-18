import { useCallback, useEffect, useState } from 'react';

import {
  fetchTrainerStudents,
  type TrainerStudent,
} from '../services/trainer';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

export function useTrainerStudents() {
  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainerName, setTrainerName] = useState('Antrenör');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        setStudents([]);
        setError('Supabase ayarlı değil. .env anahtarlarını kontrol et.');
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStudents([]);
        setError('Öğrencileri görmek için antrenör olarak giriş yap.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, full_name, trainer_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setTrainerName(profile.full_name);
      }

      if (profile?.role && profile.role !== 'trainer' && profile.role !== 'admin') {
        setStudents([]);
        setError('Bu hesap antrenör değil.');
        return;
      }

      const data = await fetchTrainerStudents(user.id);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öğrenciler yüklenemedi');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { students, loading, error, trainerName, refresh };
}
