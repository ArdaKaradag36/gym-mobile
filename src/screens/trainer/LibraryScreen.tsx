import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SegmentedControl } from '../../components/trainer/SegmentedControl';
import { TrainerTopNavbar } from '../../components/trainer/TrainerTopNavbar';
import { exerciseVideoUrl, muscleGroupLabel } from '../../constants/media';
import { formatKcal, formatMacroNumber, sumMealFoodMacros } from '../../forms/macros';
import { useExercises } from '../../hooks/useExercises';
import { useFoods } from '../../hooks/useFoods';
import type { TrainerLibraryStackParamList } from '../../navigation/TrainerLibraryStack';
import {
  deleteDietTemplate,
  deleteWorkoutTemplate,
  fetchDietTemplates,
  fetchWorkoutTemplates,
} from '../../services/templates';
import { useAuthStore } from '../../stores/useAuthStore';
import type { DietTemplate, Exercise, Food, WorkoutTemplate } from '../../types/database';
import { MEAL_CHIP_LABELS, MEAL_SORT_ORDER } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { gridCardStyle, screenBottomPadding } from '../../utils/layout';

type Props = NativeStackScreenProps<TrainerLibraryStackParamList, 'LibraryHome'>;
type LibraryTab = 'exercises' | 'workouts' | 'diets' | 'foods';

