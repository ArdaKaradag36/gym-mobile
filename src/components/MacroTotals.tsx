import { StyleSheet, Text, View } from 'react-native';

import { formatKcal, formatMacroNumber, type Macros } from '../forms/macros';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  macros: Macros;
  title?: string;
};

export function MacroTotals({ macros, title = 'GÜNLÜK TOPLAM' }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.neonGreenBorder },
      ]}
    >
      <Text style={[styles.kicker, { color: colors.neonGreen }]}>{title}</Text>
      <Text style={[styles.kcal, { color: colors.onSurface }]}>
        {formatKcal(macros.kcal)} kcal
      </Text>
      <View style={styles.row}>
        <MacroChip label="Protein" value={`${formatMacroNumber(macros.protein)} g`} />
        <MacroChip label="Karb" value={`${formatMacroNumber(macros.carb)} g`} />
        <MacroChip label="Yağ" value={`${formatMacroNumber(macros.fat)} g`} />
      </View>
    </View>
  );
}

function MacroChip({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: colors.surfaceContainerLow }]}>
      <Text style={[styles.chipLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: colors.onSurface }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 10,
  },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  kcal: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 2,
  },
  chipLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  chipValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
