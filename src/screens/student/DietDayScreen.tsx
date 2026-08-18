import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { StudentDietStackParamList } from '../../navigation/StudentDietStack';
import { MEAL_LABELS, MEAL_SORT_ORDER } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStudentDayStore } from '../../stores/useStudentDayStore';
import { formatShortDate } from '../../utils/format';
import { animateListSink } from '../../utils/layoutAnim';

type Props = NativeStackScreenProps<StudentDietStackParamList, 'DietDay'>;

export function DietDayScreen({ navigation, route }: Props) {
  const { date, planId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const studentId = useAuthStore((state) => state.profile?.id);
  const { days, loading, load, toggleMeal } = useStudentDayStore();

  const refresh = useCallback(() => {
    if (studentId) void load(studentId);
  }, [load, studentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const day = days.find((item) => item.id === planId);
  const isTrainingDay = day?.is_training_day ?? true;

  const meals = useMemo(() => {
    const list = [...(day?.daily_diets ?? [])];
    list.sort((a, b) => {
      if (a.is_completed !== b.is_completed) return Number(a.is_completed) - Number(b.is_completed);
      return MEAL_SORT_ORDER.indexOf(a.meal_type) - MEAL_SORT_ORDER.indexOf(b.meal_type);
    });
    return list;
  }, [day]);

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
          style={[styles.back, { backgroundColor: colors.surfaceContainer }]}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.onSurfaceVariant }]}>
            {formatShortDate(date)}
          </Text>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            {isTrainingDay ? 'Antrenman günü' : 'Off gün'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.neonGreen} />
        }
      >
        {loading && !day ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {meals.map((meal) => {
          const foods = (meal.diet_foods ?? []).filter(
            (food) => isTrainingDay || !food.training_day_only,
          );
          return (
            <Pressable
              key={meal.id}
              onPress={() => {
                animateListSink();
                void toggleMeal(meal.id, planId, !meal.is_completed);
              }}
              style={[
                styles.card,
                {
                  backgroundColor: meal.is_completed
                    ? colors.surfaceContainerLow
                    : colors.surfaceContainerHigh,
                  borderColor: meal.is_completed ? colors.neonGreenMuted : colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.mealTitle, { color: colors.onSurface }]}>
                  {MEAL_LABELS[meal.meal_type] ?? meal.meal_type}
                </Text>
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: meal.is_completed ? colors.neonGreen : 'transparent',
                      borderColor: colors.neonGreen,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="check"
                    size={18}
                    color={meal.is_completed ? colors.onPrimary : 'transparent'}
                  />
                </View>
              </View>
              {foods.length === 0 ? (
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
                  {meal.content}
                </Text>
              ) : (
                foods.map((food) => (
                  <Text
                    key={food.id}
                    style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}
                  >
                    {food.food_name}
                    {food.amount ? ` · ${food.amount}` : ''}
                  </Text>
                ))
              )}
            </Pressable>
          );
        })}

        {!loading && meals.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Bu gün için öğün yok.
          </Text>
        ) : null}
      </ScrollView>
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
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 20 },
  content: {
    padding: spacing.marginPage,
    paddingBottom: 120,
    gap: spacing.stackMd,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
