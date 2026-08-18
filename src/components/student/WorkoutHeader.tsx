import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type WorkoutHeaderProps = {
  dayLabel: string;
  workoutTitle: string;
  completedCount: number;
  totalCount: number;
};

export function WorkoutHeader({
  dayLabel,
  workoutTitle,
  completedCount,
  totalCount,
}: WorkoutHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.day, { color: colors.onSurface }]}>{dayLabel}</Text>
      <Text style={[styles.title, { color: colors.neonGreen }]}>{workoutTitle}</Text>
      <View style={styles.metaRow}>
        <MaterialIcons name="fitness-center" size={16} color={colors.outline} />
        <Text style={[styles.meta, { color: colors.outline }]}>
          {totalCount === 0
            ? 'No exercises scheduled'
            : `${completedCount}/${totalCount} exercises complete`}
        </Text>
        <View style={[styles.dot, { backgroundColor: colors.outlineVariant }]} />
        <MaterialIcons name="bolt" size={16} color={colors.outline} />
        <Text style={[styles.meta, { color: colors.outline }]}>TODAY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.unit,
  },
  day: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.stackSm,
  },
  meta: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
});
