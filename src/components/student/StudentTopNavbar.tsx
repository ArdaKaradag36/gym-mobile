import { AppTopNavbar } from '../AppTopNavbar';

type StudentTopNavbarProps = {
  studentName?: string;
  trainerName?: string | null;
  avatarUrl?: string | null;
};

export function StudentTopNavbar(_props: StudentTopNavbarProps) {
  return <AppTopNavbar />;
}
