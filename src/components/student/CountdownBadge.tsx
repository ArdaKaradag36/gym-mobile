import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type CountdownBadgeProps = {
  daysLeft: number | null;
};

export function CountdownBadge({ daysLeft }: CountdownBadgeProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.neonGreenMuted, borderColor: colors.neonGreenBorder },
      ]}
    >
      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>PROGRAM</Text>
      <Text style={[styles.value, { color: colors.neonGreen }]}>
        {daysLeft == null ? 'Atanmadı' : `${daysLeft} gün kaldı`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 4,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  value: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
  },
});
