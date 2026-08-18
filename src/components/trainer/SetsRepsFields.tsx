import { StyleSheet, TextInput, View } from 'react-native';

import { formatSetsReps, parseSetsReps } from '../../forms/setsReps';
import { radii } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SetsRepsFields({ value, onChange }: Props) {
  const { colors } = useTheme();
  const { sets, reps } = parseSetsReps(value);

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <TextInput
          value={sets}
          onChangeText={(next) => onChange(formatSetsReps(next.replace(/\D/g, ''), reps))}
          placeholder="Set"
          placeholderTextColor={colors.outline}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
        />
      </View>
      <View style={styles.field}>
        <TextInput
          value={reps}
          onChangeText={(next) => onChange(formatSetsReps(sets, next.replace(/\D/g, '')))}
          placeholder="Tekrar"
          placeholderTextColor={colors.outline}
          keyboardType="number-pad"
          style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    minHeight: 44,
    minWidth: 0,
    width: '100%',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
  },
});
