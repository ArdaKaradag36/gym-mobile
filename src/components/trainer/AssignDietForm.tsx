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

import type { MealType } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const MEAL_OPTIONS: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'Sabah' },
  { key: 'lunch', label: 'Öğle' },
  { key: 'dinner', label: 'Akşam' },
  { key: 'snack', label: 'Ara öğün' },
];

type AssignDietFormProps = {
  studentName: string;
  date: string;
  onDateChange: (date: string) => void;
  saving: boolean;
  onSubmit: (params: { mealType: MealType; content: string }) => Promise<void>;
};

export function AssignDietForm({
  studentName,
  date,
  onDateChange,
  saving,
  onSubmit,
}: AssignDietFormProps) {
  const { colors } = useTheme();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSave = async () => {
    setFormError(null);
    if (!content.trim()) {
      setFormError('Kaydetmeden önce öğün içeriği ekle.');
      return;
    }

    try {
      await onSubmit({ mealType, content: content.trim() });
      setContent('');
    } catch {
      // parent surfaces error
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.neonGreenMuted,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.onSurface }]}>Öğün ekle</Text>
      <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
        {studentName} için beslenme planı.
      </Text>

      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Tarih</Text>
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

      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Öğün</Text>
      <View style={styles.mealRow}>
        {MEAL_OPTIONS.map((option) => {
          const active = option.key === mealType;
          return (
            <Pressable
              key={option.key}
              onPress={() => setMealType(option.key)}
              style={[
                styles.mealChip,
                {
                  backgroundColor: active
                    ? colors.neonGreenMuted
                    : colors.surfaceContainerHigh,
                  borderColor: active ? colors.neonGreenBorder : colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.neonGreen : colors.onSurfaceVariant,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>İçerik</Text>
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Tavuk, pirinç, salata…"
        placeholderTextColor={colors.outline}
        multiline
        style={[
          styles.textarea,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: colors.outlineVariant,
            color: colors.onSurface,
          },
        ]}
      />

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
            <MaterialIcons name="restaurant" size={18} color={colors.onPrimary} />
            <Text style={[styles.saveText, { color: colors.onPrimary }]}>Öğünü kaydet</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
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
  textarea: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: spacing.stackMd,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealChip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
