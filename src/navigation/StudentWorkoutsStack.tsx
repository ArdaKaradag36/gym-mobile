import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { WorkoutDayScreen } from '../screens/student/WorkoutDayScreen';
import { WorkoutsScreen } from '../screens/student/WorkoutsScreen';

export type StudentWorkoutsStackParamList = {
  WorkoutDays: undefined;
  WorkoutDay: { date: string; planId: string };
};

const Stack = createNativeStackNavigator<StudentWorkoutsStackParamList>();

export function StudentWorkoutsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WorkoutDays" component={WorkoutsScreen} />
      <Stack.Screen name="WorkoutDay" component={WorkoutDayScreen} />
    </Stack.Navigator>
  );
}
