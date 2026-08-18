import { StyleSheet, Text, TextInput, View } from 'react-native';

import { FoodPickerButton } from './FoodPicker';
import {
  foodUnitGrams,
  foodUnitTitle,
  formatMacroLine,
  formatMacroNumber,
  gramsFromQuantity,
  hasCountUnit,
  hasMacros,
  parseGrams,
  type Macros,
} from '../../forms/macros';
import type { Food } from '../../types/database';
import { radii } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  selected: Food | null;
  fallbackName?: string;
  grams: string;
  macros?: Macros;
  loading?: boolean;
  onPick: () => void;
  onGramsChange: (value: string) => void;
};

export function FoodAmountFields({
  selected,
  fallbackName,
  grams,
  macros,
  loading,
  onPick,
  onGramsChange,
}: Props) {
  const { colors } = useTheme();
  const counted = hasCountUnit(selected);
  const quantity = parseGrams(grams);
  const gramsValue = gramsFromQuantity(quantity, selected);
  const perUnit = foodUnitGrams(selected);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <FoodPickerButton
          selected={selected}
          fallbackName={fallbackName}
          loading={loading}
          onPress={onPick}
        />
        <View style={styles.amountField}>
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
            {foodUnitTitle(selected)}
          </Text>
          <TextInput
            value={grams}
            onChangeText={onGramsChange}
            placeholder={counted ? '3' : '50'}
            placeholderTextColor={colors.outline}
            keyboardType="decimal-pad"
            style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
          />
        </View>
      </View>
      {counted && perUnit > 0 ? (
        <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
          1 {selected?.unit_label ?? 'adet'} ≈ {formatMacroNumber(perUnit)} g
          {gramsValue > 0 ? ` · ${formatMacroNumber(gramsValue)} g` : ''}
        </Text>
      ) : null}
      {macros && hasMacros(macros) ? (
        <Text style={[styles.macros, { color: colors.electricBlueSoft }]}>
          {formatMacroLine(macros)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    width: '100%',
  },
  amountField: {
    width: 92,
    flexShrink: 0,
    gap: 4,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  input: {
    minHeight: 56,
    minWidth: 0,
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  macros: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
