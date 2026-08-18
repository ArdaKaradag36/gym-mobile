import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DietDayScreen } from '../screens/student/DietDayScreen';
import { DietScreen } from '../screens/student/DietScreen';

export type StudentDietStackParamList = {
  DietDays: undefined;
  DietDay: { date: string; planId: string };
};

const Stack = createNativeStackNavigator<StudentDietStackParamList>();

export function StudentDietStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DietDays" component={DietScreen} />
      <Stack.Screen name="DietDay" component={DietDayScreen} />
    </Stack.Navigator>
  );
}
