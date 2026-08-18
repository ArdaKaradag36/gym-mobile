import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Segment<T extends string> = {
  key: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            onPress={() => onChange(segment.key)}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.neonGreenDim : colors.onSurfaceVariant,
                },
              ]}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
