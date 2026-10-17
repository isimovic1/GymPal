import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { MUSCLE_LABELS, matchesSearch } from '../lib/exercises';
import type { Exercise } from '../lib/types';
import { colors, spacing } from '../theme';
import { ExerciseItem } from './ExerciseItem';
import { styles } from './ui';

/** Searchable, muscle-filtered exercise list shared by the library and the picker. */
export function ExerciseBrowser({ exercises, selected, onPress, footer, usageCount }: {
  exercises: Exercise[];
  selected?: Set<string>;
  onPress: (e: Exercise) => void;
  footer?: React.ReactElement;
  /** How often each exercise was trained; frequently used ones are listed first. */
  usageCount?: Map<string, number>;
}) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  const list = useMemo(() => {
    const filtered = exercises.filter(
      (e) => matchesSearch(e, query) && (!muscle || e.primaryMuscles.includes(muscle)),
    );
    return filtered.sort((a, b) => {
      const ua = usageCount?.get(a.id) ?? 0;
      const ub = usageCount?.get(b.id) ?? 0;
      return ub - ua || a.name.localeCompare(b.name);
    });
  }, [exercises, query, muscle, usageCount]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }}>
        <View style={styles.inputRow}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Traži (npr. bench, čučanj, prsa)…"
            placeholderTextColor={colors.muted}
            style={[styles.input, { marginLeft: 6 }]}
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          <Chip label="Sve" active={!muscle} onPress={() => setMuscle(null)} />
          {Object.entries(MUSCLE_LABELS).map(([key, label]) => (
            <Chip key={key} label={label} active={muscle === key} onPress={() => setMuscle(muscle === key ? null : key)} />
          ))}
        </ScrollView>
        <Text style={[styles.muted, { fontSize: 12 }]}>{list.length} vježbi</Text>
      </View>
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: 6, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <ExerciseItem exercise={item} selected={selected?.has(item.id)} onPress={() => onPress(item)} />
        )}
        ListFooterComponent={footer}
      />
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: active ? colors.primary : colors.card,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
