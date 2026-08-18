import type { ReactNode } from 'react';
import { Controller, useFieldArray, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { MuscleGroupPicker } from './MuscleGroupPicker';
import { CardioFields } from './CardioFields';
import { ExercisePickerButton } from './ExercisePicker';
import { FoodAmountFields } from './FoodAmountFields';
import { SetsRepsFields } from './SetsRepsFields';
import { MacroTotals } from '../MacroTotals';
import type { AssignmentForm } from '../../forms/studentDayAssignment';
import { emptyCardioRow, emptyFoodRow, emptyWorkoutRow } from '../../forms/studentDayAssignment';
import { formatMacroLine, macrosForFood, sumFoodMacros, sumMealFoodMacros } from '../../forms/macros';
import { MEAL_LABELS } from '../../types/database';
import type { Exercise, Food } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Mode = 'workout' | 'diet';

type Props = {
  control: Control<AssignmentForm>;
  setValue: UseFormSetValue<AssignmentForm>;
  dayIndex: number;
  exercises: Exercise[];
  foods?: Food[];
  mode: Mode;
  onPickExercise?: (workoutIndex: number) => void;
  onPickFood?: (mealIndex: number, foodIndex: number) => void;
};

export function InlineDayEditor({
  control,
  setValue,
  dayIndex,
  exercises,
  foods = [],
  mode,
  onPickExercise,
  onPickFood,
}: Props) {
  const { colors } = useTheme();
  const isRestDay = useWatch({ control, name: `days.${dayIndex}.is_rest_day` });

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
                  placeholder="İtme / Çekme / Bacak"
                  placeholderTextColor={colors.outline}
                  style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                />
              )}
            />
          </Field>
          <Controller
            control={control}
            name={`days.${dayIndex}.is_rest_day`}
            render={({ field }) => (
              <View style={styles.row}>
                <View style={styles.switchBlock}>
                  <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
                    {field.value ? 'Dinlenme' : 'Antrenman'}
                  </Text>
                  <Switch
                    value={field.value}
                    onValueChange={(next) => {
                      field.onChange(next);
                      setValue(`days.${dayIndex}.is_training_day`, !next, { shouldDirty: true });
                    }}
                    thumbColor={colors.neonGreen}
                  />
                </View>
              </View>
            )}
          />
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

      <Field label="Bu güne özel not">
        <Controller
          control={control}
          name={`days.${dayIndex}.daily_note`}
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Bu güne özel (boşsa genel mesaj gider)"
              placeholderTextColor={colors.outline}
              multiline
              maxLength={400}
              style={[styles.input, styles.multiline, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
            />
          )}
        />
      </Field>

      {mode === 'workout' && !isRestDay ? (
        <WorkoutRows
          control={control}
          dayIndex={dayIndex}
          exercises={exercises}
          onPickExercise={onPickExercise}
        />
      ) : mode === 'diet' ? (
        <DietRows control={control} dayIndex={dayIndex} foods={foods} onPickFood={onPickFood} />
      ) : (
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
          Dinlenme gününde egzersiz yazılmaz.
        </Text>
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
      {workouts.fields.map((row, index) => {
        const isCardio = Boolean(row.is_cardio);
        return (
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
          {isCardio ? (
            <Controller
              control={control}
              name={`days.${dayIndex}.workouts.${index}.cardio_params`}
              render={({ field }) => <CardioFields value={field.value} onChange={field.onChange} />}
            />
          ) : (
            <>
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
            render={({ field }) => <SetsRepsFields value={field.value} onChange={field.onChange} />}
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
                <View style={styles.weightField}>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Min kg"
                    placeholderTextColor={colors.outline}
                    style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name={`days.${dayIndex}.workouts.${index}.weight_max`}
              render={({ field }) => (
                <View style={styles.weightField}>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Max kg"
                    placeholderTextColor={colors.outline}
                    style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                  />
                </View>
              )}
            />
            <Controller
              control={control}
              name={`days.${dayIndex}.workouts.${index}.rest_seconds`}
              render={({ field }) => (
                <View style={styles.restField}>
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Dinlenme sn"
                    placeholderTextColor={colors.outline}
                    keyboardType="number-pad"
                    style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                  />
                </View>
              )}
            />
          </View>
            </>
          )}
          <Pressable onPress={() => workouts.remove(index)}>
            <Text style={{ color: colors.error, fontFamily: 'Inter_600SemiBold' }}>Satırı sil</Text>
          </Pressable>
        </View>
        );
      })}
      <View style={styles.row}>
      <Pressable
        onPress={() => workouts.append(emptyWorkoutRow())}
        style={[styles.addBtn, { borderColor: colors.neonGreenBorder, flex: 1 }]}
      >
        <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>+ Egzersiz</Text>
      </Pressable>
      <Pressable
        onPress={() => workouts.append(emptyCardioRow())}
        style={[styles.addBtn, { borderColor: colors.electricBlue, flex: 1 }]}
      >
        <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold' }}>+ Kardiyo</Text>
      </Pressable>
      </View>
    </>
  );
}

