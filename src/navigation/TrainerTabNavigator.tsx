import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTrainerStore } from '../stores/useTrainerStore';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../utils/format';
import { TrainerLibraryStack } from './TrainerLibraryStack';
import { TrainerStudentsStack } from './TrainerStudentsStack';

export type TrainerTabParamList = {
  Students: undefined;
  Library: undefined;
};

const Tab = createBottomTabNavigator<TrainerTabParamList>();

export function TrainerTabNavigator() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Students"
      screenListeners={({ navigation, route }) => ({
        tabPress: (event) => {
          const state = navigation.getState();
          const current = state.routes[state.index]?.name;
          if (current === route.name) return;
          if (!useTrainerStore.getState().unsavedLock) return;

          event.preventDefault();
          Alert.alert(
            'Kaydedilmemiş değişiklikler',
            'Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?',
            [
              { text: 'Vazgeç', style: 'cancel' },
              {
                text: 'Çık',
                style: 'destructive',
                onPress: () => navigation.navigate(route.name),
              },
            ],
          );
        },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.neonGreenDim,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: withAlpha(colors.surfaceContainerLowest, 0.92),
          borderTopColor: withAlpha(colors.outlineVariant, 0.35),
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64 + Math.max(insets.bottom, spacing.stackSm),
          paddingTop: spacing.stackSm,
          paddingBottom: Math.max(insets.bottom, spacing.stackSm),
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 12,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconName =
            route.name === 'Students' ? ('group' as const) : ('collections-bookmark' as const);

          return (
            <View style={styles.iconWrap}>
              {focused ? (
                <View style={[styles.activeDot, { backgroundColor: colors.neonGreenDim }]} />
              ) : null}
              <MaterialIcons name={iconName} size={size} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Students"
        component={TrainerStudentsStack}
        options={{ title: 'Öğrenciler' }}
      />
      <Tab.Screen
        name="Library"
        component={TrainerLibraryStack}
        options={{ title: 'Kütüphane' }}
      />
    </Tab.Navigator>
  );
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
