import type { ReactNode } from 'react';
import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { MuscleGroupPicker } from './MuscleGroupPicker';
import { ExercisePickerButton } from './ExercisePicker';
import type { AssignmentForm } from '../../forms/studentDayAssignment';
import { emptyFoodRow, emptyWorkoutRow } from '../../forms/studentDayAssignment';
import { MEAL_LABELS } from '../../types/database';
import type { Exercise } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Mode = 'workout' | 'diet';

type Props = {
  control: Control<AssignmentForm>;
  dayIndex: number;
  exercises: Exercise[];
  mode: Mode;
  onPickExercise?: (workoutIndex: number) => void;
};

export function InlineDayEditor({ control, dayIndex, exercises, mode, onPickExercise }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {mode === 'workout' ? (
        <>
          <Field label="Antrenman başlığı">
            <Controller
              control={control}
              name={`days.${dayIndex}.workout_title`}
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="PUSH / PULL / LEGS"
                  placeholderTextColor={colors.outline}
                  style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                />
              )}
            />
          </Field>
          <View style={styles.row}>
            <Controller
              control={control}
              name={`days.${dayIndex}.is_rest_day`}
              render={({ field }) => (
                <View style={styles.switchBlock}>
                  <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Dinlenme</Text>
                  <Switch value={field.value} onValueChange={field.onChange} thumbColor={colors.neonGreen} />
                </View>
              )}
            />
            <Controller
              control={control}
              name={`days.${dayIndex}.is_training_day`}
              render={({ field }) => (
                <View style={styles.switchBlock}>
                  <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Antrenman</Text>
                  <Switch value={field.value} onValueChange={field.onChange} thumbColor={colors.electricBlue} />
                </View>
              )}
            />
          </View>
        </>
      ) : (
        <Field label="Su hedefi (ml)" style={{ flex: 1 }}>
          <Controller
            control={control}
            name={`days.${dayIndex}.water_goal`}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="number-pad"
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              />
            )}
          />
        </Field>
      )}

      <Field label="Günlük not">
        <Controller
          control={control}
          name={`days.${dayIndex}.daily_note`}
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Bugüne özel mesaj"
              placeholderTextColor={colors.outline}
              multiline
              style={[styles.input, styles.multiline, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
            />
          )}
        />
      </Field>

      {mode === 'workout' ? (
        <WorkoutRows
          control={control}
          dayIndex={dayIndex}
          exercises={exercises}
          onPickExercise={onPickExercise}
        />
      ) : (
        <DietRows control={control} dayIndex={dayIndex} />
      )}
    </View>
  );
}

function WorkoutRows({
  control,
  dayIndex,
  exercises,
  onPickExercise,
}: {
  control: Control<AssignmentForm>;
  dayIndex: number;
  exercises: Exercise[];
  onPickExercise?: (workoutIndex: number) => void;
}) {
  const { colors } = useTheme();
  const workouts = useFieldArray({ control, name: `days.${dayIndex}.workouts` });

  return (
    <>
      <Text style={[styles.section, { color: colors.neonGreen }]}>Egzersizler</Text>
      {workouts.fields.map((row, index) => (
        <View
          key={row.id}
          style={[
            styles.card,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceContainerHigh,
              overflow: 'hidden',
            },
          ]}
        >
          <Controller
            control={control}
            name={`days.${dayIndex}.workouts.${index}.exercise_id`}
            render={({ field }) => (
              <ExercisePickerButton
                selected={exercises.find((item) => item.id === field.value) ?? null}
                onPress={() => onPickExercise?.(index)}
              />
            )}
          />
          <Controller
            control={control}
            name={`days.${dayIndex}.workouts.${index}.reps_scheme`}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Set/tekrar: 4*12/8/6/6"
                placeholderTextColor={colors.outline}
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              />
            )}
          />
          <Controller
            control={control}
            name={`days.${dayIndex}.workouts.${index}.muscle_group`}
            render={({ field }) => (
              <MuscleGroupPicker value={field.value} onChange={field.onChange} />
            )}
          />
          <View style={styles.row}>
            <Controller
              control={control}
              name={`days.${dayIndex}.workouts.${index}.weight_min`}
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Min kg"
                  placeholderTextColor={colors.outline}
                  style={[styles.input, { flex: 1, color: colors.onSurface, borderColor: colors.outlineVariant }]}
                />
              )}
            />
            <Controller
              control={control}
              name={`days.${dayIndex}.workouts.${index}.weight_max`}
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Max kg"
                  placeholderTextColor={colors.outline}
                  style={[styles.input, { flex: 1, color: colors.onSurface, borderColor: colors.outlineVariant }]}
                />
              )}
            />
            <Controller
              control={control}
              name={`days.${dayIndex}.workouts.${index}.rest_seconds`}
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Dinlenme sn"
                  placeholderTextColor={colors.outline}
                  keyboardType="number-pad"
                  style={[styles.input, { width: 90, color: colors.onSurface, borderColor: colors.outlineVariant }]}
                />
              )}
            />
          </View>
          <Controller
            control={control}
            name={`days.${dayIndex}.workouts.${index}.is_cardio`}
            render={({ field }) => (
              <View style={styles.row}>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular', flex: 1 }}>
                  Kardiyo (listenin en altında)
                </Text>
                <Switch value={field.value} onValueChange={field.onChange} thumbColor={colors.neonGreen} />
              </View>
            )}
          />
          <Pressable onPress={() => workouts.remove(index)}>
            <Text style={{ color: colors.error, fontFamily: 'Inter_600SemiBold' }}>Satırı sil</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={() => workouts.append(emptyWorkoutRow())}
        style={[styles.addBtn, { borderColor: colors.neonGreenBorder }]}
      >
        <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>+ Egzersiz</Text>
      </Pressable>
    </>
  );
}

