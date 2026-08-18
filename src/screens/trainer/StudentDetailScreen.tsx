import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useFormState, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExercisePickerModal } from '../../components/trainer/ExercisePicker';
import { FoodPickerModal } from '../../components/trainer/FoodPicker';
import { InlineDayEditor } from '../../components/trainer/InlineDayEditor';
import {
  MeasurementForm,
  type MeasurementFormHandle,
} from '../../components/trainer/MeasurementForm';
import { MuscleGroupPicker } from '../../components/trainer/MuscleGroupPicker';
import { SegmentedControl } from '../../components/trainer/SegmentedControl';
import { StudentInbox } from '../../components/trainer/StudentInbox';
import { validateAssignment } from '../../forms/assignmentSchema';
import {
  assignmentFromServer,
  emptyAssignmentForm,
  type AssignmentForm,
} from '../../forms/studentDayAssignment';
import { useExercises } from '../../hooks/useExercises';
import { useFoods } from '../../hooks/useFoods';
import { useUnsavedChangesGuard } from '../../navigation/useUnsavedChangesGuard';
import type { TrainerStudentsStackParamList } from '../../navigation/TrainerStudentsStack';
import {
  fetchStudentMeasurements,
  fetchTrainerPlanWindow,
  publishAssignment,
} from '../../services/trainer';
import { fetchStudentInbox, markStudentNotesRead } from '../../services/studentNotes';
import {
  dietTemplateToMeals,
  fetchDietTemplates,
  fetchWorkoutTemplates,
  templateItemsToWorkoutRows,
} from '../../services/templates';
import { useAuthStore } from '../../stores/useAuthStore';
import { useTrainerStore } from '../../stores/useTrainerStore';
import type { DietTemplate, Measurement, Program, StudentNote, WorkoutTemplate } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { formatWeekdayDay } from '../../utils/format';
import { screenBottomPadding, STICKY_ACTION_HEIGHT } from '../../utils/layout';

type DetailTab = 'workouts' | 'diets' | 'measurements';
type Props = NativeStackScreenProps<TrainerStudentsStackParamList, 'StudentDetail'>;

