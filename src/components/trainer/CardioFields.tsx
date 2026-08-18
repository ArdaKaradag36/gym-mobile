import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CARDIO_TEMPOS,
  encodeCardioParams,
  parseCardioParams,
} from '../../forms/cardio';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CardioFields({ value, onChange }: Props) {
  const { colors } = useTheme();
  const params = parseCardioParams(value);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.neonGreen }]}>Kardiyo</Text>
      <Text style={[styles.hint, { color: colors.onSurfaceVariant }]}>
        Hareket gibi eklenir. Sadece süre ve tempo.
      </Text>
      <TextInput
        value={params.minutes}
        onChangeText={(minutes) => onChange(encodeCardioParams({ ...params, minutes }))}
        keyboardType="number-pad"
        placeholder="Dakika"
        placeholderTextColor={colors.outline}
        style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
      />
      <View style={styles.tempos}>
        {CARDIO_TEMPOS.map((tempo) => {
          const active = params.tempo === tempo.key;
          return (
            <Pressable
              key={tempo.key}
              onPress={() => onChange(encodeCardioParams({ ...params, tempo: tempo.key }))}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.neonGreen : colors.surfaceContainerHigh,
                  borderColor: active ? colors.neonGreen : colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.onPrimary : colors.onSurfaceVariant,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                }}
              >
                {tempo.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 16 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
  },
  tempos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
