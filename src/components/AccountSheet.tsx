import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { sendStudentNote } from '../services/studentNotes';
import { updatePassword } from '../services/authService';
import { useAuthStore } from '../stores/useAuthStore';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AccountSheet({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const profile = useAuthStore((state) => state.profile);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setPassword('');
    setConfirm('');
    setMessage(null);
    setError(null);
    onClose();
  };

  const onChangePassword = async () => {
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError('Yeni şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    setBusy(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setPassword('');
      setConfirm('');
      setMessage('Şifren güncellendi.');
    } finally {
      setBusy(false);
    }
  };

  const onDeleteRequest = async () => {
    setError(null);
    setMessage(null);
    if (profile?.role === 'student' && profile.trainer_id && profile.id) {
      setBusy(true);
      try {
        await sendStudentNote({
          studentId: profile.id,
          trainerId: profile.trainer_id,
          body: 'Hesap silme talebi. Lütfen hesabımı kapatın / silin.',
        });
        setMessage('Silme talebin antrenörüne iletildi.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Talep gönderilemedi.');
      } finally {
        setBusy(false);
      }
      return;
    }
    setMessage('Hesap silme için yöneticiyle iletişime geç.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={[styles.title, { color: colors.onSurface }]}>Hesap</Text>
            <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Yeni şifre</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="En az 8 karakter"
              placeholderTextColor={colors.outline}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
            />
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="Şifreyi tekrar yaz"
              placeholderTextColor={colors.outline}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
            />
            <Pressable
              onPress={() => void onChangePassword()}
              disabled={busy}
              style={[styles.button, { backgroundColor: colors.neonGreen, opacity: busy ? 0.7 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Şifreyi güncelle</Text>
              )}
            </Pressable>

            <Text style={[styles.section, { color: colors.neonGreen }]}>Gizlilik (KVKK)</Text>
            <Text style={[styles.copy, { color: colors.onSurfaceVariant }]}>
              FORGE antrenman, beslenme ve vücut ölçümü verilerini programını yönetmek için
              saklar. Veriler antrenörün ve yöneticinin erişimine açıktır. Ticari amaçla üçüncü
              kişilere satılmaz. Hesabını silmek için aşağıdaki talebi kullan.
            </Text>
            <Pressable
              onPress={() => void onDeleteRequest()}
              disabled={busy}
              style={[styles.button, { borderWidth: 1, borderColor: colors.error }]}
            >
              <Text style={[styles.buttonText, { color: colors.error }]}>Hesap silme talebi</Text>
            </Pressable>

            {error ? <Text style={{ color: colors.error, marginTop: 12 }}>{error}</Text> : null}
            {message ? <Text style={{ color: colors.neonGreen, marginTop: 12 }}>{message}</Text> : null}

            <Pressable onPress={close} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold' }}>Kapat</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackLg,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 22,
    marginBottom: spacing.stackMd,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.stackMd,
    marginBottom: spacing.stackSm,
    fontFamily: 'Inter_400Regular',
  },
  button: {
    minHeight: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.stackSm,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6,
  },
  section: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    marginTop: spacing.stackLg,
    marginBottom: 8,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
});
