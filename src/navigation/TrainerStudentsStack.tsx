import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { StudentDetailScreen } from '../screens/trainer/StudentDetailScreen';
import { StudentsScreen } from '../screens/trainer/StudentsScreen';

export type TrainerStudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: {
    studentId: string;
    studentName: string;
  };
};

const Stack = createNativeStackNavigator<TrainerStudentsStackParamList>();

export function TrainerStudentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentsList" component={StudentsScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
    </Stack.Navigator>
  );
}
