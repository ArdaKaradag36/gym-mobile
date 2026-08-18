import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MUSCLE_GROUPS } from '../../constants/media';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function MuscleGroupPicker({ value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {MUSCLE_GROUPS.map((group) => {
        const active = value === group.key;
        return (
          <Pressable
            key={group.key}
            onPress={() => onChange(group.key)}
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
              {group.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
