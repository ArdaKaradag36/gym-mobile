import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WorkoutExerciseCard } from '../../components/student/WorkoutExerciseCard';
import { muscleGroupLabel } from '../../constants/media';
import type { StudentWorkoutsStackParamList } from '../../navigation/StudentWorkoutsStack';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStudentDayStore } from '../../stores/useStudentDayStore';
import { formatShortDate } from '../../utils/format';
import { screenBottomPadding } from '../../utils/layout';
import { groupStudentWorkouts } from '../../utils/workoutSort';

type Props = NativeStackScreenProps<StudentWorkoutsStackParamList, 'WorkoutDay'>;

export function WorkoutDayScreen({ navigation, route }: Props) {
  const { date, planId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const studentId = useAuthStore((state) => state.profile?.id);
  const days = useStudentDayStore((state) => state.days);
  const loading = useStudentDayStore((state) => state.loading);
  const updatingId = useStudentDayStore((state) => state.updatingId);
  const load = useStudentDayStore((state) => state.load);
  const toggleWorkout = useStudentDayStore((state) => state.toggleWorkout);

  const refresh = useCallback(() => {
    if (studentId) void load(studentId);
  }, [load, studentId]);

  useFocusEffect(
    useCallback(() => {
      if (!studentId) return;
      const state = useStudentDayStore.getState();
      if (state.updatingId) return;
      void load(studentId, { silent: state.days.length > 0 });
    }, [load, studentId]),
  );

  useEffect(() => {
    if (days.length === 0) return;
    const exact = days.find((item) => item.id === planId);
    if (exact) return;
    const byDate = days.find((item) => item.date === date);
    if (byDate) navigation.setParams({ planId: byDate.id });
  }, [date, days, navigation, planId]);

  const resolvedPlanId =
    days.find((item) => item.id === planId)?.id ??
    days.find((item) => item.date === date)?.id ??
    planId;
  const day = days.find((item) => item.id === resolvedPlanId);
  const groups = useMemo(
    () => groupStudentWorkouts(day?.daily_workouts ?? []),
    [day],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + spacing.stackSm,
            borderBottomColor: colors.outlineVariant,
            backgroundColor: colors.surfaceContainerLowest,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.back, { backgroundColor: colors.surfaceContainer }]}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.onSurfaceVariant }]}>
            {formatShortDate(date)}
          </Text>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
            {day?.is_rest_day ? 'Dinlenme' : day?.workout_title?.trim() || 'Antrenman'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.neonGreen} />
        }
      >
        {loading && !day ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {day?.is_rest_day ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Bugün dinlenme günü.
          </Text>
        ) : (
          groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.neonGreen }]}>
              {muscleGroupLabel(group.key)}
            </Text>
            <View style={styles.grid}>
              {group.items.map((workout) => (
                <WorkoutExerciseCard
                  key={workout.id}
                  workout={workout}
                  busy={updatingId === workout.id}
                  onToggleComplete={() => {
                    void toggleWorkout(workout, resolvedPlanId);
                  }}
                />
              ))}
            </View>
          </View>
          ))
        )}

        {!loading && !day?.is_rest_day && groups.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Bu gün için hareket yok.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.marginPage,
    paddingBottom: spacing.stackMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 20 },
  content: {
    padding: spacing.marginPage,
    gap: spacing.stackLg,
  },
  group: { gap: spacing.stackSm },
  groupTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gutterCard,
  },
});
