import { MaterialIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '../../services/authService';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../utils/format';

type StudentTopNavbarProps = {
  studentName: string;
  trainerName: string | null;
  avatarUrl?: string | null;
};

export function StudentTopNavbar({
  studentName,
  trainerName,
  avatarUrl,
}: StudentTopNavbarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const initials = studentName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

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
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.initials, { color: colors.neonGreen }]}>
              {initials || '?'}
            </Text>
          )}
        </View>

        <View style={styles.textBlock}>
          <Text
            style={[styles.studentName, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {studentName}
          </Text>
          <Text
            style={[styles.trainerName, { color: colors.electricBlueSoft }]}
            numberOfLines={1}
          >
            {trainerName ? `Trainer · ${trainerName}` : 'No trainer assigned'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel="Sign out"
        onPress={() => void signOut()}
        style={({ pressed }) => [
          styles.settingsButton,
          {
            backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent',
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
    zIndex: 50,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 14,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  studentName: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  trainerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
