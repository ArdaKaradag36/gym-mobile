import { create } from 'zustand';

import {
  fetchTrainerStudents,
  setStudentActive,
  type TrainerStudent,
} from '../services/trainer';

type TrainerState = {
  students: TrainerStudent[];
  loading: boolean;
  error: string | null;
  unsavedLock: boolean;
  setUnsavedLock: (locked: boolean) => void;
  load: (trainerId: string) => Promise<void>;
  toggleActive: (studentId: string, isActive: boolean) => Promise<void>;
};

export const useTrainerStore = create<TrainerState>((set, get) => ({
  students: [],
  loading: false,
  error: null,
  unsavedLock: false,
  setUnsavedLock: (locked) => set({ unsavedLock: locked }),

  load: async (trainerId) => {
    set({ loading: true, error: null });
    try {
      const students = await fetchTrainerStudents(trainerId);
      set({ students, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load students',
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
        error: err instanceof Error ? err.message : 'Failed to update student status',
      });
    }
  },
}));
