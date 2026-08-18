import type { MeasurementFormValues } from '../forms/measurementForm';
import { emptyMeasurementForm } from '../forms/measurementForm';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type ParsedMeasurement = Partial<MeasurementFormValues> & {
  raw_text?: string;
};

function applyParsed(parsed: Record<string, unknown>): MeasurementFormValues {
  const base = emptyMeasurementForm();
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, value == null ? '' : String(value)]),
    ),
    source: 'pdf',
    device: String(parsed.device ?? base.device),
  };
}

export async function parseTanitaPdf(base64: string): Promise<MeasurementFormValues> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase ayarlı değil.');
  }

  const { data, error } = await supabase.functions.invoke('parse-tanita-pdf', {
    body: { pdfBase64: base64 },
  });

  if (error) {
    throw new Error(error.message || 'PDF okunamadı.');
  }

  const payload = data as { success?: boolean; error?: string; fields?: Record<string, unknown> } | null;
  if (!payload?.success || !payload.fields) {
    throw new Error(payload?.error ?? 'PDF’den ölçüm alanları okunamadı.');
  }

  return applyParsed(payload.fields);
}
