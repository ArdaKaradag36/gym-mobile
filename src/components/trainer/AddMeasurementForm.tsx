import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Measurement } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type AddMeasurementFormProps = {
  date: string;
  onDateChange: (date: string) => void;
  saving: boolean;
  recent: Measurement[];
  onSubmit: (params: { weight: number; bodyFat: number | null }) => Promise<void>;
};

export function AddMeasurementForm({
  date,
  onDateChange,
  saving,
  recent,
  onSubmit,
}: AddMeasurementFormProps) {
  const { colors } = useTheme();
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    setFormError(null);
    const parsedWeight = Number(weight);
    const parsedBodyFat = bodyFat.trim() === '' ? null : Number(bodyFat);

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setFormError('Enter a valid weight.');
      return;
    }
    if (parsedBodyFat != null && (!Number.isFinite(parsedBodyFat) || parsedBodyFat < 0)) {
      setFormError('Enter a valid body fat % or leave blank.');
      return;
    }

    try {
      await onSubmit({ weight: parsedWeight, bodyFat: parsedBodyFat });
      setWeight('');
      setBodyFat('');
    } catch {
      // parent surfaces error
    }
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceCard,
            borderColor: colors.neonGreenMuted,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>New Measurement</Text>

        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Date</Text>
        <TextInput
          value={date}
          onChangeText={onDateChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.outlineVariant,
              color: colors.onSurface,
            },
          ]}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Weight (kg)</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="78.5"
              placeholderTextColor={colors.outline}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
            />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
              Body fat %
            </Text>
            <TextInput
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="decimal-pad"
              placeholder="14.2"
              placeholderTextColor={colors.outline}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                },
              ]}
            />
          </View>
        </View>

        {formError ? (
          <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>
            {formError}
          </Text>
        ) : null}

        <Pressable
          onPress={() => void handleSave()}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            {
              backgroundColor: colors.neonGreen,
              opacity: pressed || saving ? 0.85 : 1,
            },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <MaterialIcons name="monitor-weight" size={18} color={colors.onPrimary} />
              <Text style={[styles.saveText, { color: colors.onPrimary }]}>Save</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.recentBlock}>
        <Text style={[styles.recentTitle, { color: colors.onSurface }]}>Recent</Text>
        {recent.length === 0 ? (
          <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
            No measurements yet.
          </Text>
        ) : (
          recent.map((item) => (
            <View
              key={item.id}
              style={[
                styles.recentRow,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Text style={{ color: colors.onSurface, fontFamily: 'Inter_600SemiBold' }}>
                {item.date}
              </Text>
              <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_400Regular' }}>
                {item.weight ?? '--'} kg
                {item.body_fat != null ? ` · ${item.body_fat}%` : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.stackLg,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackLg,
    gap: spacing.stackMd,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.stackMd,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.gutterCard,
  },
  half: {
    flex: 1,
    gap: 8,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  recentBlock: {
    gap: spacing.stackMd,
  },
  recentTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
  },
  recentRow: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.stackMd,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
