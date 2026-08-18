import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useFormState, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardioFields } from '../../components/trainer/CardioFields';
import { ExercisePickerButton, ExercisePickerModal } from '../../components/trainer/ExercisePicker';
import { FoodAmountFields } from '../../components/trainer/FoodAmountFields';
import { FoodPickerModal } from '../../components/trainer/FoodPicker';
import { MacroTotals } from '../../components/MacroTotals';
import { MuscleGroupPicker } from '../../components/trainer/MuscleGroupPicker';
import { SetsRepsFields } from '../../components/trainer/SetsRepsFields';
import {
  emptyDietTemplateForm,
  emptyWorkoutTemplateForm,
  type DietTemplateForm,
  type WorkoutTemplateForm,
} from '../../forms/templateForm';
import { emptyCardioRow, emptyFoodRow, emptyWorkoutRow } from '../../forms/studentDayAssignment';
import { formatMacroLine, inputQuantityFromGrams, macrosForFood, parseGrams, sumFoodMacros, sumMealFoodMacros } from '../../forms/macros';
import { useExercises } from '../../hooks/useExercises';
import { useFoods } from '../../hooks/useFoods';
import { useUnsavedChangesGuard } from '../../navigation/useUnsavedChangesGuard';
import type { TrainerLibraryStackParamList } from '../../navigation/TrainerLibraryStack';
import {
  fetchDietTemplates,
  fetchWorkoutTemplates,
  saveDietTemplate,
  saveWorkoutTemplate,
  templateItemsToWorkoutRows,
} from '../../services/templates';
import { useAuthStore } from '../../stores/useAuthStore';
import { MEAL_LABELS } from '../../types/database';
import type { Food } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { screenBottomPadding } from '../../utils/layout';

type Props = NativeStackScreenProps<TrainerLibraryStackParamList, 'TemplateEditor'>;

export function TemplateEditorScreen({ navigation, route }: Props) {
  const { kind, templateId } = route.params;
  if (kind === 'diet') {
    return <DietEditor navigation={navigation} templateId={templateId} />;
  }
  return <WorkoutEditor navigation={navigation} templateId={templateId} />;
}

function WorkoutEditor({
  navigation,
  templateId,
}: {
  navigation: Props['navigation'];
  templateId?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const trainerId = useAuthStore((state) => state.profile?.id);
  const { exercises } = useExercises();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const { control, handleSubmit, reset, setValue, getValues } = useForm<WorkoutTemplateForm>({
    defaultValues: emptyWorkoutTemplateForm(),
  });
  const { isDirty } = useFormState({ control });
  const items = useFieldArray({ control, name: 'items' });
  const muscleGroup = useWatch({ control, name: 'muscle_group' });
  const { skipNext, sheet } = useUnsavedChangesGuard({ isDirty, navigation, saving });

  useEffect(() => {
    if (!trainerId || !templateId) return;
    void fetchWorkoutTemplates(trainerId).then((list) => {
      const found = list.find((item) => item.id === templateId);
      if (!found) return;
      reset({
        name: found.name,
        muscle_group: found.muscle_group ?? '',
        items: templateItemsToWorkoutRows(found.workout_template_items),
      });
    });
  }, [reset, templateId, trainerId]);

  const onSave = handleSubmit(async (values) => {
    if (!trainerId) return;
    setSaving(true);
    setError(null);
    try {
      await saveWorkoutTemplate(trainerId, values, templateId);
      reset(values);
      skipNext();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <EditorHeader
        title="Antrenman şablonu"
        onBack={() => navigation.goBack()}
        onSave={() => void onSave()}
        saving={saving}
      />
      <ScrollView
        scrollEnabled={pickerIndex == null}
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
      >
        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="İleri Seviye İtme Günü"
              placeholderTextColor={colors.outline}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
            />
          )}
        />
        <Controller
          control={control}
          name="muscle_group"
          render={({ field }) => <MuscleGroupPicker value={field.value} onChange={field.onChange} />}
        />
        {items.fields.map((row, index) => (
          <View
            key={row.id}
            style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerHigh }]}
          >
            {row.is_cardio ? (
              <Controller
                control={control}
                name={`items.${index}.cardio_params`}
                render={({ field }) => <CardioFields value={field.value} onChange={field.onChange} />}
              />
            ) : (
              <>
            <Controller
              control={control}
              name={`items.${index}.exercise_id`}
              render={({ field }) => (
                <ExercisePickerButton
                  selected={exercises.find((item) => item.id === field.value) ?? null}
                  onPress={() => setPickerIndex(index)}
                />
              )}
            />
            <Controller
              control={control}
              name={`items.${index}.reps_scheme`}
              render={({ field }) => <SetsRepsFields value={field.value} onChange={field.onChange} />}
            />
            <View style={styles.row}>
              <Controller
                control={control}
                name={`items.${index}.weight_min`}
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
                name={`items.${index}.weight_max`}
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
            </View>
              </>
            )}
            <Pressable onPress={() => items.remove(index)}>
              <Text style={{ color: colors.error }}>Sil</Text>
            </Pressable>
          </View>
        ))}
        <View style={styles.row}>
        <Pressable onPress={() => items.append(emptyWorkoutRow())}>
          <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>+ Hareket</Text>
        </Pressable>
        <Pressable onPress={() => items.append(emptyCardioRow())}>
          <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold' }}>+ Kardiyo</Text>
        </Pressable>
        </View>
      </ScrollView>
      <ExercisePickerModal
        visible={pickerIndex != null}
        exercises={exercises}
        muscleGroup={muscleGroup || null}
        selectedId={pickerIndex == null ? null : getValues(`items.${pickerIndex}.exercise_id`)}
        onClose={() => setPickerIndex(null)}
        onSelect={(exercise) => {
          if (pickerIndex == null) return;
          setValue(`items.${pickerIndex}.exercise_id`, exercise.id, { shouldDirty: true });
          if (exercise.category) {
            setValue(`items.${pickerIndex}.muscle_group`, exercise.category, { shouldDirty: true });
          }
          setPickerIndex(null);
        }}
      />
      {sheet}
    </View>
  );
}

