import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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

import { MacroTotals } from '../../components/MacroTotals';
import {
  formatAssignedFoodAmount,
  formatMacroLine,
  sumFoodMacros,
} from '../../forms/macros';
import type { StudentDietStackParamList } from '../../navigation/StudentDietStack';
import {
  MEAL_LABELS,
  MEAL_SORT_ORDER,
  type DietFood,
  type MealType,
} from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStudentDayStore } from '../../stores/useStudentDayStore';
import { formatShortDate } from '../../utils/format';
import { screenBottomPadding } from '../../utils/layout';

type Props = NativeStackScreenProps<StudentDietStackParamList, 'DietDay'>;

function prepNote(note?: string | null) {
  if (!note?.trim()) return null;
  if (!note.toLowerCase().includes('kcal')) return note.trim();
  const rest = note.split('—').slice(1).join('—').trim();
  return rest || null;
}

function isPlaceholderContent(content?: string | null, mealType?: string) {
  const trimmed = content?.trim() ?? '';
  if (!trimmed) return true;
  if (mealType && trimmed === mealType) return true;
  return trimmed in MEAL_LABELS;
}

export function DietDayScreen({ navigation, route }: Props) {
  const { date, planId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const studentId = useAuthStore((state) => state.profile?.id);
  const { days, loading, updatingId, load, toggleMeal } = useStudentDayStore();

  const refresh = useCallback(() => {
    if (studentId) void load(studentId);
  }, [load, studentId]);

  useFocusEffect(
    useCallback(() => {
      if (!studentId) return;
      const hasData = useStudentDayStore.getState().days.length > 0;
      void load(studentId, { silent: hasData });
    }, [load, studentId]),
  );

  useEffect(() => {
    if (days.length === 0) return;
    const exact = days.find((item) => item.id === planId);
    if (exact) return;
    const byDate = days.find((item) => item.date === date);
    if (byDate) navigation.setParams({ planId: byDate.id });
  }, [date, days, navigation, planId]);

  const resolvedPlanId =
    days.find((item) => item.id === planId)?.id ??
    days.find((item) => item.date === date)?.id ??
    planId;
  const day = days.find((item) => item.id === resolvedPlanId);
  const isTrainingDay = day?.is_training_day ?? true;

  const visibleFoods = useCallback(
    (mealFoods: DietFood[] | undefined) =>
      (mealFoods ?? []).filter((food) => isTrainingDay || !food.training_day_only),
    [isTrainingDay],
  );

  const meals = useMemo(() => {
    const list = [...(day?.daily_diets ?? [])];
    list.sort(
      (a, b) => MEAL_SORT_ORDER.indexOf(a.meal_type) - MEAL_SORT_ORDER.indexOf(b.meal_type),
    );
    return list.filter((meal) => {
      if (visibleFoods(meal.diet_foods).length > 0) return true;
      return !isPlaceholderContent(meal.content, meal.meal_type);
    });
  }, [day, visibleFoods]);

  const totals = useMemo(
    () => sumFoodMacros(meals.flatMap((meal) => visibleFoods(meal.diet_foods))),
    [meals, visibleFoods],
  );

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
            {isTrainingDay ? 'Antrenman günü' : 'Dinlenme günü'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.neonGreen} />
        }
      >
        {loading && !day ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {meals.map((meal) => {
          const foods = visibleFoods(meal.diet_foods);
          const mealMacros = sumFoodMacros(foods);
          const mealLine = formatMacroLine(mealMacros);
          const mealTitle = MEAL_LABELS[meal.meal_type as MealType] ?? meal.meal_type;
          const busy = updatingId === meal.id;
          const completed = meal.is_completed;

          return (
            <View
              key={meal.id}
              style={[
                styles.card,
                {
                  backgroundColor: completed
                    ? colors.surfaceContainerLow
                    : colors.surfaceContainerHigh,
                  borderColor: completed ? colors.neonGreenMuted : colors.outlineVariant,
                  opacity: busy ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.mealTitle, { color: colors.onSurface }]}>{mealTitle}</Text>
                  <Text style={[styles.macro, { color: colors.electricBlueSoft }]}>
                    {mealLine || '0 kcal · 0P · 0C · 0Y'}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: completed }}
                  accessibilityLabel={completed ? 'Öğünü geri al' : 'Öğünü tamamla'}
                  hitSlop={8}
                  disabled={busy}
                  onPress={() => void toggleMeal(meal.id, resolvedPlanId, !completed)}
                  style={[
                    styles.check,
                    {
                      backgroundColor: completed ? colors.neonGreen : 'transparent',
                      borderColor: colors.neonGreen,
                    },
                  ]}
                >
                  <MaterialIcons
                    name="check"
                    size={18}
                    color={completed ? colors.onPrimary : 'transparent'}
                  />
                </Pressable>
              </View>

              {foods.length === 0 ? (
                isPlaceholderContent(meal.content, meal.meal_type) ? null : (
                  <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
                    {meal.content}
                  </Text>
                )
              ) : (
                foods.map((food) => {
                  const name = food.foods?.name ?? food.food_name;
                  const grams = formatAssignedFoodAmount(food);
                  const foodLine = formatMacroLine(sumFoodMacros([food]));
                  const note = prepNote(food.note);
                  return (
                    <View key={food.id} style={styles.foodRow}>
                      <Text style={[styles.foodName, { color: colors.onSurface }]}>
                        {name}
                        {grams ? ` · ${grams}` : ''}
                      </Text>
                      <Text style={[styles.foodMacro, { color: colors.onSurfaceVariant }]}>
                        {foodLine || '0 kcal'}
                      </Text>
                      {note ? (
                        <Text style={[styles.foodNote, { color: colors.outline }]}>{note}</Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          );
        })}

        {!loading && meals.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Bu gün için öğün yok.
          </Text>
        ) : null}
        {meals.length > 0 ? <MacroTotals macros={totals} /> : null}
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
    gap: spacing.stackMd,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitle: { fontFamily: 'Montserrat_700Bold', fontSize: 18 },
  macro: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 2 },
  foodRow: { gap: 2 },
  foodName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  foodMacro: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  foodNote: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
