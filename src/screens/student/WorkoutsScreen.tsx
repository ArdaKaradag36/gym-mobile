import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StudentScreenShell } from '../../components/student/StudentScreenShell';
import type { StudentWorkoutsStackParamList } from '../../navigation/StudentWorkoutsStack';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStudentDayStore } from '../../stores/useStudentDayStore';
import { formatShortDate, todayIsoDate } from '../../utils/format';

type Props = NativeStackScreenProps<StudentWorkoutsStackParamList, 'WorkoutDays'>;

export function WorkoutsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const studentId = useAuthStore((state) => state.profile?.id);
  const { days, loading, error, load } = useStudentDayStore();

  const refresh = useCallback(() => {
    if (studentId) void load(studentId);
  }, [load, studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const today = todayIsoDate();

  return (
    <StudentScreenShell>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.neonGreen} />
        }
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>14 günlük antrenman</Text>
        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text>
        ) : null}
        {loading && days.length === 0 ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {days.map((day) => {
          const done =
            day.daily_workouts.length > 0 &&
            day.daily_workouts.every((item) => item.is_completed);
          const isToday = day.date === today;
          return (
            <Pressable
              key={day.id}
              onPress={() =>
                navigation.navigate('WorkoutDay', { date: day.date, planId: day.id })
              }
              style={[
                styles.row,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  borderColor: isToday ? colors.neonGreen : colors.outlineVariant,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.date, { color: colors.onSurface }]}>
                  {formatShortDate(day.date)}
                  {isToday ? ' · Bugün' : ''}
                </Text>
                <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
                  {day.is_rest_day
                    ? 'Dinlenme'
                    : day.workout_title?.trim() || 'Antrenman'}
                </Text>
              </View>
              {done ? (
                <MaterialIcons name="check-circle" size={22} color={colors.neonGreen} />
              ) : (
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              )}
            </Pressable>
          );
        })}

        {!loading && days.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Aktif 14 günlük program yok. Hoca ONAYLA yapınca görünür.
          </Text>
        ) : null}
      </ScrollView>
    </StudentScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    paddingBottom: 120,
    gap: spacing.stackSm,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    marginBottom: spacing.stackSm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radii.xl,
    minHeight: 72,
    paddingHorizontal: spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  date: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
});
