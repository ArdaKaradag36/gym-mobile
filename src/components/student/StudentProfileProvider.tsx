import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

import { useStudentProfile } from '../../hooks/useStudentProfile';
import type { StudentProfileWithTrainer } from '../../services/workouts';

type StudentProfileContextValue = {
  profile: StudentProfileWithTrainer | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const StudentProfileContext = createContext<StudentProfileContextValue | null>(
  null,
);

export function StudentProfileProvider({ children }: { children: ReactNode }) {
  const value = useStudentProfile();
  return (
    <StudentProfileContext.Provider value={value}>
      {children}
    </StudentProfileContext.Provider>
  );
}

export function useStudentProfileContext() {
  const context = useContext(StudentProfileContext);
  if (!context) {
    throw new Error(
      'useStudentProfileContext must be used within StudentProfileProvider',
    );
  }
  return context;
}