function DietEditor({
  navigation,
  templateId,
}: {
  navigation: Props['navigation'];
  templateId?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const trainerId = useAuthStore((state) => state.profile?.id);
  const { foods } = useFoods();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodPicker, setFoodPicker] = useState<{ mealIndex: number; foodIndex: number } | null>(null);

  const { control, handleSubmit, reset, setValue, getValues } = useForm<DietTemplateForm>({
    defaultValues: emptyDietTemplateForm(),
  });
  const { isDirty } = useFormState({ control });
  const meals = useFieldArray({ control, name: 'meals' });
  const mealValues = useWatch({ control, name: 'meals' });
  const totals = sumMealFoodMacros(mealValues, foods);
  const { skipNext, sheet } = useUnsavedChangesGuard({ isDirty, navigation, saving });

  useEffect(() => {
    if (!trainerId || !templateId) return;
    void fetchDietTemplates(trainerId).then((list) => {
      const found = list.find((item) => item.id === templateId);
      if (!found) return;
      reset({
        name: found.name,
        meals: (found.diet_template_meals ?? []).map((meal) => ({
          meal_type: meal.meal_type,
          foods: (meal.diet_template_foods ?? []).map((food) => {
            const grams =
              food.amount_in_grams != null
                ? parseGrams(food.amount_in_grams)
                : parseGrams(food.amount);
            return {
              food_id: food.food_id ?? '',
              food_name: food.foods?.name ?? food.food_name,
              amount_grams: inputQuantityFromGrams(grams, food.foods),
              note: food.note ?? '',
              training_day_only: food.training_day_only,
            };
          }),
        })),
      });
    });
  }, [reset, templateId, trainerId]);

  const onSave = handleSubmit(async (values) => {
    if (!trainerId) return;
    setSaving(true);
    setError(null);
    try {
      await saveDietTemplate(trainerId, values, templateId);
      reset(values);
      skipNext();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <EditorHeader
        title="Diyet şablonu"
        onBack={() => navigation.goBack()}
        onSave={() => void onSave()}
        saving={saving}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}>
        {error ? <Text style={{ color: colors.error }}>{error}</Text> : null}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Kesim diyeti"
              placeholderTextColor={colors.outline}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
            />
          )}
        />
        {meals.fields.map((meal, mealIndex) => (
          <MealFoods
            key={meal.id}
            control={control}
            mealIndex={mealIndex}
            foods={foods}
            onPickFood={(foodIndex) => setFoodPicker({ mealIndex, foodIndex })}
          />
        ))}
        <MacroTotals macros={totals} />
      </ScrollView>
      <FoodPickerModal
        visible={foodPicker != null}
        foods={foods}
        mealType={foodPicker ? getValues(`meals.${foodPicker.mealIndex}.meal_type`) : null}
        selectedId={
          foodPicker
            ? getValues(`meals.${foodPicker.mealIndex}.foods.${foodPicker.foodIndex}.food_id`)
            : null
        }
        onClose={() => setFoodPicker(null)}
        onSelect={(food) => {
          if (!foodPicker) return;
          setValue(`meals.${foodPicker.mealIndex}.foods.${foodPicker.foodIndex}.food_id`, food.id, {
            shouldDirty: true,
          });
          setValue(
            `meals.${foodPicker.mealIndex}.foods.${foodPicker.foodIndex}.food_name`,
            food.name,
            { shouldDirty: true },
          );
          setFoodPicker(null);
        }}
      />
      {sheet}
    </View>
  );
}

