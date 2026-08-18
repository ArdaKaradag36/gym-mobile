import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StudentProfileProvider } from '../components/student/StudentProfileProvider';
import { HomeScreen } from '../screens/student/HomeScreen';
import { MeasurementsScreen } from '../screens/student/MeasurementsScreen';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { StudentDietStack } from './StudentDietStack';
import { StudentWorkoutsStack } from './StudentWorkoutsStack';

export type StudentTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Diet: undefined;
  Measurements: undefined;
};

const Tab = createBottomTabNavigator<StudentTabParamList>();

const ICONS: Record<keyof StudentTabParamList, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Workouts: 'fitness-center',
  Diet: 'restaurant',
  Measurements: 'show-chart',
};

export function StudentTabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <StudentProfileProvider>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.neonGreen,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: withAlpha(colors.surfaceContainerLowest, 0.92),
            borderTopColor: withAlpha(colors.outlineVariant, 0.35),
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            height: 64 + Math.max(insets.bottom, spacing.stackSm),
            paddingTop: spacing.stackSm,
            paddingBottom: Math.max(insets.bottom, spacing.stackSm),
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 12,
          },
          tabBarIcon: ({ color, focused, size }) => (
            <View style={styles.iconWrap}>
              {focused ? (
                <View style={[styles.activeDot, { backgroundColor: colors.neonGreen }]} />
              ) : null}
              <MaterialIcons name={ICONS[route.name]} size={size} color={color} />
            </View>
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Bugün' }} />
        <Tab.Screen name="Workouts" component={StudentWorkoutsStack} options={{ title: 'Antrenman' }} />
        <Tab.Screen name="Diet" component={StudentDietStack} options={{ title: 'Diyet' }} />
        <Tab.Screen
          name="Measurements"
          component={MeasurementsScreen}
          options={{ title: 'Ölçüm' }}
        />
      </Tab.Navigator>
    </StudentProfileProvider>
  );
}

function withAlpha(hex: string, alpha: number) {
  if (!hex.startsWith('#') || hex.length < 7) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
