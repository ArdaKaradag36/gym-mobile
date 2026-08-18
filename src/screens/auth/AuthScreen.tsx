import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signInWithEmail } from '../../services/authService';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

export function AuthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }

    setBusy(true);
    try {
      const result = await signInWithEmail(email, password);
      if (!result.success) {
        setError(result.error);
        Alert.alert('Giriş başarısız', result.error);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.stackLg,
            paddingBottom: insets.bottom + spacing.stackLg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.brand, { color: colors.neonGreen }]}>FORGE</Text>
        <Text style={[styles.headline, { color: colors.onSurface }]}>Giriş yap</Text>
        <Text style={[styles.subhead, { color: colors.onSurfaceVariant }]}>
          Hesaplar yalnızca yönetici tarafından veritabanına eklenir.
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceCard,
              borderColor: colors.neonGreenMuted,
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>E-posta</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@forge.app"
            placeholderTextColor={colors.outline}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            style={[styles.input, inputColors(colors)]}
          />

          <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Şifre</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.outline}
            secureTextEntry
            textContentType="password"
            style={[styles.input, inputColors(colors)]}
          />

          {error ? (
            <Text style={[styles.feedback, { color: colors.error }]}>{error}</Text>
          ) : null}

          <Pressable
            onPress={() => void onSubmit()}
            disabled={busy}
            style={({ pressed }) => [
              styles.submit,
              {
                backgroundColor: colors.neonGreen,
                opacity: pressed || busy ? 0.85 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.submitText, { color: colors.onPrimary }]}>Giriş</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function inputColors(colors: {
  surfaceContainerLowest: string;
  outlineVariant: string;
  onSurface: string;
}) {
  return {
    backgroundColor: colors.surfaceContainerLowest,
    borderColor: colors.outlineVariant,
    color: colors.onSurface,
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.marginPage,
    justifyContent: 'center',
    gap: spacing.stackMd,
  },
  brand: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    letterSpacing: 4,
  },
  headline: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 36,
    letterSpacing: -1,
  },
  subhead: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.stackSm,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackLg,
    gap: spacing.stackMd,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.stackMd,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
  },
  feedback: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  submit: {
    marginTop: spacing.stackSm,
    minHeight: 56,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