function MealFoods({
  control,
  mealIndex,
  foods,
  onPickFood,
}: {
  control: ReturnType<typeof useForm<DietTemplateForm>>['control'];
  mealIndex: number;
  foods: Food[];
  onPickFood: (foodIndex: number) => void;
}) {
  const { colors } = useTheme();
  const mealFoods = useFieldArray({ control, name: `meals.${mealIndex}.foods` });
  const mealFoodValues = useWatch({ control, name: `meals.${mealIndex}.foods` });
  const mealLine = formatMacroLine(sumFoodMacros(mealFoodValues, foods));

  return (
    <View style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
      <Controller
        control={control}
        name={`meals.${mealIndex}.meal_type`}
        render={({ field }) => (
          <View style={{ gap: 2 }}>
            <Text style={{ color: colors.onSurface, fontFamily: 'Montserrat_700Bold' }}>
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
            name={`meals.${mealIndex}.foods.${foodIndex}.food_id`}
            render={({ field: idField }) => (
              <Controller
                control={control}
                name={`meals.${mealIndex}.foods.${foodIndex}.food_name`}
                render={({ field: nameField }) => (
                  <Controller
                    control={control}
                    name={`meals.${mealIndex}.foods.${foodIndex}.amount_grams`}
                    render={({ field: gramsField }) => (
                      <FoodAmountFields
                        selected={foods.find((item) => item.id === idField.value) ?? null}
                        fallbackName={nameField.value}
                        grams={gramsField.value}
                        macros={macrosForFood(
                          { food_id: idField.value, amount_grams: gramsField.value },
                          foods,
                        )}
                        onPick={() => onPickFood(foodIndex)}
                        onGramsChange={gramsField.onChange}
                      />
                    )}
                  />
                )}
              />
            )}
          />
          <Pressable onPress={() => mealFoods.remove(foodIndex)}>
            <Text style={{ color: colors.error }}>Sil</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => mealFoods.append(emptyFoodRow())}>
        <Text style={{ color: colors.electricBlueSoft }}>+ Besin</Text>
      </Pressable>
    </View>
  );
}

function EditorHeader({
  title,
  onBack,
  onSave,
  saving,
}: {
  title: string;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
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
        onPress={onBack}
        disabled={saving}
        style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer, opacity: saving ? 0.4 : 1 }]}
      >
        <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
      </Pressable>
      <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
      <Pressable onPress={onSave} style={[styles.save, { backgroundColor: colors.neonGreen }]}>
        {saving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={{ color: colors.onPrimary, fontFamily: 'Inter_600SemiBold' }}>Kaydet</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.marginPage,
    paddingBottom: spacing.stackMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  save: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.marginPage,
    gap: spacing.stackMd,
  },
  input: {
    minHeight: 44,
    minWidth: 0,
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 10,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  weightField: {
    flex: 1,
    minWidth: 0,
  },
});
