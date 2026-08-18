import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { TrainerTopNavbar } from '../../components/trainer/TrainerTopNavbar';
import { useTrainerStudents } from '../../hooks/useTrainerStudents';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';

const PLACEHOLDER_TEMPLATES = [
  {
    id: '1',
    tag: 'Hypertrophy',
    tagTone: 'green' as const,
    title: 'Başlangıç Hacim',
    meta: '4 Weeks · 3 Days/Wk',
  },
  {
    id: '2',
    tag: 'Fat Loss',
    tagTone: 'blue' as const,
    title: 'Yağ Yakımı',
    meta: '6 Weeks · 4 Days/Wk',
  },
];

export function TemplatesScreen() {
  const { colors } = useTheme();
  const { trainerName } = useTrainerStudents();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <TrainerTopNavbar trainerName={trainerName} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Templates</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
          Reusable 14-day program blueprints. Bulk apply coming next.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {PLACEHOLDER_TEMPLATES.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      item.tagTone === 'green' ? colors.neonGreen : colors.electricBlue,
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.tag}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.title}</Text>
              <Text style={[styles.cardMeta, { color: colors.onSurfaceVariant }]}>
                {item.meta}
              </Text>
              <View style={styles.cardFooter}>
                <View
                  style={[
                    styles.play,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialIcons name="play-arrow" size={18} color={colors.onSurface} />
                </View>
              </View>
            </View>
          ))}

          <View
            style={[
              styles.card,
              styles.createCard,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <MaterialIcons name="add-circle" size={32} color={colors.onSurfaceVariant} />
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Inter_600SemiBold' }}>
              Create New
            </Text>
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.marginPage,
    paddingTop: spacing.stackLg,
    paddingBottom: 120,
    gap: spacing.stackMd,
  },
  title: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 24,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    gap: spacing.gutterCard,
    paddingVertical: spacing.stackSm,
  },
  card: {
    width: 240,
    height: 160,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.stackMd,
    justifyContent: 'space-between',
  },
  createCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
  },
  cardMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  play: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
