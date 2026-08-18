import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { exerciseVideoUrl, exercisesForMuscleGroup, muscleGroupLabel } from '../../constants/media';
import type { Exercise } from '../../types/database';
import { radii, spacing } from '../../theme/colors';
import { useTheme } from '../../theme/ThemeContext';
import { sheetBottomPadding } from '../../utils/layout';

type ButtonProps = {
  selected: Exercise | null;
  onPress: () => void;
  loading?: boolean;
};

export function ExercisePickerButton({ selected, onPress, loading = false }: ButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.trigger,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: pressed ? colors.electricBlue : colors.outlineVariant,
        },
      ]}
    >
      <MaterialIcons name="fitness-center" size={20} color={colors.onSurfaceVariant} />
      <View style={styles.triggerText}>
        <Text style={[styles.triggerLabel, { color: colors.onSurfaceVariant }]}>Egzersiz</Text>
        <Text style={[styles.triggerValue, { color: colors.onSurface }]} numberOfLines={1}>
          {selected?.name ?? (loading ? 'Yükleniyor…' : 'Kütüphaneden seç')}
        </Text>
      </View>
      <MaterialIcons name="expand-more" size={22} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

type ModalProps = {
  visible: boolean;
  exercises: Exercise[];
  muscleGroup?: string | null;
  selectedId?: string | null;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};

export function ExercisePickerModal({
  visible,
  exercises,
  muscleGroup,
  selectedId,
  onSelect,
  onClose,
}: ModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const sheetHeight = Math.min(Math.round(Dimensions.get('window').height * 0.72), 640);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setShowAll(false);
    }
  }, [visible, muscleGroup]);

  const scoped = useMemo(
    () => (showAll ? exercises : exercisesForMuscleGroup(exercises, muscleGroup)),
    [exercises, muscleGroup, showAll],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return scoped;
    return scoped.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.category?.toLowerCase().includes(normalized) ||
        muscleGroupLabel(item.category).toLowerCase().includes(normalized),
    );
  }, [query, scoped]);

  if (!visible) return null;

  const groupLabel = muscleGroup ? muscleGroupLabel(muscleGroup) : null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            maxHeight: '92%',
            backgroundColor: colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
            paddingBottom: sheetBottomPadding(insets),
          },
        ]}
      >
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>
            {groupLabel ? `${groupLabel} hareketleri` : 'Egzersiz kütüphanesi'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <MaterialIcons name="close" size={22} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>

        {muscleGroup ? (
          <View style={styles.scopeRow}>
            <Pressable
              onPress={() => setShowAll(false)}
              style={[
                styles.scopeChip,
                {
                  backgroundColor: showAll ? colors.surfaceContainerHigh : colors.neonGreenMuted,
                  borderColor: showAll ? colors.outlineVariant : colors.neonGreenBorder,
                },
              ]}
            >
              <Text
                style={{
                  color: showAll ? colors.onSurfaceVariant : colors.neonGreen,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                }}
              >
                Bu grup
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShowAll(true)}
              style={[
                styles.scopeChip,
                {
                  backgroundColor: showAll ? colors.neonGreenMuted : colors.surfaceContainerHigh,
                  borderColor: showAll ? colors.neonGreenBorder : colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={{
                  color: showAll ? colors.neonGreen : colors.onSurfaceVariant,
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                }}
              >
                Tümü
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View
          style={[
            styles.search,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.electricBlue,
            },
          ]}
        >
          <MaterialIcons name="search" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Egzersiz ara…"
            placeholderTextColor={colors.outline}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.listFlex}
          contentContainerStyle={styles.list}
        >
          {filtered.length === 0 ? (
            <Text style={[styles.empty, { color: colors.onSurfaceVariant }]}>
              {groupLabel && !showAll
                ? `Bu grup için hareket yok. Tümü ile tüm kütüphaneye bakabilirsin.`
                : 'Aktif egzersiz bulunamadı.'}
            </Text>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onSelect({ ...item, youtube_url: exerciseVideoUrl(item.youtube_url) });
                    setQuery('');
                    onClose();
                  }}
                  style={[
                    styles.option,
                    {
                      backgroundColor: isSelected
                        ? colors.neonGreenMuted
                        : colors.surfaceContainerHigh,
                      borderColor: isSelected ? colors.neonGreenBorder : colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionName, { color: colors.onSurface }]}>{item.name}</Text>
                    <Text style={[styles.optionMeta, { color: colors.onSurfaceVariant }]}>
                      {muscleGroupLabel(item.category)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <MaterialIcons name="check" size={20} color={colors.neonGreen} />
                  ) : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  triggerText: {
    flex: 1,
    gap: 2,
  },
  triggerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  triggerValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    zIndex: 41,
    overflow: 'hidden',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.stackMd,
    gap: spacing.stackMd,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 20,
    flex: 1,
    paddingRight: 8,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeChip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    gap: 8,
    paddingBottom: spacing.stackMd,
  },
  option: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  optionMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: spacing.stackLg,
  },
});
