import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeasurementHistory } from '../../components/MeasurementHistory';
import { StudentScreenShell } from '../../components/student/StudentScreenShell';
import { fetchStudentMeasurements } from '../../services/measurements';
import type { Measurement } from '../../types/database';
import { spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { screenBottomPadding } from '../../utils/layout';

export function MeasurementsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const studentId = useAuthStore((state) => state.profile?.id);
  const [rows, setRows] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchStudentMeasurements(studentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ölçümler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <StudentScreenShell>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.neonGreen} />
        }
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>Ölçümler</Text>
        <Text style={[styles.subtitle, { color: colors.neonGreen }]}>Sadece görüntüleme</Text>

        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text>
        ) : null}
        {loading && rows.length === 0 ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {!loading && rows.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Henüz ölçüm kaydı yok.
          </Text>
        ) : null}

        <MeasurementHistory rows={rows} />
      </ScrollView>
    </StudentScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    gap: spacing.stackMd,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
  },
  subtitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
});
