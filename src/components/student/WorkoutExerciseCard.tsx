import { MaterialIcons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { exerciseVideoUrl, muscleGroupLabel } from '../../constants/media';
import type { WorkoutWithExercise } from '../../services/workouts';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

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
  const exerciseName = workout.exercises?.name ?? 'Egzersiz';
  const scheme = workout.reps_scheme || workout.target_reps;
  const hasRange = workout.weight_min != null || workout.weight_max != null;
  const targetWeight = hasRange
    ? `${workout.weight_min ?? '—'}–${workout.weight_max ?? '—'} kg`
    : null;
  const videoUrl = exerciseVideoUrl(workout.exercises?.youtube_url);

  return (
    <Pressable
      onPress={onToggleComplete}
      onLongPress={() => void Linking.openURL(videoUrl)}
      disabled={busy}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: completed
            ? colors.surfaceContainerLow
            : colors.surfaceContainerHigh,
          borderColor: completed ? colors.neonGreenMuted : colors.neonGreenBorder,
          opacity: pressed || busy ? 0.85 : completed ? 0.92 : 1,
        },
      ]}
    >
      {completed ? (
        <View style={[styles.completedWash, { backgroundColor: colors.neonGreenMuted }]} />
      ) : (
        <View style={[styles.activeBar, { backgroundColor: colors.neonGreen }]} />
      )}

      <Pressable
        accessibilityLabel="Video"
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          void Linking.openURL(videoUrl);
        }}
        style={styles.hiddenVideo}
      >
        <MaterialIcons name="play-circle-outline" size={18} color={colors.outline} />
      </Pressable>

      <Text
        style={[styles.name, { color: completed ? colors.onSurface : colors.neonGreen }]}
        numberOfLines={2}
      >
        {exerciseName}
      </Text>
      <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
        {muscleGroupLabel(workout.muscle_group)}
      </Text>
      <Text style={[styles.targets, { color: colors.onSurfaceVariant }]}>
        {scheme || 'Şema yok'}
      </Text>
      {targetWeight ? (
        <Text style={[styles.weight, { color: colors.electricBlueSoft }]}>{targetWeight}</Text>
      ) : null}

      <View
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 168,
    aspectRatio: 1,
    maxWidth: '48%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackMd,
    gap: 4,
  },
  completedWash: {
    ...StyleSheet.absoluteFill,
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
    paddingRight: 22,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
