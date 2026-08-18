import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StudentScreenShell } from '../../components/student/StudentScreenShell';
import { fetchStudentMeasurements } from '../../services/measurements';
import { MEASUREMENT_FIELDS } from '../../forms/measurementForm';
import type { Measurement } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatNumericDate } from '../../utils/format';
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

  const latest = rows[0] ?? null;

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
        {loading && !latest ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {!loading && !latest ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Henüz ölçüm kaydı yok.
          </Text>
        ) : null}

        {latest ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceCard, borderColor: colors.outlineVariant },
            ]}
          >
            <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              {formatNumericDate(latest.date)} · {latest.device ?? 'Manuel'}
            </Text>
            <View style={[styles.tableHead, { borderBottomColor: colors.outlineVariant }]}>
              <Text style={[styles.headCell, { color: colors.onSurfaceVariant, flex: 1.4 }]}>
                Metrik
              </Text>
              <Text style={[styles.headCell, { color: colors.onSurfaceVariant }]}>Değer</Text>
              <Text style={[styles.headCell, { color: colors.onSurfaceVariant }]}>İdeal</Text>
            </View>
            {MEASUREMENT_FIELDS.filter((field) => !field.key.endsWith('_ideal')).map((field) => {
              const value = latest[field.key as keyof Measurement];
              const idealKey = `${field.key}_ideal` as keyof Measurement;
              const ideal = latest[idealKey];
              if (value == null && ideal == null) return null;
              return (
                <View key={field.key} style={[styles.tableRow, { borderBottomColor: colors.outlineVariant }]}>
                  <Text style={[styles.cell, { color: colors.onSurface, flex: 1.4 }]}>{field.label}</Text>
                  <Text style={[styles.cell, { color: colors.neonGreen }]}>
                    {value == null ? '—' : String(value)}
                  </Text>
                  <Text style={[styles.cell, { color: colors.onSurfaceVariant }]}>
                    {ideal == null ? '—' : String(ideal)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {rows.slice(1).map((row) => (
          <View
            key={row.id}
            style={[styles.history, { borderColor: colors.outlineVariant }]}
          >
            <Text style={{ color: colors.onSurface, fontFamily: 'Inter_600SemiBold' }}>
              {formatNumericDate(row.date)}
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
              {row.weight ?? '—'} kg · %{row.body_fat_percent ?? row.body_fat ?? '—'}
            </Text>
          </View>
        ))}
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
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 0,
  },
  meta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 12,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  headCell: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  cell: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  history: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.stackMd,
    gap: 4,
  },
});
