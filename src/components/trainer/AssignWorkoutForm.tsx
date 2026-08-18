import { MaterialIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ExercisePicker } from './ExercisePicker';
import { useExercises } from '../../hooks/useExercises';
import type { Exercise } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type AssignWorkoutFormProps = {
  studentName: string;
  date: string;
  onDateChange: (date: string) => void;
  saving: boolean;
  onSubmit: (params: {
    exerciseId: string;
    targetSets: number;
    targetReps: number;
    workoutTitle?: string;
  }) => Promise<void>;
};

export function AssignWorkoutForm({
  studentName,
  date,
  onDateChange,
  saving,
  onSubmit,
}: AssignWorkoutFormProps) {
  const { colors } = useTheme();
  const { exercises, loading } = useExercises();
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [title, setTitle] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    setFormError(null);
    if (!selected) {
      setFormError('Select an exercise from the library.');
      return;
    }

    const targetSets = Number(sets);
    const targetReps = Number(reps);
    if (!Number.isFinite(targetSets) || targetSets < 1) {
      setFormError('Enter a valid set count.');
      return;
    }
    if (!Number.isFinite(targetReps) || targetReps < 1) {
      setFormError('Enter a valid rep count.');
      return;
    }

    try {
      await onSubmit({
        exerciseId: selected.id,
        targetSets,
        targetReps,
        workoutTitle: title.trim() || undefined,
      });
      setSelected(null);
      setSets('3');
      setReps('10');
      setTitle('');
    } catch {
      // parent surfaces error
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.neonGreenMuted,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Add Exercise</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Assign a library movement to {studentName}&apos;s plan.
        </Text>
      </View>

      <Field label="Plan date (YYYY-MM-DD)" colors={colors}>
        <TextInput
          value={date}
          onChangeText={onDateChange}
          placeholder="2026-08-08"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          style={[styles.input, inputStyle(colors)]}
        />
      </Field>

      <Field label="Workout title (optional)" colors={colors}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Back Day"
          placeholderTextColor={colors.outline}
          style={[styles.input, inputStyle(colors)]}
        />
      </Field>

      <ExercisePicker
        exercises={exercises}
        selected={selected}
        onSelect={setSelected}
        loading={loading}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Sets" colors={colors}>
            <TextInput
              value={sets}
              onChangeText={setSets}
              keyboardType="number-pad"
              placeholder="3"
              placeholderTextColor={colors.outline}
              style={[styles.input, inputStyle(colors)]}
            />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Reps" colors={colors}>
            <TextInput
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor={colors.outline}
              style={[styles.input, inputStyle(colors)]}
            />
          </Field>
        </View>
      </View>

      {formError ? (
        <Text style={[styles.error, { color: colors.error }]}>{formError}</Text>
      ) : null}

      <Pressable
        onPress={() => void handleSave()}
        disabled={saving}
        style={({ pressed }) => [
          styles.saveButton,
          {
            backgroundColor: colors.neonGreen,
            opacity: pressed || saving ? 0.85 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <>
            <MaterialIcons name="save" size={18} color={colors.onPrimary} />
            <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function Field({
  label,
  colors,
  children,
}: {
  label: string;
  colors: { onSurfaceVariant: string };
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>
      {children}
    </View>
  );
}

function inputStyle(colors: {
  surfaceContainerLowest: string;
  outlineVariant: string;
  onSurface: string;
}) {
  return {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    color: colors.onSurface,
  };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackLg,
    gap: spacing.stackMd,
  },
  header: {
    gap: 6,
    paddingBottom: spacing.stackMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#444933',
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.stackMd,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.gutterCard,
  },
  half: {
    flex: 1,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  saveButton: {
    marginTop: spacing.stackSm,
    minHeight: 52,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
