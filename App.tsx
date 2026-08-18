import {
  Inter_400Regular,
  Inter_600SemiBold,
  useFonts as useInterFonts,
} from '@expo-google-fonts/inter';
import {
  Montserrat_700Bold,
  useFonts as useMontserratFonts,
} from '@expo-google-fonts/montserrat';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppNavigator() {
  const { colors } = useTheme();

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.neonGreen,
      background: colors.background,
      card: colors.surfaceContainerLowest,
      text: colors.onSurface,
      border: colors.outlineVariant,
      notification: colors.electricBlue,
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });
  const [montserratLoaded] = useMontserratFonts({
    Montserrat_700Bold,
  });
  const [fontWaitTimedOut, setFontWaitTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontWaitTimedOut(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const fontsReady = (interLoaded && montserratLoaded) || fontWaitTimedOut;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