export function StudentDetailScreen({ navigation, route }: Props) {
  const { studentId, studentName } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const trainerId = useAuthStore((state) => state.profile?.id);
  const setUnsavedLock = useTrainerStore((state) => state.setUnsavedLock);
  const setDiscardHandler = useTrainerStore((state) => state.setDiscardHandler);
  const { exercises } = useExercises();
  const { foods } = useFoods();
  const measurementRef = useRef<MeasurementFormHandle>(null);

  const [tab, setTab] = useState<DetailTab>('workouts');
  const [dayIndex, setDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [dietTemplates, setDietTemplates] = useState<DietTemplate[]>([]);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [templateMuscle, setTemplateMuscle] = useState('');
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [foodPicker, setFoodPicker] = useState<{ mealIndex: number; foodIndex: number } | null>(
    null,
  );
  const [measurementDirty, setMeasurementDirty] = useState(false);

  const { control, handleSubmit, reset, setValue, getValues } = useForm<AssignmentForm>({
    defaultValues: emptyAssignmentForm(),
  });
  const { isDirty } = useFormState({ control });
  const formDays = useWatch({ control, name: 'days' });
  const combinedDirty = isDirty || measurementDirty;

  const { skipNext, sheet } = useUnsavedChangesGuard({
    isDirty: combinedDirty,
    navigation,
    saving,
    message: 'Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?',
  });

  useEffect(() => {
    setUnsavedLock(combinedDirty);
    return () => setUnsavedLock(false);
  }, [combinedDirty, setUnsavedLock]);

  useEffect(() => {
    setDiscardHandler(() => {
      skipNext();
      navigation.goBack();
    });
    return () => setDiscardHandler(null);
  }, [navigation, setDiscardHandler, skipNext]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [{ program: nextProgram, days }, measurementRows, wTemplates, dTemplates, inbox] =
        await Promise.all([
          fetchTrainerPlanWindow(studentId),
          fetchStudentMeasurements(studentId),
          trainerId ? fetchWorkoutTemplates(trainerId) : Promise.resolve([]),
          trainerId ? fetchDietTemplates(trainerId) : Promise.resolve([]),
          fetchStudentInbox(studentId).catch(() => [] as StudentNote[]),
        ]);
      setProgram(nextProgram);
      setMeasurements(measurementRows);
      setWorkoutTemplates(wTemplates);
      setDietTemplates(dTemplates);
      setStudentNotes(inbox);
      reset(assignmentFromServer(nextProgram, days));
      if (trainerId && inbox.some((note) => !note.read_at)) {
        void markStudentNotesRead(studentId, trainerId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öğrenci detayı yüklenemedi');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [reset, studentId, trainerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPickerIndex(null);
    setFoodPicker(null);
  }, [dayIndex, tab]);

  const onPublish = handleSubmit(async (values) => {
    if (!trainerId) return;
    const validation = validateAssignment(values);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await publishAssignment({
        studentId,
        trainerId,
        form: values,
        existingProgramId: program?.id,
        publish: true,
      });
      setProgram(saved);
      reset(getValues());
      measurementRef.current?.resetDirty();
      setMeasurementDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ONAYLA başarısız');
    } finally {
      setSaving(false);
    }
  });

  const filteredTemplates = useMemo(() => {
    if (!templateMuscle) return workoutTemplates;
    return workoutTemplates.filter(
      (item) => (item.muscle_group ?? '').toLowerCase() === templateMuscle,
    );
  }, [templateMuscle, workoutTemplates]);

  const applyWorkoutTemplate = (template: WorkoutTemplate) => {
    setValue(`days.${dayIndex}.workouts`, templateItemsToWorkoutRows(template.workout_template_items), {
      shouldDirty: true,
    });
    setValue(`days.${dayIndex}.workout_title`, template.name, { shouldDirty: true });
  };

  const applyDietTemplate = (template: DietTemplate) => {
    const meals = dietTemplateToMeals(template);
    if (meals.length === 0) return;
    const cloneMeals = () =>
      meals.map((meal) => ({
        ...meal,
        foods: meal.foods.map((food) => ({ ...food })),
      }));
    getValues('days').forEach((day, index) => {
      const hasFood = day.meals.some((meal) =>
        meal.foods.some((food) => food.food_id.trim()),
      );
      if (index === dayIndex || !hasFood) {
        setValue(`days.${index}.meals`, cloneMeals(), { shouldDirty: true });
      }
    });
  };

  const selectedExerciseId =
    pickerIndex == null ? null : getValues(`days.${dayIndex}.workouts.${pickerIndex}.exercise_id`);

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
          disabled={saving}
          style={[
            styles.backButton,
            { backgroundColor: colors.surfaceContainer, opacity: saving ? 0.4 : 1 },
          ]}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.badge, { color: colors.onSurfaceVariant }]}>
            {program?.status === 'active' ? 'AKTİF PROGRAM' : 'TASLAK'}
          </Text>
          <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
            {studentName}
          </Text>
        </View>
      </View>

      <ScrollView
        scrollEnabled={pickerIndex == null}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: screenBottomPadding(
              insets,
              tab === 'measurements' ? 0 : STICKY_ACTION_HEIGHT,
            ),
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.neonGreen} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <SegmentedControl
          value={tab}
          onChange={setTab}
          segments={[
            { key: 'workouts', label: 'Antrenman' },
            { key: 'diets', label: 'Diyet' },
            { key: 'measurements', label: 'Ölçüm' },
          ]}
        />

        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text>
        ) : null}

        <StudentInbox notes={studentNotes} />

        {tab !== 'measurements' ? (
          <>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Program başlığı"
                  placeholderTextColor={colors.outline}
                  style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                />
              )}
            />
            <Controller
              control={control}
              name="trainer_notes"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
              placeholder="Tüm günlere gidecek kısa mesaj"
              placeholderTextColor={colors.outline}
              multiline
              maxLength={400}
                  style={[
                    styles.input,
                    { minHeight: 72, color: colors.onSurface, borderColor: colors.outlineVariant },
                  ]}
                />
              )}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {Array.from({ length: 14 }, (_, index) => (
                <Pressable
                  key={index}
                  onPress={() => setDayIndex(index)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor:
                        dayIndex === index ? colors.neonGreen : colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: dayIndex === index ? colors.onPrimary : colors.onSurface,
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    G{index + 1}
                  </Text>
                  <Text
                    style={{
                      color: dayIndex === index ? colors.onPrimary : colors.onSurfaceVariant,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 10,
                    }}
                  >
                    {formatWeekdayDay(formDays?.[index]?.date ?? '')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {tab === 'workouts' ? (
              <>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold' }}>
                  Şablon kas grubu
                </Text>
                <MuscleGroupPicker value={templateMuscle} onChange={setTemplateMuscle} />
                <ScrollView horizontal contentContainerStyle={styles.days}>
                  {filteredTemplates.map((template) => (
                    <Pressable
                      key={template.id}
                      onPress={() => applyWorkoutTemplate(template)}
                      style={[styles.templateChip, { borderColor: colors.outlineVariant }]}
                    >
                      <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold' }}>
                        {template.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            {tab === 'diets' && dietTemplates.length > 0 ? (
              <ScrollView horizontal contentContainerStyle={styles.days}>
                {dietTemplates.map((template) => (
                  <Pressable
                    key={template.id}
                    onPress={() => applyDietTemplate(template)}
                    style={[styles.templateChip, { borderColor: colors.outlineVariant }]}
                  >
                    <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold' }}>
                      {template.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {loading && !program ? <ActivityIndicator color={colors.neonGreen} /> : null}
            <InlineDayEditor
              key={`${tab}-${dayIndex}`}
              control={control}
              dayIndex={dayIndex}
              exercises={exercises}
              foods={foods}
              mode={tab === 'diets' ? 'diet' : 'workout'}
              onPickExercise={setPickerIndex}
              onPickFood={(mealIndex, foodIndex) => setFoodPicker({ mealIndex, foodIndex })}
            />
          </>
        ) : null}

        <View style={tab === 'measurements' ? undefined : styles.hidden}>
          <MeasurementForm
            ref={measurementRef}
            studentId={studentId}
            recent={measurements}
            onSaved={() => load({ silent: true })}
            onDirtyChange={setMeasurementDirty}
          />
        </View>
      </ScrollView>

      {tab !== 'measurements' ? (
        <View
          style={[
            styles.sticky,
            {
              paddingBottom: spacing.stackSm,
              backgroundColor: colors.surfaceContainerLowest,
              borderTopColor: colors.outlineVariant,
            },
          ]}
        >
          <Pressable
            onPress={() => void onPublish()}
            disabled={saving}
            style={[styles.approve, { backgroundColor: colors.neonGreen }]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.approveText, { color: colors.onPrimary }]}>ONAYLA</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      <ExercisePickerModal
        visible={pickerIndex != null}
        exercises={exercises}
        muscleGroup={
          pickerIndex == null
            ? null
            : getValues(`days.${dayIndex}.workouts.${pickerIndex}.muscle_group`) ||
              templateMuscle ||
              null
        }
        selectedId={selectedExerciseId}
        onClose={() => setPickerIndex(null)}
        onSelect={(exercise) => {
          if (pickerIndex == null) return;
          setValue(`days.${dayIndex}.workouts.${pickerIndex}.exercise_id`, exercise.id, {
            shouldDirty: true,
          });
          if (exercise.category) {
            setValue(`days.${dayIndex}.workouts.${pickerIndex}.muscle_group`, exercise.category, {
              shouldDirty: true,
            });
          }
          setPickerIndex(null);
        }}
      />
      <FoodPickerModal
        visible={foodPicker != null}
        foods={foods}
        mealType={
          foodPicker
            ? getValues(`days.${dayIndex}.meals.${foodPicker.mealIndex}.meal_type`)
            : null
        }
        selectedId={
          foodPicker
            ? getValues(
                `days.${dayIndex}.meals.${foodPicker.mealIndex}.foods.${foodPicker.foodIndex}.food_id`,
              )
            : null
        }
        onClose={() => setFoodPicker(null)}
        onSelect={(food) => {
          if (!foodPicker) return;
          setValue(
            `days.${dayIndex}.meals.${foodPicker.mealIndex}.foods.${foodPicker.foodIndex}.food_id`,
            food.id,
            { shouldDirty: true },
          );
          setValue(
            `days.${dayIndex}.meals.${foodPicker.mealIndex}.foods.${foodPicker.foodIndex}.food_name`,
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

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  topBar: {
    paddingHorizontal: spacing.marginPage,
    paddingBottom: spacing.stackMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  badge: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 },
  name: { fontFamily: 'Montserrat_700Bold', fontSize: 20 },
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
  days: { gap: 8, paddingVertical: 4 },
  dayChip: {
    minWidth: 58,
    height: 48,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateChip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackSm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  approve: {
    minHeight: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    fontSize: 16,
  },
  hidden: {
    display: 'none',
  },
});
