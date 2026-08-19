import type { StudentNote } from '../types/database';
import { clampNote, NOTE_MAX_LENGTH } from '../forms/dailyNotes';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export async function fetchStudentInbox(studentId: string): Promise<StudentNote[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('student_notes')
    .select('id, student_id, trainer_id, body, created_at, read_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as StudentNote[];
}

export async function fetchUnreadNoteCounts(
  trainerId: string,
  allStudents = false,
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  let query = supabase.from('student_notes').select('student_id').is('read_at', null);
  if (!allStudents) {
    query = query.eq('trainer_id', trainerId);
  }
  const { data, error } = await query;
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { student_id: string }).student_id;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

export async function sendStudentNote(params: {
  studentId: string;
  trainerId: string;
  body: string;
}): Promise<StudentNote> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase ayarlı değil.');
  }
  const body = clampNote(params.body.trim());
  if (!body) throw new Error('Not boş olamaz.');
  if (body.length > NOTE_MAX_LENGTH) {
    throw new Error(`Not en fazla ${NOTE_MAX_LENGTH} karakter olabilir.`);
  }

  const { data, error } = await supabase
    .from('student_notes')
    .insert({
      student_id: params.studentId,
      trainer_id: params.trainerId,
      body,
    })
    .select('id, student_id, trainer_id, body, created_at, read_at')
    .single();

  if (error) throw error;
  return data as StudentNote;
}

export async function markStudentNotesRead(studentId: string, trainerId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('student_notes')
    .update({ read_at: new Date().toISOString() })
    .eq('student_id', studentId)
    .eq('trainer_id', trainerId)
    .is('read_at', null);
  if (error) throw error;
}
