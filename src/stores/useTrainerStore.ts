import { create } from 'zustand';

import {
  fetchTrainerStudents,
  setStudentActive,
  type TrainerStudent,
} from '../services/trainer';
import type { UserRole } from '../types/database';

type TrainerState = {
  students: TrainerStudent[];
  loading: boolean;
  error: string | null;
  unsavedLock: boolean;
  setUnsavedLock: (locked: boolean) => void;
  setDiscardHandler: (handler: (() => void) | null) => void;
  discardUnsaved: () => void;
  load: (trainerId: string, opts?: { silent?: boolean; role?: UserRole }) => Promise<void>;
  toggleActive: (studentId: string, isActive: boolean) => Promise<void>;
};

let discardHandler: (() => void) | null = null;

export const useTrainerStore = create<TrainerState>((set, get) => ({
  students: [],
  loading: false,
  error: null,
  unsavedLock: false,
  setUnsavedLock: (locked) => set({ unsavedLock: locked }),
  setDiscardHandler: (handler) => {
    discardHandler = handler;
  },
  discardUnsaved: () => {
    set({ unsavedLock: false });
    discardHandler?.();
  },

  load: async (trainerId, opts) => {
    if (!opts?.silent) set({ loading: true, error: null });
    else set({ error: null });
    try {
      const role = opts?.role;
      const students = await fetchTrainerStudents(trainerId, role);
      set({ students, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Öğrenciler yüklenemedi',
        loading: false,
      });
    }
  },

  toggleActive: async (studentId, isActive) => {
    const previous = get().students;
    set({
      students: previous.map((student) =>
        student.id === studentId ? { ...student, is_active: isActive } : student,
      ),
    });
    try {
      await setStudentActive(studentId, isActive);
    } catch (err) {
      set({
        students: previous,
        error: err instanceof Error ? err.message : 'Öğrenci durumu güncellenemedi',
      });
    }
  },
}));
