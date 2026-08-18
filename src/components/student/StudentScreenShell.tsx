import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeContext';
import { StudentTopNavbar } from './StudentTopNavbar';
import { useStudentProfileContext } from './StudentProfileProvider';

type StudentScreenShellProps = {
  children: ReactNode;
};

export function StudentScreenShell({ children }: StudentScreenShellProps) {
  const { colors } = useTheme();
  const { profile } = useStudentProfileContext();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StudentTopNavbar
        studentName={profile?.full_name?.trim() || 'Student'}
        trainerName={profile?.trainer?.full_name ?? null}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
