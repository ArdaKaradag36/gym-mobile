import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MEASUREMENT_FIELDS } from '../forms/measurementForm';
import type { Measurement } from '../types/database';
import { radii, spacing } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { formatNumericDate } from '../utils/format';

type Props = {
  rows: Measurement[];
};

export function MeasurementHistory({ rows }: Props) {
  const latestId = rows[0]?.id ?? null;
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(latestId ? [latestId] : []));

  useEffect(() => {
    if (!latestId) return;
    setOpenIds((current) => {
      if (current.has(latestId)) return current;
      const next = new Set(current);
      next.add(latestId);
      return next;
    });
  }, [latestId]);

  if (rows.length === 0) return null;

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.list}>
      {rows.map((row, index) => (
        <MeasurementCard
          key={row.id}
          row={row}
          latest={index === 0}
          expanded={openIds.has(row.id)}
          onToggle={() => toggle(row.id)}
        />
      ))}
    </View>
  );
}

function MeasurementCard({
  row,
  latest,
  expanded,
  onToggle,
}: {
  row: Measurement;
  latest: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const fat = row.body_fat_percent ?? row.body_fat;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: latest ? colors.neonGreenBorder : colors.outlineVariant,
        },
      ]}
    >
      <Pressable onPress={onToggle} style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.date, { color: colors.onSurface }]}>
            {formatNumericDate(row.date)}
            {latest ? ' · Son ölçüm' : ''}
          </Text>
          <Text style={[styles.summary, { color: colors.onSurfaceVariant }]}>
            {row.device ?? 'Manuel'} · {row.weight ?? '—'} kg · %{fat ?? '—'}
          </Text>
        </View>
        <MaterialIcons
          name={expanded ? 'expand-less' : 'expand-more'}
          size={28}
          color={colors.onSurfaceVariant}
        />
      </Pressable>

      {expanded ? <MeasurementTable row={row} /> : null}
    </View>
  );
}

function MeasurementTable({ row }: { row: Measurement }) {
  const { colors } = useTheme();
  const lines = MEASUREMENT_FIELDS.filter((field) => !field.key.endsWith('_ideal'))
    .map((field) => {
      const value = row[field.key as keyof Measurement];
      const ideal = row[`${field.key}_ideal` as keyof Measurement];
      if (value == null && ideal == null) return null;
      return { key: field.key, label: field.label, value, ideal };
    })
    .filter((line): line is NonNullable<typeof line> => line != null);

  return (
    <View style={styles.table}>
      <View style={[styles.tableHead, { borderBottomColor: colors.outlineVariant }]}>
        <Text style={[styles.headCell, { color: colors.onSurfaceVariant, flex: 1.4 }]}>Metrik</Text>
        <Text style={[styles.headCell, { color: colors.onSurfaceVariant }]}>Değer</Text>
        <Text style={[styles.headCell, { color: colors.onSurfaceVariant }]}>İdeal</Text>
      </View>
      {lines.map((line) => (
        <View
          key={line.key}
          style={[styles.tableRow, { borderBottomColor: colors.outlineVariant }]}
        >
          <Text style={[styles.cell, { color: colors.onSurface, flex: 1.4 }]}>{line.label}</Text>
          <Text style={[styles.cell, { color: colors.neonGreen }]}>
            {line.value == null ? '—' : String(line.value)}
          </Text>
          <Text style={[styles.cell, { color: colors.onSurfaceVariant }]}>
            {line.ideal == null ? '—' : String(line.ideal)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.stackMd },
  card: {
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.stackMd,
    gap: 8,
  },
  date: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  summary: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  table: {
    paddingHorizontal: spacing.stackMd,
    paddingBottom: spacing.stackMd,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  headCell: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  cell: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
