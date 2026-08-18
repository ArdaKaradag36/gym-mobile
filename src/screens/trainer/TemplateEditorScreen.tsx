import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useFormState } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExercisePickerButton, ExercisePickerModal } from '../../components/trainer/ExercisePicker';
import { MuscleGroupPicker } from '../../components/trainer/MuscleGroupPicker';
import {
  emptyDietTemplateForm,
  emptyWorkoutTemplateForm,
  type DietTemplateForm,
  type WorkoutTemplateForm,
} from '../../forms/templateForm';
import { emptyFoodRow, emptyWorkoutRow } from '../../forms/studentDayAssignment';
import { useExercises } from '../../hooks/useExercises';
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
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

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
  useUnsavedChangesGuard({ isDirty, navigation });

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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
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
            <View style={styles.row}>
              <Controller
                control={control}
                name={`items.${index}.weight_min`}
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
                name={`items.${index}.weight_max`}
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
            </View>
            <Controller
              control={control}
              name={`items.${index}.is_cardio`}
              render={({ field }) => (
                <View style={styles.row}>
                  <Text style={{ color: colors.onSurfaceVariant }}>Kardiyo</Text>
                  <Switch value={field.value} onValueChange={field.onChange} />
                </View>
              )}
            />
            <Pressable onPress={() => items.remove(index)}>
              <Text style={{ color: colors.error }}>Sil</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={() => items.append(emptyWorkoutRow())}>
          <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>+ Hareket</Text>
        </Pressable>
      </ScrollView>
      <ExercisePickerModal
        visible={pickerIndex != null}
        exercises={exercises}
        selectedId={pickerIndex == null ? null : getValues(`items.${pickerIndex}.exercise_id`)}
        onClose={() => setPickerIndex(null)}
        onSelect={(exercise) => {
          if (pickerIndex == null) return;
          setValue(`items.${pickerIndex}.exercise_id`, exercise.id, { shouldDirty: true });
          if (exercise.category) {
            setValue(`items.${pickerIndex}.muscle_group`, exercise.category, { shouldDirty: true });
          }
          if (exercise.is_cardio) {
            setValue(`items.${pickerIndex}.is_cardio`, true, { shouldDirty: true });
          }
          setPickerIndex(null);
        }}
      />
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<DietTemplateForm>({
    defaultValues: emptyDietTemplateForm(),
  });
  const { isDirty } = useFormState({ control });
  const meals = useFieldArray({ control, name: 'meals' });
  useUnsavedChangesGuard({ isDirty, navigation });

  useEffect(() => {
    if (!trainerId || !templateId) return;
    void fetchDietTemplates(trainerId).then((list) => {
      const found = list.find((item) => item.id === templateId);
      if (!found) return;
      reset({
        name: found.name,
        meals: (found.diet_template_meals ?? []).map((meal) => ({
          meal_type: meal.meal_type,
          foods: (meal.diet_template_foods ?? []).map((food) => ({
            food_name: food.food_name,
            amount: food.amount ?? '',
            note: food.note ?? '',
            training_day_only: food.training_day_only,
          })),
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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
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
          <MealFoods key={meal.id} control={control} mealIndex={mealIndex} />
        ))}
      </ScrollView>
    </View>
  );
}

function MealFoods({
  control,
  mealIndex,
}: {
  control: ReturnType<typeof useForm<DietTemplateForm>>['control'];
  mealIndex: number;
}) {
  const { colors } = useTheme();
  const foods = useFieldArray({ control, name: `meals.${mealIndex}.foods` });

  return (
    <View style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
      <Controller
        control={control}
        name={`meals.${mealIndex}.meal_type`}
        render={({ field }) => (
          <Text style={{ color: colors.onSurface, fontFamily: 'Montserrat_700Bold' }}>
            {MEAL_LABELS[field.value] ?? field.value}
          </Text>
        )}
      />
      {foods.fields.map((food, foodIndex) => (
        <View key={food.id} style={{ gap: 6 }}>
          <Controller
            control={control}
            name={`meals.${mealIndex}.foods.${foodIndex}.food_name`}
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
            name={`meals.${mealIndex}.foods.${foodIndex}.amount`}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                placeholder="75GR"
                placeholderTextColor={colors.outline}
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              />
            )}
          />
        </View>
      ))}
      <Pressable onPress={() => foods.append(emptyFoodRow())}>
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
      <Pressable onPress={onBack} style={[styles.iconBtn, { backgroundColor: colors.surfaceContainer }]}>
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
  root: { flex: 1 },
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});
