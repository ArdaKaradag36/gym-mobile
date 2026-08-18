import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type WaterStepperProps = {
  consumed: number;
  goal: number;
  onAdjust: (delta: number) => void;
};

export function WaterStepper({ consumed, goal, onAdjust }: WaterStepperProps) {
  const { colors } = useTheme();
  const progress = goal > 0 ? Math.min(1, consumed / goal) : 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceCard, borderColor: colors.outlineVariant },
      ]}
    >
      <Text style={[styles.label, { color: colors.electricBlueSoft }]}>SU</Text>
      <Text style={[styles.value, { color: colors.onSurface }]}>
        {Math.round(consumed)} / {Math.round(goal)} ml
      </Text>
      <View style={[styles.track, { backgroundColor: colors.surfaceContainerHigh }]}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: colors.electricBlue },
          ]}
        />
      </View>
      <View style={styles.row}>
        <Pressable
          onPress={() => onAdjust(-100)}
          style={[styles.step, { borderColor: colors.outlineVariant }]}
        >
          <MaterialIcons name="remove" size={20} color={colors.onSurface} />
          <Text style={[styles.stepText, { color: colors.onSurfaceVariant }]}>100 ml</Text>
        </Pressable>
        <Pressable
          onPress={() => onAdjust(100)}
          style={[styles.step, { borderColor: colors.neonGreenBorder }]}
        >
          <MaterialIcons name="add" size={20} color={colors.neonGreen} />
          <Text style={[styles.stepText, { color: colors.neonGreen }]}>100 ml</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  value: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.stackSm,
    marginTop: spacing.stackSm,
  },
  step: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.lg,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
