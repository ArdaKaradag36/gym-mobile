import { StyleSheet, Text, View } from 'react-native';

import type { StudentNote } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { formatNoteTime } from '../../utils/format';

type Props = {
  notes: StudentNote[];
};

export function StudentInbox({ notes }: Props) {
  const { colors } = useTheme();
  const unread = notes.filter((note) => !note.read_at).length;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant },
      ]}
    >
      <Text style={[styles.label, { color: colors.electricBlueSoft }]}>
        ÖĞRENCİ NOTLARI{unread > 0 ? ` · ${unread} yeni` : ''}
      </Text>
      {notes.length === 0 ? (
        <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>Henüz not yok.</Text>
      ) : (
        notes.slice(0, 8).map((note) => (
          <View key={note.id} style={styles.row}>
            <View
              style={[
                styles.dot,
                { backgroundColor: note.read_at ? colors.outlineVariant : colors.neonGreen },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.body, { color: colors.onSurface }]}>{note.body}</Text>
              <Text style={[styles.meta, { color: colors.onSurfaceVariant }]}>
                {formatNoteTime(note.created_at)}
              </Text>
            </View>
          </View>
        ))
      )}
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
  empty: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
});