export function LibraryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const trainerName = useAuthStore((state) => state.profile?.full_name ?? 'Antrenör');
  const trainerId = useAuthStore((state) => state.profile?.id);
  const { exercises, loading: exercisesLoading, error: exercisesError, refresh } = useExercises();
  const { foods, loading: foodsLoading, error: foodsError, refresh: refreshFoods } = useFoods();
  const [tab, setTab] = useState<LibraryTab>('workouts');
  const [query, setQuery] = useState('');
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [dietTemplates, setDietTemplates] = useState<DietTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const focusedOnce = useRef(false);

  const loadTemplates = useCallback(async (opts?: { silent?: boolean }) => {
    if (!trainerId) return;
    if (!opts?.silent) setTemplatesLoading(true);
    try {
      const [workouts, diets] = await Promise.all([
        fetchWorkoutTemplates(trainerId),
        fetchDietTemplates(trainerId),
      ]);
      setWorkoutTemplates(workouts);
      setDietTemplates(diets);
    } finally {
      setTemplatesLoading(false);
    }
  }, [trainerId]);

  useFocusEffect(
    useCallback(() => {
      const silent = focusedOnce.current;
      focusedOnce.current = true;
      void loadTemplates({ silent });
      void refresh({ silent });
      void refreshFoods({ silent });
    }, [loadTemplates, refresh, refreshFoods]),
  );

  const filteredExercises = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;
    return exercises.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.category?.toLowerCase().includes(normalized),
    );
  }, [exercises, query]);

  const filteredFoods = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return foods;
    return foods.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.category?.toLowerCase().includes(normalized),
    );
  }, [foods, query]);

  const refreshing =
    tab === 'exercises' ? exercisesLoading : tab === 'foods' ? foodsLoading : templatesLoading;
  const onRefresh =
    tab === 'exercises' ? refresh : tab === 'foods' ? refreshFoods : loadTemplates;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrainerTopNavbar trainerName={trainerName} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Kütüphane</Text>
        <SegmentedControl
          value={tab}
          onChange={(next) => {
            setTab(next);
            setQuery('');
          }}
          segments={[
            { key: 'workouts', label: 'Antrenman' },
            { key: 'diets', label: 'Diyet' },
            { key: 'exercises', label: 'Egzersiz' },
            { key: 'foods', label: 'Besin' },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.neonGreen}
          />
        }
      >
        {tab === 'exercises' ? (
          <ExercisesGrid
            exercises={filteredExercises}
            query={query}
            onQueryChange={setQuery}
            loading={exercisesLoading}
            error={exercisesError}
          />
        ) : null}

        {tab === 'foods' ? (
          <FoodsGrid
            foods={filteredFoods}
            query={query}
            onQueryChange={setQuery}
            loading={foodsLoading}
            error={foodsError}
          />
        ) : null}

        {tab === 'workouts' ? (
          <>
            <Pressable
              onPress={() => navigation.navigate('TemplateEditor', { kind: 'workout' })}
              style={[styles.create, { borderColor: colors.neonGreenBorder }]}
            >
              <MaterialIcons name="add" size={20} color={colors.neonGreen} />
              <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>
                Antrenman şablonu
              </Text>
            </Pressable>
            {workoutTemplates.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.templateCard,
                  { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
                ]}
              >
                <Pressable
                  style={styles.templateBody}
                  onPress={() =>
                    navigation.navigate('TemplateEditor', { kind: 'workout', templateId: item.id })
                  }
                >
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.name}</Text>
                  <Text style={{ color: colors.onSurfaceVariant }}>
                    {muscleGroupLabel(item.muscle_group)} · {item.workout_template_items?.length ?? 0}{' '}
                    hareket
                  </Text>
                </Pressable>
                <Pressable onPress={() => void deleteWorkoutTemplate(item.id).then(() => loadTemplates())}>
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        {tab === 'diets' ? (
          <>
            <Pressable
              onPress={() => navigation.navigate('TemplateEditor', { kind: 'diet' })}
              style={[styles.create, { borderColor: colors.neonGreenBorder }]}
            >
              <MaterialIcons name="add" size={20} color={colors.neonGreen} />
              <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>
                Diyet şablonu
              </Text>
            </Pressable>
            {dietTemplates.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.templateCard,
                  { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
                ]}
              >
                <Pressable
                  style={styles.templateBody}
                  onPress={() =>
                    navigation.navigate('TemplateEditor', { kind: 'diet', templateId: item.id })
                  }
                >
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.name}</Text>
                  <Text style={{ color: colors.onSurfaceVariant }}>
                    {item.diet_template_meals?.length ?? 0} öğün
                    {(() => {
                      const kcal = Math.round(
                        sumMealFoodMacros(
                          (item.diet_template_meals ?? []).map((meal) => ({
                            foods: meal.diet_template_foods,
                          })),
                        ).kcal,
                      );
                      return kcal > 0 ? ` · ${kcal} kcal` : '';
                    })()}
                  </Text>
                </Pressable>
                <Pressable onPress={() => void deleteDietTemplate(item.id).then(() => loadTemplates())}>
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ExercisesGrid({
  exercises,
  query,
  onQueryChange,
  loading,
  error,
}: {
  exercises: Exercise[];
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const { colors } = useTheme();

  return (
    <>
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
        ]}
      >
        <MaterialIcons name="search" size={18} color={colors.onSurfaceVariant} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Egzersiz ara…"
          placeholderTextColor={colors.outline}
          style={[styles.searchInput, { color: colors.onSurface }]}
        />
      </View>

      {loading && exercises.length === 0 ? <ActivityIndicator color={colors.neonGreen} /> : null}
      {!loading && exercises.length === 0 ? (
        <Text style={{ color: colors.onSurfaceVariant }}>{error ?? 'Egzersiz yok.'}</Text>
      ) : null}

      <View style={styles.grid}>
        {exercises.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              gridCardStyle,
              { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
            ]}
          >
            <Pressable
              accessibilityLabel="Video"
              onPress={() => void Linking.openURL(exerciseVideoUrl(item.youtube_url))}
              style={styles.hiddenVideo}
            >
              <MaterialIcons name="play-circle-outline" size={18} color={colors.outline} />
            </Pressable>
            <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.name}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
              {muscleGroupLabel(item.category) || (item.is_cardio ? 'Kardiyo' : '—')}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

function FoodsGrid({
  foods,
  query,
  onQueryChange,
  loading,
  error,
}: {
  foods: Food[];
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const { colors } = useTheme();

  return (
    <>
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
        ]}
      >
        <MaterialIcons name="search" size={18} color={colors.onSurfaceVariant} />
        <TextInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="Besin ara…"
          placeholderTextColor={colors.outline}
          style={[styles.searchInput, { color: colors.onSurface }]}
        />
      </View>

      {loading && foods.length === 0 ? <ActivityIndicator color={colors.neonGreen} /> : null}
      {!loading && foods.length === 0 ? (
        <Text style={{ color: colors.onSurfaceVariant }}>{error ?? 'Besin yok.'}</Text>
      ) : null}

      <View style={styles.grid}>
        {foods.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              gridCardStyle,
              { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
            ]}
          >
            <Text style={[styles.foodTitle, { color: colors.onSurface }]}>{item.name}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: 12 }}>
              {item.category ?? 'Genel'}
            </Text>
            <Text style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
              {formatKcal(Number(item.kcal_per_100g))} kcal / 100g
            </Text>
            {item.grams_per_unit ? (
              <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: 11 }}>
                1 {item.unit_label} ≈ {formatMacroNumber(Number(item.grams_per_unit))} g
              </Text>
            ) : null}
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular', fontSize: 11 }}>
              {formatMacroNumber(Number(item.protein_per_100g))}P ·{' '}
              {formatMacroNumber(Number(item.carb_per_100g))}C ·{' '}
              {formatMacroNumber(Number(item.fat_per_100g))}Y
            </Text>
            <View style={styles.mealChips}>
              {MEAL_SORT_ORDER.filter((meal) => item.meal_types?.includes(meal)).map((meal) => (
                <View
                  key={meal}
                  style={[styles.mealChip, { backgroundColor: colors.surfaceContainerLow }]}
                >
                  <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold', fontSize: 10 }}>
                    {MEAL_CHIP_LABELS[meal]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    gap: spacing.stackMd,
  },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 24 },
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackMd,
    gap: spacing.gutterCard,
  },
  search: {
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Inter_400Regular' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.gutterCard,
  },
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  hiddenVideo: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    opacity: 0.45,
  },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, paddingRight: 22 },
  foodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  mealChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  mealChip: {
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  create: {
    borderWidth: 1,
    borderRadius: radii.lg,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  templateCard: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateBody: {
    flex: 1,
  },
});
