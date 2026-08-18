import { todayIsoDate } from '../utils/format';

export type MeasurementFormValues = {
  date: string;
  measured_at: string;
  device: string;
  weight: string;
  weight_ideal: string;
  body_density: string;
  bmi: string;
  bmi_ideal: string;
  muscle_kg: string;
  muscle_kg_ideal: string;
  mineral: string;
  mineral_ideal: string;
  protein: string;
  protein_ideal: string;
  fluid_kg: string;
  fluid_kg_ideal: string;
  fat_mass_kg: string;
  fat_mass_kg_ideal: string;
  body_fat_percent: string;
  body_fat_percent_ideal: string;
  bmi_score: string;
  muscle_score: string;
  fluid_score: string;
  bmr_score: string;
  fat_score: string;
  metabolic_age: string;
  fat_free_mass_kg: string;
  source: string;
};

export const MEASUREMENT_FIELDS: Array<{
  key: keyof MeasurementFormValues;
  label: string;
}> = [
  { key: 'weight', label: 'Ağırlık (kg)' },
  { key: 'weight_ideal', label: 'Ağırlık ideal' },
  { key: 'bmi', label: 'BKİ' },
  { key: 'bmi_ideal', label: 'BKİ ideal' },
  { key: 'muscle_kg', label: 'Kas (kg)' },
  { key: 'muscle_kg_ideal', label: 'Kas ideal' },
  { key: 'mineral', label: 'Mineral' },
  { key: 'mineral_ideal', label: 'Mineral ideal' },
  { key: 'protein', label: 'Protein' },
  { key: 'protein_ideal', label: 'Protein ideal' },
  { key: 'fluid_kg', label: 'Sıvı (kg)' },
  { key: 'fluid_kg_ideal', label: 'Sıvı ideal' },
  { key: 'fat_mass_kg', label: 'Yağ kütlesi (kg)' },
  { key: 'fat_mass_kg_ideal', label: 'Yağ kütlesi ideal' },
  { key: 'body_fat_percent', label: 'Yağ oranı %' },
  { key: 'body_fat_percent_ideal', label: 'Yağ oranı ideal' },
  { key: 'body_density', label: 'Vücut yoğunluğu' },
  { key: 'fat_free_mass_kg', label: 'Yağsız kütle (kg)' },
  { key: 'metabolic_age', label: 'Metabolik yaş' },
  { key: 'bmi_score', label: 'BKİ skor' },
  { key: 'muscle_score', label: 'Kas skor' },
  { key: 'fluid_score', label: 'Sıvı skor' },
  { key: 'bmr_score', label: 'BMR skor' },
  { key: 'fat_score', label: 'Yağ skor' },
];

export function emptyMeasurementForm(): MeasurementFormValues {
  return {
    date: todayIsoDate(),
    measured_at: '',
    device: 'Tanita RD-545',
    weight: '',
    weight_ideal: '',
    body_density: '',
    bmi: '',
    bmi_ideal: '',
    muscle_kg: '',
    muscle_kg_ideal: '',
    mineral: '',
    mineral_ideal: '',
    protein: '',
    protein_ideal: '',
    fluid_kg: '',
    fluid_kg_ideal: '',
    fat_mass_kg: '',
    fat_mass_kg_ideal: '',
    body_fat_percent: '',
    body_fat_percent_ideal: '',
    bmi_score: '',
    muscle_score: '',
    fluid_score: '',
    bmr_score: '',
    fat_score: '',
    metabolic_age: '',
    fat_free_mass_kg: '',
    source: 'manual',
  };
}

export function formToMeasurementPayload(
  values: MeasurementFormValues,
): Record<string, unknown> {
  const toNum = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const bodyFat = toNum(values.body_fat_percent);

  return {
    date: values.date,
    measured_at: values.measured_at.trim() || null,
    device: values.device.trim() || 'Tanita RD-545',
    weight: toNum(values.weight),
    weight_ideal: toNum(values.weight_ideal),
    body_density: toNum(values.body_density),
    bmi: toNum(values.bmi),
    bmi_ideal: toNum(values.bmi_ideal),
    muscle_kg: toNum(values.muscle_kg),
    muscle_kg_ideal: toNum(values.muscle_kg_ideal),
    mineral: toNum(values.mineral),
    mineral_ideal: toNum(values.mineral_ideal),
    protein: toNum(values.protein),
    protein_ideal: toNum(values.protein_ideal),
    fluid_kg: toNum(values.fluid_kg),
    fluid_kg_ideal: toNum(values.fluid_kg_ideal),
    fat_mass_kg: toNum(values.fat_mass_kg),
    fat_mass_kg_ideal: toNum(values.fat_mass_kg_ideal),
    body_fat_percent: bodyFat,
    body_fat: bodyFat,
    body_fat_percent_ideal: toNum(values.body_fat_percent_ideal),
    bmi_score: toNum(values.bmi_score),
    muscle_score: toNum(values.muscle_score),
    fluid_score: toNum(values.fluid_score),
    bmr_score: toNum(values.bmr_score),
    fat_score: toNum(values.fat_score),
    metabolic_age: toNum(values.metabolic_age),
    fat_free_mass_kg: toNum(values.fat_free_mass_kg),
    source: values.source || 'manual',
  };
}
