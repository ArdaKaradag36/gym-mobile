import { useFocusEffect } from '@react-navigation/native';
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

import { CountdownBadge } from '../../components/student/CountdownBadge';
import { NoteToTrainer } from '../../components/student/NoteToTrainer';
import { StudentScreenShell } from '../../components/student/StudentScreenShell';
import { WaterStepper } from '../../components/student/WaterStepper';
import { noteForDayIndex } from '../../forms/dailyNotes';
import { fetchStudentInbox } from '../../services/studentNotes';
import type { StudentNote } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { daysLeftInProgram, useStudentDayStore } from '../../stores/useStudentDayStore';
import { useStudentProfileContext } from '../../components/student/StudentProfileProvider';
import { visibleMealsForDay } from '../../services/workouts';
import { daysBetweenIso, todayIsoDate } from '../../utils/format';
import { screenBottomPadding } from '../../utils/layout';

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const studentId = useAuthStore((state) => state.profile?.id);
  const { profile } = useStudentProfileContext();
  const today = useStudentDayStore((state) => state.today);
  const program = useStudentDayStore((state) => state.program);
  const loading = useStudentDayStore((state) => state.loading);
  const error = useStudentDayStore((state) => state.error);
  const load = useStudentDayStore((state) => state.load);
  const adjustWater = useStudentDayStore((state) => state.adjustWater);
  const flushPendingWater = useStudentDayStore((state) => state.flushPendingWater);
  const [inbox, setInbox] = useState<StudentNote[]>([]);

  const refresh = useCallback(() => {
    if (studentId) {
      void load(studentId);
      void fetchStudentInbox(studentId)
        .then(setInbox)
        .catch(() => setInbox([]));
    }
  }, [load, studentId]);

  useEffect(() => {
    if (!studentId) return;
    void fetchStudentInbox(studentId)
      .then(setInbox)
      .catch(() => setInbox([]));
  }, [studentId]);

  useEffect(() => {
    return () => {
      void useStudentDayStore.getState().flushPendingWater();
    };
  }, [flushPendingWater]);

  useFocusEffect(
    useCallback(() => {
      if (!studentId) return;
      const state = useStudentDayStore.getState();
      if (state.updatingId) return;
      void load(studentId, { silent: Boolean(state.today || state.days.length) });
    }, [load, studentId]),
  );

  const workouts = today?.is_rest_day ? [] : (today?.daily_workouts ?? []);
  const meals = today ? visibleMealsForDay(today) : [];
  const workoutDone = workouts.filter((item) => item.is_completed).length;
  const mealsDone = meals.filter((item) => item.is_completed).length;
  const dayIndex = program?.start_date
    ? daysBetweenIso(program.start_date, today?.date ?? todayIsoDate())
    : 0;
  const coachNote =
    noteForDayIndex(program?.daily_notes, dayIndex) || today?.daily_note?.trim() || '';

  return (
    <StudentScreenShell>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.neonGreen}
          />
        }
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>Bugün</Text>

        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text>
        ) : null}

        {loading && !today ? <ActivityIndicator color={colors.neonGreen} /> : null}

        <View
          style={[
            styles.note,
            { backgroundColor: colors.surfaceCard, borderColor: colors.outlineVariant },
          ]}
        >
          <Text style={[styles.noteLabel, { color: colors.neonGreen }]}>GÜNLÜK MESAJ</Text>
          <Text style={[styles.noteBody, { color: colors.onSurface }]}>
            {coachNote || 'Bugün için not yok.'}
          </Text>
        </View>

        {studentId && profile?.trainer_id ? (
          <NoteToTrainer
            studentId={studentId}
            trainerId={profile.trainer_id}
            notes={inbox}
            onSent={(note) => setInbox((current) => [note, ...current])}
          />
        ) : null}

        <View style={styles.cards}>
          <SummaryCard
            label="Antrenman"
            value={
              today?.is_rest_day
                ? 'Dinlenme'
                : workouts.length
                  ? `${workoutDone}/${workouts.length}`
                  : '—'
            }
            hint={today?.workout_title || 'Plan yok'}
          />
          <SummaryCard
            label="Beslenme"
            value={meals.length ? `${mealsDone}/${meals.length}` : '—'}
            hint="öğün"
          />
          <SummaryCard
            label="Su"
            value={`${Number(today?.water_consumed ?? 0)}`}
            hint={`${Math.round(Number(today?.water_goal ?? 4000))} ml hedef`}
          />
        </View>

        <WaterStepper
          consumed={Number(today?.water_consumed ?? 0)}
          goal={Number(today?.water_goal ?? 4000)}
          onAdjust={(delta) => void adjustWater(delta)}
        />

        <View style={styles.spacer} />
        <CountdownBadge daysLeft={daysLeftInProgram(program)} />
      </ScrollView>
    </StudentScreenShell>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.summary,
        { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
      ]}
    >
      <Text style={[styles.summaryLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.neonGreen }]}>{value}</Text>
      <Text style={[styles.summaryHint, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    gap: spacing.stackMd,
    flexGrow: 1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
  },
  note: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 8,
  },
  noteLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
  },
  noteBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
  cards: {
    flexDirection: 'row',
    gap: spacing.gutterCard,
  },
  summary: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.stackSm,
    gap: 4,
  },
  summaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  summaryValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
  },
  summaryHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
});
