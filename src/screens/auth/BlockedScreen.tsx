import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../stores/useAuthStore';

export function BlockedScreen() {
  const { colors } = useTheme();
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <MaterialIcons name="lock" size={40} color={colors.neonGreen} />
      <Text style={[styles.title, { color: colors.onSurface }]}>Hesabın pasif</Text>
      <Text style={[styles.copy, { color: colors.onSurfaceVariant }]}>
        Antrenörün hesabını pasife aldı. Programı görmek için aktifleştirilmesini bekle.
      </Text>
      <Pressable
        onPress={() => void signOut()}
        style={[styles.button, { borderColor: colors.neonGreen }]}
      >
        <Text style={[styles.buttonText, { color: colors.neonGreen }]}>Çıkış yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.marginPage,
    gap: spacing.stackMd,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 28,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.stackSm,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.stackLg,
    paddingVertical: spacing.stackMd,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
