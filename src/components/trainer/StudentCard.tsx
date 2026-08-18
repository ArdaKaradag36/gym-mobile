import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import type { TrainerStudent } from '../../services/trainer';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { initialsFromName, withAlpha } from '../../utils/format';

type StudentCardProps = {
  student: TrainerStudent;
  onPress: () => void;
  onToggleActive?: (next: boolean) => void;
};

export function StudentCard({ student, onPress, onToggleActive }: StudentCardProps) {
  const { colors } = useTheme();
  const name = student.full_name?.trim() || 'İsimsiz öğrenci';
  const { status } = student;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(colors.surfaceCard, 0.9),
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable onPress={onPress} style={styles.identity}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: status.workoutCompleted
                  ? colors.neonGreen
                  : colors.outlineVariant,
              },
            ]}
          >
            <Text style={[styles.initials, { color: colors.neonGreen }]}>
              {initialsFromName(name) || '?'}
            </Text>
            <View
              style={[
                styles.onlineDot,
                {
                  backgroundColor: status.workoutCompleted
                    ? colors.neonGreen
                    : colors.outlineVariant,
                  borderColor: colors.surfaceCard,
                },
              ]}
            />
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {student.is_active ? 'Aktif' : 'Pasif'}
              {status.totalWorkouts > 0
                ? ` · ${status.completedCount}/${status.totalWorkouts} egzersiz`
                : ' · Bugün plan yok'}
            </Text>
          </View>
        </Pressable>
        {onToggleActive ? (
          <View style={styles.toggleWrap}>
            <Switch
              value={student.is_active}
              onValueChange={onToggleActive}
              thumbColor={student.is_active ? colors.neonGreen : colors.outline}
            />
          </View>
        ) : (
          <Pressable onPress={onPress} hitSlop={8}>
            <MaterialIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      <Pressable onPress={onPress} style={styles.footer}>
        <View style={styles.statusRow}>
          <StatusChip
            icon={status.workoutCompleted ? 'check-circle' : 'pending'}
            label="Antrenman"
            active={status.workoutCompleted || status.workoutInProgress}
            tone={status.workoutCompleted ? 'green' : 'muted'}
          />
          <StatusChip
            icon="sticky-note-2"
            label="Not"
            active={status.hasDailyNote}
            tone={status.hasDailyNote ? 'blue' : 'muted'}
          />
          <StatusChip
            icon="water-drop"
            label="Su"
            active={status.hydrationOnTrack}
            tone={status.hydrationOnTrack ? 'blue' : 'muted'}
          />
        </View>

        <View style={styles.compliance}>
          <Text style={[styles.complianceValue, { color: colors.onSurface }]}>
            {status.compliancePercent == null ? '--' : `${status.compliancePercent}%`}
          </Text>
          <Text style={[styles.complianceLabel, { color: colors.electricBlueSoft }]}>
            Uyum
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function StatusChip({
  icon,
  label,
  active,
  tone,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active: boolean;
  tone: 'green' | 'blue' | 'muted';
}) {
  const { colors } = useTheme();
  const iconColor =
    tone === 'green'
      ? colors.neonGreen
      : tone === 'blue'
        ? colors.electricBlueSoft
        : colors.onSurfaceVariant;

  return (
    <View style={styles.chip}>
      <View
        style={[
          styles.chipIcon,
          {
            backgroundColor: colors.surfaceContainerHigh,
            borderColor:
              tone === 'green'
                ? withAlpha(colors.neonGreen, 0.35)
                : tone === 'blue'
                  ? withAlpha(colors.electricBlue, 0.35)
                  : colors.outlineVariant,
            opacity: active ? 1 : 0.55,
          },
        ]}
      >
        <MaterialIcons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={[styles.chipLabel, { color: colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackMd,
    gap: spacing.stackMd,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleWrap: {
    paddingLeft: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  initials: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 16,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    alignItems: 'center',
    gap: 4,
  },
  chipIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  compliance: {
    alignItems: 'flex-end',
  },
  complianceValue: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
    lineHeight: 28,
  },
  complianceLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
});
