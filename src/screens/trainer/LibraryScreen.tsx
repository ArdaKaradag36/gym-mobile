import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { SegmentedControl } from '../../components/trainer/SegmentedControl';
import { TrainerTopNavbar } from '../../components/trainer/TrainerTopNavbar';
import { exerciseVideoUrl, muscleGroupLabel } from '../../constants/media';
import { useExercises } from '../../hooks/useExercises';
import type { TrainerLibraryStackParamList } from '../../navigation/TrainerLibraryStack';
import {
  deleteDietTemplate,
  deleteWorkoutTemplate,
  fetchDietTemplates,
  fetchWorkoutTemplates,
} from '../../services/templates';
import { useAuthStore } from '../../stores/useAuthStore';
import type { DietTemplate, Exercise, WorkoutTemplate } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Props = NativeStackScreenProps<TrainerLibraryStackParamList, 'LibraryHome'>;
type LibraryTab = 'exercises' | 'workouts' | 'diets';

export function LibraryScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const trainerName = useAuthStore((state) => state.profile?.full_name ?? 'Trainer');
  const trainerId = useAuthStore((state) => state.profile?.id);
  const { exercises, loading: exercisesLoading, error: exercisesError, refresh } = useExercises();
  const [tab, setTab] = useState<LibraryTab>('workouts');
  const [query, setQuery] = useState('');
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
  const [dietTemplates, setDietTemplates] = useState<DietTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!trainerId) return;
    setTemplatesLoading(true);
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

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const filteredExercises = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return exercises;
    return exercises.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.category?.toLowerCase().includes(normalized),
    );
  }, [exercises, query]);

  const refreshing = tab === 'exercises' ? exercisesLoading : templatesLoading;
  const onRefresh = tab === 'exercises' ? refresh : loadTemplates;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrainerTopNavbar trainerName={trainerName} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Kütüphane</Text>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          segments={[
            { key: 'workouts', label: 'Antrenman' },
            { key: 'diets', label: 'Diyet' },
            { key: 'exercises', label: 'Egzersiz' },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
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
                <Pressable onPress={() => void deleteWorkoutTemplate(item.id).then(loadTemplates)}>
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
                  </Text>
                </Pressable>
                <Pressable onPress={() => void deleteDietTemplate(item.id).then(loadTemplates)}>
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
    paddingBottom: 120,
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
    flexGrow: 1,
    flexBasis: 140,
    maxWidth: '48%',
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
