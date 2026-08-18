import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { NOTE_MAX_LENGTH } from '../../forms/dailyNotes';
import { sendStudentNote } from '../../services/studentNotes';
import type { StudentNote } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { formatNoteTime } from '../../utils/format';

type Props = {
  studentId: string;
  trainerId: string;
  notes: StudentNote[];
  onSent: (note: StudentNote) => void;
};

export function NoteToTrainer({ studentId, trainerId, notes, onSent }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = notes[0];

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const note = await sendStudentNote({ studentId, trainerId, body });
      setText('');
      onSent(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
      ]}
    >
      <Text style={[styles.label, { color: colors.electricBlueSoft }]}>HOCAMA NOT</Text>
      <TextInput
        value={text}
        onChangeText={(value) => setText(value.slice(0, NOTE_MAX_LENGTH))}
        placeholder="Kısa not yaz (diz ağrısı, uykusuzluk…)"
        placeholderTextColor={colors.outline}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        style={[styles.input, { color: colors.onSurface, borderColor: colors.outlineVariant }]}
      />
      <View style={styles.row}>
        <Text style={[styles.counter, { color: colors.outline }]}>
          {text.trim().length}/{NOTE_MAX_LENGTH}
        </Text>
        <Pressable
          onPress={() => void send()}
          disabled={sending || !text.trim()}
          style={[
            styles.send,
            { backgroundColor: colors.neonGreen, opacity: sending || !text.trim() ? 0.45 : 1 },
          ]}
        >
          {sending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.sendText, { color: colors.onPrimary }]}>Gönder</Text>
          )}
        </Pressable>
      </View>
      {error ? <Text style={{ color: colors.error, fontFamily: 'Inter_400Regular' }}>{error}</Text> : null}
      {latest ? (
        <Text style={[styles.latest, { color: colors.onSurfaceVariant }]}>
          Son: {latest.body} · {formatNoteTime(latest.created_at)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.stackMd,
    gap: 10,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  counter: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  send: {
    minWidth: 96,
    minHeight: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sendText: { fontFamily: 'Inter_600SemiBold' },
  latest: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
});