function DietRows({
  control,
  dayIndex,
}: {
  control: Control<AssignmentForm>;
  dayIndex: number;
}) {
  const { colors } = useTheme();
  const meals = useFieldArray({ control, name: `days.${dayIndex}.meals` });

  return (
    <>
      <Text style={[styles.section, { color: colors.neonGreen }]}>Öğünler</Text>
      {meals.fields.map((meal, mealIndex) => (
        <MealEditor key={meal.id} control={control} dayIndex={dayIndex} mealIndex={mealIndex} />
      ))}
    </>
  );
}

function MealEditor({
  control,
  dayIndex,
  mealIndex,
}: {
  control: Control<AssignmentForm>;
  dayIndex: number;
  mealIndex: number;
}) {
  const { colors } = useTheme();
  const foods = useFieldArray({
    control,
    name: `days.${dayIndex}.meals.${mealIndex}.foods`,
  });

  return (
    <View style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
      <Controller
        control={control}
        name={`days.${dayIndex}.meals.${mealIndex}.meal_type`}
        render={({ field }) => (
          <Text style={[styles.section, { color: colors.onSurface }]}>
            {MEAL_LABELS[field.value] ?? field.value}
          </Text>
        )}
      />
      {foods.fields.map((food, foodIndex) => (
        <View key={food.id} style={{ gap: 6 }}>
          <Controller
            control={control}
            name={`days.${dayIndex}.meals.${mealIndex}.foods.${foodIndex}.food_name`}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="YUMURTA"
                placeholderTextColor={colors.outline}
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              />
            )}
          />
          <Controller
            control={control}
            name={`days.${dayIndex}.meals.${mealIndex}.foods.${foodIndex}.amount`}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="75GR / 3 adet"
                placeholderTextColor={colors.outline}
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              />
            )}
          />
          <Controller
            control={control}
            name={`days.${dayIndex}.meals.${mealIndex}.foods.${foodIndex}.training_day_only`}
            render={({ field }) => (
              <View style={styles.row}>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular', flex: 1 }}>
                  Sadece antrenman günü
                </Text>
                <Switch value={field.value} onValueChange={field.onChange} />
                <Pressable onPress={() => foods.remove(foodIndex)}>
                  <Text style={{ color: colors.error }}>Sil</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      ))}
      <Pressable onPress={() => foods.append(emptyFoodRow())}>
        <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold' }}>+ Besin</Text>
      </Pressable>
    </View>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View style={[{ gap: 6, flexShrink: 1 }, style]}>
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.stackMd, overflow: 'hidden', flexShrink: 1 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.4 },
  section: { fontFamily: 'Montserrat_700Bold', fontSize: 16 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    flexShrink: 1,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  switchBlock: { alignItems: 'center', gap: 4 },
  card: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.stackMd, gap: 10 },
  addBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
