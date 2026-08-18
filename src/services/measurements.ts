import type { Measurement } from '../types/database';
import { MEASUREMENT_COLUMNS } from './queries';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export async function fetchStudentMeasurements(studentId: string): Promise<Measurement[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('measurements')
    .select(MEASUREMENT_COLUMNS)
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .order('measured_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Measurement[];
}

export async function insertMeasurement(
  studentId: string,
  payload: Record<string, unknown>,
): Promise<Measurement> {
  const { data, error } = await supabase
    .from('measurements')
    .insert({
      student_id: studentId,
      ...payload,
    })
    .select(MEASUREMENT_COLUMNS)
    .single();

  if (error) throw error;
  return data as Measurement;
}
