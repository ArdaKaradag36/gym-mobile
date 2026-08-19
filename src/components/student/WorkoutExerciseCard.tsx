import { MaterialIcons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCardioSummary } from '../../forms/cardio';
import { exerciseVideoUrl, muscleGroupLabel } from '../../constants/media';
import type { WorkoutWithExercise } from '../../services/workouts';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { gridCardStyle } from '../../utils/layout';

type WorkoutExerciseCardProps = {
  workout: WorkoutWithExercise;
  busy?: boolean;
  onToggleComplete: () => void;
};

export function WorkoutExerciseCard({
  workout,
  busy = false,
  onToggleComplete,
}: WorkoutExerciseCardProps) {
  const { colors } = useTheme();
  const completed = workout.is_completed;
  const isCardio = workout.is_cardio || workout.muscle_group === 'cardio';
  const exerciseName = isCardio ? 'Kardiyo' : (workout.exercises?.name ?? 'Egzersiz');
  const scheme = isCardio
    ? formatCardioSummary(workout.cardio_params)
    : workout.reps_scheme || workout.target_reps;
  const hasRange = !isCardio && (workout.weight_min != null || workout.weight_max != null);
  const targetWeight = hasRange
    ? `${workout.weight_min ?? '—'}–${workout.weight_max ?? '—'} kg`
    : null;
  const videoUrl = exerciseVideoUrl(workout.exercises?.youtube_url);

  return (
    <View
      style={[
        styles.card,
        gridCardStyle,
        {
          backgroundColor: completed
            ? colors.surfaceContainerLow
            : colors.surfaceContainerHigh,
          borderColor: completed ? colors.neonGreenMuted : colors.neonGreenBorder,
          opacity: busy ? 0.85 : completed ? 0.92 : 1,
        },
      ]}
    >
      {completed ? (
        <View
          pointerEvents="none"
          style={[styles.completedWash, { backgroundColor: colors.neonGreenMuted }]}
        />
      ) : (
        <View pointerEvents="none" style={[styles.activeBar, { backgroundColor: colors.neonGreen }]} />
      )}

      <View pointerEvents="none" style={styles.body}>
        <Text
          style={[styles.name, { color: completed ? colors.onSurface : colors.neonGreen }]}
          numberOfLines={2}
        >
          {exerciseName}
        </Text>
        <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {isCardio ? 'Süre / tempo' : muscleGroupLabel(workout.muscle_group)}
        </Text>
        <Text style={[styles.targets, { color: colors.onSurfaceVariant }]}>
          {scheme || 'Şema yok'}
        </Text>
        {targetWeight ? (
          <Text style={[styles.weight, { color: colors.electricBlueSoft }]}>{targetWeight}</Text>
        ) : null}
      </View>

      {videoUrl ? (
        <Pressable
          accessibilityLabel="Video"
          hitSlop={8}
          onPress={() => void Linking.openURL(videoUrl).catch(() => undefined)}
          style={styles.hiddenVideo}
        >
          <MaterialIcons name="play-circle-outline" size={18} color={colors.outline} />
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? 'Tamamlandı, geri al' : 'Tamamlandı olarak işaretle'}
        hitSlop={12}
        disabled={busy}
        onPress={onToggleComplete}
        style={[
          styles.checkbox,
          {
            borderColor: completed ? colors.neonGreen : colors.outlineVariant,
            backgroundColor: completed ? colors.neonGreen : 'transparent',
          },
        ]}
      >
        <MaterialIcons
          name="check"
          size={22}
          color={completed ? colors.onPrimary : 'transparent'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 168,
    aspectRatio: 1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackMd,
  },
  body: {
    flex: 1,
    gap: 4,
    paddingRight: 28,
    paddingBottom: 40,
  },
  completedWash: {
    ...StyleSheet.absoluteFillObject,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  hiddenVideo: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    opacity: 0.45,
  },
  name: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    lineHeight: 20,
  },
  meta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  targets: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  weight: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginTop: 'auto',
  },
  checkbox: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    zIndex: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
