import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '../../services/authService';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { initialsFromName, withAlpha } from '../../utils/format';

type TrainerTopNavbarProps = {
  title?: string;
  trainerName?: string;
};

export function TrainerTopNavbar({
  title = 'Hoca Dashboard',
  trainerName = 'Trainer',
}: TrainerTopNavbarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const initials = initialsFromName(trainerName);

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
      <View style={styles.identity}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.surfaceContainerHigh,
              borderColor: withAlpha(colors.outlineVariant, 0.45),
            },
          ]}
        >
          <Text style={[styles.initials, { color: colors.neonGreen }]}>
            {initials || 'H'}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Sign out"
        onPress={() => void signOut()}
        style={({ pressed }) => [
          styles.settingsButton,
          {
            backgroundColor: pressed
              ? colors.surfaceContainerHigh
              : colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <MaterialIcons name="logout" size={22} color={colors.onSurfaceVariant} />
      </Pressable>
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
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: spacing.stackMd,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
