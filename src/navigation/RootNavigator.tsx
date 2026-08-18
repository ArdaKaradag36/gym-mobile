import { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '../screens/auth/AuthScreen';
import { BlockedScreen } from '../screens/auth/BlockedScreen';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../stores/useAuthStore';
import { StudentTabNavigator } from './StudentTabNavigator';
import { TrainerTabNavigator } from './TrainerTabNavigator';

export function RootNavigator() {
  const { colors } = useTheme();
  const { session, profile, booting, error, hydrate, applySession } = useAuthStore();

  useEffect(() => {
    void hydrate();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        void applySession(nextSession);
      }, 0);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [applySession, hydrate]);

  const retry = useCallback(() => {
    void hydrate();
  }, [hydrate]);

  if (booting) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.neonGreen} />
      </View>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.neonGreen }]}>FORGE</Text>
        <Text style={[styles.copy, { color: colors.error }]}>
          {error ?? 'Supabase is not configured.'}
        </Text>
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (profile?.role === 'student' && profile.is_active === false) {
    return <BlockedScreen />;
  }

  if (profile?.role === 'trainer' || profile?.role === 'admin') {
    return <TrainerTabNavigator />;
  }

  if (profile?.role === 'student') {
    return <StudentTabNavigator />;
  }

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.neonGreen} />
      <Text style={[styles.copy, { color: colors.onSurfaceVariant }]}>
        {error ?? 'Loading your workspace…'}
      </Text>
      <Text onPress={retry} style={{ color: colors.neonGreen, fontFamily: 'Inter_600SemiBold' }}>
        Retry
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.marginPage,
    gap: spacing.stackMd,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    letterSpacing: 2,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
