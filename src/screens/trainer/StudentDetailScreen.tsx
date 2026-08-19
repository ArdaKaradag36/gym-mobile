import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useFormState, useWatch, type Control } from 'react-hook-form';
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

import { ConfirmSheet } from '../../components/ConfirmSheet';
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
  type MealRowForm,
} from '../../forms/studentDayAssignment';
import { useExercises } from '../../hooks/useExercises';
import { useFoods } from '../../hooks/useFoods';
import { useUnsavedChangesGuard } from '../../navigation/useUnsavedChangesGuard';
import type { TrainerStudentsStackParamList } from '../../navigation/TrainerStudentsStack';
import { fetchTrainerPlanWindow, fetchTrainers, publishAssignment, assignStudentTrainer } from '../../services/trainer';
import { fetchStudentProfile } from '../../services/workouts';
import { fetchStudentMeasurements } from '../../services/measurements';
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
import { formatWeekdayDay, todayIsoDate } from '../../utils/format';
import { screenBottomPadding, STICKY_ACTION_HEIGHT } from '../../utils/layout';

type DetailTab = 'workouts' | 'diets' | 'measurements';
type Props = NativeStackScreenProps<TrainerStudentsStackParamList, 'StudentDetail'>;

type PendingSheet =
  | { type: 'refresh' }
  | { type: 'workout'; template: WorkoutTemplate }
  | { type: 'diet-copy'; meals: MealRowForm[] }
  | { type: 'new-period' };

function programBadge(program: Program | null) {
  if (!program) return 'Program yok';
  if (program.status === 'draft') return 'TASLAK';
  if (program.status === 'active') return 'AKTİF PROGRAM';
  return 'ARŞİV';
}

