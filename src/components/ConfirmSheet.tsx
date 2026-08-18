import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmSheet({
  visible,
  title = 'Kaydedilmemiş değişiklikler',
  message,
  cancelLabel = 'Vazgeç',
  confirmLabel = 'Çık',
  onCancel,
  onConfirm,
}: Props) {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onCancel} />
      <View
        style={[
          styles.dialog,
          { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant },
        ]}
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>{message}</Text>
        <View style={styles.row}>
          <Pressable
            onPress={onCancel}
            style={[styles.btn, { borderColor: colors.outlineVariant }]}
          >
            <Text style={{ color: colors.onSurface, fontFamily: 'Inter_600SemiBold' }}>
              {cancelLabel}
            </Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[styles.btn, styles.confirm, { backgroundColor: colors.error }]}
          >
            <Text style={{ color: colors.onPrimary, fontFamily: 'Inter_600SemiBold' }}>
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginPage,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  dialog: {
    zIndex: 1001,
    width: '100%',
    maxWidth: 420,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackLg,
    gap: spacing.stackMd,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirm: {
    borderWidth: 0,
  },
});
