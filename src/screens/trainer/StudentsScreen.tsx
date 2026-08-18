import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { StudentCard } from '../../components/trainer/StudentCard';
import { SegmentedControl } from '../../components/trainer/SegmentedControl';
import { TrainerTopNavbar } from '../../components/trainer/TrainerTopNavbar';
import type { TrainerStudentsStackParamList } from '../../navigation/TrainerStudentsStack';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTrainerStore } from '../../stores/useTrainerStore';

type Props = NativeStackScreenProps<TrainerStudentsStackParamList, 'StudentsList'>;
type Filter = 'active' | 'passive' | 'all';

export function StudentsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const { students, loading, error, load, toggleActive } = useTrainerStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  const refresh = useCallback(() => {
    if (profile?.id) void load(profile.id);
  }, [load, profile?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return students.filter((student) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && student.is_active) ||
        (filter === 'passive' && !student.is_active);
      const matchesQuery =
        !normalized || (student.full_name ?? '').toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [students, query, filter]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrainerTopNavbar trainerName={profile?.full_name ?? 'Trainer'} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.neonGreen}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              segments={[
                { key: 'active', label: 'Aktif' },
                { key: 'passive', label: 'Pasif' },
                { key: 'all', label: 'Tümü' },
              ]}
            />
            <View
              style={[
                styles.searchCard,
                {
                  backgroundColor: colors.surfaceCard,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <MaterialIcons name="search" size={20} color={colors.onSurfaceVariant} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Öğrenci ara…"
                placeholderTextColor={colors.outline}
                style={[styles.searchInput, { color: colors.onSurface }]}
              />
            </View>

            {error ? (
              <View
                style={[
                  styles.message,
                  { borderColor: colors.error, backgroundColor: colors.surfaceContainerLow },
                ]}
              >
                <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text>
                <Pressable onPress={refresh}>
                  <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>
                    Tekrar dene
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {loading && students.length === 0 ? (
              <ActivityIndicator color={colors.neonGreen} style={{ marginTop: 24 }} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? (
            <View
              style={[
                styles.emptyCard,
                {
                  borderColor: colors.outlineVariant,
                  backgroundColor: colors.surfaceContainerLow,
                },
              ]}
            >
              <MaterialIcons name="group-add" size={28} color={colors.outline} />
              <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
                Bu filtrede öğrenci yok.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <StudentCard
            student={item}
            onToggleActive={(next) => void toggleActive(item.id, next)}
            onPress={() =>
              navigation.navigate('StudentDetail', {
                studentId: item.id,
                studentName: item.full_name?.trim() || 'Student',
              })
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    paddingBottom: 120,
    gap: spacing.gutterCard,
  },
  headerBlock: {
    gap: spacing.stackMd,
    marginBottom: spacing.stackSm,
  },
  searchCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    minHeight: 52,
    paddingHorizontal: spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  message: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackLg,
    gap: spacing.stackMd,
    alignItems: 'flex-start',
  },
});
