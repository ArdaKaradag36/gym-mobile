import { MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmSheet } from '../components/ConfirmSheet';
import { useTrainerStore } from '../stores/useTrainerStore';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../utils/format';
import { tabBarDockStyle } from '../utils/layout';
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
  const [pendingTab, setPendingTab] = useState<keyof TrainerTabParamList | null>(null);
  const tabNavRef = useRef<{ navigate: (name: keyof TrainerTabParamList) => void } | null>(null);

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      initialRouteName="Students"
      safeAreaInsets={{ bottom: 0 }}
      screenListeners={({ navigation, route }) => ({
        tabPress: (event) => {
          tabNavRef.current = navigation;
          const state = navigation.getState();
          const current = state.routes[state.index]?.name;
          if (current === route.name) return;
          if (!useTrainerStore.getState().unsavedLock) return;

          event.preventDefault();
          setPendingTab(route.name);
        },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.neonGreenDim,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: withAlpha(colors.surfaceContainerLowest, 0.92),
          borderTopColor: withAlpha(colors.outlineVariant, 0.35),
          borderTopWidth: StyleSheet.hairlineWidth,
          ...tabBarDockStyle(insets.bottom),
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
    <ConfirmSheet
      visible={pendingTab != null}
      message="Kaydedilmemiş değişiklikler var, çıkmak istediğinize emin misiniz?"
      onCancel={() => setPendingTab(null)}
      onConfirm={() => {
        const target = pendingTab;
        setPendingTab(null);
        useTrainerStore.getState().discardUnsaved();
        if (target) tabNavRef.current?.navigate(target);
      }}
    />
    </View>
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
