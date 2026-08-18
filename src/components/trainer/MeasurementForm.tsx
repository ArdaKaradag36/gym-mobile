import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Controller, useForm, useFormState } from 'react-hook-form';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  emptyMeasurementForm,
  formToMeasurementPayload,
  MEASUREMENT_FIELDS,
  type MeasurementFormValues,
} from '../../forms/measurementForm';
import { insertMeasurement } from '../../services/measurements';
import { parseTanitaPdf } from '../../services/pdfParse';
import type { Measurement } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  studentId: string;
  recent: Measurement[];
  onSaved: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

export function MeasurementForm({ studentId, recent, onSaved, onDirtyChange }: Props) {
  const { colors } = useTheme();
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<MeasurementFormValues>({
    defaultValues: emptyMeasurementForm(),
  });
  const { isDirty } = useFormState({ control });

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    setMessage(null);
    try {
      await insertMeasurement(studentId, formToMeasurementPayload(values));
      reset(emptyMeasurementForm());
      await onSaved();
      setMessage('Ölçüm kaydedildi.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  });

  const importPdf = async () => {
    setParsing(true);
    setMessage(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const bytes = await readPdfBytes(asset.uri);
      const base64 = bytesToBase64(bytes);

      const parsed = await parseTanitaPdf(base64);
      (Object.keys(parsed) as Array<keyof MeasurementFormValues>).forEach((key) => {
        setValue(key, parsed[key], { shouldDirty: true });
      });
      setMessage('PDF okundu. Alanları kontrol et, henüz kaydedilmedi.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'PDF okunamadı');
    } finally {
      setParsing(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => void importPdf()}
        style={[styles.pdfBtn, { borderColor: colors.electricBlue }]}
      >
        {parsing ? (
          <ActivityIndicator color={colors.electricBlue} />
        ) : (
          <Text style={{ color: colors.electricBlue, fontFamily: 'Inter_600SemiBold' }}>
            Tanita PDF içe aktar
          </Text>
        )}
      </Pressable>

      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.outline}
            style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
          />
        )}
      />
      <Controller
        control={control}
        name="device"
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            placeholder="Cihaz"
            placeholderTextColor={colors.outline}
            style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
          />
        )}
      />

      {MEASUREMENT_FIELDS.map((item) => (
        <Controller
          key={item.key}
          control={control}
          name={item.key}
          render={({ field }) => (
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>{item.label}</Text>
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                keyboardType="decimal-pad"
                placeholder="—"
                placeholderTextColor={colors.outline}
                style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
              />
            </View>
          )}
        />
      ))}

      {message ? (
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>{message}</Text>
      ) : null}

      <Pressable
        onPress={() => void onSubmit()}
        disabled={saving}
        style={[styles.save, { backgroundColor: colors.neonGreen }]}
      >
        {saving ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={{ color: colors.onPrimary, fontFamily: 'Inter_600SemiBold' }}>
            ONAYLA
          </Text>
        )}
      </Pressable>
      {isDirty ? (
        <Text style={{ color: colors.electricBlueSoft, fontFamily: 'Inter_400Regular' }}>
          Kaydedilmemiş ölçüm alanları var.
        </Text>
      ) : null}

      {recent.slice(0, 3).map((row) => (
        <Text key={row.id} style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_400Regular' }}>
          {row.date}: {row.weight ?? '—'} kg · %{row.body_fat_percent ?? row.body_fat ?? '—'}
        </Text>
      ))}
    </View>
  );
}

async function readPdfBytes(uri: string): Promise<Uint8Array> {
  try {
    return await new File(uri).bytes();
  } catch {
    const response = await fetch(uri);
    return new Uint8Array(await response.arrayBuffer());
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.stackMd },
  field: { gap: 4 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
  },
  pdfBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  save: {
    minHeight: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