function DietRows({
  control,
  dayIndex,
  foods,
  onPickFood,
}: {
  control: Control<AssignmentForm>;
  dayIndex: number;
  foods: Food[];
  onPickFood?: (mealIndex: number, foodIndex: number) => void;
}) {
  const { colors } = useTheme();
  const meals = useFieldArray({ control, name: `days.${dayIndex}.meals` });
  const mealValues = useWatch({ control, name: `days.${dayIndex}.meals` });
  const totals = sumMealFoodMacros(mealValues, foods);

  return (
    <>
      <Text style={[styles.section, { color: colors.neonGreen }]}>Öğünler</Text>
      {meals.fields.map((meal, mealIndex) => (
        <MealEditor
          key={meal.id}
          control={control}
          dayIndex={dayIndex}
          mealIndex={mealIndex}
          foods={foods}
          onPickFood={onPickFood}
        />
      ))}
      <MacroTotals macros={totals} />
    </>
  );
}

function MealEditor({
  control,
  dayIndex,
  mealIndex,
  foods,
  onPickFood,
}: {
  control: Control<AssignmentForm>;
  dayIndex: number;
  mealIndex: number;
  foods: Food[];
  onPickFood?: (mealIndex: number, foodIndex: number) => void;
}) {
  const { colors } = useTheme();
  const mealFoods = useFieldArray({
    control,
    name: `days.${dayIndex}.meals.${mealIndex}.foods`,
  });
  const mealFoodValues = useWatch({ control, name: `days.${dayIndex}.meals.${mealIndex}.foods` });
  const mealTotals = sumFoodMacros(mealFoodValues, foods);
  const mealLine = formatMacroLine(mealTotals);

  return (
    <View style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
      <Controller
        control={control}
        name={`days.${dayIndex}.meals.${mealIndex}.meal_type`}
        render={({ field }) => (
          <View style={{ gap: 2 }}>
            <Text style={[styles.section, { color: colors.onSurface }]}>
              {MEAL_LABELS[field.value] ?? field.value}
            </Text>
            {mealLine ? (
              <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold', fontSize: 12 }}>
                {mealLine}
              </Text>
            ) : null}
          </View>
        )}
      />
      {mealFoods.fields.map((food, foodIndex) => (
        <View key={food.id} style={{ gap: 6 }}>
          <Controller
            control={control}
            name={`days.${dayIndex}.meals.${mealIndex}.foods.${foodIndex}.food_id`}
            render={({ field: idField }) => (
              <Controller
                control={control}
                name={`days.${dayIndex}.meals.${mealIndex}.foods.${foodIndex}.food_name`}
                render={({ field: nameField }) => (
                  <Controller
                    control={control}
                    name={`days.${dayIndex}.meals.${mealIndex}.foods.${foodIndex}.amount_grams`}
                    render={({ field: gramsField }) => (
                      <FoodAmountFields
                        selected={foods.find((item) => item.id === idField.value) ?? null}
                        fallbackName={nameField.value}
                        grams={gramsField.value}
                        macros={macrosForFood(
                          { food_id: idField.value, amount_grams: gramsField.value },
                          foods,
                        )}
                        onPick={() => onPickFood?.(mealIndex, foodIndex)}
                        onGramsChange={gramsField.onChange}
                      />
                    )}
                  />
                )}
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
                <Pressable onPress={() => mealFoods.remove(foodIndex)}>
                  <Text style={{ color: colors.error }}>Sil</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      ))}
      <Pressable onPress={() => mealFoods.append(emptyFoodRow())}>
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
    minWidth: 0,
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
  },
  multiline: { minHeight: 72, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' },
  weightField: { flex: 1, minWidth: 0 },
  restField: { width: 90, flexShrink: 0 },
  switchBlock: { alignItems: 'center', gap: 4 },
  card: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.stackMd, gap: 10, overflow: 'hidden' },
  addBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
  },
});
