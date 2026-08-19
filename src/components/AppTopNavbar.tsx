import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSheet } from './AccountSheet';
import { HalterciLogo } from './HalterciLogo';
import { signOut } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../utils/format';

function roleLabel(role?: string | null) {
  if (role === 'trainer') return 'Antrenör';
  if (role === 'admin') return 'Yönetici';
  return 'Öğrenci';
}

export function AppTopNavbar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((state) => state.profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const name = profile?.full_name?.trim() || 'Kullanıcı';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.stackSm,
          backgroundColor: withAlpha(colors.surfaceContainerLowest, 0.92),
          borderBottomColor: withAlpha(colors.outlineVariant, 0.35),
        },
      ]}
    >
      {menuOpen ? (
        <Pressable
          accessibilityLabel="Menüyü kapat"
          onPress={() => setMenuOpen(false)}
          style={styles.backdrop}
        />
      ) : null}

      <View style={styles.brand}>
        <HalterciLogo size={28} color={colors.neonGreen} />
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          FORGE
        </Text>
      </View>

      <View style={styles.menuAnchor}>
        <Pressable
          accessibilityLabel="Ayarlar"
          onPress={() => setMenuOpen((open) => !open)}
          style={({ pressed }) => [
            styles.gearButton,
            {
              backgroundColor: pressed
                ? colors.surfaceContainerHigh
                : colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <MaterialIcons name="settings" size={22} color={colors.onSurfaceVariant} />
        </Pressable>

        {menuOpen ? (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Text style={[styles.menuName, { color: colors.onSurface }]} numberOfLines={2}>
              {name}
            </Text>
            <Text style={[styles.menuRole, { color: colors.onSurfaceVariant }]}>
              {roleLabel(profile?.role)}
            </Text>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                setAccountOpen(true);
              }}
              style={({ pressed }) => [
                styles.logoutBtn,
                { backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent' },
              ]}
            >
              <MaterialIcons name="manage-accounts" size={18} color={colors.onSurface} />
              <Text style={[styles.logoutText, { color: colors.onSurface }]}>Hesap</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMenuOpen(false);
                void signOut();
              }}
              style={({ pressed }) => [
                styles.logoutBtn,
                { backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent' },
              ]}
            >
              <MaterialIcons name="logout" size={18} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>Çıkış yap</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <AccountSheet visible={accountOpen} onClose={() => setAccountOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.marginPage,
    paddingBottom: spacing.stackMd,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 200,
    overflow: 'visible',
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: spacing.stackMd,
  },
  title: {
    flexShrink: 1,
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  menuAnchor: {
    position: 'relative',
    zIndex: 201,
  },
  gearButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backdrop: {
    ...Platform.select({
      web: {
        position: 'fixed' as unknown as 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      default: {
        ...StyleSheet.absoluteFillObject,
      },
    }),
    zIndex: 200,
  },
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    width: 220,
    zIndex: 202,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackMd,
    gap: 4,
  },
  menuName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  menuRole: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: spacing.stackSm,
  },
  logoutBtn: {
    minHeight: 44,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