export function StudentDetailScreen({ navigation, route }: Props) {
  const { studentId, studentName } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const trainerId = useAuthStore((state) => state.profile?.id);
  const actorRole = useAuthStore((state) => state.profile?.role);
  const setUnsavedLock = useTrainerStore((state) => state.setUnsavedLock);
  const setDiscardHandler = useTrainerStore((state) => state.setDiscardHandler);
  const { exercises } = useExercises();
  const { foods } = useFoods();
  const measurementRef = useRef<MeasurementFormHandle>(null);
  const notesMarkedRef = useRef(false);

  const [tab, setTab] = useState<DetailTab>('workouts');
  const [dayIndex, setDayIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [dietTemplates, setDietTemplates] = useState<DietTemplate[]>([]);
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);
  const [trainers, setTrainers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [assignedTrainerId, setAssignedTrainerId] = useState<string | null>(null);
  const [templateMuscle, setTemplateMuscle] = useState('');
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [foodPicker, setFoodPicker] = useState<{ mealIndex: number; foodIndex: number } | null>(
    null,
  );
  const [measurementDirty, setMeasurementDirty] = useState(false);
  const [forceNewPeriod, setForceNewPeriod] = useState(false);
  const [periodStart, setPeriodStart] = useState(todayIsoDate());
  const [pending, setPending] = useState<PendingSheet | null>(null);

  const { control, handleSubmit, reset, setValue, getValues } = useForm<AssignmentForm>({
    defaultValues: emptyAssignmentForm(),
  });
  const { isDirty } = useFormState({ control });
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

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [{ program: nextProgram, days }, measurementRows, wTemplates, dTemplates, inbox, trainerRows, studentProfile] =
        await Promise.all([
          fetchTrainerPlanWindow(studentId),
          fetchStudentMeasurements(studentId),
          trainerId ? fetchWorkoutTemplates(trainerId) : Promise.resolve([]),
          trainerId ? fetchDietTemplates(trainerId) : Promise.resolve([]),
          fetchStudentInbox(studentId).catch(() => [] as StudentNote[]),
          actorRole === 'admin' ? fetchTrainers() : Promise.resolve([]),
          fetchStudentProfile(studentId).catch(() => null),
        ]);
      setProgram(nextProgram);
      setMeasurements(measurementRows);
      setWorkoutTemplates(wTemplates);
      setDietTemplates(dTemplates);
      setStudentNotes(inbox);
      setTrainers(trainerRows.map((row) => ({ id: row.id, full_name: row.full_name })));
      setAssignedTrainerId(studentProfile?.trainer_id ?? null);
      const nextForm = assignmentFromServer(nextProgram, days);
      reset(nextForm);
      setPeriodStart(nextForm.days[0]?.date ?? todayIsoDate());
      setForceNewPeriod(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öğrenci detayı yüklenemedi');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [actorRole, reset, studentId, trainerId]);

  useEffect(() => {
    setDiscardHandler(() => {
      skipNext();
      void load({ silent: true });
    });
    return () => setDiscardHandler(null);
  }, [load, setDiscardHandler, skipNext]);

  useEffect(() => {
    notesMarkedRef.current = false;
    void load();
  }, [load]);

  const markInboxRead = useCallback(() => {
    if (!trainerId) return;
    if (!studentNotes.some((note) => !note.read_at)) return;
    notesMarkedRef.current = true;
    void markStudentNotesRead(studentId, trainerId).then(() => {
      setStudentNotes((current) =>
        current.map((note) =>
          note.read_at ? note : { ...note, read_at: new Date().toISOString() },
        ),
      );
    });
  }, [studentId, studentNotes, trainerId]);

  useEffect(() => {
    setPickerIndex(null);
    setFoodPicker(null);
  }, [dayIndex, tab]);

  const saveAssignment = (publish: boolean) =>
    handleSubmit(async (values) => {
      if (!trainerId) return;
      const validation = validateAssignment(values);
      if (validation) {
        setError(validation);
        setNotice(null);
        return;
      }
      setSaving(true);
      setError(null);
      setNotice(null);
      try {
        const saved = await publishAssignment({
          studentId,
          trainerId,
          form: values,
          existingProgramId: program?.id,
          publish,
          newPeriod: forceNewPeriod,
        });
        setProgram(saved);
        setForceNewPeriod(false);
        measurementRef.current?.resetDirty();
        setMeasurementDirty(false);
        setNotice(
          publish
            ? 'Öğrenci görüyor · tamamlananlar korunur'
            : 'Taslak kaydedildi. Öğrenci henüz görmez.',
        );
        await load({ silent: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : publish ? 'ONAYLA başarısız' : 'Kayıt başarısız');
      } finally {
        setSaving(false);
      }
    })();

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

  const cloneMeals = (meals: MealRowForm[]) =>
    meals.map((meal) => ({
      ...meal,
      id: undefined,
      foods: meal.foods.map((food) => ({ ...food })),
    }));

  const applyDietToDay = (index: number, meals: MealRowForm[]) => {
    setValue(`days.${index}.meals`, cloneMeals(meals), { shouldDirty: true });
  };

  const startNewPeriod = () => {
    const start = periodStart.trim() || todayIsoDate();
    reset(
      {
        ...getValues(),
        days: emptyAssignmentForm(start).days,
      },
      { keepDefaultValues: true },
    );
    setForceNewPeriod(true);
    setDayIndex(0);
  };

  const selectedExerciseId =
    pickerIndex == null ? null : getValues(`days.${dayIndex}.workouts.${pickerIndex}.exercise_id`);

  const sheetCopy = pendingSheetCopy(pending);

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
            {programBadge(program)}
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
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              if (combinedDirty) setPending({ type: 'refresh' });
              else void load();
            }}
            tintColor={colors.neonGreen}
          />
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
        {notice ? (
          <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_400Regular' }}>{notice}</Text>
        ) : null}

        {tab !== 'measurements' ? (
          <StudentInbox notes={studentNotes} onMarkRead={markInboxRead} />
        ) : null}

        {actorRole === 'admin' && trainers.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold' }}>
              Antrenör ata{assignedTrainerId ? '' : ' · atanmamış'}
            </Text>
            <ScrollView horizontal contentContainerStyle={styles.days}>
              {trainers.map((trainer) => {
                const selected = assignedTrainerId === trainer.id;
                return (
                  <Pressable
                    key={trainer.id}
                    onPress={() => {
                      void assignStudentTrainer(studentId, trainer.id).then(() => {
                        setAssignedTrainerId(trainer.id);
                      });
                    }}
                    style={[
                      styles.templateChip,
                      {
                        borderColor: selected ? colors.neonGreen : colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? colors.neonGreen : colors.electricBlueSoft,
                        fontFamily: 'Inter_600SemiBold',
                      }}
                    >
                      {trainer.full_name || 'Antrenör'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

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

            <View style={styles.macroGrid}>
              {(
                [
                  ['kcal_target', 'kcal'],
                  ['protein_g', 'P antr.'],
                  ['carb_g', 'K antr.'],
                  ['fat_g', 'Y antr.'],
                  ['protein_g_off', 'P din.'],
                  ['carb_g_off', 'K din.'],
                  ['fat_g_off', 'Y din.'],
                ] as const
              ).map(([name, label]) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <View style={styles.macroField}>
                      <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                        {label}
                      </Text>
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={colors.outline}
                        style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
                      />
                    </View>
                  )}
                />
              ))}
            </View>
            <View style={styles.periodRow}>
              <TextInput
                value={periodStart}
                onChangeText={setPeriodStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.outline}
                style={[
                  styles.input,
                  styles.periodInput,
                  { color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
              />
              <Pressable
                onPress={() => setPending({ type: 'new-period' })}
                style={[styles.periodBtn, { borderColor: colors.electricBlue }]}
              >
                <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_600SemiBold' }}>
                  Yeni dönem
                </Text>
              </Pressable>
            </View>
            {forceNewPeriod ? (
              <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_400Regular' }}>
                Yeni 14 gün hazır. ONAYLA eski aktif programı arşivler.
              </Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
              {Array.from({ length: 14 }, (_, index) => (
                <DayChip
                  key={index}
                  control={control}
                  index={index}
                  selected={dayIndex === index}
                  onPress={() => setDayIndex(index)}
                />
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
                      onPress={() => setPending({ type: 'workout', template })}
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
                    onPress={() => {
                      const meals = dietTemplateToMeals(template);
                      if (meals.length === 0) return;
                      applyDietToDay(dayIndex, meals);
                      setPending({ type: 'diet-copy', meals });
                    }}
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
              setValue={setValue}
              dayIndex={dayIndex}
              exercises={exercises}
              foods={foods}
              mode={tab === 'diets' ? 'diet' : 'workout'}
              onPickExercise={setPickerIndex}
              onPickFood={(mealIndex, foodIndex) => setFoodPicker({ mealIndex, foodIndex })}
            />
          </>
        ) : (
          <MeasurementForm
            ref={measurementRef}
            studentId={studentId}
            recent={measurements}
            onSaved={() => load({ silent: true })}
            onDirtyChange={setMeasurementDirty}
          />
        )}
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
          <View style={styles.stickyRow}>
            <Pressable
              onPress={() => void saveAssignment(false)}
              disabled={saving}
              style={[styles.approve, styles.saveBtn, { borderColor: colors.outlineVariant }]}
            >
              {saving ? (
                <ActivityIndicator color={colors.onSurface} />
              ) : (
                <Text style={[styles.approveText, { color: colors.onSurface }]}>Kaydet</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => void saveAssignment(true)}
              disabled={saving}
              style={[styles.approve, { backgroundColor: colors.neonGreen, flex: 1.2 }]}
            >
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.approveText, { color: colors.onPrimary }]}>ONAYLA</Text>
              )}
            </Pressable>
          </View>
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
      <ConfirmSheet
        visible={pending != null}
        title={sheetCopy.title}
        message={sheetCopy.message}
        confirmLabel={sheetCopy.confirmLabel}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const current = pending;
          setPending(null);
          if (!current) return;
          if (current.type === 'refresh') void load();
          if (current.type === 'workout') applyWorkoutTemplate(current.template);
          if (current.type === 'diet-copy') {
            getValues('days').forEach((day, index) => {
              if (index === dayIndex) return;
              const hasFood = day.meals.some((meal) =>
                meal.foods.some((food) => food.food_id.trim()),
              );
              if (!hasFood) applyDietToDay(index, current.meals);
            });
          }
          if (current.type === 'new-period') startNewPeriod();
        }}
      />
    </View>
  );
}

function pendingSheetCopy(pending: PendingSheet | null) {
  if (pending?.type === 'workout') {
    return {
      title: 'Şablon uygula',
      message: 'Bu günün hareketleri değişecek.',
      confirmLabel: 'Uygula',
    };
  }
  if (pending?.type === 'diet-copy') {
    return {
      title: 'Diğer günler',
      message: 'Boş günlere de kopyala?',
      confirmLabel: 'Kopyala',
    };
  }
  if (pending?.type === 'new-period') {
    return {
      title: 'Yeni dönem',
      message: 'Yeni 14 günlük dönem başlar. ONAYLA’da eski aktif program arşivlenir.',
      confirmLabel: 'Başlat',
    };
  }
  return {
    title: 'Kaydedilmemiş değişiklikler',
    message: 'Yenilemek kaydedilmemiş değişiklikleri siler.',
    confirmLabel: 'Yenile',
  };
}

function DayChip({
  control,
  index,
  selected,
  onPress,
}: {
  control: Control<AssignmentForm>;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const date = useWatch({ control, name: `days.${index}.date` });

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dayChip,
        {
          backgroundColor: selected ? colors.neonGreen : colors.surfaceContainerHigh,
        },
      ]}
    >
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.onSurface,
          fontFamily: 'Inter_600SemiBold',
        }}
      >
        G{index + 1}
      </Text>
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.onSurfaceVariant,
          fontFamily: 'Inter_400Regular',
          fontSize: 10,
        }}
      >
        {formatWeekdayDay(date ?? '')}
      </Text>
    </Pressable>
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
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroField: {
    width: '23%',
    flexGrow: 1,
    minWidth: 72,
    gap: 4,
  },
  periodRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  periodInput: { flex: 1 },
  periodBtn: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  stickyRow: { flexDirection: 'row', gap: 8 },
  approve: {
    minHeight: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  saveBtn: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  approveText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.5,
    fontSize: 16,
  },
});
