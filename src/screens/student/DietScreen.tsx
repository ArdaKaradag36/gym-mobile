import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
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

import { StudentScreenShell } from '../../components/student/StudentScreenShell';
import { formatKcal, sumFoodMacros } from '../../forms/macros';
import type { StudentDietStackParamList } from '../../navigation/StudentDietStack';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStudentDayStore } from '../../stores/useStudentDayStore';
import { formatShortDate, todayIsoDate } from '../../utils/format';
import { screenBottomPadding } from '../../utils/layout';

type Props = NativeStackScreenProps<StudentDietStackParamList, 'DietDays'>;

export function DietScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const studentId = useAuthStore((state) => state.profile?.id);
  const { days, loading, error, load } = useStudentDayStore();

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

  const today = todayIsoDate();

  return (
    <StudentScreenShell>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: screenBottomPadding(insets) }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.neonGreen} />
        }
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>14 günlük diyet</Text>
        {error ? (
          <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text>
        ) : null}
        {loading && days.length === 0 ? <ActivityIndicator color={colors.neonGreen} /> : null}

        {days.map((day) => {
          const done =
            day.daily_diets.length > 0 && day.daily_diets.every((item) => item.is_completed);
          const visibleFoods = day.daily_diets.flatMap((meal) =>
            (meal.diet_foods ?? []).filter(
              (food) => day.is_training_day || !food.training_day_only,
            ),
          );
          const kcal = Math.round(sumFoodMacros(visibleFoods).kcal);
          return (
            <Pressable
              key={day.id}
              onPress={() => navigation.navigate('DietDay', { date: day.date, planId: day.id })}
              style={[
                styles.row,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  borderColor: day.date === today ? colors.neonGreen : colors.outlineVariant,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.date, { color: colors.onSurface }]}>
                  {formatShortDate(day.date)}
                  {day.date === today ? ' · Bugün' : ''}
                </Text>
                <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
                  {day.daily_diets.length} öğün
                  {kcal > 0 ? ` · ${formatKcal(kcal)} kcal` : ''}
                </Text>
              </View>
              {done ? (
                <MaterialIcons name="check-circle" size={22} color={colors.neonGreen} />
              ) : (
                <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
              )}
            </Pressable>
          );
        })}

        {!loading && days.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            Aktif programda diyet yok.
          </Text>
        ) : null}
      </ScrollView>
    </StudentScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    gap: spacing.stackSm,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
    marginBottom: spacing.stackSm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radii.xl,
    minHeight: 72,
    paddingHorizontal: spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: { fontFamily: 'Montserrat_700Bold', fontSize: 16 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
});
